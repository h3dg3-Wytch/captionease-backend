export interface ConfigInterface {
  STAGE: string;
  NODE_ENV: string;
  SUPABASE_API_URL: string;
  SUPABASE_API_KEY: string;
  VIDEO_INPUT_BUCKET: string;
  EXTRACTED_VIDEO_AUDIO_BUCKET: string;
}

export default {
  STAGE: {
    doc: 'Development or production',
    format: String,
    default: null,
  },
  NODE_ENV: {
    doc: 'Development or production',
    format: String,
    default: null,
  },
  SUPABASE_API_URL: {
    doc: 'Development or production',
    format: String,
    default: null,
  },
  SUPABASE_API_KEY: {
    doc: 'Development or production',
    format: String,
    default: null,
  },
  VIDEO_INPUT_BUCKET: {
    doc: 'Development or production',
    format: String,
    default: null,
  },
  EXTRACTED_VIDEO_AUDIO_BUCKET: {
    doc: 'Development or production',
    format: String,
    default: null,
  },
};
