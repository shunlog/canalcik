import { Divider, NavLink } from "@mantine/core";
import {
  IconAlertTriangle,
  IconBatteryAutomotive,
  IconBoxSeam,
  IconClipboardList,
  IconFileInvoice,
  IconFileSpreadsheet,
  IconFileText,
  IconPackages,
  IconSettings,
  IconShirt,
  IconTruck,
  IconUsers,
  IconWheel,
} from "@tabler/icons-react";
import { Fragment } from "react";
import { Link, useLocation } from "react-router";

const SECTIONS = [
  {
    label: null,
    items: [
      { to: "/soferi", label: "Șoferi", icon: IconUsers },
      { to: "/vehicule", label: "Vehicule", icon: IconTruck },
      { to: "/anvelope", label: "Anvelope", icon: IconWheel },
      { to: "/acumulatoare", label: "Acumulatoare", icon: IconBatteryAutomotive },
      { to: "/produse", label: "Produse", icon: IconBoxSeam },
      { to: "/materiale", label: "Materiale de întreținere", icon: IconPackages },
      { to: "/echipament", label: "Echipament", icon: IconShirt },
    ],
  },
  {
    label: "Zilnic",
    items: [
      { to: "/bonuri", label: "Bonuri de eliberare", icon: IconFileText },
      { to: "/act-defectiune", label: "Acte de defecțiune", icon: IconAlertTriangle },
      { to: "/comanda-materiale", label: "Comenzi de materiale", icon: IconClipboardList },
    ],
  },
  {
    label: "Lunar",
    items: [
      { to: "/facturi", label: "Facturi de expediție", icon: IconFileInvoice },
      { to: "/monthly-report", label: "Fișe limită", icon: IconFileSpreadsheet },
    ],
  },
  {
    label: null,
    items: [{ to: "/setari", label: "Setări", icon: IconSettings }],
  },
];

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  return (
    <>
      {SECTIONS.map((section, i) => (
        <Fragment key={section.label ?? `section-${i}`}>
          {i > 0 && (
            <Divider my="xs" label={section.label ?? undefined} labelPosition="left" />
          )}
          {section.items.map(({ to, label, icon: Icon }) => (
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
        </Fragment>
      ))}
    </>
  );
}
