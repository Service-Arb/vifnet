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
