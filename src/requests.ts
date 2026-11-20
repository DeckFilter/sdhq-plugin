import { call } from "@decky/api";

import type { GameReview, NewsItem } from "./sdhq-types";

type RequestResult<T> = { data: T } | { error: string };

async function request<T>(method: string, ...args: string[]): Promise<T> {
  const result = await call<string[], RequestResult<T>>(method, ...args);
  if ("error" in result) throw new Error(result.error);
  return result.data;
}

export const getNews = () => request<NewsItem[]>("get_news");
export const getLatestReviews = () => request<GameReview[]>("get_latest_reviews");
export const getStoreAppId = () => request<string | null>("get_store_app_id");
export const getReviewForApp = (appId: number | string) =>
  request<GameReview | null>("get_review_for_app", String(appId));
