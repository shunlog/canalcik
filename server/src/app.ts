import { Hono } from "hono";
import type { ApiErrorBody, HealthBody } from "./api-types.ts";
import { db } from "./db.ts";
import { onError } from "./http/onError.ts";
import { bonuri } from "./routes/bonuri.ts";
import { drive } from "./routes/drive.ts";
import { facturi } from "./routes/facturi.ts";
import { fisaLimita } from "./routes/fisaLimita.ts";
import { materiale } from "./routes/materiale.ts";
import { soferi } from "./routes/soferi.ts";
import { vehicule } from "./routes/vehicule.ts";

export const app = new Hono();

app.get("/api/health", async (c) => {
  const [soferiCount, vehiculeCount, bonuriCount] = await Promise.all([
    db.sofer.count(),
    db.vehicul.count(),
    db.bonEliberare.count(),
  ]);
  const body: HealthBody = {
    ok: true,
    counts: { soferi: soferiCount, vehicule: vehiculeCount, bonuri: bonuriCount },
  };
  return c.json(body);
});

app.route("/api/soferi", soferi);
app.route("/api/vehicule", vehicule);
app.route("/api/bonuri", bonuri);
app.route("/api/materiale", materiale);
app.route("/api/facturi", facturi);
app.route("/api/fisa-limita", fisaLimita);
app.route("/api/drive", drive);

// No CORS middleware on purpose: in dev the browser only ever talks to Vite,
// which proxies /api here, so everything is same-origin.
app.notFound((c) => {
  const body: ApiErrorBody = { error: { code: "NOT_FOUND", message: "Rută inexistentă" } };
  return c.json(body, 404);
});
app.onError(onError);
