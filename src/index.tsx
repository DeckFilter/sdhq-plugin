import { definePlugin, staticClasses } from "@decky/ui";
import { FC, useEffect, useState } from "react";

import { getCurrentAppId } from "./helpers";
import { loadHomeData, loadReviewData } from "./load-data";
import HQLogo from "./pages/HQLogo";
import HomePage from "./pages/home";
import { ReviewPage } from "./pages/review";
import {
  getLastRequestErrors,
  getLatestReviews,
  getNews,
  getReviewForApp,
} from "./requests";
import { GameReview, NewsItem } from "./sdhq-types";

const Content: FC = () => {
  const [page, setPage] = useState<"home" | "review">("home");
  const [newsItems, setNewsitems] = useState<NewsItem[]>([]);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [review, setReview] = useState<GameReview | null | undefined>();
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [currentAppId, setCurrentAppId] = useState<string | null | undefined>(
    undefined,
  );
  const [currentAppError, setCurrentAppError] = useState<string | null>(null);
  const [latestReviews, setLatestReviews] = useState<GameReview[] | null>(null);
  const [latestReviewsError, setLatestReviewsError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (currentAppId === undefined) {
      return;
    }

    if (currentAppId === null) {
      setReview(null);
      setReviewError(null);
      setPage("home");
      return;
    }

    let cancelled = false;

    const loadReview = async () => {
      const { review: nextReview, reviewError: nextReviewError } =
        await loadReviewData(currentAppId, {
          getReviewForApp,
          getLastRequestErrors,
        });
      if (cancelled) {
        return;
      }

      setReview(nextReview);
      setReviewError(nextReviewError);
      setPage("home");
    };

    loadReview();

    return () => {
      cancelled = true;
    };
  }, [currentAppId]);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      const {
        currentAppError,
        currentAppId,
        latestReviews,
        latestReviewsError,
        newsError,
        newsItems,
      } = await loadHomeData({
        getCurrentAppId,
        getLastRequestErrors,
        getLatestReviews,
        getNews,
      });
      if (cancelled) {
        return;
      }

      setCurrentAppError(currentAppError);
      setCurrentAppId(currentAppId);
      setLatestReviews(latestReviews);
      setLatestReviewsError(latestReviewsError);
      setNewsError(newsError);
      setNewsitems(newsItems);
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  if (page === "review" && review) {
    return <ReviewPage review={review} setPage={setPage} />;
  }

  return (
    <HomePage
      appError={currentAppError}
      appIsActive={currentAppId !== null || currentAppError !== null}
      latestReviewsError={latestReviewsError}
      newsError={newsError}
      review={review}
      reviewError={reviewError}
      newsItems={newsItems}
      setPage={setPage}
      reviewItems={latestReviews}
    />
  );
};

export default definePlugin(() => {
  return {
    name: "Steam Deck HQ",
    title: <div className={staticClasses.Title}>Steam Deck HQ</div>,
    content: <Content />,
    icon: <HQLogo />,
    onDismount() {},
  };
});
