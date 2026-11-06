import { findClassModule } from "@decky/ui";

const pageClasses = findClassModule((classes) => typeof classes.BasicPartnerEventsPage === "string");
const libraryClasses = findClassModule((classes) => typeof classes.LibraryEventTitleContainer === "string");
const partnerClasses = findClassModule((classes) =>
  typeof classes.PartnerEvent === "string" && typeof classes.EventTypeAndTimeRow === "string",
);

const hasNativeArticleLayout = Boolean(pageClasses && libraryClasses && partnerClasses);
const joinClasses = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(" ");

export const articleClasses = {
  page: pageClasses?.BasicPartnerEventsPage ?? "",
  container: pageClasses?.BasicPartnerEventContainer ?? "",
  carousel: pageClasses?.EventCarousel ?? "",
  inner: pageClasses?.InnerContainer ?? "",
  pageable: pageClasses?.PageableContainer ?? "",
  card: joinClasses(pageClasses?.BasicPartnerEvent, partnerClasses?.PartnerEvent, libraryClasses?.InLibraryView),
  focus: pageClasses?.PartnerEventFocusable ?? "",
  scroll: pageClasses?.ScrollablePanel ?? "",
  header: libraryClasses?.LibraryEventTitleContainer ?? "",
  headerContent: libraryClasses?.EventDetailTitleContainer ?? "",
  brand: pageClasses?.GameIconAndName ?? "",
  brandIcon: pageClasses?.GameIcon ?? "",
  brandName: pageClasses?.GameName ?? "",
  typeRow: partnerClasses?.EventTypeAndTimeRow ?? "",
  meta: partnerClasses?.TimeandPostedBy ?? "",
  category: partnerClasses?.EventType ?? "",
  author: partnerClasses?.PostedBy ?? "",
  date: libraryClasses?.EventDetailTimeInfo ?? "",
  title: libraryClasses?.EventDetailTitle ?? "",
  bodyContainer: libraryClasses?.LibraryEventBodyContainer ?? "",
  body: joinClasses(libraryClasses?.EventDetailsBody, partnerClasses?.EventDetailsBody),
  hero: libraryClasses?.EventCoverImageBackground ?? "",
  heroBlur: libraryClasses?.EventBackgroundBlur ?? "",
};

const fallbackArticleStyles = `
.sdhq-article-viewer .sdhq-article-scroll {
  width: 100%; height: 100%; box-sizing: border-box; padding: 24px;
  overflow-x: hidden; overflow-y: auto;
}
.sdhq-article-viewer .sdhq-article-card {
  width: 100%; max-width: 640px; box-sizing: border-box; margin: 24px auto 40px;
  background: radial-gradient(at left top, #42454c, #25282e);
  position: relative; box-shadow: none; overflow: hidden;
}
.sdhq-article-viewer .sdhq-article-focus.gpfocus > .sdhq-article-card,
.sdhq-article-viewer .sdhq-article-focus.gpfocuswithin > .sdhq-article-card {
  outline: 2px solid rgba(255,255,255,.6); outline-offset: 2px;
}
.sdhq-article-viewer .sdhq-article-header {
  padding: 16px 24px 12px; margin: 0; box-sizing: border-box;
  background: radial-gradient(at center bottom, rgba(255,255,255,.1) 10%, transparent 80%);
  position: relative;
}
.sdhq-article-viewer .sdhq-article-brand { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.sdhq-article-viewer .sdhq-article-meta {
  display: flex; flex-wrap: wrap; align-items: center; row-gap: 6px;
  font-size: 12px; line-height: normal; font-weight: 300;
}
.sdhq-article-viewer .sdhq-article-category {
  color: #289cff; text-transform: uppercase; font-weight: 500;
  letter-spacing: normal; margin-right: 6px;
}
.sdhq-article-viewer .sdhq-article-date {
  display: inline-flex; color: #868f98; font-weight: 300;
}
.sdhq-article-viewer .sdhq-article-posted {
  margin-right: 3px; text-transform: uppercase;
}
.sdhq-article-viewer .sdhq-article-author {
  color: #868f98; font-size: 12px; margin-left: auto;
}
.sdhq-article-viewer .sdhq-article-title {
  margin: 12px 0 0; padding: 0; color: #eaeaeb; font-size: 24px;
  font-weight: 500; line-height: 36px; overflow-wrap: anywhere;
}
.sdhq-article-viewer .sdhq-article-hero {
  position: absolute; inset: 0; width: 100%; height: 220px;
  object-fit: cover; opacity: .2; pointer-events: none;
}
.sdhq-article-viewer .sdhq-article-hero-blur { display: none; }
.sdhq-article-viewer .sdhq-article-body {
  min-height: 0; box-sizing: border-box; position: relative;
  margin: 0; padding: 24px; color: #cfd2d3;
  font-size: 14px; font-weight: 300; line-height: 19px; overflow-wrap: anywhere;
}
`;

