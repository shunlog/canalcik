import { NavLink, Paper, Stack, Text, TextInput } from "@mantine/core";
import type { CategorieProduse } from "@canalcik/server/api-types";
import { IconSearch } from "@tabler/icons-react";
import fuzzysort from "fuzzysort";
import { useMemo, useState } from "react";
import { useProduse } from "../../api/produse.ts";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { aplatizeaza, evidentiaza } from "../../lib/produse.tsx";

function ArboreCategorie({ categorie, nivel = 0 }: { categorie: CategorieProduse; nivel?: number }) {
  const fundal = `color-mix(in srgb, var(--mantine-color-text) ${(nivel + 1) * 4}%, transparent)`;
  return (
    <NavLink
      label={categorie.nume}
      childrenOffset={16}
      py={4}
      bg={fundal}
      styles={{
        // 8px = half of the chevron icon's default 16px width, so the border lands under its center.
        children: {
          marginInlineStart: "calc(var(--mantine-spacing-sm) + 8px)",
          borderInlineStart: "1px dashed black",
        },
        section: { order: -1, marginInlineStart: 0, marginInlineEnd: "var(--mantine-spacing-xs)" },
      }}
    >
      {categorie.copii?.map((c) => <ArboreCategorie key={c.nume} categorie={c} nivel={nivel + 1} />)}
      {categorie.produse?.map((p) => (
        <Text key={p.cod} py={4} px="sm" size="sm" bg="var(--mantine-color-body)">
          {p.nume} <Text span c="dimmed" size="sm">· {p.unitate} · {p.cod}</Text>
        </Text>
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
      keys: [(p) => p.nume, (p) => p.cale.join(" › "), (p) => p.cod],
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
                const [rezNume, rezCale, rezCod] = r;
                return (
                  <Paper key={r.obj.cod} p="xs" withBorder>
                    <Text fw={500}>
                      {evidentiaza(rezNume, r.obj.nume)}{" "}
                      <Text span c="dimmed" size="sm">
                        · {r.obj.unitate} · {evidentiaza(rezCod, r.obj.cod)}
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
