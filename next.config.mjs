import withPWAInit, { runtimeCaching as defaultCache } from "@ducanh2912/next-pwa";

// ─── Runtime cache ────────────────────────────────────────────────────────────
// Entries are evaluated in order; first match wins. Our custom rules come first
// to override the defaults where we need different strategies or timeouts.

/** @type {import('workbox-build').RuntimeCaching[]} */
const runtimeCaching = [
  // SVG icons and manifest: cache-first, 1 year (immutable in practice)
  {
    urlPattern: /\/icons\/.*/i,
    handler: "CacheFirst",
    options: {
      cacheName: "fittrack-icons",
      expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 },
      cacheableResponse: { statuses: [0, 200] },
    },
  },

  // Next.js static bundles: cache-first, 1 year.
  // Content-hashed filenames make these safe to cache forever; new deploys get
  // new hashes so clients always get the latest code after a SW update.
  {
    urlPattern: /^\/_next\/static\/.*/i,
    handler: "CacheFirst",
    options: {
      cacheName: "fittrack-next-static",
      expiration: { maxEntries: 300, maxAgeSeconds: 365 * 24 * 60 * 60 },
      cacheableResponse: { statuses: [0, 200] },
    },
  },

  // RSC prefetch streams: network-first with a 3-second timeout so the cached
  // version is returned quickly when offline.
  {
    urlPattern: /** @type {import('workbox-build').MatchCallback} */ ({ request, url: { pathname }, sameOrigin }) =>
      request.headers.get("RSC") === "1" &&
      request.headers.get("Next-Router-Prefetch") === "1" &&
      sameOrigin &&
      !pathname.startsWith("/api/"),
    handler: "NetworkFirst",
    options: {
      cacheName: "pages-rsc-prefetch",
      networkTimeoutSeconds: 3,
      expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 },
      cacheableResponse: { statuses: [0, 200] },
    },
  },

  // RSC data for navigation: network-first, 3-second offline fallback.
  {
    urlPattern: /** @type {import('workbox-build').MatchCallback} */ ({ request, url: { pathname }, sameOrigin }) =>
      request.headers.get("RSC") === "1" &&
      sameOrigin &&
      !pathname.startsWith("/api/"),
    handler: "NetworkFirst",
    options: {
      cacheName: "pages-rsc",
      networkTimeoutSeconds: 3,
      expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 },
      cacheableResponse: { statuses: [0, 200] },
    },
  },

  // All app-shell pages: network-first, 3-second offline fallback.
  // Because all data lives in IndexedDB via Dexie, serving a cached HTML shell
  // is enough to make the app fully functional offline.
  {
    urlPattern: /** @type {import('workbox-build').MatchCallback} */ ({ url: { pathname }, sameOrigin }) =>
      sameOrigin && !pathname.startsWith("/api/"),
    handler: "NetworkFirst",
    options: {
      cacheName: "pages",
      networkTimeoutSeconds: 3,
      expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 },
      cacheableResponse: { statuses: [0, 200] },
    },
  },

  // Keep the defaults for everything else (Google Fonts, cross-origin, etc.),
  // skipping the entries we've already overridden above.
  ...defaultCache.filter((e) =>
    !["next-static-js-assets", "pages-rsc-prefetch", "pages-rsc", "pages"].includes(
      /** @type {any} */ (e.options)?.cacheName ?? ""
    )
  ),
];

// ─── PWA config ───────────────────────────────────────────────────────────────

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: false, // we show an in-app indicator; don't force a page reload
  disable: process.env.NODE_ENV === "development",
  register: false, // PWAContext handles registration for install-prompt coordination
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["dexie", "dexie-react-hooks"],
};

export default withPWA(nextConfig);
