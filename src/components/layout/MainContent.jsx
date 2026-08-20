import React from 'react';
import useAppStore from '../../stores/appStore';
import GeneralModule from '../modules/GeneralModule';
import DataModule from '../modules/DataModule';
import ContentModule from '../modules/ContentModule';
import BulkModule from '../modules/BulkModule';
import AuditModule from '../modules/AuditModule';
import SettingsModule from '../modules/SettingsModule';

export default function MainContent() {
  const { currentModule } = useAppStore();

  switch (currentModule) {
    case 'general':
      return <GeneralModule />;
    case 'data':
      return <DataModule />;
    case 'content':
      return <ContentModule />;
    case 'bulk':
      return <BulkModule />;
    case 'audit':
      return <AuditModule />;
    case 'settings':
      return <SettingsModule />;
    default:
      return <GeneralModule />;
  }
}
