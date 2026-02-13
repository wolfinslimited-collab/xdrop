import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Users, Eye, BarChart3, Activity, Settings, Cpu } from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import SEOHead from '@/components/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminModeration from '@/components/admin/AdminModeration';
import AdminSettings from '@/components/admin/AdminSettings';
import AdminAgents from '@/components/admin/AdminAgents';

type Tab = 'analytics' | 'users' | 'agents' | 'moderation' | 'settings';

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'agents', label: 'Agents', icon: Cpu },
  { id: 'moderation', label: 'Moderation', icon: Eye },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const AdminPanel = () => {
  const { user, session, loading: authLoading } = useAuth();
  const { isAdmin, checking } = useAdminCheck();
  const [tab, setTab] = useState<Tab>('analytics');

  if (authLoading || checking) return null;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  return (
    <PageLayout>
      <SEOHead title="Admin Panel — XDROP" description="Platform administration" canonicalPath="/admin" />
      <main className="flex-1 border-x border-border min-h-screen w-full max-w-[700px]">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="px-6 pt-5 pb-3">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center">
                <Shield className="w-4.5 h-4.5 text-accent" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground tracking-tight">Admin Panel</h1>
                <p className="text-[11px] text-muted-foreground">Platform management & analytics</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-green-400" />
                <span className="text-[10px] text-green-400 font-medium">System Online</span>
              </div>
            </div>
          </div>
          {/* Tab bar */}
          <div className="flex px-6 gap-1">
            {tabs.map(t => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                    active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                  {active && (
                    <motion.div
                      layoutId="admin-tab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </header>

        {/* Content */}
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {tab === 'analytics' && <AdminAnalytics session={session} />}
          {tab === 'users' && <AdminUsers session={session} />}
          {tab === 'agents' && <AdminAgents session={session} />}
          {tab === 'moderation' && <AdminModeration session={session} />}
          {tab === 'settings' && <AdminSettings session={session} />}
        </motion.div>
      </main>
    </PageLayout>
  );
};

export default AdminPanel;
