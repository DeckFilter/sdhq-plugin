import assert from "node:assert/strict";
import test from "node:test";

import { loadHomeData, loadReviewData } from "../src/load-data.ts";

test("loadHomeData preserves successful sections when one request fails", async () => {
  const result = await loadHomeData({
    getCurrentAppId: async () => "123",
    getNews: async () => [{ id: 1, title: { rendered: "News" } } as any],
    getLatestReviews: async () => {
      throw new Error("reviews down");
    },
    getLastRequestErrors: async () => ({
      latest_reviews: "URLError: reviews down",
    }),
  });

  assert.equal(result.currentAppId, "123");
  assert.equal(result.currentAppError, null);
  assert.deepEqual(result.newsItems, [{ id: 1, title: { rendered: "News" } }]);
  assert.equal(result.newsError, null);
  assert.deepEqual(result.latestReviews, []);
  assert.equal(result.latestReviewsError, "reviews down");
});

test("loadReviewData surfaces backend request errors for the active game", async () => {
  const result = await loadReviewData("3500390", {
    getReviewForApp: async () => null,
    getLastRequestErrors: async () => ({
      review_for_app: "SSLCertVerificationError: certificate verify failed",
    }),
  });

  assert.equal(result.review, null);
  assert.equal(
    result.reviewError,
    "SSLCertVerificationError: certificate verify failed",
  );
});
