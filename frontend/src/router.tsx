import { createBrowserRouter } from "react-router";
import { AppLayout } from "./layout/AppLayout.tsx";
import { BonCreatePage } from "./pages/bonuri/BonCreatePage.tsx";
import { BonDetailPage } from "./pages/bonuri/BonDetailPage.tsx";
import { BonuriListPage } from "./pages/bonuri/BonuriListPage.tsx";
import { HomePage } from "./pages/HomePage.tsx";
import { MaterialDetailPage } from "./pages/materiale/MaterialDetailPage.tsx";
import { MaterialeListPage } from "./pages/materiale/MaterialeListPage.tsx";
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
      { path: "/materiale", element: <MaterialeListPage /> },
      { path: "/materiale/:id", element: <MaterialDetailPage /> },
    ],
  },
]);
