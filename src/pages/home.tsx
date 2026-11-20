import {
	ButtonItem,
	Navigation,
	PanelSection,
	PanelSectionRow
} from "@decky/ui"

import badge from "../../assets/bestOnDeck-badge.png"
import { SteamDeckHQLogo } from "../components/SteamDeckHQLogo"
import { GameReview, NewsItem } from "../sdhq-types"

type HomePageProps = {
	appError: string | null
	appIsActive: boolean
	latestReviewsError: string | null
	newsError: string | null
	review: GameReview | null | undefined
	reviewError: string | null
	newsItems: NewsItem[]
	setPage: (page: "home" | "review") => void
	reviewItems: GameReview[] | null
}

export const HomePage = ({
	appError,
	appIsActive,
	latestReviewsError,
	newsError,
	review,
	reviewError,
	newsItems,
	setPage,
	reviewItems,
}: HomePageProps) => (
	<>
		<>
			{appIsActive ? (
				<PanelSection
					title={
						review ? review.title.rendered : "Current Game"
					}
				>
					<PanelSectionRow>
						{appError ? (
							<span>Failed to resolve the current game: {appError}</span>
						) : !review ? (
							<span>
								{reviewError
									? `Failed to load the current game review: ${reviewError}`
									: review === null
										? "No SDHQ Review For Current Game"
										: "Loading..."}
							</span>
						) : (
							<ButtonItem
								layout="below"
								onClick={() => setPage("review")}
							>
								See Recommended Settings
								{review.acf?.best_on_deck ? (
									<img
										style={{
											position: "absolute",
											right: "-10px",
											height: "25px",
											width: "25px",
											top: "-10px",
											rotate: "-30deg",
										}}
										src={badge}
									/>
								) : null}
							</ButtonItem>
						)}
					</PanelSectionRow>
				</PanelSection>
			) : null}

			<PanelSection title="Latest Reviews">
				{reviewItems !== null ? (
					<>
						{reviewItems.map((gameReview) => (
							<PanelSectionRow key={gameReview.id}>
								<ButtonItem
									layout="below"
									onClick={() =>
										Navigation.NavigateToExternalWeb(
											gameReview.link
										)
									}
								>
									{gameReview.title.rendered}
								</ButtonItem>
							</PanelSectionRow>
						))}
					</>
				) : latestReviewsError ? (
					<PanelSectionRow>
						<i>Failed to load reviews: {latestReviewsError}</i>
					</PanelSectionRow>
				) : null}
				{reviewItems !== null &&
				reviewItems.length === 0 &&
				latestReviewsError ? (
					<PanelSectionRow>
						<i>Failed to load reviews: {latestReviewsError}</i>
					</PanelSectionRow>
				) : null}
				<PanelSectionRow>
					<ButtonItem
						layout="below"
						onClick={() =>
							Navigation.NavigateToExternalWeb(
								"https://steamdeckhq.com/game-settings/"
							)
						}
					>
						<i>All Reviews...</i>
					</ButtonItem>
				</PanelSectionRow>
			</PanelSection>

			<PanelSection title="Latest News">
				{newsItems.length === 0 && newsError ? (
					<PanelSectionRow>
						<i>Failed to load news: {newsError}</i>
					</PanelSectionRow>
				) : newsItems.length === 0 ? (
					<PanelSectionRow>
						<i>Loading...</i>
					</PanelSectionRow>
				) : null}
				{newsItems.map((news) => (
					<PanelSectionRow key={news.id}>
						<ButtonItem
							layout="below"
							onClick={() =>
								Navigation.NavigateToExternalWeb(news.link)
							}
						>
							{news.title.rendered}
						</ButtonItem>
					</PanelSectionRow>
				))}
				<PanelSectionRow>
					<ButtonItem
						layout="below"
						onClick={() =>
							Navigation.NavigateToExternalWeb(
								"https://steamdeckhq.com/news/"
							)
						}
					>
						<i>View More...</i>
					</ButtonItem>
				</PanelSectionRow>
			</PanelSection>

			<PanelSection>
				<PanelSectionRow>
					<ButtonItem
						layout="below"
						onClick={() => Navigation.NavigateToExternalWeb("https://steamdeckhq.com/")}
					>
						<SteamDeckHQLogo />
					</ButtonItem>
				</PanelSectionRow>
			</PanelSection>
		</>
	</>
)
export default HomePage
