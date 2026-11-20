import { Element, Text, htmlToDOM, type DOMNode } from "html-react-parser"

import type { GameReview, ReviewSettingsProfile } from "./sdhq-types"

export function getSteamDeckProfiles(acf: GameReview["acf"]): ReviewSettingsProfile[] {
	const profiles: ReviewSettingsProfile[] = []
	if (Array.isArray(acf?.steamos_settings)) {
		for (const row of acf.steamos_settings) {
			const profile = row?.steamos_setting
			if (typeof profile?.device === "string" && profile.device.trim().toLowerCase() === "steam deck") {
				profiles.push(profile)
			}
		}
	}
	if (profiles.length) return profiles

	const legacy = acf?.optimized_and_recommended_settings
	if (!legacy || typeof legacy !== "object" || Array.isArray(legacy)) return []
	const { steamos_settings, ...details } = legacy
	const steamOS = steamos_settings && typeof steamos_settings === "object" && !Array.isArray(steamos_settings)
		? steamos_settings
		: {}
	const profile = { ...steamOS, ...details }
	return Object.keys(profile).length ? [profile] : []
}

export function getGameSettingsText(html: string): string {
	const readText = (node: DOMNode): string => {
		if (node instanceof Text) return node.data
		if (!(node instanceof Element) || ["script", "style", "noscript", "template"].includes(node.name)) return ""
		if (node.name === "br") return "\n"
		const text = node.children.map(child => readText(child as DOMNode)).join("")
		return ["p", "div", "li"].includes(node.name) ? `\n${text}\n` : text
	}

	return htmlToDOM(html).map(readText).join("").split(/\r?\n/).map(line => line.trim()).filter(Boolean).join("\n")
}
