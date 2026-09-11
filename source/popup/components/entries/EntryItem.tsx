import React, { MouseEvent, useCallback, useContext, useMemo } from "react";
import styled from "styled-components";
import cn from "classnames";
import { Button, ButtonGroup, Classes, Intent, Tag, Text } from "@blueprintjs/core";
import { SearchResult, VaultSourceStatus } from "buttercup";
import { SiteIcon } from "@buttercup/ui";
import { LaunchContext } from "../contexts/LaunchContext.js";
import { extractEntryDomain } from "../../../shared/library/domain.js";
import { Tooltip2 } from "@blueprintjs/popover2";
import { t } from "../../../shared/i18n/trans.js";
import { copyTextToClipboard } from "../../services/clipboard.js";
import { getToaster } from "../../../shared/services/notifications.js";
import { localisedErrorMessage } from "../../../shared/library/error.js";

interface EntryItemProps {
    entry: SearchResult;
    fetchIcons: boolean;
    vaultName?: string | null;
    onAutoClick: () => void;
    onClick: () => void;
    onInfoClick: () => void;
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
const VaultName = styled(Tag)`
    margin-top: 0.35rem;
    max-width: 100%;
`;
const EntryIconBackground = styled.div`
    width: 2.5rem;
    height: 2.5rem;
    flex: 0 0 auto;
    background-color: ${p => p.theme.backgroundColor};
    border-radius: 3px;
    border: 1px solid ${p => p.theme.listItemHover};
`;
const EntryRow = styled.div`
    flex: 1;
    width: 100%;
    display: flex;
    cursor: pointer;
    align-items: center;
`;

export function EntryItem(props: EntryItemProps) {
    const {
        entry,
        fetchIcons,
        vaultName,
        onAutoClick,
        onClick,
        onInfoClick
    } = props;
    const { source: popupSource } = useContext(LaunchContext);
    const entryDomain = useMemo(() => {
        if (!fetchIcons) {
            return null;
        }
        return extractEntryDomain(entry.properties);
    }, [entry, fetchIcons]);
    const handleEntryClick = useCallback(
        (evt: MouseEvent) => {
            evt.preventDefault();
            evt.stopPropagation();
            onClick();
        },
        [onClick]
    );
    const handleEntryLoginClick = useCallback(
        (evt: MouseEvent) => {
            evt.preventDefault();
            evt.stopPropagation();
            onAutoClick();
        },
        [onAutoClick]
    );
    const handleEntryInfoClick = useCallback((evt: MouseEvent) => {
        evt.preventDefault();
        evt.stopPropagation();
        onInfoClick();
    }, [onInfoClick]);
    const handleCopyClick = useCallback((property: string, value: string) => async (evt: MouseEvent) => {
        evt.preventDefault();
        evt.stopPropagation();
        try {
            await copyTextToClipboard(value);
            getToaster().show({
                intent: Intent.SUCCESS,
                message: t("popup.entries.info.copy-success", { property }),
                timeout: 4000
            });
        } catch (err) {
            getToaster().show({
                intent: Intent.DANGER,
                message: t("popup.entries.info.copy-error", { message: localisedErrorMessage(err) }),
                timeout: 10000
            });
        }
    }, []);
    return (
        <Container isActive={false} onClick={handleEntryClick}>
            <EntryRow>
                <EntryIconBackground>
                    <EntryIcon
                        domain={entryDomain}
                        type={entry.entryType}
                    />
                </EntryIconBackground>
                <DetailRow>
                    <Title title={entry.properties.title}>
                        <Text ellipsize>{entry.properties.title}</Text>
                    </Title>
                    <CenteredText ellipsize className={cn(Classes.TEXT_SMALL, Classes.TEXT_MUTED)}>
                        {entry.properties.username} {entry.properties.url && `@ ${entry.properties.url}` || ""}
                    </CenteredText>
                    {vaultName && (
                        <VaultName icon="box" minimal>
                            <Text ellipsize title={vaultName}>{vaultName}</Text>
                        </VaultName>
                    )}
                </DetailRow>
                {popupSource === "popup" && (
                    <ButtonGroup>
                        {entry.properties.username && (
                            <Tooltip2
                                content={t("popup.entries.copy.username-tooltip")}
                            >
                                <Button
                                    icon="user"
                                    minimal
                                    onClick={handleCopyClick("Username", entry.properties.username)}
                                />
                            </Tooltip2>
                        )}
                        {entry.properties.password && (
                            <Tooltip2
                                content={t("popup.entries.copy.password-tooltip")}
                            >
                                <Button
                                    icon="key"
                                    minimal
                                    onClick={handleCopyClick("Password", entry.properties.password)}
                                />
                            </Tooltip2>
                        )}
                        <Tooltip2
                            content={t("popup.entries.auto-login.tooltip")}
                        >
                            <Button
                                icon="text-highlight"
                                minimal
                                onClick={handleEntryLoginClick}
                            />
                        </Tooltip2>
                        <Tooltip2
                            content={t("popup.entries.info.tooltip")}
                        >
                            <Button
                                icon="info-sign"
                                minimal
                                onClick={handleEntryInfoClick}
                            />
                        </Tooltip2>
                    </ButtonGroup>
                )}
            </EntryRow>
        </Container>
    );
}
