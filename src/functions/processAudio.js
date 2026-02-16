const { app } = require('@azure/functions');

// Minimal, safe stub: validates input, checks required envs, returns clear messages.
// Does NOT call external APIs until env is confirmed via /api/health.

const REQUIRED_ENVS = [
  'AZURE_STORAGE_CONNECTION_STRING',
  'SPEECH_KEY',
  'SPEECH_REGION',
  'TRANSLATOR_KEY',
  'TRANSLATOR_ENDPOINT',
  'TRANSLATOR_REGION',
  'OPENAI_API_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_WHATSAPP_FROM',
];

function checkEnv() {
  const missing = REQUIRED_ENVS.filter((k) => !process.env[k]);
  return { ok: missing.length === 0, missing };
}

function validateBody(body) {
  const errors = [];
  if (!body) errors.push('Empty body');
  else {
    if (!body.blobName || typeof body.blobName !== 'string') errors.push('blobName (string) is required');
    if (!body.doctorWhatsApp || typeof body.doctorWhatsApp !== 'string') errors.push('doctorWhatsApp (string, e.g., whatsapp:+91XXXXXXXXXX) is required');
    if (!body.language || typeof body.language !== 'string') errors.push('language (ISO code, e.g., en, hi, ta) is required');
    // patientWhatsApp is optional for now
  }
  return { ok: errors.length === 0, errors };
}

app.http('processAudio', {
  methods: ['POST'],
  authLevel: 'function',
  handler: async (request, context) => {
    const reqId = context.invocationId;
    const start = Date.now();

    try {
      const body = await request.json().catch(() => null);
      const v = validateBody(body);
      if (!v.ok) {
        context.log(JSON.stringify({ level: 'warn', reqId, at: 'validateBody', errors: v.errors }));
        return { status: 400, jsonBody: { ok: false, error: 'INVALID_INPUT', details: v.errors } };
      }

      const env = checkEnv();
      if (!env.ok) {
        context.log(JSON.stringify({ level: 'warn', reqId, at: 'checkEnv', missing: env.missing }));
        return {
          status: 503,
          jsonBody: {
            ok: false,
            error: 'ENV_INCOMPLETE',
            message: 'Backend configuration incomplete. See /api/health for details.',
            missing: env.missing,
          },
        };
      }

      // Defer heavy processing until envs are verified via /api/health.
      // Return 202 to indicate the request is accepted and will be processed when LIVE flag is enabled.
      context.log(JSON.stringify({ level: 'info', reqId, at: 'accepted', blobName: body.blobName, doctor: body.doctorWhatsApp, lang: body.language }));

      return {
        status: 202,
        jsonBody: {
          ok: true,
          message: 'Accepted for processing (stub). Once environment is confirmed, full processing will be enabled.',
          received: { blobName: body.blobName, doctorWhatsApp: body.doctorWhatsApp, language: body.language },
          durationMs: Date.now() - start,
        },
      };
    } catch (err) {
      context.log(JSON.stringify({ level: 'error', reqId, at: 'catch', error: err && err.message }));
      return { status: 500, jsonBody: { ok: false, error: 'UNEXPECTED_ERROR' } };
    }
  },
});
