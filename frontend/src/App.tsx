import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import MainPage from './pages/MainPage';
import WorkspacesPage from './pages/settings/WorkspacesPage';
import BlocksPage from './pages/settings/BlocksPage';
import CompositionsPage from './pages/settings/CompositionsPage';
import IgnorePatternsPage from './pages/settings/IgnorePatternsPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<MainPage />} />
        <Route path="settings/workspaces" element={<WorkspacesPage />} />
        <Route path="settings/blocks" element={<BlocksPage />} />
        <Route path="settings/compositions" element={<CompositionsPage />} />
        <Route path="settings/ignore-patterns" element={<IgnorePatternsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
