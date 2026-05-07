import { Route, Routes } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { DashboardPage } from "@/pages/DashboardPage";
import { EnergySavingPage } from "@/pages/EnergySavingPage";
import { UtilisationPage } from "@/pages/UtilisationPage";
import { SmartHomePage } from "@/pages/SmartHomePage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/energy" element={<EnergySavingPage />} />
        <Route path="/utilisation" element={<UtilisationPage />} />
        <Route path="/smart-home" element={<SmartHomePage />} />
      </Routes>
    </Layout>
  );
}
