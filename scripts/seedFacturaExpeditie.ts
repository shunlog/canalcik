import path from "node:path";
import { pathToFileURL } from "node:url";
import type {
  ApiErrorBody,
  FacturaCreateBody,
  FacturaDetail,
  FacturaListItem,
  MaterialListItem,
} from "../server/src/api-types.ts";
import type { FacturaExpeditie } from "./facturaExpeditieTypes.ts";

// Seeds a "factura de expeditie" through the API, from a data file, e.g.:
//   pnpm run seed:factura -- scripts/facturi/2026-09.ts [api-url]
//
// The API url defaults to the local server (http://localhost:8787). Credentials
// for a server behind Basic Auth go in the url: https://user:pass@host
//
// A month can hold more than one factura, but re-seeding the same one would
// only create a duplicate: the run is rejected when a factura with the same
// date and the same materials is already there. The materials the lines point
// at are reused when they already exist and are never deleted — the catalogue
// outlives the facturi.

const DEFAULT_API_URL = "http://localhost:8787";

/** A non-2xx response, carrying the server's error code and per-field messages. */
class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const apiFetch = async <T>(
  baseUrl: string,
  auth: string | undefined,
  method: string,
  path: string,
  body?: unknown,
): Promise<T> => {
  const headers: Record<string, string> = {};
  if (auth) headers.authorization = auth;
  if (body !== undefined) headers["content-type"] = "application/json";

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 204) return undefined as T;

  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (json as ApiErrorBody | null)?.error;
    throw new ApiError(
      res.status,
      err?.code ?? "INTERNAL",
      err?.message ?? `Eroare HTTP ${res.status}`,
      err?.fields,
    );
  }
  return json as T;
};

async function loadFactura(filePath: string): Promise<FacturaExpeditie> {
  const module = await import(pathToFileURL(path.resolve(filePath)).href);
  return module.default as FacturaExpeditie;
}

// A factura is considered already present when one exists with the same `data`
// and the same set of materials (by nrCart, cantitate, pretUnitar). Line order
// is ignored — it is presentation, not identity.
type FacturaLineSig = { nrCart: string; cantitate: number; pretUnitar: number };

const signature = (lines: FacturaLineSig[]) =>
  lines
    .map((l) => `${l.nrCart.trim()}:${l.cantitate}:${l.pretUnitar}`)
    .sort()
    .join("|");

/**
 * Guards against re-seeding the same factura: if one the API already holds has
 * the same date and the same materials, the run is rejected instead of adding
 * a second copy. Runs before any material is created, so a duplicate leaves
 * the catalogue untouched too.
 */
async function checkForDuplicate(
  apiUrl: string,
  auth: string | undefined,
  data: string,
  linii: FacturaExpeditie["linii"],
) {
  const existing = await apiFetch<FacturaListItem[]>(apiUrl, auth, "GET", "/api/facturi");
  const candidates = existing.filter((f) => f.data === data && f.nrLinii === linii.length);
  if (candidates.length === 0) return;

  const wanted = signature(linii);
  for (const candidate of candidates) {
    const detail = await apiFetch<FacturaDetail>(
      apiUrl,
      auth,
      "GET",
      `/api/facturi/${candidate.id}`,
    );
    if (signature(detail.materiale) === wanted) {
      throw new Error(
        `Factura din ${data} cu aceleași ${linii.length} materiale există deja (id ${candidate.id})`,
      );
    }
  }
}

const normalize = (linie: FacturaExpeditie["linii"][number]) => ({
  nrCart: linie.nrCart.trim(),
  nume: linie.nume.trim(),
  um: linie.um.trim().toUpperCase(),
});

/**
 * Resolves each line's material to a catalogue id, creating any material that
 * doesn't exist yet, and returns the mapping.
 *
 * First it guards the same identity rule the API enforces on POST /materiale
 * (nrCart is a material's identity): a line naming a code that's already in
 * the catalogue under a different nume/um points at a data-entry mistake —
 * either in the file being seeded or in the catalogue — so it's rejected
 * before anything is written, rather than silently connecting to the wrong
 * material or overwriting its name. Matching nume/um for an existing code is
 * fine and just reuses that material.
 */
