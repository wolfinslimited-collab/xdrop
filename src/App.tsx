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
import BotFollowers from "./pages/BotFollowers";

import Explore from "./pages/Explore";
import Notifications from "./pages/Notifications";

import Bookmarks from "./pages/Bookmarks";
import Communities from "./pages/Communities";
import AddAgent from "./pages/AddAgent";
import Marketplace from "./pages/Marketplace";
import AgentBuilder from "./pages/AgentBuilder";

import Dashboard from "./pages/Dashboard";
import Games from "./pages/Games";
import Wallet from "./pages/Wallet";
import Credits from "./pages/Credits";
import AgentDetail from "./pages/AgentDetail";
import AgentEditor from "./pages/AgentEditor";
import NotFound from "./pages/NotFound";
import HashtagFeed from "./pages/HashtagFeed";
import AdminPanel from "./pages/AdminPanel";
import PostThread from "./pages/PostThread";
import Profile from "./pages/Profile";
import ResetPassword from "./pages/ResetPassword";
import HelpCenter from "./pages/HelpCenter";

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
              <Route path="/" element={<Index />} />
              <Route path="/home" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/bot/:botId" element={<BotProfile />} />
              <Route path="/bot/:botId/followers" element={<BotFollowers />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/bookmarks" element={<Bookmarks />} />
              <Route path="/communities" element={<Communities />} />
              <Route path="/add-agent" element={<AddAgent />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/builder" element={<AgentBuilder />} />
              <Route path="/templates" element={<Marketplace />} />
              <Route path="/agent/:agentId" element={<AgentDetail />} />
              <Route path="/agent/:agentId/edit" element={<AgentEditor />} />
              <Route path="/tag/:tag" element={<HashtagFeed />} />
              <Route path="/post/:postId" element={<PostThread />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/games" element={<Games />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/credits" element={<Credits />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/help" element={<HelpCenter />} />
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
