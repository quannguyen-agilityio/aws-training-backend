import { ApiResponse } from '@shared/types';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,DELETE',
  'Access-Control-Allow-Headers':
    'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
};

export function buildResponse<T>(statusCode: number, data: T): ApiResponse<T> {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(data),
    data,
  };
}

export function success<T>(data: T): ApiResponse<T> {
  return buildResponse(200, data);
}

export function accepted<T>(data: T): ApiResponse<T> {
  return buildResponse(202, data);
}

export function badRequest(message: string): ApiResponse<{ message: string }> {
  return buildResponse(400, { message });
}

export function unauthorized(message: string): ApiResponse<{ message: string }> {
  return buildResponse(401, { message });
}

export function notFound(message: string): ApiResponse<{ message: string }> {
  return buildResponse(404, { message });
}

export function internalError(
  message = 'Internal Server Error',
  error?: unknown
): ApiResponse<{ message: string; error?: string }> {
  const errorMessage = error instanceof Error ? error.message : String(error || '');
  return buildResponse(500, {
    message,
    ...(errorMessage ? { error: errorMessage } : {}),
  });
}
