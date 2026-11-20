import { definePlugin, staticClasses } from "@decky/ui";
import { FC, useState } from "react";

import { useHomeData } from "./load-data";
import HQLogo from "./pages/HQLogo";
import HomePage from "./pages/home";
import { ReviewPage } from "./pages/review";

const Content: FC = () => {
  const [page, setPage] = useState<"home" | "review">("home");
  const { news, latestReviews, currentApp, gameReview } = useHomeData();
  const review = gameReview.data;

  if (page === "review" && review) {
    return <ReviewPage review={review} setPage={setPage} />;
  }

  return (
    <HomePage
      appError={currentApp.error}
      appIsActive={currentApp.data !== null}
      latestReviewsError={latestReviews.error}
      newsError={news.error}
      review={review}
      reviewError={gameReview.error}
      newsItems={news.data}
      setPage={setPage}
      reviewItems={latestReviews.data}
    />
  );
};

export default definePlugin(() => {
  return {
    name: "Steam Deck HQ",
    title: <div className={staticClasses.Title}>Steam Deck HQ</div>,
    content: <Content />,
    icon: <HQLogo />,
    onDismount() {},
  };
});
