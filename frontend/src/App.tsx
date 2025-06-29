import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import MainPage from './pages/MainPage';
import WorkspacesPage from './pages/settings/WorkspacesPage';
import BlocksPage from './pages/settings/BlocksPage';
import CompositionsPage from './pages/settings/CompositionsPage';
import IgnorePatternsPage from './pages/settings/IgnorePatternsPage';

function App() {
  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<MainPage />} />
          <Route path="settings/workspaces" element={<WorkspacesPage />} />
          <Route path="settings/blocks" element={<BlocksPage />} />
          <Route path="settings/compositions" element={<CompositionsPage />} />
          <Route path="settings/ignore-patterns" element={<IgnorePatternsPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
