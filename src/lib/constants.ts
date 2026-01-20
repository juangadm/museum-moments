// Single source of truth for categories across the application

export const CATEGORIES = [
  "Branding",
  "Images",
  "Interfaces",
  "Objects",
  "Spaces",
  "Typography",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  Branding: "logos, identity systems, brand guidelines",
  Images: "photography, illustration, posters, visual art",
  Interfaces: "web design, apps, product UI, dashboards",
  Objects: "physical products, hardware, packaging",
  Spaces: "architecture, interiors, retail environments",
  Typography: "typefaces, lettering, type systems",
};

export const TAG_SUGGESTIONS: Record<Category, string[]> = {
  Branding: ["logo", "identity", "guidelines", "rebrand", "wordmark", "visual-identity"],
  Images: ["photography", "illustration", "poster", "print", "editorial", "visual"],
  Interfaces: ["web", "app", "ui", "dashboard", "saas", "mobile", "product"],
  Objects: ["hardware", "packaging", "product", "industrial", "physical"],
  Spaces: ["architecture", "interior", "retail", "exhibition", "environment"],
  Typography: ["typeface", "lettering", "variable", "specimen", "font", "type"],
};
