export function descriptionJsonToText(descriptionJson: any): string {
  if (
    !descriptionJson ||
    typeof descriptionJson !== "object" ||
    !Array.isArray(descriptionJson.sections)
  ) {
    return "";
  }

  let result = "";

  for (const section of descriptionJson.sections) {
    if (!section || typeof section !== "object") continue;

    if (section.type === "text" && typeof section.value === "string") {
      result += section.value + "\n";
    }

    if (section.type === "list" && Array.isArray(section.items)) {
      result +=
        section.items
          .filter((i: any) => typeof i === "string" && i.trim())
          .map((i: any) => `✅ ${i}`)
          .join("\n") + "\n";
    }
  }

  return result.trim();
}

export function parseDescription(rawText: string) {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const sections: any[] = [];

  for (const line of lines) {
    if (line.startsWith("✅")) {
      let last = sections[sections.length - 1];

      if (!last || last.type !== "list") {
        sections.push({
          id: crypto.randomUUID(),
          type: "list",
          order: sections.length + 1,
          items: [],
        });

        last = sections[sections.length - 1];
      }

      last.items.push(line.replace("✅", "").trim());
    } else {
      sections.push({
        id: crypto.randomUUID(),
        type: "text",
        order: sections.length + 1,
        value: line,
      });
    }
  }

  return {
    sections,
  };
}
