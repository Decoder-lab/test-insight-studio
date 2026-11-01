import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import FullPageSpinner from "@/components/FullPageSpinner";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import ResultsPage from "./pages/ResultsPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";

// Auth and respondent routes are lazy so supabase-js stays out of the public landing bundle.
const RespondentPage = lazy(() => import("./pages/RespondentPage"));
const AuthLayout = lazy(() => import("./components/auth/AuthLayout"));
const Login = lazy(() => import("./pages/Login"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Logout = lazy(() => import("./pages/Logout"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const ProjectsPage = lazy(() => import("./pages/admin/ProjectsPage"));
const CreateProjectPage = lazy(() => import("./pages/admin/CreateProjectPage"));
const ProjectDetailsPage = lazy(() => import("./pages/admin/ProjectDetailsPage"));

// Review-only: the old demo flow, kept until its pieces are reused in the respondent page.
// `import.meta.env.DEV` is false in production builds, so the chunk is dropped there.
const TestDemoPage = import.meta.env.DEV ? lazy(() => import("./pages/TestPage")) : null;

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route
            path="/test"
            element={
              <Suspense fallback={<FullPageSpinner />}>
                <RespondentPage />
              </Suspense>
            }
          />
          {TestDemoPage && (
            <Route
              path="/dev/test-demo"
              element={
                <Suspense fallback={<FullPageSpinner />}>
                  <TestDemoPage />
                </Suspense>
              }
            />
          )}
          <Route path="/results/:id" element={<ResultsPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />

          {/* Only this subtree contains lazy routes, so only it needs a Suspense boundary. */}
          <Route
            element={
              <Suspense fallback={<FullPageSpinner />}>
                <AuthLayout />
              </Suspense>
            }
          >
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/logout" element={<Logout />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<ProjectsPage />} />
                <Route path="projects/new" element={<CreateProjectPage />} />
                <Route path="projects/:projectId" element={<ProjectDetailsPage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
