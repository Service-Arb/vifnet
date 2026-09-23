# The Node workflows, written to .github/workflows/ by the devShell. v_flakes
# generates the container release, the LoC badge and the Claude review; its
# language jobs are Rust's, so these are authored here in the same shape as
# aquafix's.
{ pkgs }:
let
  lib = pkgs.lib;
  yaml = (pkgs.formats.yaml { }).generate;

  on = { pull_request = { }; push = { }; workflow_dispatch = { }; };
  permissions = { contents = "read"; };

  # Everything runs inside `nix develop`, so CI has the node, the Playwright
  # and the browsers the lockfile and the flake pin — not the runner's.
  setup = [
    { uses = "actions/checkout@v4"; }
    {
      name = "Install Nix";
      uses = "DeterminateSystems/nix-installer-action@main";
      "with".extra-conf = "lazy-trees = true";
    }
    {
      name = "Setup Nix cache";
      uses = "nix-community/cache-nix-action@v7";
      "with" = {
        primary-key = "nix-\${{ runner.os }}-\${{ hashFiles('**/flake.lock') }}";
        restore-prefixes-first-match = "nix-\${{ runner.os }}-";
      };
    }
    {
      name = "Setup npm cache";
      uses = "actions/cache@v4";
      "with" = {
        path = "~/.npm";
        key = "npm-\${{ runner.os }}-\${{ hashFiles('package-lock.json') }}";
        restore-keys = "npm-\${{ runner.os }}-";
      };
    }
    (dev "npm ci" "npm ci")
  ];
  dev = name: cmd: { inherit name; run = "nix develop --command ${cmd}"; };

  # The spec's @playwright/test is the flake's, linked where tsc resolves it.
  playwright = args: [
    (dev "Link @playwright/test" "bash -c 'ln -sfn \"$E2E_PLAYWRIGHT_MODULES\" tests/e2e/node_modules'")
    (dev "tsc (e2e)" "npx tsc --noEmit -p tests/e2e")
    (dev "Playwright" "playwright test -c tests/e2e${lib.optionalString (args != "") " ${args}"}")
  ];

  # Missing baselines are written by the run that finds them missing, so this
  # artifact is also how the first set is produced — README, "Visual baselines".
  uploadShots = {
    name = "Upload screenshots";
    "if" = "always()";
    uses = "actions/upload-artifact@v4";
    "with" = {
      name = "visual-snapshots";
      path = "tests/e2e/__screenshots__/";
      if-no-files-found = "ignore";
    };
  };
  uploadReport = {
    name = "Upload Playwright report";
    "if" = "failure()";
    uses = "actions/upload-artifact@v4";
    "with" = {
      name = "playwright-report";
      path = "test-results/\nplaywright-report/";
      if-no-files-found = "ignore";
    };
  };

  errors = {
    name = "Errors";
    inherit on permissions;
    jobs = {
      node = {
        name = "tsc · lint · vitest · build · bundle budget";
        runs-on = "ubuntu-latest";
        timeout-minutes = 30;
        steps = setup ++ [
          (dev "tsc" "npm run typecheck")
          (dev "eslint · steiger" "npm run lint")
          (dev "vitest" "npx vitest run")
          (dev "next build" "npm run build")
          # The one hard gate.
          (dev "Bundle budget" "npm run -s size")
        ];
      };
      e2e = {
        name = "Playwright (1440 + 390)";
        runs-on = "ubuntu-latest";
        timeout-minutes = 30;
        steps = setup ++ [ (dev "next build" "npm run build") ] ++ playwright "" ++ [ uploadShots uploadReport ];
      };
      # The image is built from this derivation; a sandbox that cannot reach
      # the network is where a missing lockfile hash or traced file shows up.
      hermetic = {
        name = "nix flake check (hermetic build + budget)";
        runs-on = "ubuntu-latest";
        timeout-minutes = 45;
        steps = lib.take 3 setup ++ [{ run = "nix flake check -L"; }];
      };
      # The release pushes this image on a tag; this is the last place its
      # contract (port, /data, prod env, the form POST, noindex) is exercised.
      container = {
        name = "Container smoke (the release image)";
        runs-on = "ubuntu-latest";
        timeout-minutes = 45;
        steps = lib.take 3 setup ++ [{ name = "Boot the image"; run = "nix run .#container-smoke"; }];
      };
    };
  };

  # Advisory: a known hole in what ships, not a build failure.
  warnings = {
    name = "Warnings";
    inherit on permissions;
    jobs.audit = {
      name = "npm audit (production dependencies)";
      runs-on = "ubuntu-latest";
      timeout-minutes = 10;
      steps = lib.take 3 setup ++ [ (dev "npm audit" "npm audit --omit=dev --audit-level=moderate") ];
    };
  };

  # Rewrites every baseline from this ref; the artifact is committed by hand.
  visualBaselines = {
    name = "Visual baselines";
    on.workflow_dispatch = { };
    inherit permissions;
    jobs.shoot = {
      name = "Shoot every section (Linux)";
      runs-on = "ubuntu-latest";
      timeout-minutes = 30;
      steps = setup ++ [ (dev "next build" "npm run build") ] ++ playwright "--update-snapshots=all" ++ [ uploadShots uploadReport ];
    };
  };

  files = {
    "errors.yml" = yaml "errors.yml" errors;
    "warnings.yml" = yaml "warnings.yml" warnings;
    "visual-baselines.yml" = yaml "visual-baselines.yml" visualBaselines;
  };
in
{
  inherit files;
  shellHook = lib.concatStrings (lib.mapAttrsToList (name: file: "cp -f ${file} ./.github/workflows/${name}\n") files);
}
