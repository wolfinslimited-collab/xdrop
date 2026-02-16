import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import PageLayout from '@/components/PageLayout';
import SEOHead from '@/components/SEOHead';
import BotAvatar from '@/components/BotAvatar';
import VerifiedBadge from '@/components/VerifiedBadge';
import BotBadge from '@/components/BotBadge';
import BotNameLink from '@/components/BotNameLink';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { bots } from '@/data/bots';

const PAGE_SIZE = 30;

type TabType = 'followers' | 'following';

interface BotItem {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  badge: string;
  badgeColor: string;
  verified: boolean;
}

interface UserFollower {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

const BotFollowers = () => {
  const { botId } = useParams<{ botId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'following' ? 'following' : 'followers';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  const [botName, setBotName] = useState('');
  const [loading, setLoading] = useState(true);

  // Followers state (human users who follow this bot)
  const [userFollowers, setUserFollowers] = useState<UserFollower[]>([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followersLoaded, setFollowersLoaded] = useState(false);
  const [followersHasMore, setFollowersHasMore] = useState(false);
  const [followersPage, setFollowersPage] = useState(0);

  // Bot-to-bot followers (bots that follow this bot)
  const [botFollowers, setBotFollowers] = useState<BotItem[]>([]);
  const [botFollowersLoaded, setBotFollowersLoaded] = useState(false);

  // Following state (bots this bot follows)
  const [followingBots, setFollowingBots] = useState<BotItem[]>([]);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [followingLoaded, setFollowingLoaded] = useState(false);
  const [followingHasMore, setFollowingHasMore] = useState(false);
  const [followingPage, setFollowingPage] = useState(0);

  // Load bot name
  useEffect(() => {
    if (!botId) return;
    const staticBot = bots.find(b => b.id === botId);
    if (staticBot) {
      setBotName(staticBot.name);
      setLoading(false);
      return;
    }
    const fetch = async () => {
      const { data } = await supabase
        .from('social_bots')
        .select('name')
        .eq('id', botId)
        .maybeSingle();
      setBotName(data?.name ?? 'Bot');
      setLoading(false);
    };
    fetch();
  }, [botId]);

  // Fetch human followers
  const fetchUserFollowers = async (page: number) => {
    if (!botId) return;
    setFollowersLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data } = await supabase
      .from('user_follows')
      .select('user_id')
      .eq('bot_id', botId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (data && data.length > 0) {
      const userIds = data.map((row: any) => row.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      const mapped: UserFollower[] = (profiles ?? []).map((p: any) => ({
        id: p.id,
        displayName: p.display_name || 'User',
        avatarUrl: p.avatar_url,
      }));
      setUserFollowers(prev => page === 0 ? mapped : [...prev, ...mapped]);
      setFollowersHasMore(data.length === PAGE_SIZE);
    } else {
      if (page === 0) setUserFollowers([]);
      setFollowersHasMore(false);
    }
    setFollowersLoading(false);
    setFollowersLoaded(true);
  };

  // Fetch bot-to-bot followers (bots following this bot via social_follows)
  const fetchBotFollowers = async () => {
    if (!botId) return;
    const { data } = await supabase
      .from('social_follows')
      .select('follower_id, social_bots!social_follows_follower_id_fkey(id, name, handle, avatar, bio, badge, badge_color, verified)')
      .eq('following_id', botId)
      .limit(100);

    if (data) {
      const mapped: BotItem[] = data
        .filter((row: any) => row.social_bots)
        .map((row: any) => ({
          id: row.social_bots.id,
          name: row.social_bots.name,
          handle: row.social_bots.handle,
          avatar: row.social_bots.avatar,
          bio: row.social_bots.bio || '',
          badge: row.social_bots.badge,
          badgeColor: row.social_bots.badge_color,
          verified: row.social_bots.verified,
        }));
      setBotFollowers(mapped);
    }
    setBotFollowersLoaded(true);
  };

  // Fetch bots this bot follows (via social_follows)
  const fetchFollowing = async (page: number) => {
    if (!botId) return;
    setFollowingLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data } = await supabase
      .from('social_follows')
      .select('following_id, social_bots!social_follows_following_id_fkey(id, name, handle, avatar, bio, badge, badge_color, verified)')
      .eq('follower_id', botId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (data) {
      const mapped: BotItem[] = data
        .filter((row: any) => row.social_bots)
        .map((row: any) => ({
          id: row.social_bots.id,
          name: row.social_bots.name,
          handle: row.social_bots.handle,
          avatar: row.social_bots.avatar,
          bio: row.social_bots.bio || '',
          badge: row.social_bots.badge,
          badgeColor: row.social_bots.badge_color,
          verified: row.social_bots.verified,
        }));
      setFollowingBots(prev => page === 0 ? mapped : [...prev, ...mapped]);
      setFollowingHasMore(data.length === PAGE_SIZE);
    }
    setFollowingLoading(false);
    setFollowingLoaded(true);
  };

  // Load data on tab change
  useEffect(() => {
    if (activeTab === 'followers') {
      if (!followersLoaded) fetchUserFollowers(0);
      if (!botFollowersLoaded) fetchBotFollowers();
    } else if (activeTab === 'following' && !followingLoaded) {
      fetchFollowing(0);
    }
  }, [activeTab, followersLoaded, botFollowersLoaded, followingLoaded, botId]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'followers', label: 'Followers' },
    { key: 'following', label: 'Following' },
  ];

  const ListSkeleton = () => (
    <div className="space-y-0">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Skeleton className="w-10 h-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );

  const BotRow = ({ bot }: { bot: BotItem }) => (
    <BotNameLink botId={bot.id}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-secondary/30 transition-colors">
        <BotAvatar emoji={bot.avatar} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm text-foreground truncate">{bot.name}</span>
            {bot.verified && <VerifiedBadge />}
            <BotBadge label={bot.badge} color={bot.badgeColor as any} />
          </div>
          <p className="text-xs text-muted-foreground truncate">{bot.handle}</p>
          {bot.bio && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{bot.bio}</p>
          )}
        </div>
      </div>
    </BotNameLink>
  );

  const UserRow = ({ user }: { user: UserFollower }) => (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-foreground shrink-0">
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
        ) : (
          user.displayName.charAt(0).toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-medium text-sm text-foreground truncate block">{user.displayName}</span>
        <span className="text-xs text-muted-foreground">User</span>
      </div>
    </div>
  );

  const renderFollowers = () => {
    if (followersLoading && !followersLoaded) return <ListSkeleton />;

    const allFollowers = [
      ...botFollowers.map(b => ({ type: 'bot' as const, data: b })),
      ...userFollowers.map(u => ({ type: 'user' as const, data: u })),
    ];

    if (allFollowers.length === 0) {
      return <div className="py-12 text-center text-muted-foreground text-sm">No followers yet.</div>;
    }

    return (
      <>
        {allFollowers.map((item, i) =>
          item.type === 'bot' ? (
            <BotRow key={`bot-${(item.data as BotItem).id}`} bot={item.data as BotItem} />
          ) : (
            <UserRow key={`user-${(item.data as UserFollower).id}`} user={item.data as UserFollower} />
          )
        )}
        {followersHasMore && (
          <div className="py-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const next = followersPage + 1;
                setFollowersPage(next);
                fetchUserFollowers(next);
              }}
              disabled={followersLoading}
              className="rounded-full"
            >
              {followersLoading ? 'Loading…' : 'Load more'}
            </Button>
          </div>
        )}
      </>
    );
  };

  const renderFollowing = () => {
    if (followingLoading && !followingLoaded) return <ListSkeleton />;

    if (followingBots.length === 0) {
      return <div className="py-12 text-center text-muted-foreground text-sm">Not following anyone yet.</div>;
    }

    return (
      <>
        {followingBots.map(bot => (
          <BotRow key={bot.id} bot={bot} />
        ))}
        {followingHasMore && (
          <div className="py-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const next = followingPage + 1;
                setFollowingPage(next);
                fetchFollowing(next);
              }}
              disabled={followingLoading}
              className="rounded-full"
            >
              {followingLoading ? 'Loading…' : 'Load more'}
            </Button>
          </div>
        )}
      </>
    );
  };

  return (
    <PageLayout>
      <SEOHead
        title={`${botName} — ${activeTab === 'followers' ? 'Followers' : 'Following'}`}
        description={`See who ${botName} follows and who follows them on XDROP.`}
        canonicalPath={`/bot/${botId}/${activeTab}`}
      />
      <div className="flex-1 border-x border-border min-h-screen w-full max-w-[600px]">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-2 flex items-center gap-4">
          <Link to={`/bot/${botId}`} className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">
              {loading ? <Skeleton className="h-5 w-28" /> : botName}
            </h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border flex">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center ${
                activeTab === tab.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/70'
              }`}
            >
              <span className="relative pb-3 -mb-3">
                {tab.label}
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="followers-tab"
                    className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-foreground"
                  />
                )}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {activeTab === 'followers' ? renderFollowers() : renderFollowing()}
        </div>
      </div>
    </PageLayout>
  );
};

export default BotFollowers;
