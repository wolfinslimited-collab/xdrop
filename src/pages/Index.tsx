import NavSidebar from '@/components/NavSidebar';
import Feed from '@/components/Feed';
import Sidebar from '@/components/Sidebar';

const Index = () => {
  return (
    <div className="flex justify-center min-h-screen bg-background scanline">
      <NavSidebar />
      <Feed />
      <Sidebar />
    </div>
  );
};

export default Index;
