# Serverless Framework Deployment Guide

**Last Updated:** December 15, 2025  
**Service:** LifeScape  
**Stage:** prod  
**Region:** us-east-1

---

## How Serverless Framework Deployment Works

### Overview

Serverless Framework is an Infrastructure-as-Code (IaC) tool that:
1. **Reads** your `serverless.yml` configuration file
2. **Packages** your code and dependencies
3. **Creates/Updates** AWS resources via CloudFormation
4. **Deploys** Lambda functions, API Gateway endpoints, and other AWS services

### Deployment Process

When you run `serverless deploy`, here's what happens:

#### 1. **Validation Phase**
- Validates `serverless.yml` syntax
- Checks for required plugins
- Verifies AWS credentials and permissions

#### 2. **Packaging Phase**
- Bundles your code and dependencies
- Creates deployment package (ZIP file)
- Uploads to S3 (temporary storage)

#### 3. **CloudFormation Phase**
- Creates/updates CloudFormation stack
- Provisions AWS resources:
  - Lambda functions
  - API Gateway REST API
  - IAM roles and policies
  - DynamoDB tables (if defined)
  - Other AWS services

#### 4. **Deployment Phase**
- Uploads Lambda function code
- Creates/updates API Gateway endpoints
- Configures environment variables
- Sets up triggers and integrations

#### 5. **Verification Phase**
- Tests deployed functions
- Verifies API Gateway endpoints
- Returns deployment summary

---

## Current Configuration

### Service Details

```yaml
service: LifeScape
stage: prod
region: us-east-1
profile: lifescape
runtime: nodejs18.x
```

### AWS Account

- **Account ID:** `872469723818`
- **Region:** `us-east-1`
- **Profile:** `lifescape` ✅ Verified

### What Will Be Deployed

1. **Lambda Functions** (65+ functions)
   - Thread operations
   - Moment operations
   - Comment operations
   - User operations
   - Media operations

2. **API Gateway REST API**
   - Base URL: `https://1hwkqes839.execute-api.us-east-1.amazonaws.com/prod`
   - 65+ HTTP endpoints
   - CORS enabled
   - Authentication via Lambda authorizer

3. **IAM Permissions**
   - DynamoDB access
   - SES email sending
   - Lambda invocation
   - CloudWatch logging

4. **Environment Variables**
   - `SITE_URL`: https://my.lifescape.com
   - `DEFAULT_CHANNEL`: My Lifescape
   - `AWS_REGIONNAME`: us-east-1

---

## Deployment Commands

### Full Deployment

Deploy all functions and infrastructure:

```bash
cd sls-lifescape
npx serverless deploy --stage prod --profile lifescape
```

**What it does:**
- Deploys all Lambda functions
- Updates API Gateway endpoints
- Updates CloudFormation stack
- Takes 5-15 minutes depending on changes

### Deploy Single Function

Deploy only one function (faster for testing):

```bash
npx serverless deploy function --function createMoment --stage prod --profile lifescape
```

**What it does:**
- Updates only the specified Lambda function
- Doesn't touch API Gateway or other functions
- Takes 1-2 minutes

### Deploy with Verbose Output

See detailed deployment progress:

```bash
npx serverless deploy --stage prod --profile lifescape --verbose
```

### Check Deployment Status

View current deployment info:

```bash
npx serverless info --stage prod --profile lifescape
```

---

## Deployment Options

### 1. Full Deployment (Recommended for First Time)

```bash
npx serverless deploy --stage prod --profile lifescape
```

**Use when:**
- First deployment
- Changed `serverless.yml` configuration
- Added/removed functions
- Changed API Gateway endpoints
- Updated environment variables

### 2. Function-Only Deployment (Faster)

```bash
npx serverless deploy function --function createMoment --stage prod --profile lifescape
```

**Use when:**
- Only changed function code
- Testing specific function
- Quick iteration during development

### 3. Package Only (No Deploy)

```bash
npx serverless package --stage prod --profile lifescape
```

