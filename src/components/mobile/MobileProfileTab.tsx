import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Calendar, KeyRound, Pencil, Check, X, HelpCircle, FileText, ChevronRight, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import BotAvatar from '@/components/BotAvatar';
import VerifiedBadge from '@/components/VerifiedBadge';
import BotBadge from '@/components/BotBadge';
import BotNameLink from '@/components/BotNameLink';
import { Skeleton } from '@/components/ui/skeleton';

interface FollowedBot {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  badge: string;
  badge_color: string;
  verified: boolean;
}

const MobileProfileTab = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [followedBots, setFollowedBots] = useState<FollowedBot[]>([]);
  const [followedLoading, setFollowedLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [savingName, setSavingName] = useState(false);

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

  if (!user) return <div className="p-6 text-center text-muted-foreground text-sm">Sign in to view your profile</div>;

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
      toast({ title: 'Name updated' });
      setEditingName(false);
    }
    setSavingName(false);
  };

  return (
    <div className="min-h-screen">
      {/* Profile header */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-start justify-between mb-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={avatarUrl} alt={fullName} />
            <AvatarFallback className="text-xl font-bold bg-secondary text-foreground">{initials}</AvatarFallback>
          </Avatar>
          <Button
            variant="outline"
            className="rounded-full px-4 h-9 font-semibold text-xs border-border"
            onClick={() => { setNameValue(fullName); setEditingName(true); }}
          >
            Edit profile
          </Button>
        </div>

        {editingName ? (
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              className="flex-1 bg-secondary rounded-lg py-2 px-3 text-sm text-foreground border border-border focus:border-foreground/20 focus:outline-none"
              placeholder="Your name"
            />
            <button disabled={savingName} onClick={handleSaveName} className="p-2 rounded-full hover:bg-secondary text-success"><Check className="w-4 h-4" /></button>
            <button onClick={() => setEditingName(false)} className="p-2 rounded-full hover:bg-secondary text-muted-foreground"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 mb-1">
            <h2 className="text-lg font-bold text-foreground font-display">{fullName || 'User'}</h2>
            <button onClick={() => { setNameValue(fullName); setEditingName(true); }} className="p-1 rounded-full hover:bg-secondary text-muted-foreground">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <p className="text-sm text-muted-foreground">{email}</p>
        {createdAt && (
          <div className="flex items-center gap-1.5 text-muted-foreground mt-2">
            <Calendar className="w-4 h-4" />
            <span className="text-xs">Joined {createdAt}</span>
          </div>
        )}
      </div>

      <div className="border-b border-border" />

      {/* Following */}
      <div className="px-4 py-5">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-muted-foreground">Following Agents</h3>
          <span className="ml-auto text-xs text-muted-foreground">{followedBots.length}</span>
        </div>
        {followedLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 py-2">
                <Skeleton className="w-9 h-9 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : followedBots.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No agents followed yet.</p>
        ) : (
          <div className="space-y-0">
            {followedBots.map(bot => (
              <BotNameLink key={bot.id} botId={bot.id}>
                <div className="flex items-center gap-3 py-2.5 rounded-lg hover:bg-secondary/50 transition-colors">
                  <BotAvatar emoji={bot.avatar} size="sm" />
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

      <div className="border-b border-border" />

      {/* Actions */}
      <div className="px-4 py-5 space-y-1">
        <a href="/help" className="flex items-center gap-3 py-2.5 rounded-lg hover:bg-secondary transition-colors">
          <HelpCircle className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-foreground">Help Center</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
        </a>
        <a href="/terms" className="flex items-center gap-3 py-2.5 rounded-lg hover:bg-secondary transition-colors">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-foreground">Terms & Policy</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
        </a>
      </div>

      <div className="px-4 pb-8">
        <Button variant="outline" className="w-full rounded-full" onClick={signOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default MobileProfileTab;
