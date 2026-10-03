// The panel's internal endpoints for vifnet as the suite needs them, on
// `E2E_MOCK_PORT` — the base `LOCATIONS_API_URL` names in a deploy
// (`/api/internal/brands/vifnet`): the live place adds nothing over the baked
// one (no number, so no call or WhatsApp anywhere), and the price list is
// down, so every price on the page and in the leads file is the baked model's.
// The operator has put every new visitor on booking_provider's b, so a spec
// can see the panel's weights reach the proxy; the rest keep the code's.
import { createServer } from "node:http";

const port = Number(process.env["E2E_MOCK_PORT"]);
const base = "/api/internal/brands/vifnet";
const json = (res, status, body) => {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
};

createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://mock");
  if (url.pathname === "/health") return json(res, 200, { ok: true });
  if (url.pathname === `${base}/pricing`) return json(res, 503, { error: "down" });
  if (url.pathname === `${base}/locations/vifnet`) return json(res, 200, {});
  if (url.pathname === `${base}/experiments`) return json(res, 200, { experiments: { booking_provider: { weights: [0, 1] } } });
  return json(res, 404, { error: "no such route" });
}).listen(port, "127.0.0.1");
