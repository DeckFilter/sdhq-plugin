import {
  Carousel,
  Focusable,
  GamepadButton,
  ScrollPanel,
  Spinner,
  findModuleExport,
  findSP,
  getFocusNavController,
  showModal,
  type GamepadEvent,
} from "@decky/ui";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ComponentType,
  type HTMLAttributes,
  type RefAttributes,
  type RefObject,
} from "react";

import { createOpenArticleDialog } from "../article-dialog-opener";
import { articleClasses, articleStyles } from "../article-styles";
import type { ArticleDetail, ArticleKind } from "../types/article-types";
import { ArticleBlocks } from "./ArticleBlocks.js";
import { useArticleImageSource } from "./ArticleImage";
import { loadArticleData } from "../load-data.js";
import { getLastRequestErrors, getNewsArticle, getReviewArticle } from "../requests.js";
import { ReviewDecisionPanel } from "./ReviewDecisionPanel.js";
import favicon from "../../assets/sdhq-favicon.png";

const useNativeScrollDirection = findModuleExport((value) => (
  typeof value === "function" && value.toString().includes("ScrollOnGamepadDirection top:")
)) as ((
  ref: RefObject<HTMLDivElement | null>,
  behavior?: ScrollBehavior,
  stepPercent?: number,
  shouldHandle?: (event: GamepadEvent) => boolean,
) => (event: GamepadEvent) => boolean) | undefined;

const nativeArticleScrollType = findModuleExport((value) => (
  typeof value?.NoTransformSparseContent === "number"
))?.NoTransformSparseContent as number | undefined;

const articleScrollEvent = (event: GamepadEvent) => {
  if (event.currentTarget === event.target
    || (event.target as HTMLElement).classList.contains("sdhq-article-focus")) {
    return true;
  }
  const tree = getFocusNavController()?.GetActiveNavTree?.();
  for (let node = tree?.GetLastFocusedNode?.()?.Parent;
    node && node.Element !== event.currentTarget; node = node.Parent) {
    if (node.BHasNavTargetInDirection?.(event.detail.button)) return false;
  }
  return true;
};

type ScrollProps = HTMLAttributes<HTMLDivElement> & { scrollDirection?: "y" };
const NativeScrollPanel = ScrollPanel as ComponentType<ScrollProps & RefAttributes<HTMLDivElement> & {
  focusableIfEmpty?: boolean;
  onGamepadDirection?: (event: GamepadEvent) => boolean;
  scrollIntoViewType?: number;
}>;

const ArticleFocusable = findModuleExport((value) => {
  const source = value?.render?.toString();
  return source?.includes("onExplicitFocusLevelChanged") && source.includes("navRefPanel");
}) as ComponentType<ComponentProps<typeof Focusable> & {
  focusable?: boolean;
  fnScrollIntoViewHandler?: () => boolean;
}>;

const keepArticleInPlace = () => true;

const ArticleScrollPanel = (props: ScrollProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const onGamepadDirection = useNativeScrollDirection?.(ref, "smooth", undefined, articleScrollEvent);
  return (
    <NativeScrollPanel {...props} ref={ref} focusableIfEmpty
      onGamepadDirection={onGamepadDirection} scrollIntoViewType={nativeArticleScrollType} />
  );
};

type ArticleCardProps = {
  articleId: number;
  kind: ArticleKind;
  initialArticle?: ArticleDetail;
  closeModal?: () => void;
};

