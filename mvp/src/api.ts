// Thin fetch wrappers around the server in ../server. Vite proxies `/api` to
// http://localhost:3000 in dev (see vite.config.ts).

export type Material = {
  id: number;
  cod: string;
  denumire: string;
  unitateMasura: string | null;
  caleCategorie: string | null;
};

export type Vehicul = {
  id: number;
  nrInmatriculare: string;
  nrInventar: number;
  tip: string;
  model: string;
  anProducere: number | null;
};

export async function searchMaterials(q: string): Promise<Material[]> {
  const res = await fetch(`/api/materials?q=${encodeURIComponent(q)}&limit=20`);
  if (!res.ok) throw new Error(`materials search failed: ${res.status}`);
  return res.json();
}

export async function searchVehicles(q: string): Promise<Vehicul[]> {
  const res = await fetch(`/api/vehicles?q=${encodeURIComponent(q)}&limit=20`);
  if (!res.ok) throw new Error(`vehicles search failed: ${res.status}`);
  return res.json();
}

export type SyncResult = {
  ok: boolean;
  materials?: number;
  vehicles?: number;
  drivers?: number;
  durationMs?: number;
  error?: string;
};

export async function syncMasterData(): Promise<SyncResult> {
  const res = await fetch("/api/sync", { method: "POST" });
  return res.json();
}

export type GenerateComandaInput = {
  data: string; // YYYY-MM-DD
  randuri: Array<{
    materialId: number;
    vehiculId: number;
    cantitate: number;
    unitateMasura?: string | null;
  }>;
};

export type GenerateComandaResult = {
  ok: boolean;
  comandaId?: number;
  driveFileId?: string;
  driveFileUrl?: string | null;
  error?: string;
};

export async function generateComanda(
  input: GenerateComandaInput
): Promise<GenerateComandaResult> {
  const res = await fetch("/api/comanda/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.json();
}
