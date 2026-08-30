import { z } from "zod";
import type { ActDefectiuneCreateBody, ActDefectiuneUpdateBody } from "../api-types.ts";
import { isoDate, requiredText, type Same } from "./common.ts";

// `nr` is the row's own number in its table and `cauza` a row number in tab 1.
// Both are sent by the client rather than derived here: they are what the
// document prints, and the act is a transcription of a paper form, so a gap or
// an odd order is the operator's to make.
const nr = z.number().int().positive();

const defectiune = z.object({
  nr,
  defectiunea: requiredText("Defecțiunea"),
  cauze: z.string().trim(),
});

// Only the code: routes/actDefectiune.ts checks it against the catalogue, which
// is then what the name and the UM are read from.
const piesaSchimb = z.object({
  nr,
  nrNomenclator: requiredText("Piesa de schimb"),
  cantitate: z.number().positive("Cantitatea trebuie să fie mai mare decât 0"),
  cauza: nr,
  necesitaInlocuire: z.enum(["da", "nu"]),
});

const lucrare = z.object({
  nr,
  denumire: requiredText("Denumirea lucrării"),
  um: requiredText("Unitatea de măsură"),
  cantitate: z.number().positive("Cantitatea trebuie să fie mai mare decât 0"),
  cauza: nr,
});

// A lucrare's UM is left as typed, unlike a bon's or a factura's: it describes
// work rather than a catalogue product, so there is nothing to read it off.
export const actDefectiuneCreate = z.object({
  data: isoDate,
  vehiculId: z.number().int().positive(),
  defectiuni: z.array(defectiune),
  pieseSchimb: z.array(piesaSchimb),
  lucrari: z.array(lucrare),
});

// PUT-shaped rather than PATCH-shaped: the act is one form, saved whole, so
// there is no partial edit to express — see routes/actDefectiune.ts.
export const actDefectiuneUpdate = actDefectiuneCreate;

const _createMatches: Same<z.infer<typeof actDefectiuneCreate>, ActDefectiuneCreateBody> = true;
const _updateMatches: Same<z.infer<typeof actDefectiuneUpdate>, ActDefectiuneUpdateBody> = true;
void _createMatches, _updateMatches;
