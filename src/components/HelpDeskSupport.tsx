import React from 'react';
import { User } from '../types';
import { SupportModule } from './Support/SupportModule';

interface HelpDeskSupportProps {
  currentUser: User;
  activeTenantId: string;
}

export function HelpDeskSupport({ currentUser, activeTenantId }: HelpDeskSupportProps) {
  return (
    <SupportModule currentUser={currentUser} activeTenantId={activeTenantId} />
  );
}
