import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TEXT } from "@/entities/content";
// The card's Done state is not part of the widget's public face; the test
// reaches it where the island renders it, with the words the card passes.
import { QuoteDone } from "@/widgets/quote-card/ui/QuoteDone";

// French typography: a no-break space before the `!`.
const NBSP = " ";
const text = { title: TEXT.fr.quote.doneTitle, body: TEXT.fr.quote.doneBody };

const done = (priced: boolean) => renderToStaticMarkup(createElement(QuoteDone, { text, phone: "06 12 34 56 78", priced }));

describe("the card's Done state", () => {
  // The form asks no name: the title greets no one by it.
  it("says done without a name", () => {
    const title = /<p[^>]*>(.*?)<\/p>/.exec(done(false))?.[1];
    expect(title).toBe(`C’est noté${NBSP}!`);
  });

  // An estimate's price is confirmed under it by the kit: a "firm quote" to come would contradict it.
  it("promises no quote to a priced lead, and still says done", () => {
    expect(done(false)).toContain("devis ferme");
    expect(done(false)).toContain("06 12 34 56 78");
    expect(done(true)).not.toContain("devis ferme");
    expect(done(true)).toContain(`C’est noté${NBSP}!`);
  });
});
