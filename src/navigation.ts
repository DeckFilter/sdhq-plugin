import { Navigation } from "@decky/ui";

export const openExternalUrl = (url: string) => {
  try {
    const openInSystemBrowser = (window as any).SteamClient?.System
      ?.OpenInSystemBrowser;
    if (typeof openInSystemBrowser === "function") {
      const result = openInSystemBrowser(url);
      if (result !== false) {
        return;
      }
    }
  } catch {}

  Navigation.NavigateToExternalWeb(url);
};
