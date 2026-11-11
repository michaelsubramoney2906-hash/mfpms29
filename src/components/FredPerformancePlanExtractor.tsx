import React from 'react';
import type { User } from '../types';
import { FredGmPerformancePlanExtractor } from './FredGmPerformancePlanExtractor';

interface FredPerformancePlanExtractorProps {
  currentUser: User;
  activeTenantId: string;
  onNavigateToIPMS?: (subModuleId?: string) => void;
}

export function FredPerformancePlanExtractor({
  currentUser,
  activeTenantId,
  onNavigateToIPMS
}: FredPerformancePlanExtractorProps) {
  return (
    <FredGmPerformancePlanExtractor
      currentUser={currentUser}
      activeTenantId={activeTenantId}
      onNavigateToIPMS={onNavigateToIPMS}
    />
  );
}

export default FredPerformancePlanExtractor;
