import { createBrowserRouter } from "react-router";
import { AppLayout } from "./layout/AppLayout.tsx";
import { ActDefectiuneCreatePage } from "./pages/actDefectiune/ActDefectiuneCreatePage.tsx";
import { ActDefectiuneDetailPage } from "./pages/actDefectiune/ActDefectiuneDetailPage.tsx";
import { ActDefectiuneListPage } from "./pages/actDefectiune/ActDefectiuneListPage.tsx";
import { BonCreatePage } from "./pages/bonuri/BonCreatePage.tsx";
import { BonDetailPage } from "./pages/bonuri/BonDetailPage.tsx";
import { BonuriListPage } from "./pages/bonuri/BonuriListPage.tsx";
import { ComandaMaterialeCreatePage } from "./pages/comandaMateriale/ComandaMaterialeCreatePage.tsx";
import { ComandaMaterialeDetailPage } from "./pages/comandaMateriale/ComandaMaterialeDetailPage.tsx";
import { ComandaMaterialeListPage } from "./pages/comandaMateriale/ComandaMaterialeListPage.tsx";
import { FacturaCreatePage } from "./pages/facturi/FacturaCreatePage.tsx";
import { FacturaDetailPage } from "./pages/facturi/FacturaDetailPage.tsx";
import { FacturiListPage } from "./pages/facturi/FacturiListPage.tsx";
import { HomePage } from "./pages/HomePage.tsx";
import { MaterialDetailPage } from "./pages/materiale/MaterialDetailPage.tsx";
import { MaterialeListPage } from "./pages/materiale/MaterialeListPage.tsx";
import { MonthlyReportDetailPage } from "./pages/monthlyReport/MonthlyReportDetailPage.tsx";
import { MonthlyReportListPage } from "./pages/monthlyReport/MonthlyReportListPage.tsx";
import { ProdusePage } from "./pages/produse/ProdusePage.tsx";
import { SetariPage } from "./pages/SetariPage.tsx";
import { SoferCreatePage } from "./pages/soferi/SoferCreatePage.tsx";
import { SoferDetailPage } from "./pages/soferi/SoferDetailPage.tsx";
import { SoferiListPage } from "./pages/soferi/SoferiListPage.tsx";
import { VehiculCreatePage } from "./pages/vehicule/VehiculCreatePage.tsx";
import { VehiculDetailPage } from "./pages/vehicule/VehiculDetailPage.tsx";
import { VehiculeListPage } from "./pages/vehicule/VehiculeListPage.tsx";

// Every page is a child of the one AppLayout route, so the header and sidebar
// mount once and survive navigation. No loaders/actions on purpose: react-query
// owns all fetching, and running both would mean two competing caches.
export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/soferi", element: <SoferiListPage /> },
      { path: "/soferi/nou", element: <SoferCreatePage /> },
      { path: "/soferi/:id", element: <SoferDetailPage /> },
      { path: "/vehicule", element: <VehiculeListPage /> },
      { path: "/vehicule/nou", element: <VehiculCreatePage /> },
      { path: "/vehicule/:id", element: <VehiculDetailPage /> },
      { path: "/bonuri", element: <BonuriListPage /> },
      { path: "/bonuri/nou", element: <BonCreatePage /> },
      { path: "/bonuri/:id", element: <BonDetailPage /> },
      { path: "/facturi", element: <FacturiListPage /> },
      { path: "/facturi/nou", element: <FacturaCreatePage /> },
      { path: "/facturi/:id", element: <FacturaDetailPage /> },
      { path: "/monthly-report", element: <MonthlyReportListPage /> },
      { path: "/monthly-report/:month", element: <MonthlyReportDetailPage /> },
      { path: "/materiale", element: <MaterialeListPage /> },
      { path: "/materiale/:id", element: <MaterialDetailPage /> },
      { path: "/produse", element: <ProdusePage /> },
      { path: "/act-defectiune", element: <ActDefectiuneListPage /> },
      { path: "/act-defectiune/nou", element: <ActDefectiuneCreatePage /> },
      { path: "/act-defectiune/:id", element: <ActDefectiuneDetailPage /> },
      { path: "/comanda-materiale", element: <ComandaMaterialeListPage /> },
      { path: "/comanda-materiale/nou", element: <ComandaMaterialeCreatePage /> },
      { path: "/comanda-materiale/:id", element: <ComandaMaterialeDetailPage /> },
      { path: "/setari", element: <SetariPage /> },
    ],
  },
]);
