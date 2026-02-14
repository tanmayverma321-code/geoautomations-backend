const { app } = require('@azure/functions');

app.http('health', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    const required = [
      'SPEECH_KEY',
      'SPEECH_REGION',
      'TRANSLATOR_KEY',
      'TRANSLATOR_ENDPOINT',
      'TRANSLATOR_REGION',
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'TWILIO_WHATSAPP_FROM',
      'OPENAI_API_KEY',
      'AZURE_STORAGE_CONNECTION_STRING',
    ];
    const present = {};
    for (const k of required) {
      present[k] = process.env[k] ? 'present' : 'missing';
    }
    return {
      status: 200,
      jsonBody: {
        ok: true,
        env: present,
        time: new Date().toISOString(),
      },
    };
  },
});
