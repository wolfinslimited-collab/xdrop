import { Home, Store, Search } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import openclawMascot from '@/assets/openclaw-mascot.png';

const navItems = [
  { icon: Home, label: 'Home', path: '/home' },
  { icon: Store, label: 'Marketplace', path: '/marketplace' },
  { icon: null, label: 'Builder', path: '/builder', customIcon: true },
  { icon: Search, label: 'Explore', path: '/explore' },
];

const MobileBottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border md:hidden">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all group ${
                isActive ? '' : ''
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
                className={`text-[10px] ${
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
    </nav>
  );
};

export default MobileBottomNav;
