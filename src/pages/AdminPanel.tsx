import { useState, useEffect } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Users, Eye, BarChart3, Settings, Cpu, ShoppingCart, Flag,
  ChevronLeft, Home, Activity, Bell, LogOut 
} from 'lucide-react';
import SEOHead from '@/components/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminModeration from '@/components/admin/AdminModeration';
import AdminSettings from '@/components/admin/AdminSettings';
import AdminAgents from '@/components/admin/AdminAgents';
import AdminPurchases from '@/components/admin/AdminPurchases';
import AdminReports from '@/components/admin/AdminReports';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

type Tab = 'analytics' | 'users' | 'agents' | 'purchases' | 'reports' | 'moderation' | 'settings';

const navItems: { id: Tab; label: string; icon: any; description: string }[] = [
  { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Platform metrics' },
  { id: 'users', label: 'Users', icon: Users, description: 'Manage accounts' },
  { id: 'agents', label: 'Agents', icon: Cpu, description: 'AI agents & APIs' },
  { id: 'purchases', label: 'Purchases', icon: ShoppingCart, description: 'Sales & trials' },
  { id: 'reports', label: 'Reports', icon: Flag, description: 'User reports' },
  { id: 'moderation', label: 'Moderation', icon: Eye, description: 'Content review' },
  { id: 'settings', label: 'Settings', icon: Settings, description: 'Platform config' },
];

const AdminPanel = () => {
  const { user, session, loading: authLoading, signOut } = useAuth();
  const { isAdmin, checking } = useAdminCheck();
  const [tab, setTab] = useState<Tab>(() => {
    const saved = sessionStorage.getItem('admin-tab');
    return (saved && navItems.some(n => n.id === saved) ? saved : 'analytics') as Tab;
  });
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.setItem('admin-tab', tab);
  }, [tab]);

  useEffect(() => {
    const handlePopState = () => {
      navigate('/home', { replace: true });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  if (authLoading || checking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center animate-pulse">
            <Shield className="w-4.5 h-4.5 text-accent" />
          </div>
          <p className="text-xs text-muted-foreground">Loading admin panel…</p>
        </div>
      </div>
    );
  }
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const currentNav = navItems.find(n => n.id === tab);

  return (
    <>
      <SEOHead title="Admin Panel — XDROP" description="Platform administration" canonicalPath="/admin" />
      <div className="flex h-screen w-full bg-background overflow-hidden">
        {/* Sidebar */}
        <motion.aside
          animate={{ width: collapsed ? 72 : 260 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="h-full border-r border-border bg-card flex flex-col shrink-0 overflow-hidden"
        >
          {/* Logo area */}
          <div className="p-4 flex items-center gap-3 h-16 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
              <Shield className="w-4.5 h-4.5 text-accent" />
            </div>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0">
                <p className="text-sm font-bold font-display text-foreground tracking-tight">XDROP</p>
                <p className="text-[10px] text-muted-foreground">Admin Console</p>
              </motion.div>
            )}
          </div>

          <Separator />

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map(item => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
                    active
                      ? 'bg-accent/10 text-accent'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="admin-sidebar-active"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-accent rounded-r-full"
                    />
                  )}
                  <item.icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-accent' : 'text-muted-foreground group-hover:text-foreground'}`} />
                  {!collapsed && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-left min-w-0">
                      <span className="block truncate">{item.label}</span>
                      {!active && <span className="block text-[10px] text-muted-foreground/60 truncate">{item.description}</span>}
                    </motion.div>
                  )}
                </button>
              );
            })}
          </nav>

          <Separator />

          {/* Bottom section */}
          <div className="p-3 space-y-2 shrink-0">
            <Link
              to="/"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            >
              <Home className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span>Back to App</span>}
            </Link>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            >
              <ChevronLeft className={`w-[18px] h-[18px] shrink-0 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
              {!collapsed && <span>Collapse</span>}
            </button>
          </div>

          {/* User pill */}
          {!collapsed && (
            <div className="p-3 pt-0 shrink-0">
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-secondary/40">
                <Avatar className="w-7 h-7">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="text-[10px] bg-accent/15 text-accent">
                    {(user?.user_metadata?.full_name || 'A')[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{user?.user_metadata?.full_name || 'Admin'}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          )}
        </motion.aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top bar */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-lg font-bold font-display text-foreground tracking-tight">
                  {currentNav?.label}
                </h1>
                <p className="text-[11px] text-muted-foreground -mt-0.5">{currentNav?.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
                <Activity className="w-3 h-3 text-success" />
                <span className="text-[10px] text-success font-medium">System Online</span>
              </div>
            </div>
          </header>

          {/* Content area */}
          <main className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                {tab === 'analytics' && <AdminAnalytics session={session} />}
                {tab === 'users' && <AdminUsers session={session} />}
                {tab === 'agents' && <AdminAgents session={session} />}
                {tab === 'purchases' && <AdminPurchases session={session} />}
                {tab === 'reports' && <AdminReports session={session} />}
                {tab === 'moderation' && <AdminModeration session={session} />}
                {tab === 'settings' && <AdminSettings session={session} />}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </>
  );
};

export default AdminPanel;
