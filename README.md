# vifnet
![Lines Of Code](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/valeratrades/b48e6f02c61942200e7d1e3eeabf9bcb/raw/vifnet-loc.json)
<br>
[<img alt="ci errors" src="https://img.shields.io/github/actions/workflow/status/Service-Arb/vifnet/errors.yml?branch=main&style=for-the-badge&style=flat-square&label=errors&labelColor=420d09" height="20">](https://github.com/Service-Arb/vifnet/actions?query=branch%3Amain) <!--NB: Won't find it if repo is private-->
[<img alt="ci warnings" src="https://img.shields.io/github/actions/workflow/status/Service-Arb/vifnet/warnings.yml?branch=main&style=for-the-badge&style=flat-square&label=warnings&labelColor=d16002" height="20">](https://github.com/Service-Arb/vifnet/actions?query=branch%3Amain) <!--NB: Won't find it if repo is private-->

The landing site of Vifnet, a cleaning business in France that works at the
customer's address and has no storefront of its own.

A Next.js app on [`@evinvest/kitstart`](https://github.com/EV-invest/lib/tree/main/ts/kitstart),
the machinery the Service-Arb landings share (routing, the place model and its
publication gate, the quote form and its lead store, SEO), built to the Figma
file `11BVyibSdB8fBYrfBiLX3C`. What is Vifnet's own is the copy, the palette,
the lock-up and the sections: hero, before/after, services, how it works,
FAQ, the quote band.

There is no domain and no public phone number yet, so every page is `noindex`,
`robots.txt` disallows everything, the sitemap is empty and the quote form is
the only channel. The facts still missing — and every term the design proposes
that the owner has not confirmed — are listed once, in `OWNER_TODO`
(`src/shared/config/site.ts`); giving the site a domain while a launch-blocking
one is open fails the build. The price table, the reviews and the service-area
chips render nothing until their facts exist.
<!-- markdownlint-disable -->
<details>
<summary>
<h2>Installation</h2>
</summary>

The repo builds with Nix. Determinate Nix with `lazy-trees = true` is required.

```sh
nix develop
```

This gives you Node 22, Playwright with its pinned browsers and vips, and
writes the generated files — `.github/workflows/`, `.gitignore`,
`.treefmt.toml` and this README — from `flake.nix`. Edit the flake and
`docs/.readme_assets/`, not them.

Plain npm works for the app itself:

```sh
npm ci && npm run typecheck && npm run lint && npx vitest run && npm run build && npm run size && npm start
```

`@evinvest/uikit` 0.20.0, `@evinvest/marketing` 0.3.0 and `@evinvest/kitstart`
0.1.0 are not on npm yet: they are packed from EV-invest/lib main and vendored
in `vendor/evinvest/`, and the flake hands them to the hermetic build. Both go
once the packages are published.

</details>
<!-- markdownlint-restore -->

## Usage
Start the site:

```sh
nix run .#dev            # http://localhost:59082/fr
```

Run the checks:

```sh
nix run .#test           # tsc, lint (eslint + steiger), vitest, build, size, Playwright
nix run .#size           # first-load JS against tests/bundle_budget.txt — the one hard gate
nix flake check          # the hermetic Nix build and the budget against it
```

Build the server and the container image:

```sh
nix build                # the standalone server
nix build .#container    # OCI image, on Linux
nix run .#container-smoke  # boot it and hold it to its contract (Linux + docker)
```

The image listens on 59082 and keeps leads in `/data`. Its settings come from
`deploy/config.nix`. Pushing a `v*` tag builds the image and publishes it to
`ghcr.io/service-arb/vifnet`: `nix run .#publish` makes the tag.

The palette is `assets/brand.toml`; `npm run palette` regenerates
`app/brand.css` from it, and a test fails when the two disagree. The photos on
the page are cut from `assets/profile_images/` by
`nix shell nixpkgs#vips -c npm run photos`; a test fails when the committed
cuts and `scripts/photos.ts` disagree.

##### Visual baselines

Screenshot baselines are Linux's, because CI is: a mac rasterises glyphs
differently, so locally the pixel comparison is skipped. To refresh them after
changing a section:

1. Run the **Visual baselines** workflow on the branch
   (`gh workflow run visual-baselines.yml --ref <branch>`). Before that workflow
   exists on `main`, a CI run of **Errors** on the branch writes any missing
   baseline and publishes the same artifact.
2. `gh run download <run-id> -n visual-snapshots -D tests/e2e/__screenshots__`
3. Look at the images, then commit them alone:
   `test: refresh visual baselines (run <run-id>)`.

`nix run .#help` prints the list of commands.

## Layout

```text
app/             Next routes, each a few lines over a kitstart factory: pages under
                 [locale]/[location], /quote, /og, /health, robots, sitemap, the global 404
src/             the site in Feature-Sliced layers (shared → entities → features → widgets → views);
                 widgets/ are named after the Figma frames (hero, before-after, services, …)
assets/          brand.toml (the palette), card.toml (contact facts), the mark and lock-up,
                 fonts/, profile_images/ (the portfolio) and photos/ (its web cuts)
scripts/         photos.ts: the AVIF/WebP cuts of the portfolio
tests/           vitest; tests/e2e/ Playwright; bundle_budget.txt
deploy/          production config, authored in Nix
nix/             the generated CI workflows' source
vendor/          the unpublished @evinvest packages, until they are on npm
```


<br>

<sup>
	This repository follows <a href="https://github.com/valeratrades/.github/tree/master/best_practices">my best practices</a> and <a href="https://github.com/tigerbeetle/tigerbeetle/blob/main/docs/TIGER_STYLE.md">Tiger Style</a> (except "proper capitalization for acronyms": (VsrState, not VSRState) and formatting). For project's architecture, see <a href="./docs/ARCHITECTURE.md">ARCHITECTURE.md</a>.
</sup>

#### License

<sup>
	Licensed under <a href="LICENSE">Blue Oak 1.0.0</a>
</sup>

<br>

<sub>
	Unless you explicitly state otherwise, any contribution intentionally submitted
for inclusion in this crate by you, as defined in the Apache-2.0 license, shall
be licensed as above, without any additional terms or conditions.
</sub>