export const articleStyles = `
.sdhq-article-viewer {
  color: #dcdedf;
}
${hasNativeArticleLayout ? "" : ".sdhq-article-viewer { position: absolute; top: 40px; left: 0; width: 100vw; height: calc(100vh - 40px); }"}
.sdhq-article-viewer .sdhq-article-focus { width: 100%; }
${hasNativeArticleLayout ? "" : fallbackArticleStyles}
${articleClasses.brandIcon ? "" : ".sdhq-article-viewer .sdhq-article-brand-icon { width: 32px; height: 32px; flex-shrink: 0; }"}
.sdhq-article-viewer .sdhq-article-brand-icon { display: block; object-fit: contain; }
.sdhq-article-viewer .sdhq-article-paragraph { margin: 7px 0; white-space: pre-wrap; }
.sdhq-article-viewer .sdhq-article-summary { margin: 0 0 14px; }
.sdhq-article-viewer .sdhq-article-body h2,
.sdhq-article-viewer .sdhq-article-body h3,
.sdhq-article-viewer .sdhq-article-body h4 {
  color: #fff; font-weight: 300; line-height: 22px; margin: 8px 0 6px;
}
.sdhq-article-viewer .sdhq-article-body h2 { font-size: 22px; }
.sdhq-article-viewer .sdhq-article-body h3 { font-size: 19px; }
.sdhq-article-viewer .sdhq-article-body h4 { font-size: 16px; }
.sdhq-article-viewer .sdhq-article-body ul,
.sdhq-article-viewer .sdhq-article-body ol { margin: 14px 0; padding-left: 40px; }
.sdhq-article-viewer .sdhq-article-body li { margin: 0 0 5px; }
.sdhq-article-viewer .sdhq-article-body figure { margin: 14px 0; }
.sdhq-article-viewer .sdhq-article-body figure img { display: block; width: 100%; height: auto; }
.sdhq-article-viewer .sdhq-article-body figcaption { margin-top: 6px; color: #868f98; font-size: 12px; }
.sdhq-article-viewer .sdhq-article-body blockquote {
  border-left: 3px solid #67c1f5; margin: 12px 0; padding-left: 12px;
}
.sdhq-article-viewer .sdhq-article-link {
  display: inline; color: #67c1f5; cursor: pointer; text-decoration: underline;
}
.sdhq-article-viewer .sdhq-article-link:hover { color: #fff; }
.sdhq-article-viewer .sdhq-article-link:focus-visible,
.sdhq-article-viewer .sdhq-article-link.gpfocus {
  color: #fff; outline: 2px solid #fff; outline-offset: 2px;
}
.sdhq-article-viewer .sdhq-article-table { overflow-x: auto; margin-bottom: 14px; }
.sdhq-article-viewer .sdhq-article-body table { width: 100%; border-collapse: collapse; }
.sdhq-article-viewer .sdhq-article-body th,
.sdhq-article-viewer .sdhq-article-body td {
  border: 1px solid #ffffff30; padding: 6px 10px; text-align: left; vertical-align: top;
}
.sdhq-article-viewer .sdhq-article-body th { font-weight: 700; }
.sdhq-article-viewer .sdhq-review-settings { white-space: pre-wrap; }
`;
