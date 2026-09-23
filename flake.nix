{
  nixConfig = {
    extra-substituters = [ "https://valeratrades.cachix.org" ];
    extra-trusted-public-keys = [ "valeratrades.cachix.org-1:gXVwhzO5YB+BaiEJYT48qZgzdaErGQew6xtZcz4Fo1Q=" ];
  };

  inputs = {
    v_flakes.url = "github:valeratrades/v_flakes?ref=v1.6";
  };

  # A copy of aquafix's flake (Service-Arb/aquafix@71045d0) cut to what this
  # site has: no business card, no bundle budget, no Playwright yet. The build,
  # the image and the generated repo files are the same machinery; if a shared
  # builder ships, this file shrinks to a call to it.
  outputs = { self, v_flakes }:
    let
      inherit (v_flakes) flake-utils pre-commit-hooks;
      manifest = builtins.fromJSON (builtins.readFile ./package.json);
      pname = manifest.name;
    in
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import v_flakes.default_nixpkgs { inherit system; };
        lib = pkgs.lib;
        # package.json `engines`; the image gets the slim build of the same major.
        nodejs = pkgs.nodejs_22;
        nodeRuntime = pkgs.nodejs-slim_22;

        # Single source for the dev server, the container's exposed port and the
        # prod env. aquafix is on 59081.
        sitePort = "59082";

        # ── the hermetic build ──────────────────────────────────────────────
        # `importNpmLock` fetches each package by the `integrity` the lockfile
        # already pins, so there is no second hash to keep in step with
        # package-lock.json, and nothing else reaches the network.
        npmLock = lib.importJSON ./package-lock.json;
        npmOs = if pkgs.stdenv.hostPlatform.isDarwin then "darwin" else "linux";
        npmCpu = if pkgs.stdenv.hostPlatform.isAarch64 then "arm64" else "x64";
        # npm's `os`/`cpu`/`libc` fields: a list of names, or of `!name` exclusions.
        fits = want: list:
          let positive = builtins.filter (x: !(lib.hasPrefix "!" x)) list;
          in !(builtins.elem "!${want}" list) && (positive == [ ] || builtins.elem want positive);
        foreign = m:
          (m ? os && !(fits npmOs m.os))
          || (m ? cpu && !(fits npmCpu m.cpu))
          || (m ? libc && !(fits "glibc" m.libc));
        npmSourceOverrides = lib.concatMapAttrs
          (path: m:
            # Every platform's native binary is in the lockfile — @next/swc
            # alone is ~100 MB per platform. npm skips the foreign ones without
            # reading them, so they are never fetched either.
            if (m.optional or false) && foreign m then
              { ${path} = pkgs.emptyFile; }
            else { })
          npmLock.packages;

        # Only what `npm run build` reads: the portfolio photos are not in the
        # site yet and would only bloat the source.
        buildSrc = lib.fileset.toSource {
          root = ./.;
          fileset = lib.fileset.unions [
            ./package.json
            ./package-lock.json
            ./app
            ./src
            ./assets/brand.toml
            ./next.config.ts
            ./tsconfig.json
            ./postcss.config.mjs
            ./proxy.ts
          ];
        };

        # `.next/standalone` plus the static chunks `postbuild` copies into it:
        # the server and only the files it was traced to need.
        site = pkgs.buildNpmPackage {
          inherit pname nodejs;
          version = manifest.version;
          src = buildSrc;
          npmDeps = pkgs.importNpmLock {
            npmRoot = ./.;
            packageSourceOverrides = npmSourceOverrides;
          };
          npmConfigHook = pkgs.importNpmLock.npmConfigHook;
          env.NEXT_TELEMETRY_DISABLED = "1";
          installPhase = ''
            runHook preInstall
            test -f .next/standalone/server.js
            test -d .next/standalone/.next/static
            cp -a .next/standalone "$out"
            runHook postInstall
          '';
          # The traced `node_modules` keep their bin shebangs; rewritten, each
          # would pull the full nodejs, npm included, into the image. Nothing in
          # the server executes them.
          dontPatchShebangs = true;
        };

        # Secret-free prod env, authored in nix and baked into the image.
        prodEnv = import ./deploy/config.nix { port = sitePort; };
        containerStd = v_flakes.container.implement {
          inherit pkgs pname;
          containers."" = {
            port = lib.toInt sitePort;
            healthPath = "/health";
            # Nothing is stored yet, so there is no volume; the lead store will
            # bring `/data` with it. A placeholder page loses no lead when
            # down; `high` comes with the quote form.
            criticality = "normal";
            entrypoint = [ "${nodeRuntime}/bin/node" "${site}/server.js" ];
            imageEnv = lib.mapAttrsToList (n: v: "${n}=${v}") prodEnv;
          };
        };

        # ── apps ────────────────────────────────────────────────────────────
        # IMPORTANT: resolve the repo at *runtime* via `git rev-parse`, never
        # `toString ./.` — the latter pins the wrapper to the read-only
        # /nix/store snapshot, where npm cannot write.
        #
        # `npm ci` wipes node_modules, so it runs only when the lockfile moved.
        ensureDeps = ''
          stamp="node_modules/.vifnet-lock"
          want="$(sha256sum package-lock.json | cut -d' ' -f1)"
          if [ "$(cat "$stamp" 2>/dev/null)" != "$want" ]; then
            npm ci
            echo "$want" > "$stamp"
          fi
        '';

        runDev = pkgs.writeShellApplication {
          name = "run-dev";
          runtimeInputs = [ nodejs pkgs.git pkgs.coreutils ];
          text = ''
            cd "$(git rev-parse --show-toplevel)"
            ${ensureDeps}
            echo "  ▶ http://localhost:${sitePort}/fr"
            exec npm run dev -- --port ${sitePort}
          '';
        };

        runTest = pkgs.writeShellApplication {
          name = "run-test";
          runtimeInputs = [ nodejs pkgs.git pkgs.coreutils ];
          text = ''
            cd "$(git rev-parse --show-toplevel)"
            ${ensureDeps}
            echo "▶ tsc";    npm run -s typecheck
            echo "▶ eslint"; npx eslint .
            echo "▶ vitest"; npx vitest run
            echo "▶ build";  npm run -s build >/dev/null
          '';
        };

        # ── bump the latest remote vX.Y.Z tag and push: `.#publish major|minor|patch [note]` ──
        # The version lives in the tag, not in a file. The tag is the release:
        # `release-container.yml` ships the image on it.
        runPublish = pkgs.writeShellApplication {
          name = "publish";
          runtimeInputs = with pkgs; [ git ];
          text = ''
            part="''${1:-}"
            case "$part" in
              major | minor | patch) ;;
              *) echo "usage: nix run .#publish -- major|minor|patch [release note]" >&2; exit 1 ;;
            esac
            [ -z "$(git status --porcelain)" ] || { echo "uncommitted changes — commit or stash first" >&2; exit 1; }
            shift
            note="$*"

            # Not silenced: computing the next version from a stale tag list is
            # how a release number gets reused, so a failed fetch must be loud.
            git fetch --tags --force origin >/dev/null
            last="$(git tag -l 'v*' --sort=-v:refname | head -n1)"
            ver="''${last#v}"; [ -n "$ver" ] || ver="0.0.0"
            ma="''${ver%%.*}"; rest="''${ver#*.}"; mi="''${rest%%.*}"; pa="''${rest##*.}"
            case "$part" in
              major) ma=$((ma + 1)); mi=0; pa=0 ;;
              minor) mi=$((mi + 1)); pa=0 ;;
              patch) pa=$((pa + 1)) ;;
            esac
            next="v$ma.$mi.$pa"
            echo "''${last:-<no tag>} → $next"

            # Annotated, never lightweight: `push --follow-tags` silently skips
            # lightweight tags, and they have nowhere to put a release note.
            if [ -n "$note" ]; then
              printf '%s\n\n%s\n' "$next" "$note" | git tag -a "$next" -F -
            else
              git tag -a "$next" -m "$next"
            fi
            # The push fires the pre-push hook, so `.#test` gates the release.
            git push origin "$next"
          '';
        };

        runHelp = pkgs.writeShellApplication {
          name = "help";
          text = ''
            cat <<'EOF'
              nix run .#dev            next dev on ${sitePort}
              nix run .#test           tsc, eslint, vitest, build                   [pre-push hook]
              nix run .#publish        bump the latest remote tag: major|minor|patch [note] — the tag ships
              nix build                the standalone server (.next/standalone)
              nix build .#container    OCI image (Linux)
              nix run .#generate       rewrite workflows, .gitignore, .treefmt.toml, README (the devShell does too)
              nix flake check          the hermetic build
            EOF
          '';
        };

        # ── generated repo files ────────────────────────────────────────────
        # `.github/workflows/*`, `.gitignore`, `.treefmt.toml` and README.md are
        # written by the devShell from here; edit this file, not them.
        workflows = import ./nix/workflows.nix { inherit pkgs; };
        # v_flakes' own generators for what is not language-specific: the
        # container release on a `v*` tag, the LoC badge and the Claude review.
        # Its `github` module would add Rust jobs and require a Rust toolchain.
        sharedWorkflows = v_flakes.workflows {
          inherit pkgs pname;
          jobsErrors = [ ];
          jobsWarnings = [ ];
          jobsOther = [ "loc-badge" ];
          containerRelease = { registry = "ghcr.io/service-arb"; };
          claude = true;
        };
        gitignore = v_flakes.files.gitignore {
          inherit pkgs;
          langs = [ "js" ];
          extra = "next-env.d.ts";
        };
        treefmt = (pkgs.formats.toml { }).generate "treefmt.toml" {
          formatter.nix = { command = "nixpkgs-fmt"; includes = [ "*.nix" ]; };
        };
        readme = v_flakes.readme-fw {
          inherit pkgs pname;
          defaults = true;
          lastSupportedVersion = null;
          rootDir = ./.;
          badges = [ "loc" "ci" ];
        };
        generateRepoFiles = ''
          mkdir -p .github/workflows
          ${v_flakes.utils.unwrapShellHook sharedWorkflows.shellHook}
          ${workflows.shellHook}
          cp -f ${gitignore} ./.gitignore
          cp -f ${treefmt} ./.treefmt.toml
          ${v_flakes.utils.unwrapShellHook readme.shellHook}
        '';

        # The same writes without entering the shell (and without its hook installs).
        runGenerate = pkgs.writeShellApplication {
          name = "generate";
          runtimeInputs = with pkgs; [ git coreutils gnused gnugrep ];
          text = ''
            cd "$(git rev-parse --show-toplevel)"
            ${generateRepoFiles}
          '';
        };

        # `.#test` on pre-push, not pre-commit: a full run per commit is too slow
        # to survive contact with actual work.
        preCommitBase = v_flakes.files.preCommit { inherit pkgs; };
        pre-commit-check = pre-commit-hooks.lib.${system}.run (preCommitBase // {
          hooks = preCommitBase.hooks // {
            treefmt = preCommitBase.hooks.treefmt // {
              settings = preCommitBase.hooks.treefmt.settings // {
                formatters = [ pkgs.nixpkgs-fmt ];
              };
            };
            test = {
              enable = true;
              name = "nix run .#test";
              entry = "${runTest}/bin/run-test";
              pass_filenames = false;
              stages = [ "pre-push" ];
            };
          };
        });
      in
      {
        apps = {
          default = { type = "app"; program = "${runDev}/bin/run-dev"; };
          dev = { type = "app"; program = "${runDev}/bin/run-dev"; };
          test = { type = "app"; program = "${runTest}/bin/run-test"; };
          publish = { type = "app"; program = "${runPublish}/bin/publish"; };
          help = { type = "app"; program = "${runHelp}/bin/help"; };
          generate = { type = "app"; program = "${runGenerate}/bin/generate"; };
        };

        packages = {
          default = site;
          site = site;
          container = containerStd.packages."${pname}-container";
        } // containerStd.packages;

        containers = containerStd.containers;

        checks = {
          inherit site;
        };

        devShells.default = pkgs.mkShell {
          shellHook = pre-commit-check.shellHook + ''
            # Generated files are written only from the repo root, and never in
            # CI, where the checkout is the thing under test.
            if [ -z "''${CI:-}" ] && [ "$PWD" = "$(git rev-parse --show-toplevel 2>/dev/null)" ]; then
              ${generateRepoFiles}
            fi
          '';

          packages = [
            nodejs
            pkgs.treefmt
            pkgs.nixpkgs-fmt
          ] ++ pre-commit-check.enabledPackages ++ readme.enabledPackages;

          env.PORT = sitePort;
          env.NEXT_TELEMETRY_DISABLED = "1";
        };
      }
    );
}
