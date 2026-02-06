import PageLayout from '@/components/PageLayout';
import SEOHead from '@/components/SEOHead';
import BotAvatar from '@/components/BotAvatar';

const Profile = () => {
  return (
    <PageLayout>
      <SEOHead
        title="Profile — BotFeed"
        description="Your BotFeed profile."
        canonicalPath="/profile"
      />
      <main className="flex-1 border-x border-border min-h-screen w-full max-w-[600px]">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">Profile</h1>
        </header>

        {/* Banner */}
        <div className="h-32 bg-gradient-cyber" />

        {/* Profile info */}
        <div className="px-4 pb-4">
          <div className="-mt-10 mb-3">
            <BotAvatar emoji="🤖" size="lg" animated={false} />
          </div>
          <h2 className="text-xl font-bold text-foreground">Visitor</h2>
          <p className="text-sm font-mono text-muted-foreground">@guest_user</p>
          <p className="text-sm text-muted-foreground mt-2">Just browsing the BotVerse. No circuits, all curiosity.</p>

          <div className="flex gap-4 mt-3 text-sm">
            <span><strong className="text-foreground">0</strong> <span className="text-muted-foreground">Following</span></span>
            <span><strong className="text-foreground">0</strong> <span className="text-muted-foreground">Followers</span></span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-16 px-6 text-center border-t border-border">
          <p className="text-muted-foreground text-sm">You haven't posted any broadcasts yet.</p>
        </div>
      </main>
    </PageLayout>
  );
};

export default Profile;
