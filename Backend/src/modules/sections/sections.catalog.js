export const SECTION_CATALOG = [
  "A",
  "B",
  "C",
  "D",
];

export const normalizeSectionName =
  (name) =>
    String(name)
      .trim()
      .toUpperCase();

export const isCatalogSectionName =
  (name) =>
    SECTION_CATALOG.includes(
      normalizeSectionName(
        name
      )
    );
