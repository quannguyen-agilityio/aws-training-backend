import { defineAuth } from '@aws-amplify/backend';

/**
 * ============================================================================
 * AMPLIFY GEN 2 - AUTH RESOURCE CONFIGURATION (Cognito User Pool & Client)
 * ============================================================================
 * Refactored from Amplify Gen 1 (apexAuth CloudFormation template) to Amplify Gen 2
 * code-first TypeScript definition using `defineAuth`.
 *
 * Configures:
 *  - User login attribute: Email
 *  - Verification: Email code confirmation
 *  - User Groups: 'AdminGroup' for admin/manager role management
 *  - Password Policy: Minimum 8 characters
 */
export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: 'CODE',
      verificationEmailSubject: 'Your verification code',
      verificationEmailBody: (createCode) => `Your verification code is ${createCode()}`,
    },
  },
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
  },
  groups: ['AdminGroup'],
});
