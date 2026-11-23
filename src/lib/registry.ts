// Build-time registry access for Astro pages. Reads the JSON emitted by
// scripts/build-registry.mjs (run via `npm run registry` before astro).

import registryJson from '../../public/registry.json';

export interface ComponentFiles {
  [filename: string]: string;
}

export interface VanillaVariant {
  files: { html: string; css: string; js: string };
}

export interface FrameworkVariant {
  files: ComponentFiles;
  bundle: string;
  css?: string;
}

export interface LibraryComponent {
  id: string;
  title: string;
  slug: string;
  category: string;
  tags: string[];
  description: string;
  author: string;
  createdAt: string;
  preview: { background: 'light' | 'dark' | 'auto'; height: number };
  variants: {
    vanilla: VanillaVariant;
    react?: FrameworkVariant;
    vue?: FrameworkVariant;
  };
}

interface Registry {
  generatedAt: string;
  categories: string[];
  components: LibraryComponent[];
}

const registry = registryJson as unknown as Registry;

export const components: LibraryComponent[] = registry.components;
export const categories: string[] = registry.categories;

export function getComponent(category: string, slug: string): LibraryComponent | undefined {
  return components.find((c) => c.category === category && c.slug === slug);
}

export const CATEGORY_LABELS: Record<string, string> = {
  buttons: 'Buttons',
  cards: 'Cards',
  loaders: 'Loaders',
  forms: 'Forms',
  navigation: 'Navigation',
  effects: 'Effects',
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category.charAt(0).toUpperCase() + category.slice(1);
}
