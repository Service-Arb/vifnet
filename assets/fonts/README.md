Inter, © The Inter Project Authors, under the SIL Open Font License 1.1
([Inter-OFL.txt](Inter-OFL.txt)).

- `Inter-{Regular,Medium,SemiBold}.woff2` — what the site serves
  (`src/shared/ui/fonts.ts`). Static instances (`opsz=14`) of the Google Fonts
  variable master, cut to the Latin range a French/English page renders:
  taken as they are from Service-Arb/aquafix `assets/fonts/`, which builds them
  with its `scripts/subset-fonts.sh`. `tests/fonts.test.ts` holds the copy to
  that range, so a character the cut leaves out fails the tests rather than
  rendering in a fallback face.
- `Inter-Regular.ttf` — what the OG card (`app/og/route.tsx`) draws with; Satori
  reads TrueType, not WOFF2. From the `@evinvest/kitstart` template.
