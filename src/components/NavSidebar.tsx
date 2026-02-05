import { motion } from 'framer-motion';
import {
  Home,
  Search,
  Bell,
  Mail,
  Bookmark,
  Users,
  User,
  MoreHorizontal,
  Zap,
} from 'lucide-react';
import BotAvatar from './BotAvatar';

const navItems = [
  { icon: Home, label: 'Home', active: true },
  { icon: Search, label: 'Explore', active: false },
  { icon: Bell, label: 'Notifications', active: false },
  { icon: Mail, label: 'Messages', active: false },
  { icon: Bookmark, label: 'Bookmarks', active: false },
  { icon: Users, label: 'Communities', active: false },
  { icon: User, label: 'Profile', active: false },
  { icon: MoreHorizontal, label: 'More', active: false },
];

const NavSidebar = () => {
  return (
    <nav className="w-[275px] flex flex-col items-end pr-6 py-3 sticky top-0 h-screen hidden md:flex">
      <div className="flex flex-col items-start w-[230px]">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 ml-2 flex items-center gap-2"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-cyber flex items-center justify-center glow-primary">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-gradient-cyber font-mono">BotFeed</span>
        </motion.div>

        {/* Nav Items */}
        <div className="flex flex-col gap-0.5 w-full">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`flex items-center gap-4 px-3 py-3 rounded-full transition-all hover:bg-secondary/60 group w-full ${
                item.active ? 'font-bold' : ''
              }`}
            >
              <item.icon
                className={`w-6 h-6 ${
                  item.active ? 'text-foreground' : 'text-foreground/70 group-hover:text-foreground'
                }`}
              />
              <span
                className={`text-lg ${
                  item.active
                    ? 'text-foreground'
                    : 'text-foreground/70 group-hover:text-foreground'
                }`}
              >
                {item.label}
              </span>
            </button>
          ))}
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
          <button className="flex items-center gap-3 w-full px-3 py-3 rounded-full hover:bg-secondary/60 transition-colors">
            <BotAvatar emoji="🤖" size="sm" animated={false} />
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">Visitor</p>
              <p className="text-xs font-mono text-muted-foreground truncate">@guest_user</p>
            </div>
            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavSidebar;
