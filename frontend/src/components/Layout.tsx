import { Outlet, Link, useLocation } from 'react-router-dom';

const Layout = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    // Exact match for all routes
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">AI Prompt Tool</h1>
          <p className="text-sm text-gray-500">v2.0</p>
        </div>
        
        <nav className="sidebar-nav">
          <Link
            to="/"
            className={`sidebar-nav-item ${isActive('/') ? 'active' : ''}`}
          >
            <span>🏠</span>
            <span>Accueil</span>
          </Link>
          
          <div className="px-3 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Paramètres
          </div>
          
          <Link
            to="/settings/workspaces"
            className={`sidebar-nav-item ${isActive('/settings/workspaces') ? 'active' : ''}`}
          >
            <span>📁</span>
            <span>Espaces de travail</span>
          </Link>
          
          <Link
            to="/settings/formats"
            className={`sidebar-nav-item ${isActive('/settings/formats') ? 'active' : ''}`}
          >
            <span>📝</span>
            <span>Formats</span>
          </Link>
          
          <Link
            to="/settings/roles"
            className={`sidebar-nav-item ${isActive('/settings/roles') ? 'active' : ''}`}
          >
            <span>🎭</span>
            <span>Rôles</span>
          </Link>
          
          <Link
            to="/settings/prompt-templates"
            className={`sidebar-nav-item ${isActive('/settings/prompt-templates') ? 'active' : ''}`}
          >
            <span>📄</span>
            <span>Templates de Prompt</span>
          </Link>
          
          <Link
            to="/settings/ignore-patterns"
            className={`sidebar-nav-item ${isActive('/settings/ignore-patterns') ? 'active' : ''}`}
          >
            <span>🚫</span>
            <span>Patterns d'exclusion</span>
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
