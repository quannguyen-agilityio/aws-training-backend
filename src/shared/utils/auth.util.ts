export interface UserClaims {
  sub?: string;
  email?: string;
  username?: string;
  groups?: string[];
  [key: string]: unknown;
}

export function extractUserClaims(event: {
  requestContext?: {
    authorizer?: {
      claims?: Record<string, unknown>;
    };
  };
}): UserClaims | null {
  const claims = event?.requestContext?.authorizer?.claims;
  if (!claims) {
    return null;
  }

  const rawGroups = claims['cognito:groups'];
  let groups: string[] = [];
  if (typeof rawGroups === 'string') {
    groups = rawGroups.split(',');
  } else if (Array.isArray(rawGroups)) {
    groups = rawGroups.map(String);
  }

  return {
    sub: (claims.sub as string) || undefined,
    email: (claims.email as string) || undefined,
    username: (claims['cognito:username'] as string) || (claims.username as string) || undefined,
    groups,
    ...claims,
  };
}
