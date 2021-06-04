export interface ConfigInterface {
  STAGE: string;
}

export default {
  STAGE: {
    doc: 'Developmnt or production',
    format: String,
    default: null,
  }
};