const ArticleCard = ({ articleId, kind, initialArticle, closeModal }: ArticleCardProps) => {
  const [article, setArticle] = useState<ArticleDetail | null>(initialArticle ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!initialArticle);
  const imageSource = useArticleImageSource(article?.imageUrl);

  useEffect(() => {
    if (initialArticle) return;
    let cancelled = false;
    void loadArticleData(kind, articleId, {
      getLastRequestErrors,
      getNewsArticle,
      getReviewArticle,
    }).then((result) => {
      if (cancelled) return;
      setArticle(result.article);
      setError(result.error ?? (!result.article ? "Article not found" : null));
      setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, [articleId, kind, initialArticle]);

  return (
    <article className={`${articleClasses.card} sdhq-article-card`}>
      {isLoading ? (
        <div className="sdhq-article-body" role="status"><Spinner />Loading article…</div>
      ) : error || !article ? (
        <div className="sdhq-article-body" role="alert">{error ?? "Article not found"}</div>
      ) : (
        <>
          {imageSource && (
            <>
              <img alt="" src={imageSource} className={`${articleClasses.hero} sdhq-article-hero`} />
              <img alt="" aria-hidden src={imageSource} className={`${articleClasses.heroBlur} sdhq-article-hero-blur`} />
            </>
          )}
          <header className={`${articleClasses.header} sdhq-article-header`}>
            <div className={articleClasses.headerContent}>
              <div className={`${articleClasses.brand} sdhq-article-brand`}>
                <img alt="" src={favicon} className={`${articleClasses.brandIcon} sdhq-article-brand-icon`} />
                <div className={articleClasses.brandName}>Steam Deck HQ</div>
              </div>
              <div className={articleClasses.typeRow}>
                <div className={`${articleClasses.meta} sdhq-article-meta`}>
                  <span className={`${articleClasses.category} sdhq-article-category`}>{article.kind === "review" ? "Review" : "News"}</span>
                  <span className={`${articleClasses.author} sdhq-article-author`}>By {article.authorName}</span>
                  {article.publishedLabel && (
                    <span className={`${articleClasses.date} sdhq-article-date`}>
                      <span className="sdhq-article-posted">Posted </span>{article.publishedLabel.replace(/^posted\s*/i, "")}
                    </span>
                  )}
                </div>
              </div>
              <div role="heading" aria-level={1} className={`${articleClasses.title} sdhq-article-title`}>{article.title}</div>
            </div>
          </header>
          <div className={articleClasses.bodyContainer}>
            <div className={`${articleClasses.body} sdhq-article-body`}>
              {article.summary && <p className="sdhq-article-summary">{article.summary}</p>}
              {article.reviewMeta && <ReviewDecisionPanel reviewMeta={article.reviewMeta} />}
              <ArticleBlocks blocks={article.blocks} articleUrl={article.link} onDismiss={closeModal} />
            </div>
          </div>
        </>
      )}
    </article>
  );
};

type ArticleDialogProps = {
  articleId: number;
  closeModal?: () => void;
  kind: ArticleKind;
  articles?: readonly ArticleDetail[];
};

const getViewport = () => {
  const steamWindow = findSP();
  return { width: steamWindow.innerWidth, height: Math.max(160, steamWindow.innerHeight - 40) };
};

export const ArticleDialog = ({ articleId, closeModal, kind, articles = [] }: ArticleDialogProps) => {
  const carouselName = `Steam Deck HQ articles ${useId()}`;
  const [viewport, setViewport] = useState(getViewport);
  const innerRef = useRef<HTMLDivElement>(null);
  const selectedIndex = articles.findIndex((article) => article.id === articleId && article.kind === kind);
  const items = selectedIndex >= 0
    ? articles.map((article) => ({ id: article.id, kind: article.kind, article }))
    : [{ id: articleId, kind, article: undefined }];
  const columnWidth = viewport.width * .8;
  const edgePadding = (viewport.width - columnWidth) / 2;
  const getColumnWidth = useCallback((index: number) => (
    columnWidth + (index === items.length ? edgePadding : 0)
  ), [columnWidth, edgePadding, items.length]);

  useLayoutEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;
    const steamWindow = findSP();
    const measure = () => {
      const width = inner.clientWidth;
      const height = inner.clientHeight;
      if (width <= 0 || height <= 0) return;
      setViewport((current) => current.width === width && current.height === height
        ? current : { width, height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(inner);
    steamWindow.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      steamWindow.removeEventListener("resize", measure);
    };
  }, []);

  const carouselHeight = viewport.height;
  return (
    <Focusable className={`${articleClasses.page} sdhq-article-viewer`} aria-label="Steam Deck HQ articles"
      onCancelButton={closeModal} onCancel={closeModal} onCancelActionDescription="Back">
      <style>{articleStyles}</style>
      <div className={articleClasses.inner} ref={innerRef}>
      <div className={articleClasses.pageable}>
      <Carousel className={articleClasses.carousel} name={carouselName} nNumItems={items.length + 1}
        initialColumn={Math.max(0, selectedIndex) + 1} nIndexLeftmost={1}
        autoFocus enableBumperPaging scrollToAlignment="center"
        nHeight={carouselHeight} nItemHeight={carouselHeight} nItemMarginX={0}
        fnGetColumnWidth={getColumnWidth} fnGetId={(index) => index}
        fnDoesItemTakeFocus={(index) => index > 0}
        fnItemRenderer={(index) => {
          const item = items[index - 1];
          if (!item) return null;
          return (
            <Focusable className={articleClasses.container} style={{ width: columnWidth, height: carouselHeight }}
              onGamepadDirection={(event) => event.detail.button === GamepadButton.DIR_UP || event.detail.button === GamepadButton.DIR_DOWN}>
            <ArticleScrollPanel className={`${articleClasses.scroll} sdhq-article-scroll`} style={{ width: columnWidth, height: carouselHeight }}
              scrollDirection="y" aria-label={item.article?.title ?? "Article"}>
              <ArticleFocusable className={`${articleClasses.focus} sdhq-article-focus`} focusable noFocusRing
                onOKActionDescription="Select" fnScrollIntoViewHandler={keepArticleInPlace}>
                <ArticleCard articleId={item.id} kind={item.kind} initialArticle={item.article} closeModal={closeModal} />
              </ArticleFocusable>
            </ArticleScrollPanel>
            </Focusable>
          );
        }}
      />
      </div>
      </div>
    </Focusable>
  );
};

export const openArticleDialog = createOpenArticleDialog({
  buildDialog: (kind, articleId, articles) => (
    <ArticleDialog articleId={articleId} kind={kind} articles={articles} />
  ),
  showModal,
});
