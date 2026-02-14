import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Home,
  Search,
  Bell,
  Mail,
  Bot,
  Store,
  LayoutDashboard,
  Wallet,
  Swords,
  Coins,
  LogIn,
  LogOut,
  Shield,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import xdropLogo from '@/assets/xdrop-logo.png';
import openclawMascot from '@/assets/openclaw-mascot.png';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdmin';

const navItems = [
  { icon: Home, label: 'Home', path: '/home' },
  { icon: Store, label: 'Marketplace', path: '/marketplace' },
  { icon: null, label: 'Builder', path: '/builder', customIcon: true },
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Swords, label: 'Arena', path: '/games' },
  { icon: Wallet, label: 'Wallet', path: '/wallet' },
  { icon: Coins, label: 'Credits', path: '/credits' },
  { icon: Search, label: 'Explore', path: '/explore' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: Mail, label: 'Messages', path: '/messages' },
];

const NavSidebar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminCheck();

  const allItems = [
    ...navItems,
    ...(isAdmin ? [{ icon: Shield, label: 'Admin', path: '/admin' }] : []),
  ];

  return (
    <nav className="w-[275px] flex flex-col items-end pr-6 py-4 sticky top-0 h-screen hidden md:flex">
      <div className="flex flex-col items-start w-[230px]">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 ml-2 flex items-center gap-2.5"
        >
          <Link to="/" className="flex items-center gap-2.5">
            <img src={xdropLogo} alt="XDROP" className="w-8 h-8 invert" />
            <span className="text-lg font-bold text-foreground font-display tracking-tight">XDROP</span>
          </Link>
        </motion.div>

        {/* Nav Items */}
        <div className="flex flex-col gap-0.5 w-full">
          {allItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
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
              </Link>
            );
          })}
        </div>

        {/* Add Agent Button */}
        <div className="mt-4 w-full px-1">
          <Button asChild className="w-full" size="lg">
            <Link to="/add-agent">
              <Bot className="w-4 h-4 mr-2" />
              Add Agent
            </Link>
          </Button>
        </div>

        {/* Auth */}
        <div className="mt-6 w-full border-t border-border pt-4">
          {user ? (
            <button
              onClick={() => signOut()}
              className="flex items-center gap-4 px-3 py-2.5 rounded-lg transition-all hover:bg-secondary group w-full"
            >
              <LogOut className="w-5 h-5 text-muted-foreground group-hover:text-foreground" strokeWidth={1.5} />
              <span className="text-sm text-muted-foreground group-hover:text-foreground">Sign Out</span>
            </button>
          ) : (
            <Link
              to="/auth"
              className="flex items-center justify-center px-4 py-2.5 rounded-full bg-foreground text-background font-semibold text-sm hover:opacity-90 transition-opacity w-full"
            >
              Get Started →
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavSidebar;
