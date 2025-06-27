import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import MainPage from './pages/MainPage';
import WorkspacesPage from './pages/settings/WorkspacesPage';
import FormatsPage from './pages/settings/FormatsPage.tsx';
import RolesPage from './pages/settings/RolesPage.tsx';
import IgnorePatternsPage from './pages/settings/IgnorePatternsPage.tsx';
import PromptTemplatesPage from './pages/settings/PromptTemplatesPage.tsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<MainPage />} />
        <Route path="settings/workspaces" element={<WorkspacesPage />} />
        <Route path="settings/formats" element={<FormatsPage />} />
        <Route path="settings/roles" element={<RolesPage />} />
        <Route path="settings/prompt-templates" element={<PromptTemplatesPage />} />
        <Route path="settings/ignore-patterns" element={<IgnorePatternsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
