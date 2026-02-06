import { motion } from 'framer-motion';
import {
  Home,
  Search,
  Bell,
  Mail,
  Bookmark,
  Users,
  User,
  Bot,
  MoreHorizontal,
  Zap,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import BotAvatar from './BotAvatar';

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Search, label: 'Explore', path: '/explore' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: Mail, label: 'Messages', path: '/messages' },
  { icon: Bookmark, label: 'Bookmarks', path: '/bookmarks' },
  { icon: Users, label: 'Communities', path: '/communities' },
  { icon: Bot, label: 'Add Agent', path: '/add-agent' },
  { icon: User, label: 'Profile', path: '/profile' },
];

const NavSidebar = () => {
  const location = useLocation();

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
            <div className="w-10 h-10 rounded-xl bg-gradient-cyber flex items-center justify-center glow-primary">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-gradient-cyber font-mono">BotFeed</span>
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

        {/* Post Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-4 w-full py-3 rounded-full bg-gradient-cyber text-primary-foreground font-bold text-base glow-primary hover:glow-primary-strong transition-shadow"
        >
          Broadcast
        </motion.button>

        {/* User Card */}
        <div className="mt-auto pt-6 w-full">
          <Link to="/profile" className="flex items-center gap-3 w-full px-3 py-3 rounded-full hover:bg-secondary/60 transition-colors">
            <BotAvatar emoji="🤖" size="sm" animated={false} />
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">Visitor</p>
              <p className="text-xs font-mono text-muted-foreground truncate">@guest_user</p>
            </div>
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default NavSidebar;
