import fetch, { Response } from "node-fetch";
import logger from "@/utils/logger";

interface LatLng {
  lat: number;
  lng: number;
}

const USER_AGENTS: string[] = [
  "WhatsApp/2.23.20.0 A",
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

const FETCH_TIMEOUT_MS = 8000;

const URL_COORD_PATTERNS: RegExp[] = [
  /@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,
  /!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/,
  /[?&]q=(-?\d{1,3}\.\d+)[,\s](-?\d{1,3}\.\d+)/,
  /[?&]ll=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,
  /[?&]daddr=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,
  /[?&]saddr=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,
  /[?&]coordinate=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,
  /[?&]sll=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,
  /[?&]center=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,
];

export function extractMapUrlFromText(text: string): string {
  if (typeof text !== "string") return "";

  const trimmed = text.trim();
  const match = trimmed.match(/https?:\/\/\S+/);
  return match ? match[0] : trimmed;
}

function isValidLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

const BARE_COORD_PATTERN =
  /^(-?\d{1,3}(?:\.\d+)?)\s*[,،]\s*(-?\d{1,3}(?:\.\d+)?)$/;

export function extractBareCoords(text: string): LatLng | null {
  if (typeof text !== "string") return null;

  const match = text.trim().match(BARE_COORD_PATTERN);

  if (!match) return null;

  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);

  return isValidLatLng(lat, lng)
    ? {
        lat,
        lng,
      }
    : null;
}

function extractCoords(url: string): LatLng | null {
  if (!url) return null;

  const decoded = safeDecodeURIComponent(url);

  for (const pattern of URL_COORD_PATTERNS) {
    const match = decoded.match(pattern) || url.match(pattern);

    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);

      if (isValidLatLng(lat, lng))
        return {
          lat,
          lng,
        };
    }
  }

  return null;
}

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function deepScanHtmlForCoords(html: string): LatLng | null {
  if (!html) return null;

  const patterns: RegExp[] = [
    /"latitude"\s*:\s*"?(-?\d{1,3}\.\d+)"?\s*,\s*"longitude"\s*:\s*"?(-?\d{1,3}\.\d+)"?/i,
    /\[null,null,(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)\]/,
    /(?:center|markers)=(-?\d{1,3}\.\d+)%2[cC](-?\d{1,3}\.\d+)/,
    /(?:center|markers)=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,
    /@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);

    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);

      if (isValidLatLng(lat, lng))
        return {
          lat,
          lng,
        };
    }
  }

  return null;
}

function extractMetaContent(html: string, property: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);

    if (match?.[1]) return match[1];
  }

  return null;
}

async function fetchWithTimeout(
  url: string,
  userAgent: string,
): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,

      headers: {
        "User-Agent": userAgent,
        Accept: "text/html,application/xhtml+xml",
        Cookie: "CONSENT=YES+; SOCS=CAI",
      },
    });
  } catch (error: any) {
    if (error?.name === "AbortError") {
      logger.warn(`[Map Helper] Fetch timeout (${userAgent})`);
    }

    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function resolveWithFallbackUserAgents(
  url: string,
): Promise<LatLng | null> {
  for (const userAgent of USER_AGENTS) {
    const response = await fetchWithTimeout(url, userAgent);

    if (!response) continue;

    if (!response.ok) {
      logger.warn(
        `[Map Helper] Non-OK status ${response.status} (UA: ${userAgent})`,
      );
      continue;
    }

    const finalUrl = response.url || url;

    if (/consent\.google\./i.test(finalUrl)) {
      continue;
    }

    const urlCoords = extractCoords(finalUrl);

    if (urlCoords) return urlCoords;

    const html = await response.text();
    const ogImage = extractMetaContent(html, "og:image");

    if (ogImage) {
      const coords = extractCoords(ogImage) ?? deepScanHtmlForCoords(ogImage);

      if (coords) return coords;
    }

    const ogUrl = extractMetaContent(html, "og:url");

    if (ogUrl) {
      const coords = extractCoords(ogUrl);

      if (coords) return coords;
    }

    const deepCoords = deepScanHtmlForCoords(html);

    if (deepCoords) return deepCoords;
  }

  return null;
}

export async function getLatLngFromUrl(url: string): Promise<LatLng | null> {
  if (!url) return null;

  const bareCoords = extractBareCoords(url);

  if (bareCoords) return bareCoords;

  const trimmedUrl = extractMapUrlFromText(url);

  if (!trimmedUrl) return null;

  try {
    const directCoords = extractCoords(trimmedUrl);

    if (directCoords) return directCoords;

    const resolvedCoords = await resolveWithFallbackUserAgents(trimmedUrl);

    if (resolvedCoords) return resolvedCoords;

    logger.warn(
      `[Map Helper] Could not extract coordinates from url: ${trimmedUrl}`,
    );
    return null;
  } catch (error: any) {
    logger.warn(`[Map Helper] Unexpected error: ${error?.message ?? error}`);
    return null;
  }
}
