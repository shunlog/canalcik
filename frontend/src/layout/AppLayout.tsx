import { Anchor, AppShell, Burger, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link, Outlet } from "react-router";
import { DriveStatus } from "./DriveStatus.tsx";
import { NavLinks } from "./NavLinks.tsx";

export function AppLayout() {
  const [opened, { toggle, close }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 240, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" gap="sm">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Anchor component={Link} to="/" fw={700} size="lg" underline="never" c="inherit">
            Canalcik
          </Anchor>
          <DriveStatus />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="xs">
        <NavLinks onNavigate={close} />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
