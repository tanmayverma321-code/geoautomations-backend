{
  "name": "geoautomations-backend",
  "version": "1.0.0",
  "description": "Azure Functions backend for GeoAutomations MVP",
  "main": "index.js",
  "scripts": {
    "start": "func start",
    "test": "echo \"No tests yet\""
  },
  "dependencies": {
    "@azure/functions": "^4.0.0",
    "@azure/storage-blob": "^12.17.0",
    "microsoft-cognitiveservices-speech-sdk": "^1.34.0",
    "axios": "^1.6.0",
    "twilio": "^4.20.0"
  },
  "devDependencies": {},
  "engines": {
    "node": ">=18.0.0"
  }
}
Commit message: Add package.json
Click Commit new file
Create processAudio.js:
Click Add file → Create new file
Filename: src/functions/processAudio.js (typing the slash creates folders automatically)
Paste the complete backend code (shown below)
Commit message: Add processAudio function
Click Commit new file
Complete Backend Code for processAudio.js: Copy this entire block into GitHub:
const { app } = require('@azure/functions');
const { BlobServiceClient } = require('@azure/storage-blob');
const sdk = require('microsoft-cognitiveservices-speech-sdk');
const axios = require('axios');
const twilio = require('twilio');

app.http('processAudio', {
    methods: ['GET', 'POST'],
    authLevel: 'function',
    handler: async (request, context) => {
        try {
            // Parse request body
            const body = await request.json();
            const { blobName, doctorWhatsApp, patientWhatsApp, language } = body;

            if (!blobName || !doctorWhatsApp || !language) {
                return {
                    status: 400,
                    jsonBody: { error: 'Missing required fields: blobName, doctorWhatsApp, language' }
                };
            }

            // Environment variables
            const SPEECH_KEY = process.env.SPEECH_KEY;
            const SPEECH_REGION = process.env.SPEECH_REGION;
            const TRANSLATOR_KEY = process.env.TRANSLATOR_KEY;
            const TRANSLATOR_ENDPOINT = process.env.TRANSLATOR_ENDPOINT;
            const TRANSLATOR_REGION = process.env.TRANSLATOR_REGION;
            const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
            const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
            const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;
            const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
            const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

            // Download audio from blob
            context.log('Downloading audio blob:', blobName);
            const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
            const containerClient = blobServiceClient.getContainerClient('upload-audio');
            const blobClient = containerClient.getBlobClient(blobName);
            const downloadResponse = await blobClient.download();
            const audioBuffer = await streamToBuffer(downloadResponse.readableStreamBody);

            // Transcribe audio using Azure Speech
            context.log('Transcribing audio...');
            const speechConfig = sdk.SpeechConfig.fromSubscription(SPEECH_KEY, SPEECH_REGION);
            speechConfig.speechRecognitionLanguage = 'en-IN';
            const audioConfig = sdk.AudioConfig.fromWavFileInput(audioBuffer);
            const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

            const transcriptText = await new Promise((resolve, reject) => {
                recognizer.recognizeOnceAsync(result => {
                    if (result.reason === sdk.ResultReason.RecognizedSpeech) {
                        resolve(result.text);
                    } else {
                        reject(new Error('Speech recognition failed'));
                    }
                });
            });

            context.log('Transcript:', transcriptText);

            // Generate SOAP note using OpenAI
            context.log('Generating SOAP note...');
            const openaiResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert AI Medical Scribe for Indian doctors. Return ONLY valid JSON with this structure: {"patient_name": "Name or Unknown", "soap": {"subjective": "...", "objective": "...", "assessment": "...", "plan": "..."}, "patient_instructions": "Simple bullet-point instructions in English."}'
                    },
                    {
                        role: 'user',
                        content: `Transcript: ${transcriptText}`
                    }
                ],
                temperature: 0.3
            }, {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            const aiResult = JSON.parse(openaiResponse.data.choices[0].message.content);
            context.log('AI Result:', aiResult);

            // Translate patient instructions if needed
            let translatedInstructions = aiResult.patient_instructions;
            if (language !== 'en') {
                context.log('Translating to:', language);
                const translatorResponse = await axios.post(
                    `${TRANSLATOR_ENDPOINT}/translate?api-version=3.0&to=${language}`,
                    [{ text: aiResult.patient_instructions }],
                    {
                        headers: {
                            'Ocp-Apim-Subscription-Key': TRANSLATOR_KEY,
                            'Ocp-Apim-Subscription-Region': TRANSLATOR_REGION,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                translatedInstructions = translatorResponse.data[0].translations[0].text;
            }

            // Send WhatsApp message via Twilio
            context.log('Sending WhatsApp...');
            const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
            const messageBody = `
*GeoAutomations - Consultation Summary*

*Patient:* ${aiResult.patient_name}

*SOAP Note:*
*S:* ${aiResult.soap.subjective}
*O:* ${aiResult.soap.objective}
*A:* ${aiResult.soap.assessment}
*P:* ${aiResult.soap.plan}

*Patient Instructions (${language}):*
${translatedInstructions}

_AI-generated draft - Doctor review required_
            `.trim();

            await twilioClient.messages.create({
                from: TWILIO_WHATSAPP_FROM,
                to: doctorWhatsApp,
                body: messageBody
            });

            context.log('WhatsApp sent successfully');

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    message: 'Processing complete',
                    patientName: aiResult.patient_name
                }
            };

        } catch (error) {
            context.error('Error:', error);
            return {
                status: 500,
                jsonBody: { error: error.message }
            };
        }
    }
});

// Helper function to convert stream to buffer
async function streamToBuffer(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on('data', (data) => {
            chunks.push(data instanceof Buffer ? data : Buffer.from(data));
        });
        readableStream.on('end', () => {
            resolve(Buffer.concat(chunks));
        });
        readableStream.on('error', reject);
    });
}
