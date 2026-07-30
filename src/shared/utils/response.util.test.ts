import { describe, expect, it } from 'vitest';
import {
  accepted,
  badRequest,
  internalError,
  notFound,
  success,
  unauthorized,
} from './response.util';

describe('Response Utility Unit Tests', () => {
  it('should return 200 success response with CORS headers', () => {
    const res = success({ foo: 'bar' });
    expect(res.statusCode).toBe(200);
    expect(res.headers?.['Access-Control-Allow-Origin']).toBe('*');
    expect(JSON.parse(res.body)).toEqual({ foo: 'bar' });
  });

  it('should return 202 accepted response', () => {
    const res = accepted({ status: 'QUEUED' });
    expect(res.statusCode).toBe(202);
    expect(JSON.parse(res.body)).toEqual({ status: 'QUEUED' });
  });

  it('should return 400 bad request response', () => {
    const res = badRequest('Invalid input');
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body)).toEqual({ message: 'Invalid input' });
  });

  it('should return 401 unauthorized response', () => {
    const res = unauthorized('Missing token');
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body)).toEqual({ message: 'Missing token' });
  });

  it('should return 404 not found response', () => {
    const res = notFound('Resource not found');
    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body)).toEqual({ message: 'Resource not found' });
  });

  it('should return 500 internal server error response', () => {
    const res = internalError('Failure', new Error('Database down'));
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body)).toEqual({
      message: 'Failure',
      error: 'Database down',
    });
  });
});
