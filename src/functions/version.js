const { app } = require('@azure/functions');

const version = {
  name: 'geoautomations-backend',
  version: process.env.BUILD_VERSION || '0.1.0',
  commit: process.env.BUILD_COMMIT || null,
  time: new Date().toISOString(),
};

app.http('version', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async () => ({ status: 200, jsonBody: version }),
});
