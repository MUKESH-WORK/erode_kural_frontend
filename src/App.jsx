import React, { useEffect } from 'react';
import useAppStore from './stores/appStore';
import { fetchConfig } from './lib/api';
import Sidebar from './components/layout/Sidebar';
import TopBar from './components/layout/TopBar';
import MainContent from './components/layout/MainContent';
import SourceInspector from './components/layout/SourceInspector';

export default function App() {
  const { sidebarCollapsed, theme, setAppConfig } = useAppStore();

  useEffect(() => {
    // Synchronize theme class on html element
    document.documentElement.classList.toggle('dark', theme === 'dark');

    // Fetch zero-hardcoded dynamic backend configuration
    fetchConfig()
      .then((cfg) => setAppConfig(cfg))
      .catch((err) => console.warn('Could not fetch app config:', err));
  }, [theme, setAppConfig]);

  return (
    <div className="app-layout">
      {/* 280px / 72px Collapsible Sidebar */}
      <Sidebar />

      {/* Main App Canvas */}
      <div className={`main-area ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <TopBar />
        <main className="content-area">
          <MainContent />
        </main>
      </div>

      {/* 400px Slide-out Source & Grounding Inspector Panel */}
      <SourceInspector />
    </div>
  );
}
