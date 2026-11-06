import {
  Element,
  Text,
  type DOMNode,
  htmlToDOM,
} from "html-react-parser";

import type {
  ArticleBlock,
  ArticleDetail,
  ArticleInline,
  ArticleKind,
  ArticleSummary,
  ReviewDecisionPanelData,
  ReviewSettingsProfile,
} from "./types/article-types";
import type { GameReview, NewsItem, ReviewSettingsPreset } from "./types/sdhq-types";

const normalizeWhitespace = (value: string): string =>
  value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();

const nodesToArray = (value: DOMNode[] | DOMNode | undefined): DOMNode[] =>
  Array.isArray(value) ? value : value ? [value] : [];

const ignoredElements = new Set(["script", "style", "noscript", "template"]);
const textBoundaryElements = new Set(["p", "div", "li", "ul", "ol", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6"]);
const inlineElements = new Set(["a", "strong", "b", "em", "i", "code", "span", "br", "img", "picture", "small", "sub", "sup", "u", "s", "del", "mark", "iframe", "embed", "video"]);

const textFromNodes = (value: DOMNode[] | DOMNode | undefined): string => {
  const visit = (node: DOMNode): string => {
    if (node instanceof Text) {
      return node.data ?? "";
    }

    if (node instanceof Element) {
      if (ignoredElements.has(node.name)) return "";
      if (node.name === "br") {
        return " ";
      }

      const text = (node.children as DOMNode[]).map(visit).join("");
      return textBoundaryElements.has(node.name) ? `${text} ` : text;
    }

    return "";
  };

  return normalizeWhitespace(nodesToArray(value).map(visit).join(""));
};

const htmlToText = (html: string): string => textFromNodes(htmlToDOM(html));

const htmlToSettingsText = (html: string): string => {
  const visit = (node: DOMNode): string => {
    if (node instanceof Text) return node.data.replace(/\r\n?/g, "\n").replace(/[\t\f\v \u00a0]+/g, " ");
    if (!(node instanceof Element) || ignoredElements.has(node.name)) return "";
    if (node.name === "br") return "\n";
    const text = (node.children as DOMNode[]).map(visit).join("");
    return textBoundaryElements.has(node.name) ? `\n${text}\n` : text;
  };
  return htmlToDOM(html).map(visit).join("").split("\n")
    .map(normalizeWhitespace).filter(Boolean).join("\n");
};

const httpUrl = (value: string, articleUrl?: string): string => {
  if (!value.trim()) return "";
  try {
    const url = new URL(value, articleUrl || undefined);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
};

const positiveDimension = (value: string | undefined): number | undefined => {
  if (!value || !/^\d+$/.test(value.trim())) return undefined;
  const dimension = Number(value);
  return Number.isSafeInteger(dimension) && dimension > 0 ? dimension : undefined;
};

const parseHeight = (style: string | undefined): string | undefined => {
  const match = style?.match(/height:\s*([^;]+)/i);
  return match?.[1]?.trim();
};

const normalizeSummary = (
  kind: ArticleKind,
  item: Pick<
    GameReview | NewsItem,
    "id" | "link" | "featured_img" | "author_meta" | "relative_dates" | "title" | "excerpt"
  >,
): ArticleSummary => ({
  authorName: item.author_meta?.display_name ?? "Steam Deck HQ",
  id: item.id,
  imageUrl: item.featured_img ?? "",
  kind,
  link: item.link,
  publishedLabel: item.relative_dates?.created ?? "",
  summary: htmlToText(item.excerpt?.rendered ?? ""),
  title: htmlToText(item.title?.rendered ?? ""),
});

type InlinePart = { content: ArticleInline[] } | { block: ArticleBlock };

const inlineText = (content: readonly ArticleInline[]): string => content.map((node): string => {
  if (node.type === "text") return node.text;
  if (node.type === "break") return "\n";
  return inlineText(node.children);
}).join("");

const trimInline = (content: readonly ArticleInline[]): ArticleInline[] => {
  const trimEdge = (nodes: readonly ArticleInline[], end: boolean): ArticleInline[] => {
    const result = [...nodes];
    while (result.length) {
      const index = end ? result.length - 1 : 0;
      const node = result[index];
      let trimmed: ArticleInline | null;
      if (node.type === "break") trimmed = null;
      else if (node.type === "text") {
        const text = end ? node.text.trimEnd() : node.text.trimStart();
        trimmed = text ? { ...node, text } : null;
      } else {
        const children = trimEdge(node.children, end);
        trimmed = children.length ? { ...node, children } : null;
      }
      if (trimmed) { result[index] = trimmed; break; }
      result.splice(index, 1);
    }
    return result;
  };
  return trimEdge(trimEdge(content, false), true);
};

const inlineParts = (nodes: readonly DOMNode[], articleUrl?: string): InlinePart[] => {
  const parts: InlinePart[] = [];
  const append = (part: InlinePart) => {
    const previous = parts[parts.length - 1];
    if ("content" in part && previous && "content" in previous) previous.content.push(...part.content);
    else parts.push(part);
  };
  for (const node of nodes) {
    if (node instanceof Text) {
      append({ content: [{ type: "text", text: node.data.replace(/\u00a0/g, " ").replace(/\s+/g, " ") }] });
      continue;
    }
    if (!(node instanceof Element) || ignoredElements.has(node.name)) continue;
    if (node.name === "br") { append({ content: [{ type: "break" }] }); continue; }
    if (node.name === "img") {
      const src = httpUrl(node.attribs.src ?? "", articleUrl);
      if (src) append({ block: { type: "image", src, alt: node.attribs.alt ?? "", width: positiveDimension(node.attribs.width), height: positiveDimension(node.attribs.height) } });
      continue;
    }
    if (node.name === "figure") {
      extractBlocksFromNodes([node], articleUrl).forEach(block => append({ block }));
      continue;
    }
    if (node.name === "iframe" || node.name === "embed" || node.name === "video") {
      const url = httpUrl(node.attribs.src ?? "", articleUrl);
      const label = normalizeWhitespace(node.attribs.title ?? "") || url;
      if (label) append({ block: { type: "unsupportedEmbed", label, url: url || undefined } });
      continue;
    }
    const children = inlineParts(node.children as DOMNode[], articleUrl);
    const href = node.name === "a" ? httpUrl(node.attribs.href ?? "", articleUrl) : "";
    const mark = node.name === "strong" || node.name === "b" ? "strong"
      : node.name === "em" || node.name === "i" ? "emphasis"
      : node.name === "code" ? "code" : null;
    for (const child of children) {
      if ("content" in child && href) append({ content: [{ type: "link", href, children: child.content }] });
      else if ("content" in child && mark) append({ content: [{ type: mark, children: child.content }] });
      else if ("block" in child && child.block.type === "image" && href) append({ block: { ...child.block, href } });
      else append(child);
    }
    if (textBoundaryElements.has(node.name)) append({ content: [{ type: "break" }] });
  }
  return parts;
};

const blocksFromInline = (parts: InlinePart[], type: "paragraph" | "heading" | "quote", level = 2): ArticleBlock[] => {
  const blocks: ArticleBlock[] = [];
  let pending: ArticleInline[] = [];
  const flush = () => {
    const content = trimInline(pending);
    const text = normalizeWhitespace(inlineText(content));
    if (text) blocks.push(type === "heading" ? { type, level, text, content } : { type, text, content });
    pending = [];
  };
  for (const part of parts) {
    if ("content" in part) pending.push(...part.content);
    else { flush(); blocks.push(part.block); }
  }
  flush();
  return blocks;
};

const extractBlocksFromNodes = (nodes: readonly DOMNode[], articleUrl?: string): ArticleBlock[] => {
  const blocks: ArticleBlock[] = [];
  let pending: DOMNode[] = [];
  const flush = () => {
    blocks.push(...blocksFromInline(inlineParts(pending, articleUrl), "paragraph"));
    pending = [];
  };
  for (const node of nodes) {
    if (!(node instanceof Element)) { pending.push(node); continue; }
    if (ignoredElements.has(node.name)) continue;
    if (node.name === "p" || node.name === "blockquote" || /^h[1-6]$/.test(node.name)) {
      flush();
      const type = node.name === "p" ? "paragraph" : node.name === "blockquote" ? "quote" : "heading";
      blocks.push(...blocksFromInline(inlineParts(node.children as DOMNode[], articleUrl), type, Number(node.name.slice(1)) || 2));
    } else if (node.name === "ul" || node.name === "ol") {
      flush();
      let items: string[] = [];
      let itemContent: ArticleInline[][] = [];
      const flushList = () => {
        if (items.length) blocks.push({ type: "list", ordered: node.name === "ol", items, itemContent });
        items = []; itemContent = [];
      };
      for (const child of node.children) {
        if (!(child instanceof Element) || child.name !== "li") continue;
        for (const block of blocksFromInline(inlineParts(child.children as DOMNode[], articleUrl), "paragraph")) {
          if (block.type === "paragraph") { items.push(block.text); itemContent.push(block.content ?? [{ type: "text", text: block.text }]); }
          else { flushList(); blocks.push(block); }
        }
      }
      flushList();
    } else if (node.name === "figure") {
      flush();
      const figure: ArticleBlock[] = [];
      for (const child of node.children) {
        if (child instanceof Element && child.name === "figcaption") {
          const captionParts = inlineParts(child.children as DOMNode[], articleUrl);
          const captionContent = trimInline(captionParts.flatMap(part => "content" in part ? part.content : []));
          const caption = normalizeWhitespace(inlineText(captionContent));
          const previous = figure[figure.length - 1];
          if (previous?.type === "image") { previous.caption = caption; previous.captionContent = captionContent; }
          else figure.push(...blocksFromInline(captionParts, "paragraph"));
        } else figure.push(...extractBlocksFromNodes([child as DOMNode], articleUrl));
      }
      blocks.push(...figure);
    } else if (node.name === "div") {
      flush();
      if ((node.attribs.class ?? "").includes("wp-block-spacer")) blocks.push({ type: "spacer", height: parseHeight(node.attribs.style) });
      else blocks.push(...extractBlocksFromNodes(node.children as DOMNode[], articleUrl));
    } else if (inlineElements.has(node.name)) pending.push(node);
    else {
      flush();
      blocks.push(...extractBlocksFromNodes(node.children as DOMNode[], articleUrl));
    }
  }
  flush();
  return blocks;
};

const normalizeBlocks = (html: string, articleUrl?: string): ArticleBlock[] =>
  extractBlocksFromNodes(htmlToDOM(html), articleUrl).filter((block) => {
    if (block.type === "paragraph" || block.type === "heading" || block.type === "quote") {
      return block.text.length > 0;
    }

    if (block.type === "image") {
      return block.src.length > 0;
    }

    if (block.type === "list") {
      return block.items.length > 0;
    }

    if (block.type === "linkCard") {
      return block.href.length > 0 || block.label.length > 0;
    }

    return true;
  });

const settingText = (value: unknown): string =>
  typeof value === "string" ? value : typeof value === "number" && Number.isFinite(value) ? String(value) : "";

const settingNumber = (value: unknown): number | undefined => {
  if (typeof value !== "number" && (typeof value !== "string" || !value.trim())) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

const normalizeSettingsProfile = (
  settings: ReviewSettingsPreset,
  links: GameReview["acf"]["links"],
): ReviewSettingsProfile => ({
  device: settingText(settings.device),
  title: settingText(settings.title),
  battery: {
    gameplayTime: settingText(settings.projected_battery_usage_and_temperature?.gameplay_time),
    temperatures: settingText(settings.projected_battery_usage_and_temperature?.temperatures),
    wattage: settingText(settings.projected_battery_usage_and_temperature?.wattage),
  },
  gameSettings: htmlToSettingsText(settingText(settings.game_settings)),
  protonVersion: settingText(settings.proton_version),
  steam: {
    fpsCap: settingText(settings.fps_cap),
    gpuClockFrequency: settingText(settings.gpu_clock_frequency),
    halfRateShading: typeof settings.half_rate_shading === "boolean" ? settings.half_rate_shading : undefined,
    protonDbUrl: settingText(links?.protondb_url),
    refreshRate: settingNumber(settings.fps_refresh_rate),
    scalingFilter: settingText(settings.scaling_filter),
    storeUrl: settingText(links?.steam_store_url),
    tdpLimit: settingText(settings.tdp_limit),
  },
});

const normalizeReviewMeta = (review: GameReview): ReviewDecisionPanelData | undefined => {
  const acf = review.acf;
  if (!acf || typeof acf !== "object" || Array.isArray(acf)) return undefined;
  const profiles = Array.isArray(acf.steamos_settings)
    ? acf.steamos_settings.flatMap((row) => {
      const settings = row?.steamos_setting;
      return settings && typeof settings === "object" && !Array.isArray(settings)
        && typeof settings.device === "string" && settings.device.trim().toLowerCase() === "steam deck"
        ? [normalizeSettingsProfile(settings, acf.links)] : [];
    }) : [];
  const legacy = acf.optimized_and_recommended_settings;
  const legacyProfile = legacy && typeof legacy === "object" && !Array.isArray(legacy)
    ? normalizeSettingsProfile({
      ...legacy.steamos_settings,
      proton_version: legacy.proton_version,
      game_settings: legacy.game_settings,
      projected_battery_usage_and_temperature: legacy.projected_battery_usage_and_temperature,
    }, acf.links) : undefined;
  const rating = settingNumber(acf.sdhq_rating);
  const bestOnDeck = typeof acf.best_on_deck === "boolean" ? acf.best_on_deck : undefined;
  if (!profiles.length && !legacyProfile && rating === undefined && bestOnDeck === undefined) return undefined;
  return {
    ...(profiles[0] ?? legacyProfile ?? normalizeSettingsProfile({}, acf.links)),
    bestOnDeck,
    rating,
    ...(profiles.length ? { profiles } : {}),
  };
};

export const normalizeReviewSummary = (review: GameReview): ArticleSummary =>
  normalizeSummary("review", review);

export const normalizeNewsSummary = (news: NewsItem): ArticleSummary =>
  normalizeSummary("news", news);

export const normalizeReviewArticle = (review: GameReview): ArticleDetail => ({
  ...normalizeReviewSummary(review),
  blocks: normalizeBlocks(review.content.rendered, review.link),
  reviewMeta: normalizeReviewMeta(review),
});

export const normalizeNewsArticle = (news: NewsItem): ArticleDetail => ({
  ...normalizeNewsSummary(news),
  blocks: normalizeBlocks(news.content.rendered, news.link),
});
