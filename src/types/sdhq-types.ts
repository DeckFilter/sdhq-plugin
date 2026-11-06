export type NewsItem = {
	id: number
	date: string
	date_gmt: string
	guid: {
		rendered: string
	}
	modified: string
	modified_gmt: string
	slug: string
	status: string
	type: string
	link: string
	title: {
		rendered: string
	}
	content: {
		rendered: string
		protected: boolean
	}
	excerpt: {
		rendered: string
		protected: boolean
	}
	author: number
	featured_media: number
	comment_status: string
	ping_status: string
	sticky: boolean
	template: string
	format: string
	meta: {
		_ebb_attr: string
		inline_featured_image: string
		advgb_blocks_editor_width: string
		advg_blocks_columns_visual_guide: string
		footnotes: string
	}
	categories: number[]
	tags: number[]
	acf: number[]
	author_meta: {
		display_name: string
		author_link: string
	}
	featured_img: string
	coauthors: string[]
	tax_additional: {
		categories: {
			linked: string[]
			unlinked: string[]
		}
		tags: {
			linked: string[]
			unlinked: string[]
		}
	}
	comment_count: number
	relative_dates: {
		created: string
		modified: string
	}
	absolute_dates: {
		created: string
		modified: string
	}
	absolute_dates_time: {
		created: string
		modified: string
	}
	featured_img_caption: string
	series_order: string
	_links: {
		self: { href: string }[]
		collection: { href: string }[]
		about: { href: string }[]
		author: { embeddable: boolean; href: string }[]
		replies: { embeddable: boolean; href: string }[]
		"version-history": { count: number; href: string }[]
		"wp:featuredmedia": { embeddable: boolean; href: string }[]
		"wp:attachment": { href: string }[]
		"wp:term": { taxonomy: string; embeddable: boolean; href: string }[]
		curies: { name: string; href: string; templated: boolean }[]
	}
}

export type ReviewSteamSettings = {
	fps_cap?: string
	fps_refresh_rate?: number | string | null
	half_rate_shading?: boolean
	tdp_limit?: string
	scaling_filter?: string
	gpu_clock_frequency?: string
}

export type ReviewSettingsPreset = ReviewSteamSettings & {
	device?: string
	title?: string
	proton_version?: string
	game_settings?: string
	projected_battery_usage_and_temperature?: {
		wattage?: string
		temperatures?: string
		gameplay_time?: string
	} | null
}

export type GameReview = {
	id: number
	date: string
	date_gmt: string
	guid: {
		rendered: string
	}
	modified: string
	modified_gmt: string
	slug: string
	status: string
	type: string
	link: string
	title: {
		rendered: string
	}
	content: {
		rendered: string
		protected: boolean
	}
	excerpt: {
		rendered: string
		protected: boolean
	}
	author: number
	featured_media: number
	comment_status: string
	ping_status: string
	template: string
	categories: string[]
	genre: string[]
	acf: {
		best_on_deck?: boolean
		is_first_look: boolean
		last_revised_date: string | null
		optimized_and_recommended_settings?: Pick<ReviewSettingsPreset,
			"proton_version" | "game_settings" | "projected_battery_usage_and_temperature"
		> & { steamos_settings?: ReviewSteamSettings | null } | null
		steamos_settings?: { steamos_setting?: ReviewSettingsPreset | null }[] | null
		sdhq_rating?: number | string | null
		sdhq_rating_tags: { sdhq_rating_tag: string }[]
		sdhq_rating_categories: {
			performance: number
			visuals: number
			stability: number
			controls: number
			battery: number
			score_breakdown: string
		}
		ratings: {
			deck_verified_rating: string
			proton_db_rating: string
		}
		deck_builds: string | null
		links?: {
			steam_store_url?: string
			protondb_url?: string
		}
		"": {
			game_logo: number
			cover_art: number
			square_art: number
			box_art: number
		}
		gallery: string
		steam_app_id: string
		other_settings: string | null
	}
	featured_img: string
	coauthors: string[]
	author_meta: {
		author_link: string
		display_name: string
	}
	relative_dates: {
		created: string
		modified: string
	}
	absolute_dates: {
		created: string
		modified: string
	}
	absolute_dates_time: {
		created: string
		modified: string
	}
	featured_img_caption: string
	tax_additional: {
		category: {
			linked: string[]
			unlinked: string[]
			sug: string
			name: string
		}
		genre: {
			linked: string[]
			unlinked: string[]
			sug: string
			name: string
		}
	}
	series_order: string
	_links: {
		self: { href: string }[]
		collection: { href: string }[]
		about: { href: string }[]
		author: { embeddable: boolean; href: string }[]
		replies: { embeddable: boolean; href: string }[]
		"version-history": { count: number; href: string }[]
		"wp:featuredmedia": { embeddable: boolean; href: string }[]
		"wp:attachment": { href: string }[]
		"wp:term": { taxonomy: string; embeddable: boolean; href: string }[]
		curies: { name: string; href: string; templated: boolean }[]
	}
}
