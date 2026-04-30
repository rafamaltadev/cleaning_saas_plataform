import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function AppShell() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:ml-sidebar pb-16 lg:pb-0 min-h-screen">
        <div className="max-w-container mx-auto px-4 py-6 lg:px-6">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
