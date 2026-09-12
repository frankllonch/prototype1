/**
 * Downloads every image referenced by the dataset and renders a responsive set.
 *
 * Output: dist/media/<id>-<width>.<avif|webp|jpg>, plus content/images.json mapping
 * image id -> variants. Both the download and each encode are skipped when the
 * output already exists, so re-runs are cheap.
 *
 * sharp is the one non-trivial dependency in this project. It earns its place:
 * the source site ships 14.5 MB of unoptimised JPEG on a single page, and AVIF at
 * three widths is the single largest performance win available here.
 */
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import type { Dataset, ProjectImage } from '../src/content/types.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const CACHE = path.join(ROOT, 'content', 'raw', 'media');
const OUT_DIR = path.join(ROOT, 'dist', 'media');
const MAP_FILE = path.join(ROOT, 'content', 'images.json');

/** Rendered widths. 400 serves the gallery grid, 1600 the detail pages. */
const WIDTHS = [400, 800, 1600] as const;
const CONCURRENCY = 4;

interface ImageManifestEntry {
  avif: { width: number; url: string }[];
  webp: { width: number; url: string }[];
  fallback: string;
  width: number;
  height: number;
}

async function download(image: ProjectImage): Promise<string | null> {
  const ext = path.extname(new URL(image.source).pathname) || '.jpg';
  const file = path.join(CACHE, `${image.id}${ext}`);
  if (existsSync(file) && (await stat(file)).size > 0) return file;

  try {
    const res = await fetch(image.source, {
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; portfolio-migration/1.0)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
    return file;
  } catch (err) {
    console.warn(`  ! download ${image.source}: ${String(err)}`);
    return null;
  }
}

async function render(image: ProjectImage, file: string): Promise<ImageManifestEntry | null> {
  const pipeline = sharp(file, { failOn: 'none' }).rotate();
  const meta = await pipeline.metadata();
  const srcWidth = meta.width ?? image.width;
  const srcHeight = meta.height ?? image.height;
  if (!srcWidth || !srcHeight) return null;

  const entry: ImageManifestEntry = {
    avif: [], webp: [], fallback: '', width: srcWidth, height: srcHeight,
  };

  // Never upscale: drop any target wider than the source, but always keep one size.
  const targets = WIDTHS.filter((w) => w <= srcWidth);
  if (targets.length === 0) targets.push(WIDTHS[0]);

  for (const width of targets) {
    const resized = () => sharp(file, { failOn: 'none' }).rotate().resize({ width, withoutEnlargement: true });

    const avifPath = path.join(OUT_DIR, `${image.id}-${width}.avif`);
    if (!existsSync(avifPath)) await resized().avif({ quality: 55, effort: 3 }).toFile(avifPath);
    entry.avif.push({ width, url: `/media/${image.id}-${width}.avif` });

    const webpPath = path.join(OUT_DIR, `${image.id}-${width}.webp`);
    if (!existsSync(webpPath)) await resized().webp({ quality: 76 }).toFile(webpPath);
    entry.webp.push({ width, url: `/media/${image.id}-${width}.webp` });
  }

  const widest = targets[targets.length - 1]!;
  const jpgPath = path.join(OUT_DIR, `${image.id}-${widest}.jpg`);
  if (!existsSync(jpgPath)) {
    await sharp(file, { failOn: 'none' }).rotate()
      .resize({ width: widest, withoutEnlargement: true })
      .jpeg({ quality: 80, progressive: true, mozjpeg: true })
      .toFile(jpgPath);
  }
  entry.fallback = `/media/${image.id}-${widest}.jpg`;
  return entry;
}

async function main() {
  await Promise.all([mkdir(CACHE, { recursive: true }), mkdir(OUT_DIR, { recursive: true })]);

  const dataset: Dataset = JSON.parse(await readFile(path.join(ROOT, 'content', 'projects.json'), 'utf8'));
  const unique = new Map<string, ProjectImage>();
  for (const project of dataset.projects) {
    for (const image of project.images) if (!unique.has(image.id)) unique.set(image.id, image);
  }

  const images = [...unique.values()];
  console.log(`Processing ${images.length} unique images at ${WIDTHS.join('/')}px in AVIF + WebP…`);

  const manifest: Record<string, ImageManifestEntry> = {};
  let done = 0;
  let failed = 0;

  let cursor = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (cursor < images.length) {
        const image = images[cursor++]!;
        const file = await download(image);
        if (file) {
          try {
            const entry = await render(image, file);
            if (entry) manifest[image.id] = entry;
            else failed++;
          } catch (err) {
            failed++;
            console.warn(`  ! render ${image.id}: ${String(err)}`);
          }
        } else failed++;
        if (++done % 25 === 0 || done === images.length) {
          process.stdout.write(`\r  ${done}/${images.length}`);
        }
      }
    }),
  );

  await writeFile(MAP_FILE, JSON.stringify(manifest, null, 2));
  console.log(`\nRendered ${Object.keys(manifest).length} images${failed ? `, ${failed} failed` : ''}.`);
}

await main();
