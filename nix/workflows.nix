# The Node workflows, written to .github/workflows/ by the devShell. v_flakes
# generates the container release, the LoC badge and the Claude review; its
# language jobs are Rust's, so these are authored here in the same shape.
# aquafix's, less the Playwright and visual-baseline jobs this site has no
# specs for yet.
{ pkgs }:
let
  lib = pkgs.lib;
  yaml = (pkgs.formats.yaml { }).generate;

  on = { pull_request = { }; push = { }; workflow_dispatch = { }; };
  permissions = { contents = "read"; };

  # Everything runs inside `nix develop`, so CI has the node the flake pins,
  # not the runner's.
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

  errors = {
    name = "Errors";
    inherit on permissions;
    jobs = {
      node = {
        name = "tsc · eslint · vitest · build";
        runs-on = "ubuntu-latest";
        timeout-minutes = 30;
        steps = setup ++ [
          (dev "tsc" "npm run typecheck")
          (dev "eslint" "npx eslint .")
          (dev "vitest" "npx vitest run")
          (dev "next build" "npm run build")
        ];
      };
      # The image is built from this derivation; a sandbox that cannot reach
      # the network is where a missing lockfile hash or traced file shows up.
      hermetic = {
        name = "nix flake check (hermetic build)";
        runs-on = "ubuntu-latest";
        timeout-minutes = 45;
        steps = lib.take 3 setup ++ [{ run = "nix flake check -L"; }];
      };
      # The release pushes this image on a tag; this is the last place its
      # contract (port, prod env, noindex) is exercised before that.
      container = {
        name = "Container smoke (the release image)";
        runs-on = "ubuntu-latest";
        timeout-minutes = 45;
        steps = lib.take 3 setup ++ [{ name = "Boot the image"; run = "bash nix/container-smoke.sh"; }];
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

  files = {
    "errors.yml" = yaml "errors.yml" errors;
    "warnings.yml" = yaml "warnings.yml" warnings;
  };
in
{
  inherit files;
  shellHook = lib.concatStrings (lib.mapAttrsToList (name: file: "cp -f ${file} ./.github/workflows/${name}\n") files);
}
