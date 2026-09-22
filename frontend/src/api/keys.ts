// Query keys live in one file so the cross-entity invalidations below don't
// need soferi.ts and vehicule.ts to import each other.

export const soferKeys = {
  all: ["soferi"] as const,
  list: ["soferi", "list"] as const,
  detail: (id: number) => ["soferi", "detail", id] as const,
};

export const vehiculKeys = {
  all: ["vehicule"] as const,
  list: ["vehicule", "list"] as const,
  detail: (id: number) => ["vehicule", "detail", id] as const,
};

export const bonKeys = {
  all: ["bonuri"] as const,
  list: ["bonuri", "list"] as const,
  detail: (id: number) => ["bonuri", "detail", id] as const,
};

export const materialKeys = {
  all: ["materiale"] as const,
  list: ["materiale", "list"] as const,
  detail: (id: number) => ["materiale", "detail", id] as const,
};

export const produseKeys = {
  all: ["produse"] as const,
  list: ["produse", "list"] as const,
};

export const driveKeys = {
  all: ["drive"] as const,
  status: ["drive", "status"] as const,
};

export const facturaKeys = {
  all: ["facturi"] as const,
  list: ["facturi", "list"] as const,
  detail: (id: number) => ["facturi", "detail", id] as const,
};

export const actDefectiuneKeys = {
  all: ["acteDefectiune"] as const,
  list: ["acteDefectiune", "list"] as const,
  detail: (id: number) => ["acteDefectiune", "detail", id] as const,
};

export const comandaMaterialeKeys = {
  all: ["comenziMateriale"] as const,
  list: ["comenziMateriale", "list"] as const,
  detail: (id: number) => ["comenziMateriale", "detail", id] as const,
};

export const monthlyReportKeys = {
  all: ["monthlyReport"] as const,
  detail: (month: string) => ["monthlyReport", "detail", month] as const,
};

export const anvelopeKeys = {
  all: ["anvelope"] as const,
  list: ["anvelope", "list"] as const,
};

export const templateKeys = {
  all: ["templates"] as const,
  list: ["templates", "list"] as const,
};
