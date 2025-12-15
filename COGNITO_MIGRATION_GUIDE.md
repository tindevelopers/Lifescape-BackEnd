# Firebase to Cognito Migration Guide

This guide walks you through migrating your LifeScape backend from Firebase to AWS Cognito.

## Prerequisites

1. AWS CLI configured with appropriate permissions
2. Node.js and npm installed
3. Serverless Framework installed (`npm install -g serverless`)

## Migration Steps

### Step 1: Install New Dependencies

```bash
cd serverless/sls-lifescape
npm install jsonwebtoken jwk-to-pem
npm uninstall firebase firebase-admin
```

### Step 2: Deploy Cognito Infrastructure

```bash
# Deploy the new Cognito-based stack
sls deploy -c serverless-cognito.yml --stage prod
```

This will create:
- Cognito User Pool
- Cognito User Pool Client
- Cognito Identity Pool
- DynamoDB tables for user data
- Lambda functions for user management

### Step 3: Run Data Migration

```bash
# Set environment variables
export COGNITO_USER_POOL_ID=<your-user-pool-id>
export USER_TABLE=<your-dynamodb-table-name>

# Run migration script
node migrate-firebase-to-cognito.js
```

Or trigger via API:
```bash
curl -X POST https://your-api-gateway-url/admin/migrate
```

### Step 4: Update Frontend Authentication

Update your frontend to use Cognito instead of Firebase:

#### Before (Firebase):
```javascript
import { signInWithEmailAndPassword } from 'firebase/auth';

const login = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const token = await userCredential.user.getIdToken();
  return token;
};
```

#### After (Cognito):
```javascript
import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';

const userPool = new CognitoUserPool({
  UserPoolId: 'your-user-pool-id',
  ClientId: 'your-client-id'
});

const login = (email, password) => {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    const authDetails = new AuthenticationDetails({ Username: email, Password: password });
    
    user.authenticateUser(authDetails, {
      onSuccess: (result) => {
        const token = result.getIdToken().getJwtToken();
        resolve(token);
      },
      onFailure: (err) => reject(err)
    });
  });
};
```

### Step 5: Update API Calls

Your API endpoints remain the same, but now use Cognito tokens:

```javascript
// Use Cognito JWT token in Authorization header
const response = await fetch('/user/profile', {
  headers: {
    'Authorization': `Bearer ${cognitoToken}`,
    'Content-Type': 'application/json'
  }
});
```

### Step 6: Test the Migration

1. **Test User Registration:**
   ```bash
   curl -X POST https://your-api/user/signup \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'
   ```

2. **Test User Login:**
   ```bash
   curl -X POST https://your-api/user/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123!"}'
   ```

3. **Test Authenticated Endpoints:**
   ```bash
   curl -X GET https://your-api/user/{user_id} \
     -H "Authorization: Bearer {cognito_token}"
   ```

### Step 7: Update Environment Variables

Update your environment variables:

```bash
# Remove Firebase variables
unset firebaseProjectId
unset firebaseClientEmail
unset firebasePrivateKey
unset firebaseUrl

# Add Cognito variables
export COGNITO_USER_POOL_ID=your-pool-id
export COGNITO_USER_POOL_CLIENT_ID=your-client-id
export COGNITO_IDENTITY_POOL_ID=your-identity-pool-id
```

## Key Differences

### Authentication Flow

| Firebase | Cognito |
|----------|---------|
| Firebase Auth SDK | AWS Cognito SDK |
| Custom tokens | JWT tokens |
| Firebase Admin SDK validation | JWT validation with public keys |
| Firestore for user data | DynamoDB for user data |

### Token Validation

- **Firebase:** Uses Firebase Admin SDK to verify custom tokens
- **Cognito:** Uses JWT verification with Cognito's public keys

### User Management

- **Firebase:** Direct Firebase Admin SDK calls
- **Cognito:** AWS Cognito Identity Provider API calls

## Rollback Plan

If you need to rollback:

1. Keep the old Firebase functions deployed
2. Switch API Gateway to point to Firebase functions
3. Update frontend to use Firebase tokens again

## Benefits of Migration

1. **Native AWS Integration:** Better integration with other AWS services
2. **Cost Optimization:** Pay only for what you use
3. **Scalability:** Automatic scaling with AWS infrastructure
4. **Security:** Built-in security features and compliance
5. **Reduced Dependencies:** No external service dependencies

## Troubleshooting

### Common Issues:

1. **Token Validation Errors:**
   - Ensure Cognito User Pool ID is correct
   - Check JWT token format
   - Verify public key retrieval

2. **User Migration Issues:**
   - Check DynamoDB table permissions
   - Verify Cognito User Pool configuration
   - Review migration logs

3. **API Gateway Issues:**
   - Update authorizer configuration
   - Check Lambda function permissions
   - Verify environment variables

### Support

For issues during migration:
1. Check CloudWatch logs for detailed error messages
2. Verify IAM permissions for all services
3. Test individual components separately
4. Review AWS Cognito documentation for advanced configurations

## Next Steps

After successful migration:
1. Remove Firebase dependencies from package.json
2. Delete Firebase configuration files
3. Update documentation
4. Monitor performance and costs
5. Consider implementing additional Cognito features (MFA, custom attributes, etc.)