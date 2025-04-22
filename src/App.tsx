import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { StoreProvider, useStore } from "./store/useStore";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import TestTaskLinks from './pages/test-task-links';
import LearningPages from './pages/LearningPages';
import LearningPageView from './pages/LearningPageView';

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useStore();
  const location = useLocation();
  
  // While checking authentication status, show nothing
  if (isLoading) {
    return null;
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

// Main app component with routes
const AppRoutes = () => {
  return (
    <BrowserRouter>
      <StoreProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            
            {/* Test pages */}
            <Route path="/test/task-links" element={<TestTaskLinks />} />
            
            {/* Learning pages */}
            <Route path="/learning" element={<LearningPages />} />
            <Route path="/learning/:id" element={<LearningPageView />} />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </StoreProvider>
    </BrowserRouter>
  );
};

// Wrap everything with the QueryClient
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppRoutes />
  </QueryClientProvider>
);

export default App;
