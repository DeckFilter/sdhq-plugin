import type { ReactNode } from "react";

import type { ArticleDetail, ArticleKind } from "./types/article-types";

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
  buildDialog: (kind: ArticleKind, articleId: number, articles?: readonly ArticleDetail[]) => ReactNode;
  parent?: EventTarget;
  showModal: ShowModalFn;
};

export const createOpenArticleDialog = ({
  buildDialog,
  parent,
  showModal,
}: CreateOpenArticleDialogDeps) => {
  return (kind: ArticleKind, articleId: number, articles?: readonly ArticleDetail[]) =>
    showModal(buildDialog(kind, articleId, articles), parent, {
      bHideMainWindowForPopouts: false,
      strTitle: "Steam Deck HQ",
    });
};
