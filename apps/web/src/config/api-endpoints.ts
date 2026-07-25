/**
 * Centralized API endpoint configuration.
 *
 * All external service URLs should be defined here so they can be
 * swapped for different environments or self-hosted instances.
 */

const isDev = import.meta.env.DEV;

/** VixMotion cloud services */
export const VixMotion_CLOUD_URL = isDev
  ? "http://localhost:8787"
  : "https://api.VixMotion.video";

/** VixMotion transcription / TTS service */
export const VixMotion_TTS_URL =
  import.meta.env.VITE_VIXMOTION_TTS_URL ||
  (isDev ? "http://127.0.0.1:18000" : "https://cloud.VixMotion.video");

/** VixMotion transcription service (GPU) */
export const VixMotion_TRANSCRIBE_URL = "https://cloud.VixMotion.video";

/**
 * Third-party API base URLs.
 * These are used by the api-proxy service in dev mode (direct calls)
 * and by the Cloudflare Pages Function proxy in production.
 * Application code should use apiFetch() from services/api-proxy.ts
 * instead of importing these directly.
 */
