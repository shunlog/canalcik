import { ActionIcon, Modal, ScrollArea, Stack, Text, TextInput, UnstyledButton } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useProduse } from "../api/produse.ts";
import { aplatizeaza, type ProdusIndexat } from "../lib/produse.tsx";
import { fuzzySearch } from "../lib/search.ts";
import classes from "./CautaProdus.module.css";

const LIMITA = 100;

/** The magnifier on a table row, opening that table's {@link CautaProdus}. */
export function ButonCautaProdus({ onClick }: { onClick: () => void }) {
  return (
    <ActionIcon variant="light" aria-label="Caută în catalog" onClick={onClick}>
      <IconSearch size={16} />
    </ActionIcon>
  );
}

/**
 * The catalogue picker. Render one per table, not one per row: hold the row
 * being filled in the table's state, open it from that row's
 * {@link ButonCautaProdus}, and prefill the row's columns in `onAlege`.
 *
 *     const [randCautat, setRandCautat] = useState<number | null>(null);
 *     <CautaProdus
 *       rand={randCautat}
 *       onInchide={() => setRandCautat(null)}
 *       onAlege={(produs, i) => form.setFieldValue(`randuri.${i}.cod`, produs.cod)}
 *     />
 */
export function CautaProdus({
  rand,
  onInchide,
  onAlege,
}: {
  rand: number | null;
  onInchide: () => void;
  onAlege: (produs: ProdusIndexat, rand: number) => void;
}) {
  const { data } = useProduse();
  const [cautare, setCautare] = useState("");
  const peTelefon = useMediaQuery("(max-width: 48em)");

  const produse = useMemo(() => (data ?? []).flatMap((c) => aplatizeaza(c, [])), [data]);
  const gasite = useMemo(
    () =>
      fuzzySearch(produse, cautare, [
        (p) => p.nume,
        (p) => p.cod,
        (p) => p.cale.join(" › "),
      ]).slice(0, LIMITA),
    [produse, cautare],
  );

  const inchide = () => {
    setCautare("");
    onInchide();
  };

  const alege = (produs: ProdusIndexat) => {
    if (rand !== null) onAlege(produs, rand);
    inchide();
  };

  return (
    <Modal
      opened={rand !== null}
      onClose={inchide}
      title="Caută în catalog"
      fullScreen={peTelefon}
      size="lg"
    >
      <Stack gap="xs">
        {/* size="md" is 16px: anything smaller makes iOS Safari zoom on focus. */}
        <TextInput
          data-autofocus
          size="md"
          placeholder="Denumire, categorie sau cod"
          leftSection={<IconSearch size={16} />}
          value={cautare}
          onChange={(e) => setCautare(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && gasite[0]) alege(gasite[0]);
          }}
        />
        <ScrollArea.Autosize mah="60vh" type="auto">
          {gasite.length === 0 ? (
            <Text c="dimmed" size="sm" p="xs">
              Niciun produs găsit
            </Text>
          ) : (
            gasite.map((produs) => (
              <UnstyledButton
                key={produs.cod}
                className={classes.optiune}
                onClick={() => alege(produs)}
              >
                <Text size="sm" fw={500}>
                  {produs.nume}
                  <Text span c="dimmed" size="sm">
                    {" "}
                    · {produs.unitate} · {produs.cod}
                  </Text>
                </Text>
                <Text size="xs" c="dimmed">
                  {produs.cale.join(" › ")}
                </Text>
              </UnstyledButton>
            ))
          )}
        </ScrollArea.Autosize>
      </Stack>
    </Modal>
  );
}
