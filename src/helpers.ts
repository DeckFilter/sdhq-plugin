import { Router } from "@decky/ui";

import { getStoreAppId } from "./requests";

export const getCurrentAppId = async (): Promise<string | null> => {
  if (Router.MainRunningApp?.appid) {
    return String(Router.MainRunningApp.appid);
  }

  return getStoreAppId();
};
