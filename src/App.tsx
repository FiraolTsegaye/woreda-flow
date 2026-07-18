import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppHeader from "@/components/AppHeader";
import AdminGate from "@/components/AdminGate";
import { SimulationProvider } from "@/lib/simulation-context";
import ServicesPage from "./pages/Services";
import ServiceDetailPage from "./pages/ServiceDetail";
import QueueStatusPage from "./pages/QueueStatus";
import DisplayBoard from "./pages/DisplayBoard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SimulationProvider>
        <BrowserRouter>
          <AppHeader />
          <Routes>
            <Route path="/" element={<Navigate to="/services" replace />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/service/:id" element={<ServiceDetailPage />} />
            <Route path="/queue" element={<QueueStatusPage />} />
            <Route path="/display" element={<DisplayBoard />} />
            <Route path="/admin" element={<AdminGate><AdminDashboard /></AdminGate>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SimulationProvider>
      <Analytics />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
