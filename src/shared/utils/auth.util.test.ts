import { describe, it, expect } from 'vitest';
import { extractUserClaims } from './auth.util';

describe('Auth Utility Unit Tests', () => {
  it('should extract user claims from requestContext authorizer', () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            sub: 'user-uuid-123',
            email: 'admin@example.com',
            'cognito:username': 'adminUser',
            'cognito:groups': 'AdminGroup,UserGroup',
          },
        },
      },
    };

    const claims = extractUserClaims(event);

    expect(claims).not.toBeNull();
    expect(claims?.sub).toBe('user-uuid-123');
    expect(claims?.email).toBe('admin@example.com');
    expect(claims?.username).toBe('adminUser');
    expect(claims?.groups).toEqual(['AdminGroup', 'UserGroup']);
  });

  it('should return null if requestContext authorizer claims are missing', () => {
    const event = {};
    const claims = extractUserClaims(event);

    expect(claims).toBeNull();
  });

  it('should handle array formatted cognito:groups', () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            sub: 'user-uuid-456',
            'cognito:groups': ['DevGroup'],
          },
        },
      },
    };

    const claims = extractUserClaims(event);
    expect(claims?.groups).toEqual(['DevGroup']);
  });
});
