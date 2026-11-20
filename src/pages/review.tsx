import { ButtonItem, Field, Focusable, Navigation, PanelSection, PanelSectionRow } from "@decky/ui"
import type { IconType } from "react-icons"
import { FaBatteryHalf, FaBolt, FaTemperatureHalf } from "react-icons/fa6"

import { getGameSettingsText, getSteamDeckProfiles } from "../review-settings"
import type { GameReview, ReviewSettingsProfile } from "../sdhq-types"

type ReviewPageProps = {
	review: GameReview
	setPage: (page: "home" | "review") => void
}

function SettingsText({ label, text }: { label?: string; text: string }) {
	return (
		<PanelSectionRow>
			<Field focusable label={label} childrenLayout="below">
				<span style={{ display: "block", overflowWrap: "anywhere" }}>{text}</span>
			</Field>
		</PanelSectionRow>
	)
}

function formatSetting(value: string | number | null | undefined, unit = "") {
	const text = value?.toString().trim()
	if (!text) return undefined
	return unit && /^\d+(?:\.\d+)?$/.test(text) ? `${text} ${unit}` : text
}

type SettingRowProps = {
	label: string
	value?: string
	Icon?: IconType
}

function SettingRow({ label, value, Icon }: SettingRowProps) {
	return (
		<PanelSectionRow>
			<Field focusable label={label} icon={Icon && <Icon aria-hidden="true" size={16} />} inlineWrap="keep-inline">
				<span style={{ display: "block", overflowWrap: "anywhere", textAlign: "right" }}>{value}</span>
			</Field>
		</PanelSectionRow>
	)
}

function ProfileSettings({ profile, title }: { profile: ReviewSettingsProfile; title: string }) {
	const hrs = profile.half_rate_shading
	const steamSettings = [
		{ label: "FPS limit", value: formatSetting(profile.fps_cap, "FPS") },
		{ label: "Refresh rate", value: formatSetting(profile.fps_refresh_rate, "Hz") },
		{ label: "TDP limit", value: formatSetting(profile.tdp_limit, "W") },
		{ label: "GPU clock", value: formatSetting(profile.gpu_clock_frequency, "MHz") },
		{ label: "Scaling filter", value: formatSetting(profile.scaling_filter) },
		{ label: "Half-rate shading", value: typeof hrs === "boolean" ? (hrs ? "On" : "Off") : undefined },
	].filter(row => row.value)
	const proton = profile.proton_version?.trim()
	const gameSettings = getGameSettingsText(profile.game_settings ?? "")
	const battery = profile.projected_battery_usage_and_temperature
	const stats = [
		{ label: "Wattage", value: battery?.wattage?.trim(), Icon: FaBolt },
		{ label: "Temperature", value: battery?.temperatures?.trim(), Icon: FaTemperatureHalf },
		{ label: "Gameplay time", value: battery?.gameplay_time?.trim(), Icon: FaBatteryHalf },
	].filter(row => row.value)

	return (
		<PanelSection title={title}>
			{steamSettings.map(row => <SettingRow key={row.label} {...row} />)}
			{proton && <SettingsText label="Proton version" text={proton} />}
			{gameSettings && gameSettings.split("\n").map((line, index) => (
				<SettingsText key={index} label={index === 0 ? "In-game settings" : undefined} text={line} />
			))}
			{stats.map(row => <SettingRow key={row.label} {...row} />)}
			{!steamSettings.length && !proton && !gameSettings && !stats.length && (
				<SettingsText text="No settings listed for this profile." />
			)}
		</PanelSection>
	)
}

export const ReviewPage = ({ review, setPage }: ReviewPageProps) => {
	const profiles = getSteamDeckProfiles(review.acf)
	return (
		<Focusable
			autoFocus
			flow-children="column"
			onCancelButton={event => {
				event.stopPropagation()
				setPage("home")
			}}
		>
			{profiles.map((profile, index) => (
				<ProfileSettings
					key={`${review.id}-${index}`}
					profile={profile}
					title={profile.title?.trim() || (index === 0 ? "Recommended" : `Profile ${index + 1}`)}
				/>
			))}
			{!profiles.length && (
				<PanelSection>
					<SettingsText text="No recommended Steam Deck settings for this review." />
				</PanelSection>
			)}
			<PanelSection title="Review">
				<PanelSectionRow>
					<ButtonItem layout="below" onClick={() => Navigation.NavigateToExternalWeb(review.link)}>
						Read Full Review
					</ButtonItem>
				</PanelSectionRow>
			</PanelSection>
		</Focusable>
	)
}
