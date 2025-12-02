import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
// Workflow system now uses direct execution - no initialization needed
import Index from "./pages/Index";
import ProjectDashboard from "./pages/ProjectDashboard";
import NotFound from "./pages/NotFound";
import { TestPhase1 } from "./components/TestPhase1";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <MainRouter />
          <Sonner />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

const MainRouter = () => {
  const { user, loading } = useAuth();
  
  // The key forces a re-render of the entire component tree when it changes.
  // This ensures a clean state when the user logs in/out.
  const key = user?.id ?? 'public';

  // Render a full-page loading indicator while the auth state is being determined.
  // This prevents child components from making authenticated requests before the user is loaded.
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xl">Ładowanie aplikacji...</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index key={key} />} />
        <Route path="/project/:projectId" element={<ProjectDashboard key={key} />} />
        <Route path="/test-phase1" element={<TestPhase1 />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
