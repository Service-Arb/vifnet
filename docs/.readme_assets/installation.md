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
