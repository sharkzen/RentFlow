import fetch from "node-fetch";

function extractLatLng(url: string) {
  const match = url.match(/@([-.\d]+),([-.\d]+)/);

  if (!match) return null;

  return {
    lat: parseFloat(match[1]),
    lng: parseFloat(match[2]),
  };
}

async function resolveShortLink(url: string) {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "manual",
    });

    const location = res.headers.get("location");

    if (!location) return null;

    return extractLatLng(location);
  } catch (err) {
    return null;
  }
}

export async function getLatLngFromUrl(url: string) {
  if (url.includes("maps.app.goo.gl")) {
    return await resolveShortLink(url);
  } else if (url.includes("google.com/maps")) {
    return extractLatLng(url);
  } else {
    return null;
  }
}
