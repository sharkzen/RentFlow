export const generateSlug = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9ก-๙\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};
