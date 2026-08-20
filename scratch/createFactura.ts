import "dotenv/config";
import type { FacturaCreateBody, FacturaDetail } from "../server/src/api-types.ts";

// Posts one factura de expeditie to the running server:
//   pnpm run dev:server        # in another terminal
//   pnpm exec tsx scratch/createFactura.ts
//
// It goes through POST /api/facturi rather than Prisma so the zod schema and
// the connectOrCreate on the material names do their work — a line naming a
// material the catalogue has never seen adds it, exactly as a factura entered
// in the app would.

const BASE = process.env.API_URL ?? `http://localhost:${process.env.PORT ?? 8787}/api`;

// `data` is an IsoDate ("YYYY-MM-DD") on the wire; the paper factura prints
// it as "29.05.2026".
const FACTURA: FacturaCreateBody = {
  data: "2026-05-29",
  materiale: [
    { nrCart: "2111017178", nume: "ANTIGEL ALBASTRU -40C", um: "L", cantitate: 5, pretUnitar: 20.0 },
    { nrCart: "2111121795", nume: "LICHID DE FRANA DOT-4", um: "L", cantitate: 6, pretUnitar: 31.06 },
    { nrCart: "2112210737", nume: "ULEI MOTOR 10W40 CI-4/SL", um: "L", cantitate: 15, pretUnitar: 33.25 },
    { nrCart: "2112210752", nume: "ULEI TRANSMISIONAL TAD-17", um: "L", cantitate: 30, pretUnitar: 30.83 },
    { nrCart: "2112210775", nume: "UNSOARE LITOL-24", um: "KG", cantitate: 26, pretUnitar: 55.67 },
    { nrCart: "2112210779", nume: "ULEI MOTOR 5W30 SN/CF", um: "L", cantitate: 10, pretUnitar: 31.33 },
    { nrCart: "2112210834", nume: "ULEI MOTOR DIZEL M10G2K", um: "L", cantitate: 165, pretUnitar: 24.6 },
    { nrCart: "2112210836", nume: "ULEI HIDRAULIC HLP-46", um: "L", cantitate: 24, pretUnitar: 25.7 },
    { nrCart: "2112210837", nume: "LUBRIFIANT MULTIFUNCTIONAL,VD-60,SPREI", um: "L", cantitate: 2, pretUnitar: 65.0 },
    { nrCart: "2112210848", nume: "ULEI INDUSTRIAL I-40", um: "L", cantitate: 129, pretUnitar: 24.0 },
    { nrCart: "2112210860", nume: "ULEI 15W40 SG/SD MAXIMUM GUARDMAX", um: "L", cantitate: 46, pretUnitar: 27.0 },
  ],
};

async function main() {
  const res = await fetch(`${BASE}/facturi`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(FACTURA),
  });

  if (!res.ok) {
    // The server answers with an ApiErrorBody; print it raw so a validation
    // error names the offending field.
    throw new Error(`POST /facturi -> ${res.status}: ${await res.text()}`);
  }

  const factura = (await res.json()) as FacturaDetail;
  const total = factura.materiale.reduce((s, m) => s + m.cantitate * m.pretUnitar, 0);
  console.log(
    `Created factura #${factura.id} (${factura.data}) with ` +
      `${factura.materiale.length} lines, total ${total.toFixed(2)} lei.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
