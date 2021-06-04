import { SchemaObj } from 'convict';

export type CorsHeadersOptionsInterface = {
  configOrigins: string;
  options: {
    allowCredentials?: boolean;
    allowMethod?: string[];
    maxAge?: number;
  }
}

const getOrigins = (customConfig: Record<string, SchemaObj>, configOrigins: string) => {
  const origins = (customConfig[configOrigins] as any);

  if (typeof origins !== 'string') {
    return null;
  }

  if (origins.includes(',')) {
    return origins.split(',');
  }

  return origins;
};

export const setCorsHeaders = (
  event: any,
  customConfig: Record<string, SchemaObj>,
  corsHeaders: CorsHeadersOptionsInterface,
  response: any,
) => {
  const {
    configOrigins,
    options: {
      allowCredentials,
    },
  } = corsHeaders;

  const { httpMethod } = event;

  const origins = configOrigins && customConfig && getOrigins(customConfig, configOrigins);

  const headersWithCors = customConfig && {
    'Access-Control-Allow-Headers': 'authorization,content-type,cookie',
    ...(allowCredentials ? { 'Access-Control-Allow-Credentials': 'true' } : null),
    ...(origins ? { 'Access-Control-Allow-Origin': origins } : null),
  };

  if (httpMethod === 'OPTIONS') {
    return ({
      headers: {
        'Access-Control-Allow-Methods': 'OPTIONS, GET, HEAD, POST',
        ...(response ? response.headers || {} : null),
        ...headersWithCors,
      },
      isBase64Encoded: false,
      statusCode: 204,
    });
  }

  const newResponse = {
    ...response,
    headers: {
      ...(response ? response.headers || {} : null),
      ...headersWithCors,
    },
  };

  return newResponse;
};
