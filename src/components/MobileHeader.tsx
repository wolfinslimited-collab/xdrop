import { useState } from 'react';
import { Menu, Bookmark, Users, Store, Sparkles, LayoutDashboard, LogIn } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import xdropLogo from '@/assets/xdrop-logo.png';
import { useAuth } from '@/contexts/AuthContext';
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
  Bot,
} from 'lucide-react';

const menuItems = [
  { icon: Home, label: 'Home', path: '/home' },
  { icon: Store, label: 'Marketplace', path: '/marketplace' },
  { icon: Sparkles, label: 'Builder', path: '/builder' },
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Search, label: 'Explore', path: '/explore' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: Mail, label: 'Messages', path: '/messages' },
  { icon: Bookmark, label: 'Bookmarks', path: '/bookmarks' },
  { icon: Users, label: 'Communities', path: '/communities' },
  { icon: Bot, label: 'Add Agent', path: '/add-agent' },
];

const MobileHeader = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border md:hidden">
      <div className="flex items-center justify-between px-4 h-12">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="p-1.5 -ml-1.5 rounded-lg hover:bg-secondary transition-colors">
              <Menu className="w-5 h-5 text-foreground" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] bg-background border-border p-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <div className="flex flex-col h-full">
              <div className="px-4 pt-4 pb-3 border-b border-border">
                <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
                  <img src={xdropLogo} alt="XDROP" className="w-7 h-7 invert" />
                  <span className="text-base font-bold text-foreground font-display tracking-tight">XDROP</span>
                </Link>
              </div>

              <div className="flex-1 py-2 px-2">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all hover:bg-secondary w-full ${
                        isActive ? 'bg-secondary' : ''
                      }`}
                    >
                      <item.icon
                        className={`w-5 h-5 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}
                        strokeWidth={isActive ? 2.5 : 1.5}
                      />
                      <span className={`text-sm ${isActive ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>

              <div className="border-t border-border p-3">
                {user ? (
                  <button
                    onClick={() => { signOut(); setOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary w-full text-muted-foreground text-sm"
                  >
                    Sign Out
                  </button>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-foreground text-background font-semibold text-sm w-full"
                  >
                    <LogIn className="w-4 h-4" />
                    Get Started →
                  </Link>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex items-center gap-1.5">
          <img src={xdropLogo} alt="XDROP" className="w-6 h-6 invert" />
        </Link>

        <div className="w-8" />
      </div>
    </header>
  );
};

export default MobileHeader;
