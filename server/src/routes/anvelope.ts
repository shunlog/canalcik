import { Hono } from "hono";
import type { AnvelopeList } from "../api-types.ts";
import { db } from "../db.ts";
import {
  anvelopaKmListSelect,
  anvelopaLuniListSelect,
  toAnvelopaKmRef,
  toAnvelopaLuniRef,
  todayIso,
} from "../dto.ts";

export const anvelope = new Hono();

// The fleet-wide "Anvelope" page: every tire across every vehicul, split the
// same way as the source data (see schema.prisma). Editing a row goes through
// PATCH /vehicule/:id/anvelope instead — there is no PATCH here.
anvelope.get("/", async (c) => {
  const today = todayIso();
  const [luni, km] = await Promise.all([
    db.anvelopaLuni.findMany({ select: anvelopaLuniListSelect, orderBy: { dataInstalarii: "asc" } }),
    db.anvelopaKm.findMany({ select: anvelopaKmListSelect, orderBy: { dataInstalarii: "asc" } }),
  ]);
  const body: AnvelopeList = {
    luni: luni.map((a) => toAnvelopaLuniRef(a, today)),
    km: km.map(toAnvelopaKmRef),
  };
  return c.json(body);
});
