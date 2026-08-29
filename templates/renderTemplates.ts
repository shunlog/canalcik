import { renderDocxBuf } from "./renderDocx.ts";
import { renderXlsxBuf, renderXlsxTabs } from "./renderXlsx.ts";

import type {
  DataComandaMateriale,
  DataActDefectiune,
  DataFisaLimita,
} from "./templateData.ts";

// The data types live in templateData.ts so the frontend can import them
// without pulling docxtemplater into the browser bundle; re-exported here
// because this module is the one callers already reach for.
export type {
  DataComandaMateriale,
  DataActDefectiune,
  DataFisaLimitaSheet,
  DataFisaLimita,
} from "./templateData.ts";

// --- Public API --------------------------------------------------------------

export function renderComandaMateriale(
  template: Buffer,
  data: DataComandaMateriale,
): Buffer {
  return renderDocxBuf(template, data);
}

export function renderActDefectiune(
  template: Buffer,
  data: DataActDefectiune,
): Buffer {
  return renderDocxBuf(template, data);
}

// Renders a spreadsheet with multiple tabs named "<registration plate>-<driver name>"
// it is normalized to Excel's naming rules and made unique if necessary.
export function renderFisaLimita(
  template: Buffer,
  data: DataFisaLimita,
): Buffer {
  const names = fisaLimitaTabNames(data);
  return renderXlsxTabs(
    template,
    data.map((fisa, index) => ({
      name: names[index],
      data: fisa,
    })),
  );
}

function fisaLimitaTabNames(data: DataFisaLimita): string[] {
  const used = new Set<string>();
  return data.map((fisa, index) => {
    const base = (
      fisa.nr_inregistrare.trim() && fisa.nume_sofer.trim()
        ? `${fisa.nr_inregistrare}-${fisa.nume_sofer}`
        : `Fisa ${index + 1}`
    )
      .replace(/[\\/*?:\[\]]/g, "-")
      .replace(/^'+|'+$/g, "")
      .slice(0, 31) || `Fisa ${index + 1}`;
    if (!used.has(base.toLocaleLowerCase())) {
      used.add(base.toLocaleLowerCase());
      return base;
    }

    let suffix = 2;
    let name = base;
    do {
      const ending = ` (${suffix++})`;
      name = `${base.slice(0, 31 - ending.length)}${ending}`;
    } while (used.has(name.toLocaleLowerCase()));
    used.add(name.toLocaleLowerCase());
    return name;
  });
}
