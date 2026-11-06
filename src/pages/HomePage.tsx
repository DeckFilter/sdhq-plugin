import { ButtonItem, Focusable, PanelSection, PanelSectionRow } from "@decky/ui";
import { useEffect, useState } from "react";

import badge from "../../assets/bestOnDeck-badge.png";
import logo from "../../assets/sdhq-logo.png";
import { openArticleDialog } from "../components/ArticleDialog";
import { normalizeNewsArticle, normalizeReviewArticle } from "../article-normalizer";
import { getCurrentAppId } from "../helpers";
import { loadHomeData, loadReviewData } from "../load-data.js";
import { openExternalUrl } from "../navigation.js";
import {
  getLastRequestErrors,
  getLatestReviews,
  getNews,
  getReviewForApp,
} from "../requests.js";
import type { GameReview, NewsItem } from "../types/sdhq-types";

export const HomePage = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[] | null>(null);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [review, setReview] = useState<GameReview | null | undefined>();
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [currentAppId, setCurrentAppId] = useState<string | null | undefined>(
    undefined,
  );
  const [currentAppError, setCurrentAppError] = useState<string | null>(null);
  const [latestReviews, setLatestReviews] = useState<GameReview[] | null>(null);
  const [latestReviewsError, setLatestReviewsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      const result = await loadHomeData({
        getCurrentAppId,
        getLastRequestErrors,
        getLatestReviews,
        getNews,
      });
      if (cancelled) {
        return;
      }

      setCurrentAppError(result.currentAppError);
      setCurrentAppId(result.currentAppId);
      setLatestReviews(result.latestReviews);
      setLatestReviewsError(result.latestReviewsError);
      setNewsError(result.newsError);
      setNewsItems(result.newsItems);
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (currentAppId === undefined) {
      return;
    }

    if (currentAppId === null) {
      setReview(null);
      setReviewError(null);
      return;
    }

    let cancelled = false;

    const loadReview = async () => {
      const result = await loadReviewData(currentAppId, {
        getLastRequestErrors,
        getReviewForApp,
      });

      if (cancelled) {
        return;
      }

      setReview(result.review);
      setReviewError(result.reviewError);
    };

    loadReview();

    return () => {
      cancelled = true;
    };
  }, [currentAppId]);

  const openCurrentReview = () => {
    if (!review) {
      return;
    }

    const reviews = [review, ...(latestReviews ?? []).filter((item) => item.id !== review.id)];
    openArticleDialog("review", review.id, reviews.map(normalizeReviewArticle));
  };

  return (
    <>
      <Focusable
        onActivate={() => openExternalUrl("https://steamdeckhq.com/")}
        onClick={() => openExternalUrl("https://steamdeckhq.com/")}
        onOKButton={() => openExternalUrl("https://steamdeckhq.com/")}
      >
        <div style={{ display: "flex", justifyContent: "center" }}>
          <img alt="Steam Deck HQ" src={logo} style={{ width: "100%" }} />
        </div>
      </Focusable>

      {currentAppId !== null || currentAppError !== null ? (
        <PanelSection title={review ? review.title.rendered : "Current Game"}>
          {currentAppError ? (
            <PanelSectionRow>
              <i>Failed to resolve the current game: {currentAppError}</i>
            </PanelSectionRow>
          ) : !review ? (
            <PanelSectionRow>
              <i>
                {reviewError
                  ? `Failed to load the current game review: ${reviewError}`
                  : review === null
                    ? "No SDHQ Review For Current Game"
                    : "Loading..."}
              </i>
            </PanelSectionRow>
          ) : (
            <div>
              <ButtonItem layout="below" onClick={openCurrentReview}>
                See Recommended Settings
                {review.acf.best_on_deck ? (
                  <img
                    alt="Best on Deck"
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
            </div>
          )}
        </PanelSection>
      ) : null}

      <PanelSection title="Latest Reviews">
        {latestReviews !== null ? (
          latestReviews.map((gameReview) => (
            <PanelSectionRow key={gameReview.id}>
              <ButtonItem
                layout="below"
                onClick={() => openArticleDialog("review", gameReview.id, latestReviews.map(normalizeReviewArticle))}
              >
                {gameReview.title.rendered}
              </ButtonItem>
            </PanelSectionRow>
          ))
        ) : latestReviewsError ? (
          <PanelSectionRow>
            <i>Failed to load reviews: {latestReviewsError}</i>
          </PanelSectionRow>
        ) : (
          <PanelSectionRow>
            <i>Loading...</i>
          </PanelSectionRow>
        )}
        {latestReviews !== null &&
        latestReviews.length === 0 &&
        latestReviewsError ? (
          <PanelSectionRow>
            <i>Failed to load reviews: {latestReviewsError}</i>
          </PanelSectionRow>
        ) : null}
        <ButtonItem
          layout="below"
          onClick={() => openExternalUrl("https://steamdeckhq.com/game-settings/")}
        >
          <i>All Reviews...</i>
        </ButtonItem>
      </PanelSection>

      <PanelSection title="Latest News">
        {newsItems === null ? (
          <PanelSectionRow>
            <i>Loading...</i>
          </PanelSectionRow>
        ) : newsItems.length === 0 && newsError ? (
          <PanelSectionRow>
            <i>Failed to load news: {newsError}</i>
          </PanelSectionRow>
        ) : null}
        {newsItems?.map((news) => (
          <PanelSectionRow key={news.id}>
            <ButtonItem
              layout="below"
              onClick={() => openArticleDialog("news", news.id, newsItems?.map(normalizeNewsArticle))}
            >
              {news.title.rendered}
            </ButtonItem>
          </PanelSectionRow>
        ))}
        <PanelSectionRow>
          <ButtonItem
            layout="below"
            onClick={() => openExternalUrl("https://steamdeckhq.com/news/")}
          >
            <i>View More...</i>
          </ButtonItem>
        </PanelSectionRow>
      </PanelSection>
    </>
  );
};

export default HomePage;
