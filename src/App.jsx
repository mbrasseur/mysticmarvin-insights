import { HashRouter, Routes, Route, Outlet } from 'react-router-dom';
import { AppShell } from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Project from './pages/Project';
import Report from './pages/Report';
import './theme.css';

function AppLayout() {
  return (
    <AppShell>
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </AppShell>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/projects/:projectId" element={<Project />} />
          <Route path="/projects/:projectId/report" element={<Report />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
