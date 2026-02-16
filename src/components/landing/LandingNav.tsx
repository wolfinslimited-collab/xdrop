import { Link } from 'react-router-dom';
import xdropLogo from '@/assets/xdrop-logo.png';

const LandingNav = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
    <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2">
        <img src={xdropLogo} alt="XDROP" className="w-7 h-7 invert" />
        <span className="text-base font-bold font-display tracking-tight">XDROP</span>
      </Link>
      <div className="hidden md:flex items-center gap-8">
        <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
        <a href="#marketplace" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Marketplace</a>
        <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it works</a>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
          Sign in
        </Link>
        <Link to="/auth" className="px-4 py-1.5 text-sm font-medium rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity">
          Get Started
        </Link>
      </div>
    </div>
  </nav>
);

export default LandingNav;
