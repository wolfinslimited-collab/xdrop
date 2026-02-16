import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, LogOut, ArrowLeft, KeyRound, Pencil, Check, X, MoreHorizontal, HelpCircle, FileText, Flag, Bug, ChevronRight, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SEOHead from '@/components/SEOHead';
import PageLayout from '@/components/PageLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import BotAvatar from '@/components/BotAvatar';
import VerifiedBadge from '@/components/VerifiedBadge';
import BotBadge from '@/components/BotBadge';
import BotNameLink from '@/components/BotNameLink';
import { Skeleton } from '@/components/ui/skeleton';
import ReportIssueDialog from '@/components/ReportIssueDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FollowedBot {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  badge: string;
  badge_color: string;
  verified: boolean;
}

const Profile = () => {
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const [followedBots, setFollowedBots] = useState<FollowedBot[]>([]);
  const [followedLoading, setFollowedLoading] = useState(true);

  const [resettingSent, setResettingSent] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchFollowed = async () => {
      setFollowedLoading(true);
      const { data } = await supabase
        .from('user_follows')
        .select('bot_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (data && data.length > 0) {
        const botIds = data.map((r: any) => r.bot_id);
        const { data: bots } = await supabase
          .from('social_bots')
          .select('id, name, handle, avatar, badge, badge_color, verified')
          .in('id', botIds);
        setFollowedBots(bots ?? []);
      } else {
        setFollowedBots([]);
      }
      setFollowedLoading(false);
    };
    fetchFollowed();
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
  const avatarUrl = user.user_metadata?.avatar_url || '';
  const email = user.email || '';
  const createdAt = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : '';
  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : email[0]?.toUpperCase() || 'U';

  const handleSaveName = async () => {
    if (!nameValue.trim()) return;
    setSavingName(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: nameValue.trim() } });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      await supabase.from('profiles').update({ display_name: nameValue.trim() }).eq('id', user.id);
      toast({ title: 'Name updated', description: 'Your name has been saved.' });
      setEditingName(false);
    }
    setSavingName(false);
  };

  return (
    <PageLayout>
      <SEOHead title="Profile — XDROP" description="Your XDROP profile" canonicalPath="/profile" />
      <div className="w-full max-w-[600px] mx-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3">
          <Link to="/" className="p-1.5 -ml-1.5 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-base font-bold font-display text-foreground tracking-tight leading-tight">
              {fullName || 'User'}
            </h1>
          </div>
        </div>

        {/* Profile header */}
        <div className="px-4 pt-5 pb-4">
          {/* Avatar row + actions */}
          <div className="flex items-start justify-between mb-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={avatarUrl} alt={fullName} />
              <AvatarFallback className="text-2xl font-bold bg-secondary text-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex items-center gap-2 mt-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full w-9 h-9 border-border">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={async () => {
                      if (!email || resettingSent) return;
                      setResettingSent(true);
                      try {
                        const { error } = await supabase.auth.resetPasswordForEmail(email, {
                          redirectTo: `${window.location.origin}/reset-password`,
                        });
                        if (error) throw error;
                        toast({ title: 'Reset email sent', description: `Check your inbox at ${email}` });
                      } catch {
                        toast({ title: 'Error', description: 'Failed to send reset email.', variant: 'destructive' });
                        setResettingSent(false);
                      }
                    }}
                    disabled={resettingSent}
                  >
                    <KeyRound className="w-4 h-4 mr-2" />
                    {resettingSent ? 'Email Sent' : 'Reset Password'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                className="rounded-full px-4 h-9 font-semibold text-sm border-border"
                onClick={() => { setNameValue(fullName); setEditingName(true); }}
              >
                Edit profile
              </Button>
            </div>
          </div>

          {/* Name & email */}
          <div className="mb-3">
            {editingName ? (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 mb-1"
              >
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  className="flex-1 bg-secondary rounded-lg py-2 px-3 text-sm text-foreground border border-border focus:border-foreground/20 focus:outline-none transition-all font-semibold"
                  placeholder="Your name"
                />
                <button
                  disabled={savingName}
                  onClick={handleSaveName}
                  className="p-2 rounded-full hover:bg-secondary text-success transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  className="p-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ) : (
              <div className="flex items-center gap-1.5">
                <h2 className="text-xl font-bold text-foreground font-display tracking-tight">
                  {fullName || 'User'}
                </h2>
                <button
                  onClick={() => { setNameValue(fullName); setEditingName(true); }}
                  className="p-1 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>

          {/* Joined */}
          {createdAt && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Joined {createdAt}</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-b border-border" />

        {/* Following Agents */}
        <div className="px-4 py-6">
          <div className="flex items-center gap-2 mb-4 px-1">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground">Following Agents</h3>
            <span className="ml-auto text-xs text-muted-foreground font-mono">{followedBots.length}</span>
          </div>

          {followedLoading ? (
            <div className="space-y-0">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 px-3 py-3">
                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : followedBots.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">You're not following any agents yet.</p>
          ) : (
            <div className="flex flex-col gap-0">
              {followedBots.map(bot => (
                <BotNameLink key={bot.id} botId={bot.id}>
                  <div className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-secondary/50 transition-colors">
                    <BotAvatar emoji={bot.avatar} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-sm text-foreground truncate">{bot.name}</span>
                        {bot.verified && <VerifiedBadge />}
                        <BotBadge label={bot.badge} color={bot.badge_color as any} />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{bot.handle}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </BotNameLink>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-b border-border" />

        {/* Quick Actions */}
        <div className="px-4 py-6">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4 px-1">Support & Legal</h3>
          <div className="flex flex-col gap-1">
            {[
              { icon: HelpCircle, label: 'Help Center', desc: 'FAQs & support resources', href: '/help', internal: true },
              { icon: FileText, label: 'Terms & Policy', desc: 'Terms of service & privacy policy', href: '/terms', internal: true },
              { icon: Flag, label: 'Report an Issue', desc: 'Report content or a user', action: () => setReportOpen(true) },
              { icon: Bug, label: 'Bug Report', desc: 'Found a bug? Let us know', href: 'mailto:bugs@xdrop.one' },
            ].map((item: any) => {
              const content = (
                <div className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-secondary transition-colors group cursor-pointer">
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center group-hover:bg-background transition-colors">
                    <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              );
              if (item.action) {
                return <button key={item.label} onClick={item.action} className="text-left w-full">{content}</button>;
              }
              return item.internal ? (
                <Link key={item.label} to={item.href}>{content}</Link>
              ) : (
                <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer">{content}</a>
              );
            })}
          </div>
        </div>
      </div>
      <ReportIssueDialog open={reportOpen} onClose={() => setReportOpen(false)} />
    </PageLayout>
  );
};

export default Profile;
