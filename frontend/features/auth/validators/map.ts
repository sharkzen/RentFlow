export const isValidMapLink = (link: string): boolean => {
  if (typeof link !== "string") return false;

  const raw = link.trim();
  if (!raw) return false;

  const url = parseUrlSafe(raw);
  if (!url) return false;

  // 1) จำกัด protocol ให้เป็น http/https เท่านั้น (กัน javascript:, data:, ฯลฯ)
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return false;
  }

  // ตัด "." ท้าย hostname (FQDN trailing dot) และแปลงเป็นตัวพิมพ์เล็ก
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  const pathname = url.pathname.toLowerCase();

  if (!hostname) return false;

  // 2) รองรับ goo.gl short link
  //    - maps.app.goo.gl/xxxx  -> ถือว่า valid เสมอ (โดเมนนี้ทำมาเพื่อ maps โดยเฉพาะ)
  //    - goo.gl/maps/xxxx      -> ต้องมี /maps ใน path เพราะ goo.gl ใช้ shorten ลิงก์อื่นได้ด้วย
  if (isExactOrSubdomain(hostname, "goo.gl")) {
    if (hostname === "maps.app.goo.gl") return true;
    if (hostname === "goo.gl" && pathname.startsWith("/maps")) return true;
    return false;
  }

  // 3) รองรับโดเมน google.* ทุกประเทศ (google.com, google.co.th, google.co.uk,
  //    google.com.au, google.de, ...) พร้อม subdomain เช่น www., maps.
  //    Regex นี้ anchor ทั้งหัวและท้ายอย่างเข้มงวด กัน bypass แบบ
  //    "google.com.evil.com" หรือ "evilgoogle.com"
  const GOOGLE_DOMAIN_RE =
    /^(?:[a-z0-9-]+\.)*google\.[a-z]{2,3}(?:\.[a-z]{2,3})?$/;

  if (GOOGLE_DOMAIN_RE.test(hostname)) {
    // ต้องเป็นลิงก์แผนที่จริง ๆ ไม่ใช่ google.com เฉย ๆ (เช่น google.com/search)
    const subdomainHasMaps = hostname.split(".")[0] === "maps";
    const pathHasMaps = pathname.startsWith("/maps");
    return subdomainHasMaps || pathHasMaps;
  }

  return false;
};

/** พยายามสร้าง URL object โดยเติม https:// ให้ถ้าไม่มี protocol */
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

/** hostname ตรงเป๊ะ หรือเป็น subdomain ของ domain ที่กำหนด (เช่น "maps.goo.gl" เป็น subdomain ของ "goo.gl") */
function isExactOrSubdomain(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}
