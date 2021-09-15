export interface ConfigInterface {
  STAGE: string;
  NODE_ENV: string;
  SUPABASE_API_URL: string;
  VIDEO_INPUT_BUCKET: string;
  EXTRACTED_VIDEO_AUDIO_BUCKET: string;
}

export default {
  STAGE: {
    doc: 'Development or production',
    format: String,
    default: null,
  },
};
