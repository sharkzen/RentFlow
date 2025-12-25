export const isValidMapLink = (link: string) => {
  try {
    const url = new URL(link.trim());
    const hostname = url.hostname.toLowerCase();

    return (
      hostname === "maps.app.goo.gl" ||
      hostname.endsWith("google.com") ||
      hostname.endsWith("google.co.th")
    );
  } catch {
    return false;
  }
};
