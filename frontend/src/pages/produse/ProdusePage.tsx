import { Mark, NavLink, Paper, Stack, Text, TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import fuzzysort, { type Result } from "fuzzysort";
import { useMemo, useState } from "react";
import { PageHeader } from "../../components/PageHeader.tsx";

interface ProdusDemo {
  cod: string;
  nume: string;
  unitate: string;
}

interface CategorieDemo {
  nume: string;
  copii?: CategorieDemo[];
  produse?: ProdusDemo[];
}

// A small slice of the real category tree from data_source/categorii_produse.csv,
// kept as a plain literal here since this page only prototypes the search UX.
const CATEGORII_DEMO: CategorieDemo[] = [
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

interface ProdusIndexat {
  cod: string;
  nume: string;
  unitate: string;
  cale: string[];
}

function aplatizeaza(categorie: CategorieDemo, cale: string[]): ProdusIndexat[] {
  const caleCurenta = [...cale, categorie.nume];
  const produseProprii = (categorie.produse ?? []).map((p) => ({ ...p, cale: caleCurenta }));
  const produseCopii = (categorie.copii ?? []).flatMap((c) => aplatizeaza(c, caleCurenta));
  return [...produseProprii, ...produseCopii];
}

const PRODUSE_INDEXATE = CATEGORII_DEMO.flatMap((c) => aplatizeaza(c, []));

function ArboreCategorie({ categorie }: { categorie: CategorieDemo }) {
  return (
    <NavLink label={categorie.nume} childrenOffset={24} defaultOpened>
      {categorie.copii?.map((c) => <ArboreCategorie key={c.nume} categorie={c} />)}
      {categorie.produse?.map((p) => (
        <NavLink
          key={p.cod}
          label={
            <>
              {p.nume} <Text span c="dimmed" size="sm">· {p.unitate}</Text>
            </>
          }
        />
      ))}
    </NavLink>
  );
}

export function ProdusePage() {
  const [search, setSearch] = useState("");

  const rezultate = useMemo(() => {
    const trimmed = search.trim();
    if (trimmed === "") return null;
    return fuzzysort.go(trimmed, PRODUSE_INDEXATE, {
      keys: [(p) => p.nume, (p) => p.cale.join(" › ")],
      limit: 50,
    });
  }, [search]);

  return (
    <>
      <PageHeader
        title="Produse"
        subtitle={rezultate ? `${rezultate.length} produse găsite` : `${PRODUSE_INDEXATE.length} produse`}
      />

      <TextInput
        placeholder="Caută după denumire sau categorie"
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        mb="md"
        maw={480}
      />

      {rezultate === null ? (
        <Stack gap={0}>
          {CATEGORII_DEMO.map((c) => (
            <ArboreCategorie key={c.nume} categorie={c} />
          ))}
        </Stack>
      ) : rezultate.length === 0 ? (
        <Text c="dimmed">Niciun produs găsit.</Text>
      ) : (
        <Stack gap="xs">
          {rezultate.map((r) => {
            const [rezNume, rezCale] = r;
            return (
              <Paper key={r.obj.cod} p="xs" withBorder>
                <Text fw={500}>
                  {evidentiaza(rezNume, r.obj.nume)}{" "}
                  <Text span c="dimmed" size="sm">
                    · {r.obj.unitate}
                  </Text>
                </Text>
                <Text size="sm" c="dimmed">
                  {evidentiaza(rezCale, r.obj.cale.join(" › "))}
                </Text>
              </Paper>
            );
          })}
        </Stack>
      )}
    </>
  );
}

// When only one of the two keys matches, fuzzysort's Result for the other key
// carries an empty string as its `.target` rather than the original text, so
// `.highlight()` must be skipped in favor of the source value in that case.
function evidentiaza(rezultat: Result, textOriginal: string) {
  if (rezultat.indexes.length === 0) return textOriginal;
  return rezultat.highlight((m, i) => <Mark key={i}>{m}</Mark>);
}
