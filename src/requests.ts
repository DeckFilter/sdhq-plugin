import { callable } from "@decky/api";

import { GameReview, NewsItem } from "./sdhq-types";
import type { RequestErrors } from "./load-data";

const getNewsCall = callable<[], NewsItem[]>("get_news");
const getLatestReviewsCall = callable<[], GameReview[]>("get_latest_reviews");
const getReviewForAppCall = callable<[appId: string], GameReview | null>(
  "get_review_for_app",
);
const getStoreAppIdCall = callable<[], string | null>("get_store_app_id");
const getLastRequestErrorsCall =
  callable<[], RequestErrors>("get_last_request_errors");

export const getNews = async () => getNewsCall();

export const getReviewForApp = async (appId: number | string) =>
  getReviewForAppCall(appId.toString());

export const getLatestReviews = async () => getLatestReviewsCall();

export const getStoreAppId = async () => getStoreAppIdCall();

export const getLastRequestErrors = async () => getLastRequestErrorsCall();
