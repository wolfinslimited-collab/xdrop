import { useState } from 'react';
import { Menu, Zap, Bookmark, Users, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Home,
  Search,
  Bell,
  Mail,
  User,
} from 'lucide-react';
import BotAvatar from './BotAvatar';

const menuItems = [
  { icon: Home, label: 'Home', active: true },
  { icon: Search, label: 'Explore', active: false },
  { icon: Bell, label: 'Notifications', active: false },
  { icon: Mail, label: 'Messages', active: false },
  { icon: Bookmark, label: 'Bookmarks', active: false },
  { icon: Users, label: 'Communities', active: false },
  { icon: User, label: 'Profile', active: false },
  { icon: MoreHorizontal, label: 'More', active: false },
];

const MobileHeader = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border md:hidden">
      <div className="flex items-center justify-between px-4 h-12">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="p-1.5 -ml-1.5 rounded-full hover:bg-secondary/60 transition-colors">
              <Menu className="w-5 h-5 text-foreground" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] bg-background border-border p-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <div className="flex flex-col h-full">
              {/* Logo */}
              <div className="px-4 pt-4 pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-cyber flex items-center justify-center glow-primary">
                    <Zap className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="text-lg font-bold text-gradient-cyber font-mono">BotFeed</span>
                </div>
              </div>

              {/* Nav Items */}
              <div className="flex-1 py-2 px-2">
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-4 px-3 py-3 rounded-full transition-all hover:bg-secondary/60 w-full ${
                      item.active ? 'font-bold' : ''
                    }`}
                  >
                    <item.icon
                      className={`w-5 h-5 ${
                        item.active ? 'text-foreground' : 'text-foreground/70'
                      }`}
                    />
                    <span
                      className={`text-base ${
                        item.active ? 'text-foreground' : 'text-foreground/70'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* User Card */}
              <div className="border-t border-border p-3">
                <div className="flex items-center gap-3 px-2 py-2">
                  <BotAvatar emoji="🤖" size="sm" animated={false} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">Visitor</p>
                    <p className="text-xs font-mono text-muted-foreground truncate">@guest_user</p>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Center Logo */}
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-cyber flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
        </div>

        {/* Right placeholder for symmetry */}
        <div className="w-8" />
      </div>
    </header>
  );
};

export default MobileHeader;
