/**
 * The six places a page shows the place's number, cut out of its markup: the
 * header's row, the phone's menu, the FAQ's last line, the gold band, the
 * footer and the sticky bar. A surface the page does not render (the FAQ on
 * most sub-pages) is absent.
 */
const BOUNDS = {
  header: ["<header", 'id="nav-menu-panel"'],
  menu: ['id="nav-menu-panel"', "</nav>"],
  faq: ['data-band="faq"', "</section>"],
  closing: ['data-band="cta"', "</section>"],
  footer: ['<footer id="footer"', "</footer>"],
  sticky: ['data-band="sticky"', null],
} as const satisfies Record<string, readonly [string, string | null]>;

export type Surface = keyof typeof BOUNDS;
export const SURFACES = Object.keys(BOUNDS) as Surface[];

export function surfaces(html: string): Partial<Record<Surface, string>> {
  const found: Partial<Record<Surface, string>> = {};
  for (const name of SURFACES) {
    const [start, end] = BOUNDS[name];
    const from = html.indexOf(start);
    if (from < 0) continue;
    const to = end === null ? -1 : html.indexOf(end, from);
    found[name] = html.slice(from, to < 0 ? undefined : to);
  }
  return found;
}
