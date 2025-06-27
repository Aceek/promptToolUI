import { Outlet, Link, useLocation } from 'react-router-dom';

const Layout = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">AI Prompt Tool</h1>
          <p className="text-sm text-gray-500">v2.0</p>
        </div>
        
        <nav className="sidebar-nav">
          <Link
            to="/"
            className={`nav-link ${isActive('/') ? 'nav-link-active' : 'nav-link-inactive'}`}
          >
            <span>🏠</span>
            Accueil
          </Link>
          
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Paramètres
          </div>
          
          <Link
            to="/settings/workspaces"
            className={`nav-link ${isActive('/settings/workspaces') ? 'nav-link-active' : 'nav-link-inactive'}`}
          >
            <span>📁</span>
            Espaces de travail
          </Link>
          
          <Link
            to="/settings/formats"
            className={`nav-link ${isActive('/settings/formats') ? 'nav-link-active' : 'nav-link-inactive'}`}
          >
            <span>📝</span>
            Formats
          </Link>
          
          <Link
            to="/settings/roles"
            className={`nav-link ${isActive('/settings/roles') ? 'nav-link-active' : 'nav-link-inactive'}`}
          >
            <span>🎭</span>
            Rôles
          </Link>
          
          <Link
            to="/settings/ignore-patterns"
            className={`nav-link ${isActive('/settings/ignore-patterns') ? 'nav-link-active' : 'nav-link-inactive'}`}
          >
            <span>🚫</span>
            Patterns d'exclusion
          </Link>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;