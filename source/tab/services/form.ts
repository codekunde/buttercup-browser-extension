import { ulid } from "ulidx";
import { getElementRectInDocument, recalculateRectForIframe } from "../library/position.js";
import { FORM } from "../state/form.js";
import { FRAME } from "../state/frame.js";
import { closePopup, togglePopup } from "../ui/popup.js";
import { waitAndAttachLaunchButtons } from "./formDetection.js";
import { broadcastFrameMessage, listenForTabEvents, sendTabEvent } from "./messaging.js";
import { findIframeForWindow } from "../library/frames.js";
import { FrameEvent, FrameEventType, TabEventType } from "../types.js";

// Some sites (notably Microsoft/Okta-style multi-step SSO forms) gate their
// "Next"/submit button on keyboard events rather than on the input's value,
// `input` or `change` events - all of which Locust already dispatches while
// filling. A trailing keydown/keyup nudges those validators the same way a
// real keypress (e.g. selecting the field and pressing Ctrl+C) does.
function nudgeFieldValidation(input: HTMLInputElement | null | undefined) {
    if (!input) return;
    for (const eventType of ["keydown", "keyup"]) {
        input.dispatchEvent(new KeyboardEvent(eventType, { bubbles: true, cancelable: true, key: "Unidentified" }));
    }
}

export function fillFormDetails(frameEvent: FrameEvent): void {
    const { currentLoginTarget: loginTarget } = FORM;
    const { inputDetails } = frameEvent;
    if (!inputDetails) {
        throw new Error("No input details for form fill action");
    }
    if (!loginTarget) {
        throw new Error("No login target found");
    }
    // Locust types characters in with a small per-character delay, so
    // awaiting these before closing the popup (as this used to) made the
    // popup visibly hang open for the whole fill. Let each field type out
    // and nudge independently in the background instead, closing straight
    // away like before the keyboard nudge was added.
    if (inputDetails.username) {
        loginTarget.fillUsername(inputDetails.username).then(() => nudgeFieldValidation(loginTarget.usernameField));
    }
    if (inputDetails.password) {
        loginTarget.fillPassword(inputDetails.password).then(() => nudgeFieldValidation(loginTarget.passwordField));
    }
    if (inputDetails.otp) {
        loginTarget.fillOTP(inputDetails.otp).then(() => nudgeFieldValidation(loginTarget.otpField));
    }
    FORM.currentFormID = null;
    FORM.currentLoginTarget = null;
    closePopup();
}

export async function initialise() {
    // Watch for forms
    await waitAndAttachLaunchButtons((input, loginTarget, inputType) => {
        FORM.currentFormID = ulid();
        FORM.currentLoginTarget = loginTarget;
        if (FRAME.isTop) {
            FORM.targetFormID = FORM.currentFormID;
            togglePopup(getElementRectInDocument(input), inputType);
        } else {
            sendTabEvent(
                {
                    type: TabEventType.OpenPopupDialog,
                    formID: FORM.currentFormID,
                    inputPosition: getElementRectInDocument(input),
                    inputType
                },
                window.parent
            );
        }
    });
    // Listen for tab-specific events
    listenForTabEvents((tabEvent) => {
        if (tabEvent.type === TabEventType.InputDetails) {
            // Detect where to send the chosen details
            if (FORM.currentFormID && tabEvent.formID === FORM.currentFormID) {
                // This tab+frame is expecting these credentials
                fillFormDetails({
                    formID: tabEvent.formID,
                    inputDetails: tabEvent.inputDetails,
                    inputType: tabEvent.inputType,
                    type: FrameEventType.FillForm
                });
            } else if (!FORM.currentFormID || FORM.currentFormID !== tabEvent.formID) {
                // Destination is another tab
                broadcastFrameMessage({
                    formID: tabEvent.formID,
                    inputDetails: tabEvent.inputDetails,
                    inputType: tabEvent.inputType,
                    type: FrameEventType.FillForm
                });
            } else {
                throw new Error("Unexpected details input state");
            }
        } else if (tabEvent.type === TabEventType.OpenPopupDialog) {
            if (!tabEvent.sourceURL) {
                console.error("No source URL provided");
                return;
            }
            if (!tabEvent.inputPosition) {
                console.error("No input position provided");
                return;
            }
            if (!tabEvent.inputType) {
                console.error("No input type provided");
                return;
            }
            // Re-calculate based upon the iframe the message came from
            const frame = findIframeForWindow(tabEvent.sourceURL);
            if (!frame) {
                console.error("Failed presening Buttercup popup: Could not trace iframe nesting");
                return;
            }
            const newPosition = recalculateRectForIframe(tabEvent.inputPosition, frame);
            // Show if top, or pass on to the next frame above
            if (FRAME.isTop) {
                FORM.targetFormID = tabEvent.formID ?? null;
                togglePopup(newPosition, tabEvent.inputType);
            } else {
                sendTabEvent(
                    {
                        ...tabEvent,
                        inputPosition: newPosition
                    },
                    window.parent
                );
            }
        }
    });
}
