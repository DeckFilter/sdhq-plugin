import type { ReactNode } from "react";

import type { ArticleDetail, ArticleDialogOptions, ArticleKind } from "./types/article-types";

type ShowModalProps = {
  bHideMainWindowForPopouts?: boolean;
  strTitle?: string;
};

type ShowModalResult = {
  Close: () => void;
  Update: (modal: ReactNode) => void;
};

type ShowModalFn = (
  modal: ReactNode,
  parent?: EventTarget,
  props?: ShowModalProps,
) => ShowModalResult;

type CreateOpenArticleDialogDeps = {
  buildDialog: (kind: ArticleKind, articleId: number, articles?: readonly ArticleDetail[], options?: ArticleDialogOptions) => ReactNode;
  parent?: EventTarget;
  showModal: ShowModalFn;
};

export const createOpenArticleDialog = ({
  buildDialog,
  parent,
  showModal,
}: CreateOpenArticleDialogDeps) => {
  return (kind: ArticleKind, articleId: number, articles?: readonly ArticleDetail[], options?: ArticleDialogOptions) =>
    showModal(buildDialog(kind, articleId, articles, options), parent, {
      bHideMainWindowForPopouts: false,
      strTitle: "Steam Deck HQ",
    });
};
