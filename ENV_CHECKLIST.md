# Azure Function Environment Checklist (No Secrets)

Set these in Azure Portal → Function App → Configuration → Application settings:

Core runtime
- FUNCTIONS_WORKER_RUNTIME = node
- FUNCTIONS_EXTENSION_VERSION = ~4
- AzureWebJobsFeatureFlags = EnableWorkerIndexing
- AzureWebJobsStorage = (your storage connection string)

App settings (required by backend)
- AZURE_STORAGE_CONNECTION_STRING = (storage connection string)
- SPEECH_KEY = (Azure Cognitive Services Speech key)
- SPEECH_REGION = (e.g., southindia)
- TRANSLATOR_KEY = (Azure Translator key)
- TRANSLATOR_ENDPOINT = (e.g., https://api.cognitive.microsofttranslator.com)
- TRANSLATOR_REGION = (e.g., southindia)
- OPENAI_API_KEY = (OpenAI API key)
- TWILIO_ACCOUNT_SID = (Twilio SID)
- TWILIO_AUTH_TOKEN = (Twilio token)
- TWILIO_WHATSAPP_FROM = (e.g., whatsapp:+14155238886 or your number)

Notes
- Do not paste secrets in repos or screenshots. Use Azure only.
- After changing settings, click Save and then Restart the Function App.
- Verify with: https://<FUNCTION_APP_NAME>.azurewebsites.net/api/health
