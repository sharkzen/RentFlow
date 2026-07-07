import fetch, { Response } from "node-fetch";
import logger from "@/utils/logger";

interface LatLng {
  lat: number;
  lng: number;
}

// ---------------------------------------------------------------------------
// User-Agents หลายแบบ เรียงตามลำดับที่ "โอกาสได้พิกัดสูงสุด" ก่อน
// - Bot/crawler UA: Google/Apple มักเสิร์ฟหน้า preview แบบมี og:image/og:url
//   ตรง ๆ โดยไม่ต้องผ่านหน้า consent (cookie) ที่มักเจอเวลาใช้ UA เบราว์เซอร์ปกติ
// - Mobile UA: บาง short link (โดยเฉพาะ maps.app.goo.gl) behavior การ redirect
//   ต่างจาก desktop เล็กน้อย ลองไว้เป็น fallback
// - Desktop UA: fallback สุดท้าย
// ---------------------------------------------------------------------------
const USER_AGENTS: string[] = [
  "WhatsApp/2.23.20.0 A",
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

const FETCH_TIMEOUT_MS = 8000;

// ---------------------------------------------------------------------------
// Regex สำหรับดึงพิกัดตรงจาก URL (ครอบคลุมทั้ง Google Maps และ Apple Maps)
// ---------------------------------------------------------------------------
const URL_COORD_PATTERNS: RegExp[] = [
  /@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/, // Google: .../@13.75,100.50,15z
  /!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/, // Google: place data blob !3dLAT!4dLNG
  /[?&]q=(-?\d{1,3}\.\d+)[,\s](-?\d{1,3}\.\d+)/, // ?q=13.75,100.50
  /[?&]ll=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/, // Google/Apple: ?ll=13.75,100.50
  /[?&]daddr=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/, // เก่า: ?daddr=
  /[?&]saddr=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,
  /[?&]coordinate=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/, // Apple Maps: ?coordinate=
  /[?&]sll=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/, // Apple Maps: ?sll=
  /[?&]center=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/, // static map preview
];

function isValidLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0) // (0,0) มักเป็นค่า placeholder ผิดพลาด ไม่ใช่พิกัดจริง
  );
}

function extractCoords(url: string): LatLng | null {
  if (!url) return null;

  const decoded = safeDecodeURIComponent(url);

  for (const pattern of URL_COORD_PATTERNS) {
    const match = decoded.match(pattern) || url.match(pattern);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (isValidLatLng(lat, lng)) return { lat, lng };
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

// ---------------------------------------------------------------------------
// สแกนเนื้อหา HTML หาพิกัด กรณีดึงจาก URL ตรง ๆ ไม่ได้
// ---------------------------------------------------------------------------
function deepScanHtmlForCoords(html: string): LatLng | null {
  if (!html) return null;

  const patterns: RegExp[] = [
    // JSON-LD schema.org GeoCoordinates: "latitude":13.75,"longitude":100.50
    /"latitude"\s*:\s*"?(-?\d{1,3}\.\d+)"?\s*,\s*"longitude"\s*:\s*"?(-?\d{1,3}\.\d+)"?/i,
    // Google Maps internal state array: [null,null,13.75,100.50]
    /\[null,null,(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)\]/,
    // static-map image URL ที่ฝังอยู่ใน og:image เช่น center=13.75,100.50 หรือ markers=13.75,100.50
    /(?:center|markers)=(-?\d{1,3}\.\d+)%2[cC](-?\d{1,3}\.\d+)/,
    /(?:center|markers)=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,
    // fallback: "@lat,lng" ที่หลงเหลืออยู่ในเนื้อหา (เช่น canonical link)
    /@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (isValidLatLng(lat, lng)) return { lat, lng };
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
        // บอก server ว่ายอมรับ consent แล้ว บาง edge case ช่วยข้ามหน้า cookie wall ของ Google ได้
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

/**
 * ดึง URL ปลายทางจริงของ short link (redirect ต่อเนื่อง) พร้อมพยายามหลาย User-Agent
 * คืนค่า finalUrl + html ของหน้าที่ fetch ได้ (ใช้แบบแรกที่ได้พิกัด)
 */
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

    // ถ้าเจอหน้า consent ของ Google แปลว่า UA นี้โดนบล็อก ลองตัวถัดไป
    if (/consent\.google\./i.test(finalUrl)) {
      continue;
    }

    // 1) ลองดึงพิกัดจาก final URL ก่อน (เร็วสุด ไม่ต้อง parse HTML)
    const urlCoords = extractCoords(finalUrl);
    if (urlCoords) return urlCoords;

    const html = await response.text();

    // 2) og:image (static map พร้อม center/markers)
    const ogImage = extractMetaContent(html, "og:image");
    if (ogImage) {
      const coords = extractCoords(ogImage) ?? deepScanHtmlForCoords(ogImage);
      if (coords) return coords;
    }

    // 3) og:url (บางหน้าใส่พิกัดใน canonical url แทน)
    const ogUrl = extractMetaContent(html, "og:url");
    if (ogUrl) {
      const coords = extractCoords(ogUrl);
      if (coords) return coords;
    }

    // 4) สแกนลึกทั้งหน้า (JSON-LD, internal state, ฯลฯ)
    const deepCoords = deepScanHtmlForCoords(html);
    if (deepCoords) return deepCoords;

    // ได้ HTML มาแล้วแต่หาพิกัดไม่เจอ ลอง UA ตัวถัดไปเผื่อได้เนื้อหาต่างออกไป
  }

  return null;
}

/**
 * ดึงพิกัด (lat, lng) จากลิงก์แผนที่ รองรับ:
 * - Google Maps: ลิงก์เต็ม (.../maps/@lat,lng), short link (maps.app.goo.gl, goo.gl/maps)
 * - Apple Maps: maps.apple, maps.apple.com (ทั้ง short link และลิงก์เต็ม)
 * - หลาย User-Agent (bot/mobile/desktop) เพื่อเลี่ยงหน้า consent/cookie wall
 *   ที่ทำให้ดึงพิกัดไม่ได้บนบาง region หรือบาง environment (server ที่รันจาก EU เป็นต้น)
 */
export async function getLatLngFromUrl(url: string): Promise<LatLng | null> {
  if (!url) return null;

  const trimmedUrl = url.trim();
  if (!trimmedUrl) return null;

  try {
    // 1) ลองดึงพิกัดจาก URL ตรง ๆ ก่อน (เร็วสุด ไม่ต้อง fetch)
    const directCoords = extractCoords(trimmedUrl);
    if (directCoords) return directCoords;

    // 2) ถ้าดึงตรง ๆ ไม่ได้ (short link หรือ URL ที่ไม่มีพิกัดฝังมา) ค่อย fetch
    //    พร้อมลองหลาย User-Agent จนกว่าจะเจอพิกัด
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
