# The prod environment of the server, baked into the image as plain env
# (`flake.nix: prodEnv`). Secret-free; the site reads no secret yet.
#
# Explicit because the defaults are dev's: without HOSTNAME the standalone
# server binds one interface the readiness probe may not reach.
{ port }:
{
  HOSTNAME = "0.0.0.0";
  PORT = toString port;
  NODE_ENV = "production";
  NEXT_TELEMETRY_DISABLED = "1";
}
