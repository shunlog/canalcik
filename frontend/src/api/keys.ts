// Query keys live in one file so the cross-entity invalidations below don't
// need soferi.ts and vehicule.ts to import each other.

export const soferKeys = {
  all: ["soferi"] as const,
  list: (q: string) => ["soferi", "list", q] as const,
  detail: (id: number) => ["soferi", "detail", id] as const,
};

export const vehiculKeys = {
  all: ["vehicule"] as const,
  list: (q: string) => ["vehicule", "list", q] as const,
  detail: (id: number) => ["vehicule", "detail", id] as const,
};

export const bonKeys = {
  all: ["bonuri"] as const,
  list: (filters: string) => ["bonuri", "list", filters] as const,
  detail: (id: number) => ["bonuri", "detail", id] as const,
};

export const materialKeys = {
  all: ["materiale"] as const,
  list: (q: string) => ["materiale", "list", q] as const,
  detail: (id: number) => ["materiale", "detail", id] as const,
};

export const facturaKeys = {
  all: ["facturi"] as const,
  list: (filters: string) => ["facturi", "list", filters] as const,
  detail: (id: number) => ["facturi", "detail", id] as const,
};
