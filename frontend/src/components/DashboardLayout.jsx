import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardLayout({ children, title, subtitle }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar title={title} subtitle={subtitle} />
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