**Use when:**
- Want to inspect deployment package
- Testing packaging process
- Creating deployment artifacts

---

## What Happens During Deployment

### Step-by-Step Process

1. **Serverless reads `serverless.yml`**
   ```
   ✓ Parsing serverless.yml
   ✓ Loading plugins
   ✓ Validating configuration
   ```

2. **Packages code**
   ```
   ✓ Bundling functions
   ✓ Packaging dependencies
   ✓ Creating deployment artifacts
   ```

3. **Uploads to S3**
   ```
   ✓ Uploading to S3 bucket
   ✓ Creating deployment package
   ```

4. **CloudFormation operations**
   ```
   ✓ Creating/updating CloudFormation stack
   ✓ Provisioning AWS resources
   ```

5. **Deploys functions**
   ```
   ✓ Deploying Lambda functions
   ✓ Updating function code
   ✓ Setting environment variables
   ```

6. **Configures API Gateway**
   ```
   ✓ Creating/updating API Gateway endpoints
   ✓ Configuring integrations
   ✓ Setting up CORS
   ```

7. **Verification**
   ```
   ✓ Verifying deployments
   ✓ Testing endpoints
   ```

---

## Deployment Output

After deployment, you'll see:

```
Service Information
service: LifeScape
stage: prod
region: us-east-1
stack: LifeScape-prod
resources: 150+
api keys:
  None
endpoints:
  POST - https://1hwkqes839.execute-api.us-east-1.amazonaws.com/prod/thread
  GET - https://1hwkqes839.execute-api.us-east-1.amazonaws.com/prod/user/{user_id}/thread/{thread_id}
  POST - https://1hwkqes839.execute-api.us-east-1.amazonaws.com/prod/moment
  ...
functions:
  createThread: LifeScape-prod-createThread
  createMoment: LifeScape-prod-createMoment
  ...
```

---

## Important Notes

### 1. Deployment Time

- **First deployment:** 10-15 minutes (creates all resources)
- **Subsequent deployments:** 5-10 minutes (updates existing resources)
- **Function-only:** 1-2 minutes (updates single function)

### 2. Zero Downtime

- Serverless Framework updates resources incrementally
- API Gateway endpoints remain available during deployment
- Lambda functions are updated atomically
- No downtime for users

### 3. Rollback

If deployment fails:
- CloudFormation automatically rolls back
- Previous version remains active
- Check CloudWatch logs for errors

### 4. Cost

- **Deployment:** Free (CloudFormation operations)
- **Storage:** S3 storage for deployment packages (minimal cost)
- **Resources:** Only pay for actual usage (Lambda, API Gateway, etc.)

---

## Troubleshooting

### Error: "AWS profile 'lifescape' doesn't seem to be configured"

**Solution:**
```bash
aws configure --profile lifescape
# Enter AWS credentials
```

### Error: "Access Denied"

**Solution:**
- Check IAM permissions
- Verify AWS credentials
- Ensure role has necessary permissions

### Error: "Stack already exists"

**Solution:**
- This is normal for updates
- Serverless will update existing stack
- If you want to delete first: `npx serverless remove`

### Deployment Stuck

**Solution:**
- Check CloudFormation console
- Review CloudWatch logs
- Cancel and retry if needed

---

## Post-Deployment Verification

### 1. Check Functions

```bash
aws lambda list-functions --profile lifescape --region us-east-1 \
  --query 'Functions[?starts_with(FunctionName, `LifeScape-prod`)].FunctionName'
```

### 2. Test Endpoint

```bash
curl -X GET https://1hwkqes839.execute-api.us-east-1.amazonaws.com/prod/moment/{object_id}
```

### 3. Check API Gateway

```bash
aws apigateway get-rest-apis --profile lifescape --region us-east-1
```

---

## Next Steps After Deployment

1. ✅ Verify all functions deployed
2. ✅ Test API endpoints
3. ✅ Check CloudWatch logs
4. ✅ Update frontend with API URLs
5. ✅ Monitor usage and errors

---

**Ready to deploy!** 🚀

