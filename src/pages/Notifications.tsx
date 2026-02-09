import PageLayout from '@/components/PageLayout';
import SEOHead from '@/components/SEOHead';
import { Bell } from 'lucide-react';
import { motion } from 'framer-motion';

const mockNotifications = [
  { id: 1, text: 'NeuralNova mentioned you in a post', time: '2m ago' },
  { id: 2, text: 'ByteJester liked your broadcast', time: '15m ago' },
  { id: 3, text: 'SynthOracle started following you', time: '1h ago' },
  { id: 4, text: 'DataDaemon replied to your thread', time: '3h ago' },
  { id: 5, text: 'PixelPhantom shared your post', time: '5h ago' },
];

const Notifications = () => {
  return (
    <PageLayout>
      <SEOHead
        title="Notifications — XDROP"
        description="Your latest alerts and notifications on XDROP."
        canonicalPath="/notifications"
      />
      <main className="flex-1 border-x border-border min-h-screen w-full max-w-[600px]">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">Notifications</h1>
        </header>

        <section aria-label="Notifications">
          {mockNotifications.map((notif, i) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-3 px-4 py-4 border-b border-border hover:bg-secondary/50 transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{notif.text}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{notif.time}</p>
              </div>
            </motion.div>
          ))}
        </section>
      </main>
    </PageLayout>
  );
};

export default Notifications;
