import { Home, Compass, ShoppingBag } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import openclawMascot from '@/assets/openclaw-mascot.png';
import { Capacitor } from '@capacitor/core';

const navItems = [
  { icon: Home, label: 'Home', path: '/home' },
  { icon: ShoppingBag, label: 'Market', path: '/marketplace' },
  { icon: null, label: 'Builder', path: '/builder', customIcon: true },
  { icon: Compass, label: 'Explore', path: '/explore' },
];

const MobileBottomNav = () => {
  const location = useLocation();
  const isAndroid = Capacitor.getPlatform() === 'android';

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border md:hidden ${isAndroid ? 'safe-area-bottom-android pb-2' : ''}`}>
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all group"
            >
              {item.customIcon ? (
                <img src={openclawMascot} alt="" className={`w-5 h-5 ${isActive ? 'opacity-100' : 'opacity-50 group-hover:opacity-80'}`} />
              ) : item.icon ? (
                <item.icon
                  className={`w-5 h-5 ${
                    isActive ? 'text-foreground' : 'text-foreground/50 group-hover:text-foreground/80'
                  }`}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
              ) : null}
              <span
                className={`text-[10px] ${
                  isActive
                    ? 'text-foreground font-extrabold'
                    : 'text-foreground/50 font-semibold group-hover:text-foreground/80'
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
