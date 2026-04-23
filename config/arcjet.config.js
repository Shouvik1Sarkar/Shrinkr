import arcjet, { detectBot, shield, tokenBucket } from "@arcjet/node";
import { ARCJET_KEY } from "./env.config.js";

// Create an Arcjet instance with multiple rules
export const aj = arcjet({
  key: ARCJET_KEY,
  characteristics: ["ip.src"],
  rules: [
    shield({ mode: "LIVE" }),

    tokenBucket({
      mode: "LIVE",
      capacity: 60, // max burst of 60 requests
      refillRate: 60, // refill 60 tokens
      interval: 60, // every 60 seconds = 1 req/sec sustained
    }),

    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:API_CLIENT"],
    }),
  ],
});
