export interface ConfigInterface {
  STAGE: string;
}

export default {
  STAGE: {
    doc: 'Development or production',
    format: String,
    default: null,
  }
};
