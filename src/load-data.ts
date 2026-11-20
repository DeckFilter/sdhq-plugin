import { useEffect, useState } from "react";

import { getCurrentAppId } from "./helpers";
import { getLatestReviews, getNews, getReviewForApp } from "./requests";
import type { GameReview, NewsItem } from "./sdhq-types";

type RequestState<T> = { data?: T; error?: string };

export function useHomeData() {
  const [news, setNews] = useState<RequestState<NewsItem[]>>({});
  const [latestReviews, setLatestReviews] = useState<RequestState<GameReview[]>>({});
  const [currentApp, setCurrentApp] = useState<RequestState<string | null>>({});
  const [gameReview, setGameReview] = useState<RequestState<GameReview | null>>({});

  useEffect(() => {
    let disposed = false;

    async function load<T>(request: () => Promise<T>, publish: (state: RequestState<T>) => void) {
      let state: RequestState<T>;
      try {
        state = { data: await request() };
      } catch (error) {
        state = { error: error instanceof Error ? error.message || error.name : String(error) };
      }
      if (!disposed) publish(state);
    }

    void load(getNews, setNews);
    void load(getLatestReviews, setLatestReviews);
    void load(getCurrentAppId, result => {
      setCurrentApp(result);
      const appId = result.data;
      if (appId) void load(() => getReviewForApp(appId), setGameReview);
    });

    return () => { disposed = true; };
  }, []);

  return { news, latestReviews, currentApp, gameReview };
}
