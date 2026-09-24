import localFont from "next/font/local";

/**
 * Inter in the three weights the design sets (400 body, 500 labels, 600
 * headings), served from the site itself: no request to a font CDN, no layout
 * shift once they load. Cut to the Latin range a French/English page renders
 * (`assets/fonts/README.md`). Paths must be literals — Next reads this call
 * statically. `app/globals.css` points the brand's font roles at the variable.
 */
export const text = localFont({
  src: [
    { path: "../../../assets/fonts/Inter-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../../assets/fonts/Inter-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../../assets/fonts/Inter-SemiBold.woff2", weight: "600", style: "normal" },
  ],
  display: "swap",
  variable: "--font-inter",
});
