import { NavLink } from "@mantine/core";
import {
  IconFileInvoice,
  IconFileSpreadsheet,
  IconFileText,
  IconPackages,
  IconSettings,
  IconTruck,
  IconUsers,
} from "@tabler/icons-react";
import { Link, useLocation } from "react-router";

const ITEMS = [
  { to: "/soferi", label: "Șoferi", icon: IconUsers },
  { to: "/vehicule", label: "Vehicule", icon: IconTruck },
  { to: "/materiale", label: "Materiale de întreținere", icon: IconPackages },
  { to: "/bonuri", label: "Bonuri de eliberare", icon: IconFileText },
  { to: "/facturi", label: "Facturi de expediție", icon: IconFileInvoice },
  { to: "/monthly-report", label: "Fișa limită", icon: IconFileSpreadsheet },
  { to: "/setari", label: "Setări", icon: IconSettings },
];

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  return (
    <>
      {ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          component={Link}
          to={to}
          label={label}
          leftSection={<Icon size={18} stroke={1.5} />}
          active={pathname === to || pathname.startsWith(`${to}/`)}
          onClick={onNavigate}
        />
      ))}
    </>
  );
}
