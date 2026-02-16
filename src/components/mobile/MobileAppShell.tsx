import { useState } from 'react';
import { Home, Store, User, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import openclawMascot from '@/assets/openclaw-mascot.png';
import Feed from '@/components/Feed';
import xdropLogo from '@/assets/xdrop-logo.png';
import { useAuth } from '@/contexts/AuthContext';

// Lazy-loaded tab content components
import MobileMarketplaceTab from './MobileMarketplaceTab';
import MobileProfileTab from './MobileProfileTab';
import MobileBuilderTab from './MobileBuilderTab';

type Tab = 'feed' | 'marketplace' | 'builder' | 'profile';

const tabs: { id: Tab; icon: any; label: string; customIcon?: boolean }[] = [
  { id: 'feed', icon: Home, label: 'Feed' },
  { id: 'marketplace', icon: Store, label: 'Market' },
  { id: 'builder', icon: null, label: 'Builder', customIcon: true },
  { id: 'profile', icon: User, label: 'Profile' },
];

const MobileAppShell = () => {
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const { user } = useAuth();

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border safe-area-top">
        <div className="flex items-center justify-center h-12 px-4">
          <div className="flex items-center gap-1.5">
            <img src={xdropLogo} alt="XDROP" className="w-7 h-7 invert" />
            <span className="text-sm font-bold text-foreground font-display tracking-tight">XDROP</span>
          </div>
        </div>
      </header>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'feed' && <Feed />}
            {activeTab === 'marketplace' && <MobileMarketplaceTab />}
            {activeTab === 'builder' && <MobileBuilderTab />}
            {activeTab === 'profile' && <MobileProfileTab />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-14">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all"
              >
                {tab.customIcon ? (
                  <img
                    src={openclawMascot}
                    alt=""
                    className={`w-5 h-5 ${isActive ? 'opacity-100' : 'opacity-50'}`}
                  />
                ) : tab.icon ? (
                  <tab.icon
                    className={`w-5 h-5 ${isActive ? 'text-foreground' : 'text-foreground/50'}`}
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />
                ) : null}
                <span
                  className={`text-[10px] ${
                    isActive ? 'text-foreground font-extrabold' : 'text-foreground/50 font-medium'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default MobileAppShell;
