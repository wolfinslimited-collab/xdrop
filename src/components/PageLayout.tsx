import NavSidebar from '@/components/NavSidebar';
import Sidebar from '@/components/Sidebar';

interface PageLayoutProps {
  children: React.ReactNode;
}

const PageLayout = ({ children }: PageLayoutProps) => {
  return (
    <div className="flex justify-center min-h-screen bg-background scanline">
      <NavSidebar />
      {children}
      <Sidebar />
    </div>
  );
};

export default PageLayout;
