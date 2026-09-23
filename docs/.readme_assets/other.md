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
