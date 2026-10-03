import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TEXT } from "@/entities/content";
// The card's Done state is not part of the widget's public face; the test
// reaches it where the island renders it, with the words the card passes.
import { QuoteDone } from "@/widgets/quote-card/ui/QuoteDone";

// French typography: a no-break space before the `!`.
const NBSP = "\u00a0";
const text = { title: TEXT.fr.quote.doneTitle, titleNoName: TEXT.fr.quote.doneTitleNoName, body: TEXT.fr.quote.doneBody };

/** The title as a visitor reads it: the first paragraph's text, entities decoded. */
function title(name: string | null): string {
  const html = renderToStaticMarkup(createElement(QuoteDone, { text, name, phone: "06 12 34 56 78" }));
  const inner = /<p[^>]*>(.*?)<\/p>/.exec(html)?.[1] ?? "";
  return inner.replaceAll("&#x27;", "'").replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"');
}

describe("the card's Done state", () => {
  it("greets the visitor by the first word of the name", () => {
    expect(title("Jean Dupont")).toBe(`C’est noté, Jean${NBSP}!`);
  });

  it("greets without a name when none was given", () => {
    expect(title(null)).toBe(`C’est noté${NBSP}!`);
    expect(title("   ")).toBe(`C’est noté${NBSP}!`);
  });

  // LEAD-FORMS-REVIEW-2026-10-03 #16: as a replacement string, `$'` and `` $` ``
  // are the text after and before the match, `$&` the match itself.
  it.each(["$'", "$`", "$&", "$$", "$1"])("prints a name typed as %s as it was typed", name => {
    expect(title(`${name} Jean`)).toBe(`C’est noté, ${name}${NBSP}!`);
  });
});
