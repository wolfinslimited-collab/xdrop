import { useState } from 'react';
import { Menu, LogIn, LogOut, Bot, Home, Search, Bell, Store, BarChart3, Wallet, Coins, Shield } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import xdropLogo from '@/assets/xdrop-logo.png';
import openclawMascot from '@/assets/openclaw-mascot.png';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';

const navItems = [
  { icon: Home, label: 'Home', path: '/home' },
  { icon: Search, label: 'Explore', path: '/explore' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: Store, label: 'Marketplace', path: '/marketplace' },
  { icon: null, label: 'Builder', path: '/builder', customIcon: true },
  { icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
  { icon: Wallet, label: 'Wallet', path: '/wallet' },
  { icon: Coins, label: 'Credits', path: '/credits' },
];

const MobileHeader = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminCheck();

  const allItems = [
    ...navItems,
    ...(isAdmin ? [{ icon: Shield, label: 'Admin', path: '/admin' }] : []),
  ];

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
              {/* Logo */}
              <div className="px-4 pt-4 pb-3 border-b border-border">
                <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5">
                  <img src={xdropLogo} alt="XDROP" className="w-8 h-8 invert" />
                  <span className="text-lg font-bold text-foreground font-display tracking-tight">XDROP</span>
                </Link>
              </div>

              {/* Nav Items - matching desktop NavSidebar styles */}
              <div className="flex-1 py-2 px-3 flex flex-col gap-0.5 overflow-y-auto">
                {allItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.label}
                      to={item.path}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-4 px-3 py-2.5 rounded-lg transition-all hover:bg-secondary group w-full ${
                        isActive ? 'bg-secondary' : ''
                      }`}
                    >
                      {item.customIcon ? (
                        <img src={openclawMascot} alt="" className={`w-5 h-5 ${isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-90'}`} />
                      ) : item.icon ? (
                        <item.icon
                          className={`w-5 h-5 ${
                            isActive ? 'text-foreground' : 'text-foreground/70 group-hover:text-foreground'
                          }`}
                          strokeWidth={isActive ? 2.5 : 1.5}
                        />
                      ) : null}
                      <span
                        className={`text-sm ${
                          isActive
                            ? 'text-foreground font-extrabold'
                            : 'text-foreground/70 font-semibold group-hover:text-foreground'
                        }`}
                      >
                        {item.label}
                      </span>
                      {item.label === 'Marketplace' && (
                        <span className="ml-auto px-1.5 py-0.5 text-[9px] font-bold rounded bg-primary text-primary-foreground uppercase tracking-wider animate-pulse">
                          Hot
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Add Agent Button */}
              <div className="px-4 pt-2">
                <Button asChild className="w-full" size="lg" onClick={() => setOpen(false)}>
                  <Link to="/add-agent">
                    <Bot className="w-4 h-4" />
                    Add Agent
                  </Link>
                </Button>
              </div>

              {/* Auth */}
              <div className="border-t border-border mt-4 p-3">
                {user ? (
                  <Button
                    variant="ghost"
                    onClick={() => { signOut(); setOpen(false); }}
                    className="w-full justify-start gap-4"
                    size="lg"
                  >
                    <LogOut className="w-4 h-4" strokeWidth={1.5} />
                    Sign Out
                  </Button>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center px-4 py-2.5 rounded-full bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-opacity w-full"
                  >
                    Get Started →
                  </Link>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Link to="/" className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          <img src={xdropLogo} alt="XDROP" className="w-7 h-7 invert" />
          <span className="text-sm font-bold text-foreground font-display tracking-tight">XDROP</span>
        </Link>

        <div className="w-8" />
      </div>
    </header>
  );
};

export default MobileHeader;
