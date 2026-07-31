export function getDisplayFirstName(fullName?: string) {
  if (!fullName) return "";

  const prefixes = [
    "นาย",
    "นาง",
    "นางสาว",
    "ด.ช.",
    "ด.ญ.",
    "Mr.",
    "Mrs.",
    "Miss",
    "Ms.",
  ];

  const parts = fullName.trim().split(/\s+/);

  return prefixes.includes(parts[0]) ? parts.slice(0, 2).join(" ") : parts[0];
}
