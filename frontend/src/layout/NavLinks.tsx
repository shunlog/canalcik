import { NavLink } from "@mantine/core";
import { IconFileText, IconTruck, IconUsers } from "@tabler/icons-react";
import { Link, useLocation } from "react-router";

const ITEMS = [
  { to: "/soferi", label: "Șoferi", icon: IconUsers },
  { to: "/vehicule", label: "Vehicule", icon: IconTruck },
  { to: "/bonuri", label: "Bonuri de eliberare", icon: IconFileText },
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
