import { Card, SimpleGrid, Text, Title } from "@mantine/core";
import { IconFileText, IconTruck, IconUsers } from "@tabler/icons-react";
import { Link } from "react-router";
import { useBonuri } from "../api/bonuri.ts";
import { useSoferi } from "../api/soferi.ts";
import { useVehicule } from "../api/vehicule.ts";
import { PageHeader } from "../components/PageHeader.tsx";

export function HomePage() {
  const soferi = useSoferi();
  const vehicule = useVehicule();
  const bonuri = useBonuri();

  const cards = [
    { to: "/soferi", label: "Șoferi", icon: IconUsers, count: soferi.data?.length },
    { to: "/vehicule", label: "Vehicule", icon: IconTruck, count: vehicule.data?.length },
    { to: "/bonuri", label: "Bonuri de eliberare", icon: IconFileText, count: bonuri.data?.length },
  ];

  return (
    <>
      <PageHeader title="Canalcik" subtitle="Gestiunea flotei și a bonurilor de eliberare" />
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        {cards.map(({ to, label, icon: Icon, count }) => (
          <Card key={to} component={Link} to={to} withBorder padding="lg">
            <Icon size={28} stroke={1.5} />
            <Title order={3} mt="sm">
              {count ?? "…"}
            </Title>
            <Text c="dimmed">{label}</Text>
          </Card>
        ))}
      </SimpleGrid>
    </>
  );
}
