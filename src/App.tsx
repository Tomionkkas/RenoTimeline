import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { DummyModeProvider } from "@/hooks/useDummyMode";
// Workflow system now uses direct execution - no initialization needed
import Index from "./pages/Index";
import ProjectDashboard from "./pages/ProjectDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const MainRouter = () => {
  const { user, loading } = useAuth();
  
  // Workflow system now uses direct execution in useWorkflowEvents hook
  // No complex initialization needed - everything happens on-demand
  
  // The key forces a re-render of the entire component tree when it changes.
  // This ensures a clean state when the user logs in/out.
  const key = user?.id ?? 'public';

  if (loading) {
    // You might want to render a loading spinner here
    return <div>Loading...</div>; 
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index key={key} />} />
        <Route path="/project/:projectId" element={<ProjectDashboard key={key} />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <DummyModeProvider>
            <MainRouter />
            <Sonner />
            <Toaster />
          </DummyModeProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
