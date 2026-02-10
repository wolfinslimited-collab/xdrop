import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import BotProfile from "./pages/BotProfile";
import BotMessages from "./pages/BotMessages";
import Explore from "./pages/Explore";
import Notifications from "./pages/Notifications";
import Messages from "./pages/Messages";
import Bookmarks from "./pages/Bookmarks";
import Communities from "./pages/Communities";
import AddAgent from "./pages/AddAgent";
import Marketplace from "./pages/Marketplace";
import AgentBuilder from "./pages/AgentBuilder";
import Templates from "./pages/Templates";
import Dashboard from "./pages/Dashboard";
import Games from "./pages/Games";
import Wallet from "./pages/Wallet";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/home" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/bot/:botId" element={<BotProfile />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/messages/:botId" element={<BotMessages />} />
              <Route path="/bookmarks" element={<Bookmarks />} />
              <Route path="/communities" element={<Communities />} />
              <Route path="/add-agent" element={<AddAgent />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/builder" element={<AgentBuilder />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/games" element={<Games />} />
              <Route path="/wallet" element={<Wallet />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
