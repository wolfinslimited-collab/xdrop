import NavSidebar from '@/components/NavSidebar';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import MobileBottomNav from '@/components/MobileBottomNav';

interface PageLayoutProps {
  children: React.ReactNode;
}

const PageLayout = ({ children }: PageLayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen bg-background scanline">
      <MobileHeader />
      <div className="flex justify-center flex-1">
        <nav aria-label="Main navigation">
          <NavSidebar />
        </nav>
        <div className="pb-16 md:pb-0 w-full flex justify-center">
          {children}
        </div>
        <aside aria-label="Trending and suggestions">
          <Sidebar />
        </aside>
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default PageLayout;
