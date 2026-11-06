import { definePlugin, staticClasses } from "@decky/ui";

import HQLogo from "./components/HQLogo";
import HomePage from "./pages/HomePage";

export default definePlugin(() => {
  return {
    name: "Steam Deck HQ",
    title: <div className={staticClasses.Title}>Steam Deck HQ</div>,
    content: <HomePage />,
    icon: <HQLogo />,
    onDismount() {},
  };
});
