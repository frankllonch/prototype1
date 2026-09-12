/**
 * Derived sections.
 *
 * The source site keeps two pages that are really several things at once: the
 * Exhibitions page is six exhibitions run together, and the About page carries the
 * biography, the collections list, the full CV and the contact line in one block
 * of 73 paragraphs. The homepage needs them separated, so they are split here —
 * from the extracted content, never by retyping it.
 */
import type { Project, ProjectImage, Row } from './types.ts';

export interface Exhibition {
  readonly slug: string;
  readonly title: string;
  readonly year?: number;
  /** Everything belonging to this exhibition, in source order. */
  readonly rows: readonly Row[];
  readonly images: readonly ProjectImage[];
  readonly cover?: ProjectImage;
  /** Plain-text standfirst for the index card. */
  readonly summary: string;
}

const strip = (html: string): string =>
  html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'exhibition';

/**
 * A row starts a new exhibition when its text opens with a `<strong>` title *and*
 * the row carries a year. The first test alone would also catch sub-headings like
 * "COLOR GLOSSARY", which belong to the exhibition above them; requiring a date is
 * what separates an exhibition from a heading inside one.
 */
function exhibitionTitleOf(row: Row): string | null {
  const text = row.columns.find((c) => c.kind === 'text');
  if (!text || text.kind !== 'text') return null;

  const opening = /^\s*<(?:p|div)[^>]*>\s*(?:<(?:span|em|i)[^>]*>\s*)*['’‘"]?\s*<strong[^>]*>(.*?)<\/strong>/is.exec(text.html);
  if (!opening) return null;
  if (!/\b(?:19|20)\d{2}\b/.test(strip(text.html))) return null;

  // Order matters: strip the full stop before the closing quote, or the quote is
  // no longer at the end and survives.
  const title = strip(opening[1]!)
    // A couple of titles type the apostrophe as a combining acute: "What ́s".
    .replace(/\s*\u0301\s*/g, '’')
    .replace(/[.,;]+\s*$/, '')
    .replace(/^['’‘"]+|['’‘"]+$/g, '')
    // "What’s color?’ ( I )" — a stray closing quote before the edition number.
    .replace(/['’‘"]\s*(?=\()/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return title || null;
}

export function splitExhibitions(page: Project | undefined): readonly Exhibition[] {
  if (!page) return [];

  // Group as: every row up to and including the next title row belongs together —
  // the source puts an exhibition's photographs *before* the text describing them.
  const starts: number[] = [];
  page.rows.forEach((row, i) => {
    if (exhibitionTitleOf(row)) starts.push(i);
  });
  if (!starts.length) return [];

  const isImageRow = (row: Row) => row.columns.every((c) => c.kind === 'images');

  const exhibitions: Exhibition[] = [];
  let from = 0;

  starts.forEach((titleIndex, n) => {
    const nextTitle = starts[n + 1];
    /*
     * An exhibition ends *before* the run of photographs that introduces the next
     * one. Cutting at the next title instead would hand every exhibition's lead
     * images to the exhibition above it — the source lays each one out as
     * photographs first, then the text describing them.
     */
    let end = page.rows.length - 1;
    if (nextTitle !== undefined) {
      let j = nextTitle - 1;
      while (j > titleIndex && isImageRow(page.rows[j]!)) j--;
      end = j;
    }
    const rows = page.rows.slice(from, end + 1);
    from = end + 1;

    const title = exhibitionTitleOf(page.rows[titleIndex]!)!;
    const text = rows.flatMap((r) => r.columns).filter((c) => c.kind === 'text');
    const body = text.map((c) => strip(c.html)).join(' ');
    const year = /\b((?:19|20)\d{2})\b/.exec(body)?.[1];
    const images = rows.flatMap((r) =>
      r.columns.flatMap((c) => (c.kind === 'images' ? [...c.images] : [])),
    );

    exhibitions.push({
      slug: slugify(title),
      title,
      ...(year ? { year: Number(year) } : {}),
      rows,
      images,
      ...(images[0] ? { cover: images[0] } : {}),
      summary: body.slice(0, 260),
    });
  });

  return exhibitions;
}

/* ----------------------------------------------------------------- about */

export type AboutBlock =
  | { readonly kind: 'html'; readonly html: string }
  | { readonly kind: 'image'; readonly image: ProjectImage };

export interface AboutContent {
  /** Prose blocks with the studio photographs already slotted in. */
  readonly blocks: readonly AboutBlock[];
  /** The contact line, lifted out for the Inquiries section. */
  readonly inquiries?: string;
}

/**
 * Where each photograph sits: after the block at this index. The first one lands
 * right under the opening paragraph, the second a few paragraphs on — both well
 * up in the text rather than buried at the point where the biography turns into
 * a CV. Change these two numbers to move them.
 */
const PHOTO_AFTER_BLOCK = [1, 5] as const;

const INQUIRIES = /INQUIRES?\s+PLEASE\s+CONTACT/i;

export function splitAbout(page: Project | undefined): AboutContent {
  if (!page) return { blocks: [] };

  const html = page.rows
    .flatMap((r) => r.columns)
    .filter((c) => c.kind === 'text')
    .map((c) => (c.kind === 'text' ? c.html : ''))
    .join('');

  const prose = [...html.matchAll(/<(p|div)[^>]*>[\s\S]*?<\/\1>/g)].map((m) => m[0]);
  const images = page.rows.flatMap((r) =>
    r.columns.flatMap((c) => (c.kind === 'images' ? [...c.images] : [])),
  );
  const inquiriesBlock = prose.find((b) => INQUIRIES.test(strip(b)));

  const blocks: AboutBlock[] = [];
  prose.forEach((block, i) => {
    if (block === inquiriesBlock) return;
    blocks.push({ kind: 'html', html: block });
    const slot = PHOTO_AFTER_BLOCK.indexOf(i as 1 | 5);
    if (slot >= 0 && images[slot]) blocks.push({ kind: 'image', image: images[slot]! });
  });
  // A photograph whose slot is beyond the text still gets shown, at the end.
  images.forEach((image, slot) => {
    if (PHOTO_AFTER_BLOCK[slot] === undefined || PHOTO_AFTER_BLOCK[slot]! >= prose.length) {
      blocks.push({ kind: 'image', image });
    }
  });

  return { blocks, ...(inquiriesBlock ? { inquiries: strip(inquiriesBlock) } : {}) };
}
