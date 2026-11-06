import { useCallback, useEffect, useRef, useState } from "react";

import { normalizeNewsArticle, normalizeReviewArticle } from "./article-normalizer";
import { getArticlePage } from "./requests";
import type { ArticleDetail, ArticleKind } from "./types/article-types";
import type { GameReview, NewsItem } from "./types/sdhq-types";

type ArticleFeedItem = {
  id: number;
  kind: ArticleKind;
  article?: ArticleDetail;
};

export const useArticleFeed = (
  kind: ArticleKind,
  articleId: number,
  initialArticles: readonly ArticleDetail[],
  browse: boolean,
) => {
  const matchingArticles = [...new Map(initialArticles.filter((article) => article.kind === kind)
    .map((article) => [article.id, article])).values()];
  const initialIndex = matchingArticles.findIndex((article) => article.id === articleId);
  const [items, setItems] = useState<ArticleFeedItem[]>(() => initialIndex >= 0
    ? matchingArticles.map((article) => ({ id: article.id, kind, article }))
    : [{ id: articleId, kind }]);
  const [activeIndex, setActiveIndex] = useState(Math.max(0, initialIndex));
  const [prefetchIndex, setPrefetchIndex] = useState(Math.max(0, initialIndex));
  const [hasMore, setHasMore] = useState(browse);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextPage = useRef(initialIndex >= 0 ? 2 : 1);
  const mounted = useRef(false);
  const inFlight = useRef(false);
  const canLoad = useRef(browse);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const loadNext = useCallback(async () => {
    if (!mounted.current || !canLoad.current || inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      const page = await getArticlePage(kind, nextPage.current);
      if (!mounted.current) return;
      if (page.error) throw new Error(page.error);
      const articles = page.articles.map((article) => kind === "review"
        ? normalizeReviewArticle(article as GameReview)
        : normalizeNewsArticle(article as NewsItem));
      setItems((current) => {
        const incoming = new Map(articles.map((article) => [`${article.kind}:${article.id}`, article]));
        const merged = current.map((item) => item.article ? item : {
          ...item, article: incoming.get(`${item.kind}:${item.id}`),
        });
        const seen = new Set(current.map((item) => `${item.kind}:${item.id}`));
        for (const article of articles) {
          const key = `${article.kind}:${article.id}`;
          if (!seen.has(key)) {
            merged.push({ id: article.id, kind: article.kind, article });
            seen.add(key);
          }
        }
        return merged;
      });
      nextPage.current += 1;
      canLoad.current = page.hasMore;
      setHasMore(page.hasMore);
    } catch (failure) {
      if (mounted.current) setError(failure instanceof Error ? failure.message : String(failure));
    } finally {
      inFlight.current = false;
      if (mounted.current) setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    if (browse && hasMore && !loading && !error && items.length - prefetchIndex <= 3) {
      void loadNext();
    }
  }, [browse, error, hasMore, items.length, loadNext, loading, prefetchIndex]);

  const selectIndex = useCallback((index: number) => {
    setActiveIndex(index);
    setPrefetchIndex(index);
  }, []);

  return { items, activeIndex, initialIndex: Math.max(0, initialIndex), setActiveIndex: selectIndex,
    setPrefetchIndex, hasMore, loading, error, loadNext };
};
