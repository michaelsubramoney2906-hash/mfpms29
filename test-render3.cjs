const React = require('react');
const ReactDOMServer = require('react-dom/server');

// Mock browser APIs
global.window = {
  atob: (s) => Buffer.from(s, 'base64').toString('binary'),
  btoa: (s) => Buffer.from(s, 'binary').toString('base64')
};
global.document = {
  createElement: () => ({ setAttribute: () => {} })
};
global.navigator = {};
global.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
global.sessionStorage = { getItem: () => null };
global.btoa = global.window.btoa;
global.atob = global.window.atob;
global.Blob = class Blob {};
global.URL = { createObjectURL: () => '', revokeObjectURL: () => {} };

// Import the component
const { PerformanceAgreements } = require('./temp.cjs');

const currentUser = {
  email: 'zulune@nkangaladm.gov.za',
  fullName: 'Noluthando Zulu',
  role: 'tenant_user',
  tenantId: 'tenant-229',
  id: 'zulune@nkangaladm.gov.za'
};

try {
  const html = ReactDOMServer.renderToString(
    React.createElement(PerformanceAgreements, {
      currentUser,
      activeTenantId: 'tenant-229',
      isPlan: true
    })
  );
  console.log('Rendered length:', html.length);
} catch (e) {
  console.error('Render error:', e.stack);
}
