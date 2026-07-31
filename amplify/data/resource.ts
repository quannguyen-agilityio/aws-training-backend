import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  ApexPlayer: a // ApexPlayer: table name
    .model({
      teamId: a.string().required(),
      playerId: a.string().required(),
      name: a.string(),
      email: a.string(),
      status: a.enum(['ACTIVE', 'INJURED', 'INACTIVE']),
    })
    .identifier(['teamId', 'playerId'])
    .authorization((allow) => [allow.authenticated()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
