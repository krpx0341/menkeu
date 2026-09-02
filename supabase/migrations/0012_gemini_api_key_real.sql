-- Add a separate Gemini API key field for receipt OCR.
-- The existing gemini_api_key is actually a Vikey token (vk-xxx),
-- used for the AI Advisor when provider=openai. This new field stores
-- the real Google Gemini API key (ai-xxx) for vision-based OCR.
ALTER TABLE app_settings
ADD COLUMN gemini_api_key_real TEXT;

COMMENT ON COLUMN app_settings.gemini_api_key_real IS 'Real Google Gemini API key (ai-xxx from Google AI Studio) for receipt OCR vision. Separate from the Vikey token in gemini_api_key.';
