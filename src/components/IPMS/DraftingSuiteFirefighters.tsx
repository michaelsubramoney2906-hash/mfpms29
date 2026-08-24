import React from 'react';
import type { User } from '../../types';
import { DraftingSuiteTeam } from './DraftingSuiteTeam';
import { TEAM_MODULE_CONFIGS } from './teamPADefaults';

interface PADraftingSuiteProps {
  currentUser: User;
  activeTenantId: string;
}

export function DraftingSuiteCDS({ currentUser, activeTenantId }: PADraftingSuiteProps) {
  const config = TEAM_MODULE_CONFIGS.cds || TEAM_MODULE_CONFIGS.firefighters;

  return (
    <DraftingSuiteTeam
      currentUser={currentUser}
      activeTenantId={activeTenantId}
      teamTitle={config.title}
      documentIdSuffix={config.documentIdSuffix}
      defaultRows={config.teams[0].defaultRows}
      defaultHeaders={config.defaultHeaders}
    />
  );
}

export const DraftingSuiteFirefighters = DraftingSuiteCDS;
export default DraftingSuiteCDS;

