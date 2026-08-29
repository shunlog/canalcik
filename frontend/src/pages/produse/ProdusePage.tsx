import { Mark, NavLink, Paper, Stack, Text, TextInput } from "@mantine/core";
import type { CategorieProduse } from "@canalcik/server/api-types";
import { IconSearch } from "@tabler/icons-react";
import fuzzysort, { type Result } from "fuzzysort";
import { useMemo, useState } from "react";
import { useProduse } from "../../api/produse.ts";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";

interface ProdusIndexat {
  cod: string;
  nume: string;
  unitate: string;
  cale: string[];
}

function aplatizeaza(categorie: CategorieProduse, cale: string[]): ProdusIndexat[] {
  const caleCurenta = [...cale, categorie.nume];
  const produseProprii = (categorie.produse ?? []).map((p) => ({ ...p, cale: caleCurenta }));
  const produseCopii = (categorie.copii ?? []).flatMap((c) => aplatizeaza(c, caleCurenta));
  return [...produseProprii, ...produseCopii];
}

function ArboreCategorie({ categorie, nivel = 0 }: { categorie: CategorieProduse; nivel?: number }) {
  return (
    <NavLink
      label={categorie.nume}
      childrenOffset={16}
      py={4}
      bg={`color-mix(in srgb, var(--mantine-color-text) ${nivel * 4}%, transparent)`}
      styles={{ children: { borderInlineStart: "1px solid var(--mantine-color-default-border)" } }}
    >
      {categorie.copii?.map((c) => <ArboreCategorie key={c.nume} categorie={c} nivel={nivel + 1} />)}
      {categorie.produse?.map((p) => (
        <NavLink
          key={p.cod}
          py={4}
          c="blue"
          label={
            <>
              {p.nume} <Text span c="dimmed" size="sm">· {p.unitate} · {p.cod}</Text>
            </>
          }
        />
      ))}
    </NavLink>
  );
}

export function ProdusePage() {
  const [search, setSearch] = useState("");
  const query = useProduse();

  const produseIndexate = useMemo(
    () => (query.data ?? []).flatMap((c) => aplatizeaza(c, [])),
    [query.data],
  );

  const rezultate = useMemo(() => {
    const trimmed = search.trim();
    if (trimmed === "") return null;
    return fuzzysort.go(trimmed, produseIndexate, {
      keys: [(p) => p.nume, (p) => p.cale.join(" › ")],
      limit: 50,
    });
  }, [search, produseIndexate]);

  return (
    <>
      <PageHeader
        title="Produse"
        subtitle={
          rezultate ? `${rezultate.length} produse găsite` : `${produseIndexate.length} produse`
        }
      />

      <TextInput
        placeholder="Caută după denumire sau categorie"
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        mb="md"
        maw={480}
      />

      <QueryBoundary query={query}>
        {(categorii) =>
          rezultate === null ? (
            <Stack gap={0}>
              {categorii.map((c) => (
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
          )
        }
      </QueryBoundary>
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
