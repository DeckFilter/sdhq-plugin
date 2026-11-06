import type { GameReview, NewsItem } from "./types/sdhq-types";
import type { ArticleDetail, ArticleKind } from "./types/article-types";
import {
  normalizeNewsArticle,
  normalizeReviewArticle,
} from "./article-normalizer";

export type RequestErrors = Partial<
  Record<
    | "latest_reviews"
    | "news"
    | "review_for_app"
    | "store_app_id"
    | "review_article"
    | "news_article",
    string
  >
>;

type HomeLoadDeps = {
  getCurrentAppId: () => Promise<string | null>;
  getNews: () => Promise<NewsItem[]>;
  getLatestReviews: () => Promise<GameReview[]>;
  getLastRequestErrors: () => Promise<RequestErrors>;
};

type ReviewLoadDeps = {
  getReviewForApp: (appId: string) => Promise<GameReview | null>;
  getLastRequestErrors: () => Promise<RequestErrors>;
};

export type HomeData = {
  currentAppError: string | null;
  currentAppId: string | null;
  latestReviews: GameReview[];
  latestReviewsError: string | null;
  newsError: string | null;
  newsItems: NewsItem[];
};

export type ReviewData = {
  review: GameReview | null;
  reviewError: string | null;
};

type ArticleLoadDeps = {
  getLastRequestErrors: () => Promise<RequestErrors>;
  getNewsArticle: (id: number) => Promise<NewsItem | null>;
  getReviewArticle: (id: number) => Promise<GameReview | null>;
};

export type ArticleData = {
  article: ArticleDetail | null;
  error: string | null;
};

const formatError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const loadHomeData = async ({
  getCurrentAppId,
  getNews,
  getLatestReviews,
  getLastRequestErrors,
}: HomeLoadDeps): Promise<HomeData> => {
  const [appIdResult, newsResult, reviewsResult] = await Promise.allSettled([
    getCurrentAppId(),
    getNews(),
    getLatestReviews(),
  ]);
  const requestErrors: RequestErrors = await getLastRequestErrors().catch(
    () => ({} as RequestErrors),
  );

  const currentAppId = appIdResult.status === "fulfilled" ? appIdResult.value : null;

  return {
    currentAppError:
      appIdResult.status === "rejected"
        ? formatError(appIdResult.reason)
        : currentAppId === null
          ? requestErrors.store_app_id ?? null
          : null,
    currentAppId,
    latestReviews:
      reviewsResult.status === "fulfilled" ? reviewsResult.value : [],
    latestReviewsError:
      reviewsResult.status === "rejected"
        ? formatError(reviewsResult.reason)
        : requestErrors.latest_reviews ?? null,
    newsError:
      newsResult.status === "rejected"
        ? formatError(newsResult.reason)
        : requestErrors.news ?? null,
    newsItems: newsResult.status === "fulfilled" ? newsResult.value : [],
  };
};

export const loadArticleData = async (
  kind: ArticleKind,
  articleId: number,
  { getLastRequestErrors, getNewsArticle, getReviewArticle }: ArticleLoadDeps,
): Promise<ArticleData> => {
  const requestErrors: RequestErrors = await getLastRequestErrors().catch(
    () => ({} as RequestErrors),
  );

  try {
    if (kind === "review") {
      const review = await getReviewArticle(articleId);
      return {
        article: review ? normalizeReviewArticle(review) : null,
        error: requestErrors.review_article ?? null,
      };
    }

    const news = await getNewsArticle(articleId);
    return {
      article: news ? normalizeNewsArticle(news) : null,
      error: requestErrors.news_article ?? null,
    };
  } catch (error: unknown) {
    return {
      article: null,
      error: formatError(error),
    };
  }
};

export const loadReviewData = async (
  appId: string,
  { getReviewForApp, getLastRequestErrors }: ReviewLoadDeps,
): Promise<ReviewData> => {
  const reviewResult = await getReviewForApp(appId)
    .then((review) => ({ review, status: "fulfilled" as const }))
    .catch((error: unknown) => ({
      error,
      status: "rejected" as const,
    }));
  const requestErrors: RequestErrors = await getLastRequestErrors().catch(
    () => ({} as RequestErrors),
  );

  return {
    review: reviewResult.status === "fulfilled" ? reviewResult.review : null,
    reviewError:
      reviewResult.status === "rejected"
        ? formatError(reviewResult.error)
        : requestErrors.review_for_app ?? null,
  };
};
