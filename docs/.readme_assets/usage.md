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

#### Visual baselines

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
