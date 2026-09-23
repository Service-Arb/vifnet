# vifnet
![Lines Of Code](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/valeratrades/b48e6f02c61942200e7d1e3eeabf9bcb/raw/vifnet-loc.json)
<br>
[<img alt="ci errors" src="https://img.shields.io/github/actions/workflow/status/Service-Arb/vifnet/errors.yml?branch=main&style=for-the-badge&style=flat-square&label=errors&labelColor=420d09" height="20">](https://github.com/Service-Arb/vifnet/actions?query=branch%3Amain) <!--NB: Won't find it if repo is private-->
[<img alt="ci warnings" src="https://img.shields.io/github/actions/workflow/status/Service-Arb/vifnet/warnings.yml?branch=main&style=for-the-badge&style=flat-square&label=warnings&labelColor=d16002" height="20">](https://github.com/Service-Arb/vifnet/actions?query=branch%3Amain) <!--NB: Won't find it if repo is private-->

The landing site of Vifnet, a cleaning business in France that works at the
customer's address and has no storefront of its own.

This is the foundation, not the site: a Next.js app on the EV kit with one
placeholder page in French and English. There is no domain and no public phone
number yet, so every page is `noindex`, `robots.txt` disallows everything and
the sitemap is empty. The facts still missing are listed once, in `OWNER_TODO`
(`src/shared/config/site.ts`); giving the site a domain while a launch-blocking
one is open fails the build.

It follows the Service-Arb landing layout of
[aquafix](https://github.com/Service-Arb/aquafix), with one deliberate
difference: the business is modelled as a service area, so the type of a place
has no field an address could be written into.
<!-- markdownlint-disable -->
<details>
<summary>
<h2>Installation</h2>
</summary>

The repo builds with Nix. Determinate Nix with `lazy-trees = true` is required.

```sh
nix develop
```

This gives you Node 22 and writes the generated files — `.github/workflows/`,
`.gitignore`, `.treefmt.toml` and this README — from `flake.nix`. Edit the
flake and `docs/.readme_assets/`, not them.

Plain npm works for the app itself:

```sh
npm ci && npm run typecheck && npx eslint . && npx vitest run && npm run build && npm start
```

</details>
<!-- markdownlint-restore -->

## Usage
Start the site:

```sh
nix run .#dev            # http://localhost:59082/fr
```

Run the checks:

```sh
nix run .#test           # tsc, eslint, vitest, build
nix flake check          # the hermetic Nix build
```

Build the server and the container image:

```sh
nix build                # the standalone server
nix build .#container    # OCI image, on Linux
```

The image listens on 59082. Its settings come from `deploy/config.nix`.
Pushing a `v*` tag builds the image and publishes it to
`ghcr.io/service-arb/vifnet`: `nix run .#publish` makes the tag.

The palette in `assets/brand.toml` is a placeholder until the design exists;
`npm run palette` regenerates `app/brand.css` from it, and a test fails when
the two disagree.

`nix run .#help` prints the list of commands.

## Layout

```text
app/             Next routes: /[locale], robots, sitemap, /health, the global 404
src/             the site in Feature-Sliced layers (shared → entities → features → widgets → views);
                 eslint rejects an upward, sideways or deep import
src/shared/landing/  the place, publication and site model of the landing vertical
assets/          brand.toml (placeholder palette), profile_images/ (the portfolio)
tests/           vitest
deploy/          production config, authored in Nix
nix/             the generated CI workflows' source, the container smoke test
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

