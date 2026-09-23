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
