import { Router } from "@decky/ui";

import { getStoreAppId } from "./requests";

export const getCurrentAppId = async (): Promise<string | null> => {
  const appId = Router.MainRunningApp?.appid;
  if (appId) {
    return appId.toString();
  }

  return getStoreAppId();
};