async function resolveMaterials(
  apiUrl: string,
  auth: string | undefined,
  linii: FacturaExpeditie["linii"],
): Promise<Map<string, number>> {
  const existing = await apiFetch<MaterialListItem[]>(apiUrl, auth, "GET", "/api/materiale");
  const byNrCart = new Map(existing.map((m) => [m.nrCart, m]));

  const lines = linii.map(normalize);

  const mismatches = lines
    .map((linie) => ({ linie, existent: byNrCart.get(linie.nrCart) }))
    .filter(
      ({ linie, existent }) =>
        existent && (existent.nume !== linie.nume || existent.um !== linie.um),
    );

  if (mismatches.length > 0) {
    const detalii = mismatches
      .map(
        ({ linie, existent }) =>
          `  ${linie.nrCart}: catalog are "${existent!.nume}" (${existent!.um}), factura dă "${linie.nume}" (${linie.um})`,
      )
      .join("\n");
    throw new Error(
      `Materiale cu nume/UM diferite de catalog pentru același cod nomenclator:\n${detalii}`,
    );
  }

  const idByNrCart = new Map<string, number>();
  const missing = new Map<string, { nume: string; um: string }>();
  for (const { nrCart, nume, um } of lines) {
    const existent = byNrCart.get(nrCart);
    if (existent) idByNrCart.set(nrCart, existent.id);
    else missing.set(nrCart, { nume, um });
  }

  for (const [nrCart, { nume, um }] of missing) {
    const created = await apiFetch<MaterialListItem>(apiUrl, auth, "POST", "/api/materiale", {
      nrCart,
      nume,
      um,
    });
    idByNrCart.set(nrCart, created.id);
    console.log(`Created material ${nrCart} (id ${created.id}): ${nume} (${um})`);
  }

  return idByNrCart;
}

async function main() {
  const [filePath, apiUrl = DEFAULT_API_URL] = process.argv.slice(2).filter((a) => a !== "--");
  if (!filePath) {
    console.error("Usage: pnpm run seed:factura -- <path-to-factura-file> [api-url]");
    process.exitCode = 1;
    return;
  }

  // Credentials can ride in the url (`https://user:pass@host`) for servers
  // behind Basic Auth, e.g. the deployed Caddy; they become an Authorization
  // header and are stripped from the url fetch sees.
  const parsedUrl = new URL(apiUrl);
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error(`Url de API invalid: ${apiUrl}`);
  }
  const auth = parsedUrl.username
    ? `Basic ${Buffer.from(
        `${decodeURIComponent(parsedUrl.username)}:${decodeURIComponent(parsedUrl.password)}`,
      ).toString("base64")}`
    : undefined;
  parsedUrl.username = "";
  parsedUrl.password = "";
  const baseUrl = parsedUrl.toString().replace(/\/+$/, "");
  const { data, totalTiparit, ramas, linii } = await loadFactura(filePath);
  const month = data.slice(0, 7);

  const total = linii.reduce((sum, l) => sum + l.cantitate * l.pretUnitar, 0);
  if (Math.abs(total - totalTiparit) > 0.05) {
    console.warn(
      `Total calculat ${total.toFixed(2)} diferă de totalul tipărit pe factură ${totalTiparit.toFixed(2)}`,
    );
  }

  await checkForDuplicate(baseUrl, auth, data, linii);

  const idByNrCart = await resolveMaterials(baseUrl, auth, linii);

  const body: FacturaCreateBody = {
    data,
    ramas: ramas ?? false,
    materiale: linii.map((l) => ({
      materialId: idByNrCart.get(l.nrCart.trim())!,
      cantitate: l.cantitate,
      pretUnitar: l.pretUnitar,
    })),
  };

  const factura = await apiFetch<FacturaDetail>(baseUrl, auth, "POST", "/api/facturi", body);
  console.log(
    `Seeded factura (id ${factura.id}) for ${month} with ${factura.materiale.length} lines.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
