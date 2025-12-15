# Firebase Admin SDK Environment Variables Setup

**Date:** December 14, 2025  
**Status:** ⚠️ **REQUIRED** - Environment variables need to be set

## Overview

The `getUserWall` function requires Firebase Admin SDK credentials to access Firestore. These credentials must be set as Lambda environment variables.

## Required Environment Variables

The following environment variables need to be set for Lambda functions that use Firebase Admin SDK:

- `firebaseProjectId`: `tin-app-db`
- `firebaseClientEmail`: (from Firebase service account JSON)
- `firebasePrivateKey`: (from Firebase service account JSON)
- `firebaseUrl`: `https://tin-app-db.firebaseio.com` (optional, has default)

## How to Get Firebase Service Account Credentials

1. **Go to Firebase Console:**
   - Navigate to: https://console.firebase.google.com/
   - Select project: `tin-app-db`

2. **Get Service Account Key:**
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Download the JSON file

3. **Extract Values from JSON:**
   The JSON file will look like:
   ```json
   {
     "type": "service_account",
     "project_id": "tin-app-db",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
     "client_email": "firebase-adminsdk-xxxxx@tin-app-db.iam.gserviceaccount.com",
     ...
   }
   ```

4. **Extract:**
   - `firebaseProjectId` = `project_id` value
   - `firebaseClientEmail` = `client_email` value
   - `firebasePrivateKey` = `private_key` value (keep the `\n` characters)

## Setting Environment Variables

### Option 1: AWS CLI (Recommended)

```bash
# Set for getUserWall function
aws lambda update-function-configuration \
  --function-name LifeScape-prod-getUserWall \
  --environment "Variables={
    DEFAULT_CHANNEL=My Lifescape,
    SENDGRID_API_KEY=YOUR_SENDGRID_API_KEY,
    AWS_REGIONNAME=us-east-1,
    SITE_URL=https://my.lifescape.com,
    firebaseProjectId=tin-app-db,
    firebaseClientEmail=firebase-adminsdk-xxxxx@tin-app-db.iam.gserviceaccount.com,
    firebasePrivateKey='-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n',
    firebaseUrl=https://tin-app-db.firebaseio.com
  }" \
  --profile lifescape \
  --region us-east-1
```

**Important:** When setting `firebasePrivateKey`, you must:
- Keep the `\n` characters in the private key
- Wrap the entire value in single quotes
- Escape any special characters properly

### Option 2: AWS Console

1. Go to AWS Lambda Console
2. Select function: `LifeScape-prod-getUserWall`
3. Go to Configuration → Environment variables
4. Add each variable:
   - Key: `firebaseProjectId`, Value: `tin-app-db`
   - Key: `firebaseClientEmail`, Value: `firebase-adminsdk-xxxxx@tin-app-db.iam.gserviceaccount.com`
   - Key: `firebasePrivateKey`, Value: `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n`
   - Key: `firebaseUrl`, Value: `https://tin-app-db.firebaseio.com` (optional)

### Option 3: AWS Secrets Manager (More Secure)

For better security, store credentials in AWS Secrets Manager:

```bash
# Create secret
aws secretsmanager create-secret \
  --name lifescape/firebase-admin-sdk \
  --secret-string '{
    "firebaseProjectId": "tin-app-db",
    "firebaseClientEmail": "firebase-adminsdk-xxxxx@tin-app-db.iam.gserviceaccount.com",
    "firebasePrivateKey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
    "firebaseUrl": "https://tin-app-db.firebaseio.com"
  }' \
  --profile lifescape \
  --region us-east-1
```

Then update Lambda to read from Secrets Manager (requires code changes).

## Functions That Need These Variables

Currently, these functions use Firebase Admin SDK:
- `LifeScape-prod-getUserWall` ⚠️ **REQUIRES SETUP**
- Any function that calls `firebaseuserob.getUserFriendDetails()`

## Verification

After setting environment variables, test the function:

```bash
# Test getUserWall
aws lambda invoke \
  --function-name LifeScape-prod-getUserWall \
  --payload '{"pathParameters":{"user_id":"test_user_id"},"body":{},"requestContext":{"authorizer":{"principalId":"test_user_id"}}}' \
  --profile lifescape \
  --region us-east-1 \
  response.json

cat response.json
```

## Troubleshooting

### Error: "Could not load the default credentials"
- **Cause:** Environment variables not set or incorrect
- **Fix:** Verify all 4 environment variables are set correctly
- **Check:** Ensure `firebasePrivateKey` includes `\n` characters

### Error: "Invalid credentials"
- **Cause:** Private key format incorrect or service account disabled
- **Fix:** Regenerate service account key in Firebase Console
- **Check:** Verify service account has Firestore permissions

### Error: "Permission denied"
- **Cause:** Service account doesn't have Firestore access
- **Fix:** Grant "Cloud Datastore User" role to service account in Firebase Console

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit credentials to Git** - These are sensitive credentials
2. **Use AWS Secrets Manager** for production (more secure than environment variables)
3. **Rotate credentials regularly** - Regenerate service account keys periodically
4. **Limit service account permissions** - Only grant necessary Firestore permissions
5. **Monitor access** - Enable CloudTrail to monitor Lambda function access

## Current Status

- ✅ Functions deployed with fixes
- ⚠️ Firebase Admin SDK environment variables **NOT SET** - **ACTION REQUIRED**

