import convict from "convict";

export const commonConfig = {
  // AWS clients automatically load these
  AWS_ACCESS_KEY_ID: {
    doc: "API key to connect to AWS",
    format: String,
    default: null,
  },
  AWS_SECRET_ACCESS_KEY: {
    doc: "API secret to connect to AWS",
    format: String,
    default: null,
  },
  AWS_REGION: {
    doc: "Default region for AWS",
    format: String,
    default: null,
  },
};

export type commonConfigKeys = keyof typeof commonConfig;

let properties: Record<commonConfigKeys | string, any>;

function getConfig<Config = Record<commonConfigKeys | string, any>>(
  customConfig: Record<string, any> = {}
): Config {
  if (!properties) {
    const config: Record<commonConfigKeys | string, any> = {
      ...commonConfig,
      ...customConfig,
    };

    const entries = Object.keys(config).reduce(
      (acc: any, key: any) => ({
        ...acc,
        [key]: {
          ...config[key],
          env: key,
        },
      }),
      {}
    );

    convict.addFormat({
      name: "base64",
      validate: String,
      coerce(value: any) {
        return Buffer.from(value, "base64").toString("ascii");
      },
    });

    const configuration = convict(entries);
    configuration.validate({ allowed: "strict" });
    // @ts-ignore
    properties = configuration.getProperties();
  }

  return properties as Config;
}
export default getConfig;
