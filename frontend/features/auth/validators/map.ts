export const extractMapUrlFromText = (text: string): string => {
  if (typeof text !== "string") return "";

  const trimmed = text.trim();
  const match = trimmed.match(/https?:\/\/\S+/);

  return match ? match[0] : trimmed;
};

export const isValidMapLink = (link: string): boolean => {
  if (typeof link !== "string") return false;

  const raw = link.trim();

  if (!raw) return false;

  const url = parseUrlSafe(raw);

  if (!url) return false;

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return false;
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  const pathname = url.pathname.toLowerCase();

  if (!hostname) return false;

  if (isExactOrSubdomain(hostname, "goo.gl")) {
    if (hostname === "maps.app.goo.gl") return true;

    if (hostname === "goo.gl" && pathname.startsWith("/maps")) return true;

    return false;
  }

  const GOOGLE_DOMAIN_RE =
    /^(?:[a-z0-9-]+\.)*google\.[a-z]{2,3}(?:\.[a-z]{2,3})?$/;

  if (GOOGLE_DOMAIN_RE.test(hostname)) {
    const subdomainHasMaps = hostname.split(".")[0] === "maps";
    const pathHasMaps = pathname.startsWith("/maps");
    return subdomainHasMaps || pathHasMaps;
  }

  return false;
};

function parseUrlSafe(input: string): URL | null {
  try {
    return new URL(input);
  } catch {
    try {
      return new URL(`https://${input}`);
    } catch {
      return null;
    }
  }
}

function isExactOrSubdomain(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}
