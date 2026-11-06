import type { GameReview, NewsItem } from "./sdhq-types";

export type ArticlePageResult = {
  articles: (NewsItem | GameReview)[];
  hasMore: boolean;
  error: string | null;
};
