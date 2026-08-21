import React from 'react';
import { useTranslation } from 'react-i18next';
import useAppStore from '../../stores/appStore';
import TnEmblem from '../icons/TnEmblem';
import { cn } from '../../lib/utils';
import {
  MessageSquare,
  FileText,
  BarChart3,
  Stamp,
  Inbox,
  Settings,
  ClipboardList,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const NAV_MODULES = [
  { id: 'general', icon: MessageSquare },
  { id: 'data', icon: BarChart3 },
  { id: 'content', icon: Stamp },
  { id: 'bulk', icon: Inbox },
];

const NAV_BOTTOM = [
  { id: 'audit', icon: ClipboardList },
  { id: 'settings', icon: Settings },
];

export default function Sidebar() {
  const { t } = useTranslation();
  const {
    currentModule,
    setCurrentModule,
    sidebarCollapsed,
    toggleSidebar,
  } = useAppStore();

  return (
    <aside className={cn('sidebar', sidebarCollapsed && 'collapsed')}>
      {/* Header with emblem - Aligned with TopBar height */}
      <div
        style={{
          height: 'var(--spacing-topbar)',
          padding: sidebarCollapsed ? '0 12px' : '0 16px',
          borderBottom: '2px solid var(--color-surface-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxSizing: 'border-box',
          flexShrink: 0,
        }}
      >
        <TnEmblem size={sidebarCollapsed ? 28 : 32} className="text-[#c8a951] flex-shrink-0" />
        {!sidebarCollapsed && (
          <div style={{ overflow: 'hidden', minWidth: 0 }}>
            <div
              className="tamil-text"
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#FFFFFF',
                whiteSpace: 'normal',
                lineHeight: 1.25,
              }}
            >
              {t('app_title')}
            </div>
          </div>
        )}
      </div>

      {/* Module Navigation */}
      <nav style={{ flex: 1, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_MODULES.map((mod) => {
          const Icon = mod.icon;
          const isActive = currentModule === mod.id;
          return (
            <button
              key={mod.id}
              className={cn('nav-item', isActive && 'active')}
              onClick={() => setCurrentModule(mod.id)}
              title={t(`sidebar.${mod.id}`)}
            >
              <Icon size={20} style={{ flexShrink: 0 }} />
              {!sidebarCollapsed && (
                <span className="nav-label tamil-text">{t(`sidebar.${mod.id}`)}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: 8,
          paddingBottom: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {NAV_BOTTOM.map((mod) => {
          const Icon = mod.icon;
          const isActive = currentModule === mod.id;
          return (
            <button
              key={mod.id}
              className={cn('nav-item', isActive && 'active')}
              onClick={() => setCurrentModule(mod.id)}
              title={t(`sidebar.${mod.id}`)}
            >
              <Icon size={20} style={{ flexShrink: 0 }} />
              {!sidebarCollapsed && (
                <span className="nav-label tamil-text">{t(`sidebar.${mod.id}`)}</span>
              )}
            </button>
          );
        })}

        {/* Collapse toggle */}
        <button
          className="nav-item"
          onClick={toggleSidebar}
          title={sidebarCollapsed ? 'Expand' : 'Collapse'}
          style={{ marginTop: 4 }}
        >
          {sidebarCollapsed ? (
            <ChevronRight size={20} style={{ flexShrink: 0 }} />
          ) : (
            <ChevronLeft size={20} style={{ flexShrink: 0 }} />
          )}
          {!sidebarCollapsed && <span className="nav-label">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
