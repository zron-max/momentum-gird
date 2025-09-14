import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";
import PendingPage from "./pages/PendingPage";
import HomePage from "./pages/HomePage";

const queryClient = new QueryClient();




const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
            <Routes>
  <Route
    path="/dashboard"
    element={
      <ProtectedRoute>
        <Index />
      </ProtectedRoute>
    }
  />
  <Route path="/" element={<HomePage />} />
  <Route path="/auth" element={<Auth />} />
  <Route path="/pending" element={<PendingPage />} />
  <Route path="*" element={<NotFound />} />
</Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
