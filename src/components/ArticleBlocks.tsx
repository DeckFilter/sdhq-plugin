import { Focusable, Navigation } from "@decky/ui";
import { Fragment, type ReactNode } from "react";

import type { ArticleBlock, ArticleInline } from "../types/article-types";
import { openExternalUrl } from "../navigation";
import { ArticleImage } from "./ArticleImage";

const externalUrl = (value: string, articleUrl?: string) => {
  if (!value.trim()) return "";
  try {
    const url = new URL(value, articleUrl || undefined);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
};

export type ArticleBlocksProps = {
  blocks: ArticleBlock[];
  articleUrl?: string;
  onDismiss?: () => void;
};

type ArticleLinkProps = {
  href: string;
  articleUrl?: string;
  onDismiss?: () => void;
  children: ReactNode;
};

const ArticleLink = ({ href, articleUrl, onDismiss, children }: ArticleLinkProps) => {
  const url = externalUrl(href, articleUrl);
  return url ? (
    <Focusable
      role="link"
      tabIndex={0}
      title={url}
      className="sdhq-article-link"
      onOKActionDescription="Open Link"
      onActivate={() => {
        onDismiss?.();
        openExternalUrl(url);
        Navigation.CloseSideMenus();
      }}
    >
      {children}
    </Focusable>
  ) : <>{children}</>;
};

type ArticleInlineContentProps = {
  content: ArticleInline[];
  articleUrl?: string;
  onDismiss?: () => void;
};

const ArticleInlineContent = ({ content, articleUrl, onDismiss }: ArticleInlineContentProps) => (
  <>
    {content.map((node, index) => {
      if (node.type === "text") return <Fragment key={index}>{node.text}</Fragment>;
      if (node.type === "break") return <br key={index} />;
      const children = <ArticleInlineContent content={node.children} articleUrl={articleUrl} onDismiss={onDismiss} />;
      if (node.type === "link") return <ArticleLink key={index} href={node.href} articleUrl={articleUrl} onDismiss={onDismiss}>{children}</ArticleLink>;
      if (node.type === "strong") return <strong key={index}>{children}</strong>;
      if (node.type === "emphasis") return <em key={index}>{children}</em>;
      return <code key={index}>{children}</code>;
    })}
  </>
);

export const ArticleBlocks = ({ blocks, articleUrl, onDismiss }: ArticleBlocksProps) => (
  <>
    {blocks.map((block, index) => {
      if (block.type === "paragraph") {
        return <div role="paragraph" key={index} className="sdhq-article-paragraph">{block.content ? <ArticleInlineContent content={block.content} articleUrl={articleUrl} onDismiss={onDismiss} /> : block.text}</div>;
      }

      if (block.type === "heading") {
        const Tag = `h${Math.min(Math.max(block.level, 2), 4)}` as "h2" | "h3" | "h4";
        return <Tag key={index}>{block.content ? <ArticleInlineContent content={block.content} articleUrl={articleUrl} onDismiss={onDismiss} /> : block.text}</Tag>;
      }

      if (block.type === "list") {
        const ListTag = block.ordered ? "ol" : "ul";
        return (
          <ListTag key={index}>
            {block.items.map((item, itemIndex) => <li key={itemIndex}>{block.itemContent?.[itemIndex] ? <ArticleInlineContent content={block.itemContent[itemIndex]} articleUrl={articleUrl} onDismiss={onDismiss} /> : item}</li>)}
          </ListTag>
        );
      }

      if (block.type === "quote") {
        return <blockquote key={index}>{block.content ? <ArticleInlineContent content={block.content} articleUrl={articleUrl} onDismiss={onDismiss} /> : block.text}</blockquote>;
      }

      if (block.type === "spacer") {
        return <div aria-hidden key={index} style={{ height: block.height ?? "24px" }} />;
      }

      if (block.type === "image") {
        const image = <ArticleImage alt={block.alt} src={block.src} loading="lazy" width={block.width} height={block.height} />;
        return (
          <figure key={index}>
            {block.href ? <ArticleLink href={block.href} articleUrl={articleUrl} onDismiss={onDismiss}>{image}</ArticleLink> : image}
            {block.caption ? <figcaption>{block.captionContent ? <ArticleInlineContent content={block.captionContent} articleUrl={articleUrl} onDismiss={onDismiss} /> : block.caption}</figcaption> : null}
          </figure>
        );
      }

      if (block.type === "linkCard") {
        const url = externalUrl(block.href, articleUrl);
        return (
          <div key={index} className="sdhq-article-paragraph">
            <ArticleLink href={block.href} articleUrl={articleUrl} onDismiss={onDismiss}>{block.label || url}</ArticleLink>
          </div>
        );
      }

      return <div key={index} className="sdhq-article-paragraph">{block.url ? <ArticleLink href={block.url} articleUrl={articleUrl} onDismiss={onDismiss}>{block.label}</ArticleLink> : block.label}</div>;
    })}
  </>
);
