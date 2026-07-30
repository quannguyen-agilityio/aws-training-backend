export interface ApiResponse<T = unknown> {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
  data?: T;
}

export interface ApiGatewayProxyEvent {
  httpMethod?: string;
  requestContext?: {
    http?: {
      method?: string;
    };
  };
  body?: string | null;
  headers?: Record<string, string>;
  queryStringParameters?: Record<string, string> | null;
  pathParameters?: Record<string, string> | null;
}
