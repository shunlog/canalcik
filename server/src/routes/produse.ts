import { Hono } from "hono";
import type { CategorieProduse } from "../api-types.ts";

export const produse = new Hono();

// A small slice of the real category tree from data_source/categorii_produse.csv,
// hardcoded here until the full catalogue is imported into SQLite.
const CATEGORII_DEMO: CategorieProduse[] = [
  {
    nume: "Elemente de caroserie",
    copii: [
      {
        nume: "Bara auto si accesorii",
        copii: [
          {
            nume: "Bara auto fata",
            produse: [
              { cod: "115212", nume: "Bara auto fata", unitate: "buc" },
              { cod: "120673", nume: "Bara reactiva K-3 MAZ 5337", unitate: "buc" },
            ],
          },
          {
            nume: "Bara auto spate",
            produse: [{ cod: "115213", nume: "Bara auto spate", unitate: "buc" }],
          },
          {
            nume: "Grila pt bara auto",
            produse: [{ cod: "115214", nume: "Grila pt bara auto", unitate: "buc" }],
          },
        ],
      },
      {
        nume: "Usi auto si accesorii",
        copii: [
          {
            nume: "Usa auto fata",
            produse: [{ cod: "115221", nume: "Usa auto fata", unitate: "buc" }],
          },
          {
            nume: "Oglinda retrovizoare",
            produse: [{ cod: "115224", nume: "Oglinda retrovizoare", unitate: "buc" }],
          },
          {
            nume: "Opritor usa auto",
            produse: [
              { cod: "115227", nume: "Opritor usa auto", unitate: "buc" },
              { cod: "120315", nume: "Angrenaj de blocare a usii (stanga) KAMAZ", unitate: "buc" },
              {
                cod: "120316",
                nume: "Dispozitiv/fixator de blocare a usii (stanga) KAMAZ",
                unitate: "buc",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    nume: "Faruri, stopuri, lumini si piese componente",
    copii: [
      {
        nume: "Faruri fata",
        copii: [
          {
            nume: "Bec la faruri",
            produse: [
              { cod: "115275", nume: "Bec la faruri C10W", unitate: "buc" },
              { cod: "115280", nume: "Bec la faruri H4", unitate: "buc" },
              { cod: "115281", nume: "Bec la faruri H7", unitate: "buc" },
              { cod: "119966", nume: "Bec electric H4", unitate: "buc" },
            ],
          },
          {
            nume: "Bec la stopuri",
            produse: [{ cod: "115286", nume: "Bec la stopuri", unitate: "buc" }],
          },
        ],
      },
      {
        nume: "Faruri, faruri de proiectie si semnalizare",
        copii: [
          {
            nume: "Far fata",
            produse: [{ cod: "115290", nume: "Far fata", unitate: "buc" }],
          },
          {
            nume: "Far spate (stop)",
            produse: [
              { cod: "115291", nume: "Far spate (stop)", unitate: "buc" },
              { cod: "120591", nume: "Felinar spate GAZ 53", unitate: "buc" },
            ],
          },
        ],
      },
    ],
  },
  {
    nume: "Sitem de franare",
    copii: [
      {
        nume: "Placute frana",
        copii: [
          {
            nume: "Placute frana fata",
            produse: [
              { cod: "115522", nume: "Placute frana fata", unitate: "buc" },
              { cod: "119907", nume: "Placute frana fata Dacia Logan", unitate: "buc" },
              { cod: "119960", nume: "Placute frana fata Iveco Daily 70C", unitate: "buc" },
              { cod: "121757", nume: "Placute frana fata Dacia Logan", unitate: "set" },
            ],
          },
          {
            nume: "Placute frana spate",
            produse: [
              { cod: "115523", nume: "Placute frana spate", unitate: "buc" },
              { cod: "119964", nume: "Placute frina Spate Iveco Daily 70C", unitate: "buc" },
            ],
          },
        ],
      },
      {
        nume: "Etriere frana",
        produse: [{ cod: "115524", nume: "Etrier frana", unitate: "buc" }],
      },
      {
        nume: "Discuri frana",
        produse: [{ cod: "115520", nume: "Disc frana", unitate: "buc" }],
      },
    ],
  },
];

produse.get("/", (c) => c.json(CATEGORII_DEMO));
