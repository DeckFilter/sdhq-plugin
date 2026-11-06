export type ArticleKind = "review" | "news";

export type ArticleSummary = {
  id: number;
  kind: ArticleKind;
  title: string;
  summary: string;
  imageUrl: string;
  link: string;
  authorName: string;
  publishedLabel: string;
};

export type ArticleInline =
  | { type: "text"; text: string }
  | { type: "break" }
  | { type: "strong" | "emphasis" | "code"; children: ArticleInline[] }
  | { type: "link"; href: string; children: ArticleInline[] };

export type ArticleBlock =
  | { type: "paragraph"; text: string; content?: ArticleInline[] }
  | { type: "heading"; level: number; text: string; content?: ArticleInline[] }
  | { type: "image"; src: string; alt: string; caption?: string; captionContent?: ArticleInline[]; href?: string; width?: number; height?: number }
  | { type: "list"; ordered: boolean; items: string[]; itemContent?: ArticleInline[][] }
  | { type: "quote"; text: string; content?: ArticleInline[] }
  | { type: "spacer"; height?: string }
  | { type: "linkCard"; href: string; label: string }
  | { type: "unsupportedEmbed"; label: string; url?: string };

export type ReviewSettingsProfile = {
  device?: string;
  title?: string;
  protonVersion: string;
  gameSettings: string;
  steam: {
    fpsCap: string;
    refreshRate?: number;
    halfRateShading?: boolean;
    tdpLimit: string;
    scalingFilter: string;
    gpuClockFrequency: string;
    storeUrl: string;
    protonDbUrl: string;
  };
  battery: {
    wattage: string;
    temperatures: string;
    gameplayTime: string;
  };
};

export type ReviewDecisionPanelData = ReviewSettingsProfile & {
  bestOnDeck?: boolean;
  rating?: number;
  profiles?: ReviewSettingsProfile[];
};

export type ArticleDetail = ArticleSummary & {
  blocks: ArticleBlock[];
  reviewMeta?: ReviewDecisionPanelData;
};
