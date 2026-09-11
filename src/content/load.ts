/**
 * Reads the extracted dataset, merges in the rendered image variants, and exposes
 * the derived collections the pages need.
 *
 * This is the only place that touches disk, so the components stay pure functions
 * of their props and can be unit-tested or ported without a filesystem.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { Dataset, Project, ProjectImage, Row } from './types.ts';

const ROOT = path.resolve(import.meta.dirname, '..', '..');

interface ManifestEntry {
  avif: { width: number; url: string }[];
  webp: { width: number; url: string }[];
  fallback: string;
  width: number;
  height: number;
}

const readJson = <T,>(file: string): T => JSON.parse(readFileSync(path.join(ROOT, file), 'utf8')) as T;

function withVariants(image: ProjectImage, manifest: Record<string, ManifestEntry>): ProjectImage {
  const entry = manifest[image.id];
  if (!entry) return image;
  return {
    ...image,
    // Trust the pipeline's measured dimensions over WordPress's markup, which is
    // wrong on a few pages where the attributes were hand-edited.
    width: entry.width,
    height: entry.height,
    variants: { avif: entry.avif, webp: entry.webp, fallback: entry.fallback },
  };
}

function hydrate(project: Project, manifest: Record<string, ManifestEntry>): Project {
  const map = (image: ProjectImage) => withVariants(image, manifest);
  const rows: Row[] = project.rows.map((row) => ({
    columns: row.columns.map((column) =>
      column.kind === 'images' ? { ...column, images: column.images.map(map) } : column,
    ),
  }));
  const images = project.images.map(map);
  return { ...project, rows, images, ...(images[0] ? { cover: images[0] } : {}) };
}

const dataset = readJson<Dataset>('content/projects.json');
const manifest = readJson<Record<string, ManifestEntry>>('content/images.json');

export const projects: readonly Project[] = dataset.projects.map((p) => hydrate(p, manifest));

const by = (kind: Project['kind']) => projects.filter((p) => p.kind === kind);

/** Paintings, newest first; ties broken by publication date so ordering is stable. */
export const works: readonly Project[] = [...by('work')].sort((a, b) => {
  const year = (b.metadata.year ?? 0) - (a.metadata.year ?? 0);
  if (year !== 0) return year;
  return (b.metadata.date ?? '').localeCompare(a.metadata.date ?? '');
});

/** Collaborations and commissions, newest first. */
export const collaborations: readonly Project[] = [...by('project')].sort(
  (a, b) => (b.metadata.year ?? 0) - (a.metadata.year ?? 0),
);

export const editorialPages: readonly Project[] = by('editorial');

export const findEditorial = (slug: string): Project | undefined =>
  editorialPages.find((p) => p.slug === slug);

/** Distinct years present in the work, newest first — drives the gallery filter. */
export const workYears: readonly number[] = [
  ...new Set(works.map((w) => w.metadata.year).filter((y): y is number => typeof y === 'number')),
].sort((a, b) => b - a);

export const availableWorks: readonly Project[] = works.filter((w) => w.metadata.available);

export const extractedAt = dataset.extractedAt;
export const sourceSite = dataset.sourceSite;
