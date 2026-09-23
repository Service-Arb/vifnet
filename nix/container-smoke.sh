#!/usr/bin/env bash
# Boots the OCI image the release ships and holds it to its contract: it
# listens on 59082 on every interface, answers /health, negotiates the bare
# URL, renders both languages, and — with no domain yet — refuses crawling and
# serves an empty sitemap. Linux + docker.
#
#   bash nix/container-smoke.sh
set -euo pipefail

port=59082
image="$(nix build .#container --no-link --print-out-paths)"
docker load <"$image" >/dev/null

cleanup() {
  docker logs smoke 2>&1 | tail -20 || true
  docker rm -f smoke >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker run -d --name smoke -p "$port:$port" vifnet:latest >/dev/null
for _ in $(seq 60); do curl -fsS "localhost:$port/health" >/dev/null 2>&1 && break; sleep 1; done

status() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
expect() {
  local want="$1"
  shift
  local got
  got="$(status "$@")"
  [ "$got" = "$want" ] || { echo "✘ $* → $got, expected $want" >&2; exit 1; }
  echo "✓ $want  $*"
}

expect 200 "localhost:$port/health"
expect 302 "localhost:$port/"
expect 200 "localhost:$port/fr"
expect 200 "localhost:$port/en"
expect 404 "localhost:$port/fr/nope"

curl -fsS "localhost:$port/robots.txt" | grep -qx 'Disallow: /' || { echo "✘ robots.txt does not disallow" >&2; exit 1; }
echo "✓ robots.txt disallows everything"
curl -fsS "localhost:$port/fr" | grep -q 'content="noindex, nofollow"' || { echo "✘ /fr is indexable" >&2; exit 1; }
echo "✓ /fr is noindex"
