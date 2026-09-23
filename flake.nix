{
  nixConfig = {
    extra-substituters = [ "https://valeratrades.cachix.org" ];
    extra-trusted-public-keys = [ "valeratrades.cachix.org-1:gXVwhzO5YB+BaiEJYT48qZgzdaErGQew6xtZcz4Fo1Q=" ];
  };

  inputs = {
    v_flakes.url = "github:valeratrades/v_flakes?ref=v1.6";
    # TODO: re-pin to ?ref=@evinvest/kitstart-v0.1.0 once it is published —
    # the tag does not exist yet, so this is lib main at the kitstart merge.
    ev.url = "github:EV-invest/lib?rev=3c0eea0a7e1c18d8f818528a1d9c18e750395c94";
    ev.inputs.v_flakes.follows = "v_flakes";
  };

  # The landing machinery (hermetic build, image, bundle budget, smoke, dev and
  # test apps) is the lib's `mkLanding`; what stays here is Vifnet's config,
  # the generated repo files, and the release tag.
  outputs = { self, v_flakes, ev }:
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
        # aquafix is on 59081.
        sitePort = "59082";
        prodEnv = import ./deploy/config.nix { port = sitePort; };

        landing = ev.lib.mkLanding {
          inherit pkgs v_flakes sitePort pname prodEnv;
          root = ./.;
          # What `npm run build` reads — not the 81 MB of source photos in
          # assets/profile_images, only the web cuts of them.
          buildFiles = [
            "package.json"
            "package-lock.json"
            "app"
            "src"
            "assets/brand.toml"
            "assets/card.toml"
            "assets/mark.svg"
            "assets/fonts"
            "assets/photos"
            "next.config.ts"
            "tsconfig.json"
            "postcss.config.mjs"
            "proxy.ts"
            "instrumentation.ts"
          ];
          requiredFiles = [ "assets/fonts/Inter-Regular.ttf" ];
          smoke = {
            page = "/fr";
            og = "/og?l=vifnet";
            quote = { location = "vifnet"; subject = "deep"; locality = "75015"; mobile = "0612345678"; surface_m2 = "65"; };
          };
          # TODO: drop with the re-pin above — the lock's @evinvest/kitstart is
          # 0.1.0 and this lib revision still says 0.0.0 until it is published.
          checkKitstartVersion = false;
        };

        # ── until @evinvest/{uikit,marketing,kitstart} are on npm ────────────
        # TODO: delete this block with the npm swap (package.json `file:` →
        # versions) and take `landing`'s outputs as they are. `importNpmLock`
        # reads a `file:` spec as a path under the lock's directory with the
        # scheme still on it, and mkLanding has no source-override input, so
        # the vendored tarballs are handed to it here, and the site, the image
        # and the budget are rebuilt on top.
        npmLock = lib.importJSON ./package-lock.json;
        npmOs = if pkgs.stdenv.hostPlatform.isDarwin then "darwin" else "linux";
        npmCpu = if pkgs.stdenv.hostPlatform.isAarch64 then "arm64" else "x64";
        fits = want: list:
          let positive = builtins.filter (x: !(lib.hasPrefix "!" x)) list;
          in !(builtins.elem "!${want}" list) && (positive == [ ] || builtins.elem want positive);
        foreign = m: (m ? os && !(fits npmOs m.os)) || (m ? cpu && !(fits npmCpu m.cpu)) || (m ? libc && !(fits "glibc" m.libc));
        npmSourceOverrides = lib.concatMapAttrs
          (path: m:
            if lib.hasPrefix "file:" (m.resolved or "") then
              { ${path} = ./. + "/${lib.removePrefix "file:" m.resolved}"; }
            else if (m.optional or false) && foreign m then
              { ${path} = pkgs.emptyFile; }
            else { })
          npmLock.packages;
        site = landing.site.overrideAttrs {
          npmDeps = pkgs.importNpmLock {
            npmRoot = lib.fileset.toSource {
              root = ./.;
              fileset = lib.fileset.unions [ ./package.json ./package-lock.json ./vendor/evinvest ];
            };
            packageSourceOverrides = npmSourceOverrides;
          };
        };
        bundleBudget = pkgs.runCommand "${pname}-bundle-budget"
          {
            nativeBuildInputs = [ pkgs.nodejs_22 ];
            budget = lib.fileset.toSource { root = ./.; fileset = ./tests/bundle_budget.txt; };
          } ''
          cd "$budget"
          node --experimental-strip-types --disable-warning=ExperimentalWarning ${ev}/ts/kitstart/src/cli/kitstart-size.ts ${site} --route '/[locale]/[location]' --budget tests/bundle_budget.txt
          touch "$out"
        '';
        containerStd = v_flakes.container.implement {
          inherit pkgs pname;
          containers."" = {
            port = lib.toInt sitePort;
            mounts = [ "/data" ];
            criticality = "high";
            healthPath = "/health";
            entrypoint = [ "${pkgs.nodejs-slim_22}/bin/node" "${site}/server.js" ];
            workingDir = "/data";
            imageEnv = [ "HOME=/data" ] ++ lib.mapAttrsToList (n: v: "${n}=${v}") prodEnv;
          };
        };
        # ── end of the vendored-tarball block ────────────────────────────────

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
          extra = ''
            next-env.d.ts
            tests/e2e/node_modules
            test-results/
            playwright-report/'';
        };
        treefmt = (pkgs.formats.toml { }).generate "treefmt.toml" {
          global.excludes = [ "vendor/**" ];
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
              entry = landing.apps.test.program;
              pass_filenames = false;
              stages = [ "pre-push" ];
            };
          };
        });
      in
      {
        apps = landing.apps // {
          publish = { type = "app"; program = "${runPublish}/bin/publish"; };
          generate = { type = "app"; program = "${runGenerate}/bin/generate"; };
        };

        packages = containerStd.packages // {
          default = site;
          inherit site;
          container = containerStd.packages."${pname}-container";
        };

        containers = containerStd.containers;

        checks = {
          inherit site;
          bundle-budget = bundleBudget;
        };

        devShells.default = landing.devShell.overrideAttrs (old: {
          shellHook = (old.shellHook or "") + pre-commit-check.shellHook + ''
            # Generated files are written only from the repo root, and never in
            # CI, where the checkout is the thing under test.
            if [ -z "''${CI:-}" ] && [ "$PWD" = "$(git rev-parse --show-toplevel 2>/dev/null)" ]; then
              ${generateRepoFiles}
            fi
          '';
          nativeBuildInputs = (old.nativeBuildInputs or [ ]) ++ [ pkgs.treefmt pkgs.nixpkgs-fmt pkgs.vips ]
            ++ pre-commit-check.enabledPackages ++ readme.enabledPackages;
          # Where CI links the flake's `@playwright/test` for the e2e specs' tsc.
          E2E_PLAYWRIGHT_MODULES = "${pkgs.playwright-test}/lib/node_modules";
        });
      }
    );
}
