import React from 'react';
import { renderToString } from 'react-dom/server';
import { PerformanceAgreements } from './src/components/IPMS/PerformanceAgreements';

console.log('Rendering...');
// Cannot do this easily because it uses ESM, JSX, etc.
