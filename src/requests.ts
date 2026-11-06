import { callable } from "@decky/api";

import { GameReview, NewsItem } from "./types/sdhq-types";
import type { RequestErrors } from "./load-data";

const getNewsArticleCall =
  callable<[articleId: number], NewsItem | null>("get_news_article");
const getReviewArticleCall =
  callable<[articleId: number], GameReview | null>("get_review_article");
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

export const getNewsArticle = async (articleId: number) =>
  getNewsArticleCall(articleId);

export const getReviewArticle = async (articleId: number) =>
  getReviewArticleCall(articleId);

export const getStoreAppId = async () => getStoreAppIdCall();

export const getLastRequestErrors = async () => getLastRequestErrorsCall();
