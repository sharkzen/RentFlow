import fetch from "node-fetch";
import logger from "@/utils/logger";

interface LatLng {
  lat: number;
  lng: number;
}

function isValidLatLng(lat: number, lng: number): boolean {
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function extractCoords(text: string): LatLng | null {
  if (!text) return null;

  const urlMatch = text.match(
    /[?&](?:center|markers|ll|q)= (-?\d+\.\d+)(?:,|%2C)(-?\d+\.\d+)/i,
  );

  if (
    urlMatch &&
    isValidLatLng(parseFloat(urlMatch[1]), parseFloat(urlMatch[2]))
  ) {
    return {
      lat: parseFloat(urlMatch[1]),
      lng: parseFloat(urlMatch[2]),
    };
  }

  const atMatch = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);

  if (
    atMatch &&
    isValidLatLng(parseFloat(atMatch[1]), parseFloat(atMatch[2]))
  ) {
    return {
      lat: parseFloat(atMatch[1]),
      lng: parseFloat(atMatch[2]),
    };
  }

  const dataLat = text.match(/!3d(-?\d+\.\d+)/);
  const dataLng = text.match(/!4d(-?\d+\.\d+)/);

  if (
    dataLat &&
    dataLng &&
    isValidLatLng(parseFloat(dataLat[1]), parseFloat(dataLng[1]))
  ) {
    return {
      lat: parseFloat(dataLat[1]),
      lng: parseFloat(dataLng[1]),
    };
  }

  return null;
}

function deepScanHtmlForCoords(html: string): LatLng | null {
  const regex = /\[\s*(-?\d{1,3}\.\d{4,})\s*,\s*(-?\d{1,3}\.\d{4,})\s*\]/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);

    if (isValidLatLng(lat, lng)) {
      if (lat !== 0 && lng !== 0) {
        return {
          lat,
          lng,
        };
      }
    }
  }

  const jsonMatch = html.match(
    /["']?lat["']?\s*:\s*(-?\d+\.\d+)\s*,\s*["']?lng["']?\s*:\s*(-?\d+\.\d+)/i,
  );

  if (
    jsonMatch &&
    isValidLatLng(parseFloat(jsonMatch[1]), parseFloat(jsonMatch[2]))
  ) {
    return {
      lat: parseFloat(jsonMatch[1]),
      lng: parseFloat(jsonMatch[2]),
    };
  }

  return null;
}

export async function getLatLngFromUrl(url: string): Promise<LatLng | null> {
  try {
    if (!url) return null;

    let coords = extractCoords(url);

    if (coords) return coords;

    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",

      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (response.status !== 200) {
      logger.warn(`[Map Helper] Error status: ${response.status}`);
      return null;
    }

    const finalUrl = response.url;
    coords = extractCoords(finalUrl);

    if (coords) return coords;

    const html = await response.text();
    const metaImageMatch =
      html.match(/meta\s+content="([^"]+)"\s+property="og:image"/i) ||
      html.match(/meta\s+property="og:image"\s+content="([^"]+)"/i);

    if (metaImageMatch && metaImageMatch[1]) {
      const imageCoords = extractCoords(metaImageMatch[1]);

      if (imageCoords) {
        return imageCoords;
      }
    }

    const metaUrlMatch = html.match(
      /meta\s+content="([^"]+)"\s+property="og:url"/i,
    );

    if (metaUrlMatch && metaUrlMatch[1]) {
      const urlCoords = extractCoords(metaUrlMatch[1]);

      if (urlCoords) {
        return urlCoords;
      }
    }

    coords = deepScanHtmlForCoords(html);

    if (coords) {
      return coords;
    }

    return null;
  } catch (error: any) {
    return null;
  }
}
