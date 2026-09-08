import React, { MouseEvent, useCallback, useMemo } from "react";
import styled from "styled-components";
import cn from "classnames";
import { Button, Classes, Intent, Spinner, Text } from "@blueprintjs/core";
import { SiteIcon } from "@buttercup/ui";
import { extractDomain } from "../../../shared/library/domain.js";
import { PreparedOTP } from "../../hooks/otp.js";
import { copyTextToClipboard } from "../../services/clipboard.js";
import { getToaster } from "../../../shared/services/notifications.js";
import { localisedErrorMessage } from "../../../shared/library/error.js";
import { t } from "../../../shared/i18n/trans.js";

interface OTPItemProps {
    otp: PreparedOTP;
    onClick: () => void;
}

const CenteredText = styled(Text)`
    display: flex;
    align-items: center;
`;
const Container = styled.div`
    border-radius: 3px;
    padding: 0.5rem;
    background-color: ${p => (p.isActive ? p.theme.listItemHover : null)};
    position: relative;
    &:hover {
        background-color: ${p => p.theme.listItemHover};
    }
`;
const DetailRow = styled.div`
    margin-left: 0.5rem;
    overflow: hidden;
    flex: 1;
`;
const EntryIcon = styled(SiteIcon)`
    width: 100%;
    height: 100%;
    > img {
        width: 100%;
        height: 100%;
    }
`;
const Title = styled(Text)`
    margin-bottom: 0.3rem;
`;
const OTPIconBackground = styled.div`
    width: 2.5rem;
    height: 2.5rem;
    flex: 0 0 auto;
    background-color: ${p => p.theme.backgroundColor};
    border-radius: 3px;
    border: 1px solid ${p => p.theme.listItemHover};
`;
const OTPCode = styled.div`
    flex: 0 0 auto;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding-left: 3px;

    .${Classes.SPINNER} {
        margin-right: 4px;
    }
`;
const OTPCodePart = styled.div`
    font-family: monospace;
    font-size: 22px;
    margin-right: 3px;
`;
const OTPRow = styled.div`
    flex: 1;
    width: 100%;
    display: flex;
    cursor: pointer;
    align-items: center;
`;

export function OTPItem(props: OTPItemProps) {
    const {
        otp,
        onClick
    } = props;
    const entryDomain = useMemo(() => otp.loginURL ? extractDomain(otp.loginURL) : null, [otp]);
    const handleOTPClick = useCallback(() => {
        onClick();
    }, [onClick]);
    const handleCopyClick = useCallback(async (evt: MouseEvent) => {
        evt.preventDefault();
        evt.stopPropagation();
        try {
            await copyTextToClipboard(otp.digits);
            getToaster().show({
                intent: Intent.SUCCESS,
                message: t("popup.otps.copy.success"),
                timeout: 4000
            });
        } catch (err) {
            getToaster().show({
                intent: Intent.DANGER,
                message: t("popup.otps.copy.error", { message: localisedErrorMessage(err) }),
                timeout: 10000
            });
        }
    }, [otp.digits]);
    const [codeFirst, codeSecond] = useMemo(() => {
        if (otp.errored) return [otp.digits, ""];
        return otp.digits.length === 8
            ? [otp.digits.substring(0, 4), otp.digits.substring(4)]
            : [otp.digits.substring(0, 3), otp.digits.substring(3)]
    }, [otp.digits]);
    const spinnerLeft = useMemo(() => {
        if (otp.errored) return 1;
        return otp.remaining / otp.period;
    }, [otp]);
    const spinnerIntent = useMemo(() => {
        if (otp.errored) return Intent.DANGER;
        return spinnerLeft < 0.15 ? Intent.DANGER : spinnerLeft < 0.35 ? Intent.WARNING : Intent.SUCCESS;
    }, [otp.errored, spinnerLeft]);
    return (
        <Container isActive={false} onClick={handleOTPClick}>
            <OTPRow>
                <OTPIconBackground>
                    <EntryIcon
                        domain={entryDomain}
                    />
                </OTPIconBackground>
                <DetailRow onClick={() => {}}>
                    <Title title={otp.otpTitle ?? ""}>
                        <Text ellipsize>{otp.otpTitle ?? "?"}</Text>
                    </Title>
                    <CenteredText ellipsize className={cn(Classes.TEXT_SMALL, Classes.TEXT_MUTED)}>
                        {otp.entryTitle}
                    </CenteredText>
                </DetailRow>
                <OTPCode>
                    <Spinner
                        size={19}
                        value={spinnerLeft}
                        intent={spinnerIntent}
                    />
                    <OTPCodePart>{codeFirst}</OTPCodePart>
                    <OTPCodePart>{codeSecond}</OTPCodePart>
                    {!otp.errored && (
                        <Button
                            icon="clipboard"
                            minimal
                            onClick={handleCopyClick}
                            title={t("popup.otps.copy.tooltip")}
                        />
                    )}
                </OTPCode>
            </OTPRow>
        </Container>
    );
}
