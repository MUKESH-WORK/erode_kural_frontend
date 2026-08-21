import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useAppStore from '../../stores/appStore';
import { Sun, Moon, Bell, Globe, User } from 'lucide-react';

export default function TopBar() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme, officerId, setOfficerId } = useAppStore();
  const [showOfficerInput, setShowOfficerInput] = useState(false);

  const toggleLang = () => {
    const next = i18n.language === 'ta' ? 'en' : 'ta';
    i18n.changeLanguage(next);
  };

  return (
    <header className="topbar">
      {/* Module breadcrumb / title space */}
      <div style={{ flex: 1 }} />

      {/* Language Toggle */}
      <button
        className="btn btn-ghost btn-sm"
        onClick={toggleLang}
        title={t('topbar.theme_toggle')}
        style={{ gap: 4, fontSize: '0.88rem' }}
      >
        <Globe size={16} />
        <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
          {i18n.language === 'ta' ? 'EN' : 'தமிழ்'}
        </span>
      </button>

      {/* Theme Toggle */}
      <button
        className="btn btn-ghost btn-sm"
        onClick={toggleTheme}
        title={t('topbar.theme_toggle')}
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      {/* Notifications */}
      <button className="btn btn-ghost btn-sm" title={t('topbar.notifications')}>
        <Bell size={16} />
      </button>

      {/* Officer ID */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 14px',
          background: 'var(--color-surface-hover)',
          borderRadius: 8,
          cursor: 'pointer',
        }}
        onClick={() => setShowOfficerInput(!showOfficerInput)}
      >
        <User size={16} style={{ color: 'var(--color-text-secondary)' }} />
        {showOfficerInput ? (
          <input
            autoFocus
            value={officerId}
            onChange={(e) => setOfficerId(e.target.value)}
            onBlur={() => setShowOfficerInput(false)}
            onKeyDown={(e) => e.key === 'Enter' && setShowOfficerInput(false)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              width: 90,
              fontSize: '1rem',
              color: 'var(--color-text-primary)',
              fontWeight: 600,
            }}
          />
        ) : (
          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {officerId}
          </span>
        )}
      </div>
    </header>
  );
}
