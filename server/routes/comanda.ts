import { Hono } from "hono";
import { db } from "../db.ts";
import { renderComandaMateriale } from "../render.ts";
import { uploadDocx } from "../drive.ts";

export const comandaRoutes = new Hono();

type IncomingRow = {
  materialId: number;
  vehiculId: number;
  cantitate: number;
  unitateMasura?: string | null;
};

type IncomingBody = {
  data: string;                // ISO date "YYYY-MM-DD"
  randuri: IncomingRow[];
};

// POST /api/comanda/generate
// 1. Validates the incoming body shape.
// 2. INSERTS ComandaMateriale + RandComanda rows in a single transaction.
//    With strict FK validation, an invalid materialId/vehiculId fails at the
//    DB layer (FK constraint), so no separate pre-check is required.
// 3. Reads the rows back joined to Material/Vehicul.
// 4. Renders the .docx, uploads to Drive, links the GeneratedDocument row.
// 5. Returns { driveFileId, driveFileUrl }.
comandaRoutes.post("/generate", async (c) => {
  const body = await c.req.json<IncomingBody>().catch(() => null);
  const validation = validateBody(body);
  if (!validation.ok) return c.json({ ok: false, error: validation.error }, 400);

  const { data, randuri } = validation.body;

  let comandaId: number;
  try {
    comandaId = await db.$transaction(async (tx) => {
      const comanda = await tx.comandaMateriale.create({
        data: {
          data,
          state: "completed",
          randuri: {
            create: randuri.map((r, i) => ({
              position: i,
              materialId: r.materialId,
              vehiculId: r.vehiculId,
              cantitate: r.cantitate,
              unitateMasura: r.unitateMasura ?? null,
            })),
          },
        },
      });
      return comanda.id;
    });
  } catch (err) {
    console.error("insert failed:", err);
    return c.json(
      { ok: false, error: "DB insert failed — likely an invalid materialId or vehiculId. " + (err instanceof Error ? err.message : String(err)) },
      400
    );
  }

  // Read back joined data for rendering.
  const comanda = await db.comandaMateriale.findUniqueOrThrow({
    where: { id: comandaId },
    include: {
      randuri: {
        orderBy: { position: "asc" },
        include: { material: true, vehicul: true },
      },
    },
  });

  const buffer = renderComandaMateriale({
    data: formatDate(comanda.data),
    materiale: comanda.randuri.map((r, i) => ({
      nr: i + 1,
      nume: r.material?.denumire ?? "",
      cod: r.material?.cod ?? "",
      spec: r.vehicul?.nrInmatriculare ?? "",
      um: r.unitateMasura ?? r.material?.unitateMasura ?? "",
      cantitate: r.cantitate != null ? String(r.cantitate) : "",
    })),
  });

  const filename = `comanda_materiale-${isoForFilename(comanda.data)}-${comanda.id}.docx`;
  const upload = await uploadDocx(filename, buffer);

  await db.documentGenerat.create({
    data: {
      driveFileId: upload.driveFileId,
      comandaId: comanda.id,
    },
  });

  return c.json({ ok: true, comandaId: comanda.id, ...upload });
});

function validateBody(body: unknown): { ok: true; body: { data: Date; randuri: IncomingRow[] } } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "expected JSON body" };
  const b = body as Partial<IncomingBody>;
  if (typeof b.data !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(b.data)) {
    return { ok: false, error: "data must be a YYYY-MM-DD string" };
  }
  if (!Array.isArray(b.randuri) || b.randuri.length === 0) {
    return { ok: false, error: "randuri must be a non-empty array" };
  }
  const randuri: IncomingRow[] = [];
  for (const [i, r] of b.randuri.entries()) {
    if (!r || typeof r !== "object") return { ok: false, error: `randuri[${i}] is not an object` };
    const rr = r as Partial<IncomingRow>;
    if (!Number.isInteger(rr.materialId)) return { ok: false, error: `randuri[${i}].materialId must be an integer` };
    if (!Number.isInteger(rr.vehiculId)) return { ok: false, error: `randuri[${i}].vehiculId must be an integer` };
    if (typeof rr.cantitate !== "number" || !Number.isFinite(rr.cantitate)) return { ok: false, error: `randuri[${i}].cantitate must be a number` };
    randuri.push({
      materialId: rr.materialId!,
      vehiculId: rr.vehiculId!,
      cantitate: rr.cantitate,
      unitateMasura: typeof rr.unitateMasura === "string" ? rr.unitateMasura : null,
    });
  }
  return { ok: true, body: { data: new Date(b.data + "T00:00:00Z"), randuri } };
}

function formatDate(d: Date): string {
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function isoForFilename(d: Date): string {
  return d.toISOString().slice(0, 10);
}
