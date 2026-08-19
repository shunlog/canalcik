import { Button, Group, Select, Text } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { Link } from "react-router";
import { useBonuri } from "../../api/bonuri.ts";
import { useSoferi } from "../../api/soferi.ts";
import { useVehicule } from "../../api/vehicule.ts";
import { BonuriTable } from "../../components/BonuriTable.tsx";
import { PageHeader } from "../../components/PageHeader.tsx";
import { QueryBoundary } from "../../components/QueryBoundary.tsx";
import { soferLabel, vehiculLabel } from "../../lib/labels.ts";

export function BonuriListPage() {
  const [soferId, setSoferId] = useState<string | null>(null);
  const [vehiculId, setVehiculId] = useState<string | null>(null);
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);

  const soferi = useSoferi();
  const vehicule = useVehicule();
  const query = useBonuri({
    soferId: soferId ? Number(soferId) : undefined,
    vehiculId: vehiculId ? Number(vehiculId) : undefined,
    from: from ?? undefined,
    to: to ?? undefined,
  });

  const clearFilters = () => {
    setSoferId(null);
    setVehiculId(null);
    setFrom(null);
    setTo(null);
  };

  return (
    <>
      <PageHeader
        title="Bonuri de eliberare"
        subtitle={query.data ? `${query.data.length} bonuri` : undefined}
        actions={
          <Button component={Link} to="/bonuri/nou" leftSection={<IconPlus size={16} />}>
            Bon nou
          </Button>
        }
      />

      <Group align="flex-end" mb="md">
        <Select
          label="Șofer"
          placeholder="Toți"
          searchable
          clearable
          w={260}
          data={(soferi.data ?? []).map((s) => ({ value: String(s.id), label: soferLabel(s) }))}
          value={soferId}
          onChange={setSoferId}
        />
        <Select
          label="Vehicul"
          placeholder="Toate"
          searchable
          clearable
          w={280}
          data={(vehicule.data ?? []).map((v) => ({ value: String(v.id), label: vehiculLabel(v) }))}
          value={vehiculId}
          onChange={setVehiculId}
        />
        <DateInput label="De la" valueFormat="DD.MM.YYYY" clearable w={150} value={from} onChange={setFrom} />
        <DateInput label="Până la" valueFormat="DD.MM.YYYY" clearable w={150} value={to} onChange={setTo} />
        <Button variant="subtle" onClick={clearFilters}>
          Resetează filtrele
        </Button>
      </Group>

      <QueryBoundary query={query}>
        {(bonuri) =>
          bonuri.length === 0 ? (
            <Text c="dimmed">Niciun bon găsit.</Text>
          ) : (
            <BonuriTable bonuri={bonuri} />
          )
        }
      </QueryBoundary>
    </>
  );
}
