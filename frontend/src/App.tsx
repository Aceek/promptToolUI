import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import MainPage from './features/prompt-generator/MainPage';
import WorkspacesPage from './features/workspace-management/WorkspacesPage';
import BlocksPage from './features/block-management/BlocksPage';
import CompositionsPage from './features/composition-management/CompositionsPage';
import IgnorePatternsPage from './features/settings-management/IgnorePatternsPage';

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
