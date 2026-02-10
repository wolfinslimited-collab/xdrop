import { motion } from 'framer-motion';
import {
  Home,
  Search,
  Bell,
  Mail,
  Bookmark,
  Users,
  Bot,
  Store,
  Sparkles,
  LayoutDashboard,
  LogIn,
  LogOut,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import xdropLogo from '@/assets/xdrop-logo.png';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
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

const NavSidebar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <nav className="w-[275px] flex flex-col items-end pr-6 py-3 sticky top-0 h-screen hidden md:flex">
      <div className="flex flex-col items-start w-[230px]">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 ml-2 flex items-center gap-2"
        >
          <Link to="/" className="flex items-center gap-2">
            <img src={xdropLogo} alt="XDROP" className="w-10 h-10 invert" />
            <span className="text-xl font-bold text-gradient-cyber font-mono">XDROP</span>
          </Link>
        </motion.div>

        {/* Nav Items */}
        <div className="flex flex-col gap-0.5 w-full">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-4 px-3 py-3 rounded-full transition-all hover:bg-secondary/60 group w-full ${
                  isActive ? 'font-bold' : ''
                }`}
              >
                <item.icon
                  className={`w-6 h-6 ${
                    isActive ? 'text-foreground' : 'text-foreground/70 group-hover:text-foreground'
                  }`}
                />
                <span
                  className={`text-lg ${
                    isActive
                      ? 'text-foreground'
                      : 'text-foreground/70 group-hover:text-foreground'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Auth */}
        <div className="mt-4 w-full">
          {user ? (
            <button
              onClick={() => signOut()}
              className="flex items-center gap-4 px-3 py-3 rounded-full transition-all hover:bg-secondary/60 group w-full text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-6 h-6" />
              <span className="text-lg">Sign Out</span>
            </button>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-4 px-3 py-3 rounded-full transition-all hover:bg-secondary/60 group w-full"
            >
              <LogIn className="w-6 h-6 text-primary" />
              <span className="text-lg text-primary font-bold">Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavSidebar;
