# How to Get Cognito Bearer Token

## Overview

The "Bearer Token" is the **Cognito ID Token** (JWT) that you receive after successful authentication. This token is used to authenticate API requests.

---

## Cognito Configuration

**User Pool ID:** `us-east-1_uFR3CWkSg`  
**App Client ID:** `4590eqn44aignshvnci9oo7al7`  
**Region:** `us-east-1`

---

## Method 1: Using AWS Cognito JavaScript SDK (Frontend)

### Step 1: Install AWS Cognito SDK

```bash
npm install amazon-cognito-identity-js
```

### Step 2: Login and Get Token

```javascript
import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';

// Configure Cognito User Pool
const poolData = {
    UserPoolId: 'us-east-1_uFR3CWkSg',
    ClientId: '4590eqn44aignshvnci9oo7al7'
};
const userPool = new CognitoUserPool(poolData);

// Login function
function login(email, password) {
    return new Promise((resolve, reject) => {
        const authenticationDetails = new AuthenticationDetails({
            Username: email,
            Password: password
        });

        const cognitoUser = new CognitoUser({
            Username: email,
            Pool: userPool
        });

        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: (result) => {
                // Get ID Token (this is your bearer token)
                const idToken = result.getIdToken().getJwtToken();
                console.log('ID Token:', idToken);
                resolve(idToken);
            },
            onFailure: (err) => {
                console.error('Login failed:', err);
                reject(err);
            }
        });
    });
}

// Usage
login('user@example.com', 'password123')
    .then(token => {
        console.log('Bearer Token:', token);
        // Use this token in Authorization header: `Bearer ${token}`
    })
    .catch(error => {
        console.error('Error:', error);
    });
```

---

## Method 2: Using AWS CLI

### Step 1: Install AWS CLI

```bash
# macOS
brew install awscli

# Or download from: https://aws.amazon.com/cli/
```

### Step 2: Configure AWS CLI

```bash
aws configure --profile lifescape
# Enter your AWS credentials
```

### Step 3: Get Token via AWS CLI

```bash
# Login and get tokens
aws cognito-idp initiate-auth \
  --region us-east-1 \
  --profile lifescape \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id 4590eqn44aignshvnci9oo7al7 \
  --auth-parameters USERNAME=user@example.com,PASSWORD=password123
```

**Response:**
```json
{
    "AuthenticationResult": {
        "AccessToken": "...",
        "ExpiresIn": 3600,
        "IdToken": "eyJraWQiOiJ...",  // <-- This is your bearer token
        "RefreshToken": "...",
        "TokenType": "Bearer"
    }
}
```

Copy the `IdToken` value - that's your bearer token!

---

## Method 3: Using AWS SDK for JavaScript (Node.js)

```javascript
const AWS = require('aws-sdk');

const cognito = new AWS.CognitoIdentityServiceProvider({
    region: 'us-east-1'
});

async function getToken(email, password) {
    const params = {
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: '4590eqn44aignshvnci9oo7al7',
        AuthParameters: {
            USERNAME: email,
            PASSWORD: password
        }
    };

    try {
        const result = await cognito.initiateAuth(params).promise();
        const idToken = result.AuthenticationResult.IdToken;
        console.log('Bearer Token:', idToken);
        return idToken;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Usage
getToken('user@example.com', 'password123')
    .then(token => {
        console.log('Token:', token);
    });
```

---

## Method 4: Using curl (Direct API Call)

```bash
curl -X POST \
  https://cognito-idp.us-east-1.amazonaws.com/ \
  -H "X-Amz-Target: AWSCognitoIdentityProviderService.InitiateAuth" \
  -H "Content-Type: application/x-amz-json-1.1" \
  -d '{
    "ClientId": "4590eqn44aignshvnci9oo7al7",
    "AuthFlow": "USER_PASSWORD_AUTH",
    "AuthParameters": {
        "USERNAME": "user@example.com",
        "PASSWORD": "password123"
    }
}'
```

---

## Method 5: Using Postman

1. **Create New Request**
   - Method: `POST`
   - URL: `https://cognito-idp.us-east-1.amazonaws.com/`

2. **Headers:**
   ```
   X-Amz-Target: AWSCognitoIdentityProviderService.InitiateAuth
   Content-Type: application/x-amz-json-1.1
   ```

3. **Body (raw JSON):**
   ```json
   {
       "ClientId": "4590eqn44aignshvnci9oo7al7",
       "AuthFlow": "USER_PASSWORD_AUTH",
       "AuthParameters": {
           "USERNAME": "user@example.com",
           "PASSWORD": "password123"
       }
   }
   ```

4. **Response:**
   - Copy the `IdToken` from the response
   - Use it as: `Authorization: Bearer <IdToken>`

---

## Using the Token

Once you have the ID token, use it in API requests:

```javascript
const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${idToken}`
};

fetch('https://xj78ujjf44.execute-api.us-east-1.amazonaws.com/prod/moment', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
        user_id: 'user123',
        object_title: 'My Moment'
    })
});
```

---

## Token Expiration

- **ID Token expires:** 1 hour (3600 seconds)
- **Refresh Token expires:** 30 days
- **Access Token expires:** 1 hour

### Refresh Token Example

```javascript
import { CognitoUserPool, CognitoUser } from 'amazon-cognito-identity-js';

function refreshToken(email, refreshToken) {
    return new Promise((resolve, reject) => {
        const poolData = {
            UserPoolId: 'us-east-1_uFR3CWkSg',
            ClientId: '4590eqn44aignshvnci9oo7al7'
        };
        const userPool = new CognitoUserPool(poolData);
        
        const cognitoUser = new CognitoUser({
            Username: email,
            Pool: userPool
        });

        cognitoUser.refreshSession(refreshToken, (err, session) => {
            if (err) {
                reject(err);
            } else {
                const newIdToken = session.getIdToken().getJwtToken();
                resolve(newIdToken);
            }
        });
    });
}
```

---

## Test User Creation

If you need to create a test user:

```bash
aws cognito-idp sign-up \
  --region us-east-1 \
  --profile lifescape \
  --client-id 4590eqn44aignshvnci9oo7al7 \
  --username user@example.com \
  --password Password123! \
  --user-attributes Name=email,Value=user@example.com
```

Then confirm the user:

```bash
aws cognito-idp admin-confirm-sign-up \
  --region us-east-1 \
  --profile lifescape \
  --user-pool-id us-east-1_uFR3CWkSg \
  --username user@example.com
```

---

## Quick Reference

**Cognito Endpoint:** `https://cognito-idp.us-east-1.amazonaws.com/`  
**User Pool ID:** `us-east-1_uFR3CWkSg`  
**App Client ID:** `4590eqn44aignshvnci9oo7al7`  
**Region:** `us-east-1`

**Token Format:** JWT (JSON Web Token)  
**Header Format:** `Authorization: Bearer <token>`

---

## Troubleshooting

### "User does not exist"
- Create user first using `sign-up` command
- Confirm user email if required

### "NotAuthorizedException"
- Check password is correct
- Verify user is confirmed
- Check if MFA is required

### "InvalidParameterException"
- Verify Client ID is correct
- Check AuthFlow is `USER_PASSWORD_AUTH`
- Ensure region matches

### Token Expired
- Use refresh token to get new ID token
- Or login again to get fresh token

---

## Security Notes

⚠️ **Important:**
- Never commit tokens to version control
- Tokens expire after 1 hour
- Use HTTPS for all API calls
- Store tokens securely (localStorage, secure cookies, or memory)
- Implement token refresh logic in production





