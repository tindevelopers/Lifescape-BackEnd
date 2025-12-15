# Serverless Framework Deployment Explanation

**Date:** December 15, 2025  
**Status:** Deployment in Progress

---

## How Serverless Framework Deployment Works

### Overview

Serverless Framework is an **Infrastructure-as-Code (IaC)** tool that automates the deployment of serverless applications to AWS. Here's how it works:

### 1. **Configuration File (`serverless.yml`)**

The `serverless.yml` file is the blueprint for your entire infrastructure:

```yaml
service: LifeScape          # Service name
stage: prod                 # Environment (prod, dev, staging)
region: us-east-1           # AWS region
provider:
  name: aws                 # Cloud provider
  runtime: nodejs18.x       # Lambda runtime
  profile: lifescape        # AWS credentials profile
```

**What it defines:**
- Lambda functions and their handlers
- API Gateway endpoints
- Environment variables
- IAM permissions
- Other AWS resources

### 2. **Deployment Process**

When you run `npx serverless deploy`, here's what happens:

#### Step 1: Validation
```
✓ Reads serverless.yml
✓ Validates configuration syntax
✓ Checks for required plugins
✓ Verifies AWS credentials
```

#### Step 2: Packaging
```
✓ Bundles your code
✓ Packages Node.js dependencies
✓ Creates ZIP files for each function
✓ Uploads packages to S3 (temporary storage)
```

#### Step 3: CloudFormation Stack Creation/Update
```
✓ Creates or updates CloudFormation stack
✓ CloudFormation is AWS's IaC service
✓ Provisions all AWS resources:
  - Lambda functions
  - API Gateway REST API
  - IAM roles and policies
  - CloudWatch log groups
```

#### Step 4: Resource Deployment
```
✓ Uploads Lambda function code
✓ Creates/updates API Gateway endpoints
✓ Configures environment variables
✓ Sets up triggers and integrations
```

#### Step 5: Verification
```
✓ Tests deployed resources
✓ Returns deployment summary
✓ Shows API endpoints
```

---

## Current Deployment Status

### Configuration

- **Service:** LifeScape
- **Stage:** prod
- **Region:** us-east-1
- **AWS Account:** 872469723818
- **Runtime:** nodejs18.x
- **Functions:** 45+ Lambda functions
- **Endpoints:** 45+ API Gateway endpoints

### What's Being Deployed

1. **Lambda Functions** (45+ functions)
   - Thread operations (create, edit, get, delete)
   - Moment operations (create, edit, get, delete)
   - Comment operations
   - User operations
   - Media operations

2. **API Gateway REST API**
   - Base URL: `https://1hwkqes839.execute-api.us-east-1.amazonaws.com/prod`
   - HTTP endpoints for each function
   - CORS configuration
   - Authentication via Lambda authorizer

3. **IAM Permissions**
   - DynamoDB access (read/write)
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

```bash
cd sls-lifescape
export AWS_PROFILE=lifescape
npx serverless deploy --stage prod
```

**What it does:**
- Deploys all functions and infrastructure
- Updates existing resources
- Creates new resources if needed
- Takes 5-15 minutes

### Deploy Single Function (Faster)

```bash
npx serverless deploy function --function createMoment --stage prod
```

**What it does:**
- Updates only one function
- Doesn't touch API Gateway
- Takes 1-2 minutes

### Check Deployment Status

```bash
npx serverless info --stage prod
```

**Shows:**
- Deployed functions
- API endpoints
- Stack status

---

## Deployment Output Explained

### During Deployment

You'll see output like:

```
Deploying LifeScape to stage prod (us-east-1)

[serverless-plugin-split-stacks]: Summary: 120 resources migrated into 5 nested stacks
├─ (root): 55 resources
├─ APINestedStack: 43 resources (API Gateway)
├─ LambdasNestedStack: 25 resources (Lambda functions)
├─ LogGroupsNestedStack: 25 resources (CloudWatch logs)
└─ PermissionsNestedStack: 26 resources (IAM permissions)
```

**What this means:**
- Serverless splits resources into nested CloudFormation stacks
- This prevents hitting AWS resource limits
- Each stack manages a different type of resource

### After Successful Deployment

```
Service Information
service: LifeScape
stage: prod
region: us-east-1
stack: LifeScape-prod
resources: 150+

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

## Important Concepts

### 1. **Zero Downtime Updates**

- Serverless Framework updates resources incrementally
- API Gateway endpoints remain available
- Lambda functions are updated atomically
- No service interruption

### 2. **CloudFormation Stacks**

- Serverless uses CloudFormation under the hood
- CloudFormation manages all AWS resources
- Changes are tracked and can be rolled back
- Stack = collection of related AWS resources

### 3. **Nested Stacks**

- Large deployments are split into nested stacks
- Prevents hitting AWS resource limits (200 resources per stack)
- Each nested stack manages a resource type:
  - API Gateway resources
  - Lambda functions
  - IAM permissions
  - CloudWatch logs

### 4. **Function Naming**

Functions are named: `{service}-{stage}-{functionName}`

Example: `LifeScape-prod-createMoment`

---

## Troubleshooting Deployment

### Error: "Stack failed to update"

**Common causes:**
1. **Code errors** - Syntax errors in Lambda functions
2. **Missing dependencies** - npm packages not installed
3. **IAM permissions** - Lambda role missing permissions
4. **Resource limits** - Too many resources in one stack
5. **Runtime mismatch** - Node.js version incompatibility

**Solution:**
- Check CloudFormation console for specific error
- Review CloudWatch logs
- Fix the issue and redeploy

### Error: "Cannot resolve variable"

**Cause:** Missing environment variable or custom variable reference

**Solution:**
- Check `serverless.yml` for variable references
- Ensure all variables are defined
- Remove or comment out unused variables

### Error: "Handler not found"

**Cause:** Function handler file doesn't exist or path is wrong

**Solution:**
- Verify handler file exists
- Check handler path in `serverless.yml`
- Ensure function is exported correctly

---

## Current Deployment Issues

### Issue 1: Lambda Function Updates Failed

**Status:** ⚠️ Multiple Lambda functions failed to update

**Possible causes:**
1. Code errors in functions
2. Missing dependencies
3. Runtime compatibility issues
4. IAM permission issues

**Next steps:**
1. Check CloudFormation console for specific errors
2. Review CloudWatch logs for each failed function
3. Test functions locally to identify issues
4. Fix issues and redeploy

### Issue 2: Configuration Warnings

**Status:** ⚠️ Deprecation warnings (non-blocking)

**Warnings:**
- `splitStacks` - Deprecated property
- `documentation` - Deprecated property
- `reqValidatorName` - Deprecated property

**Impact:** These are warnings, not errors. Deployment can proceed, but these should be cleaned up in future updates.

---

## Deployment Best Practices

### 1. **Test Locally First**

```bash
npx serverless invoke local --function createMoment --path event/moment.json
```

### 2. **Deploy Functions Individually**

For testing, deploy one function at a time:

```bash
npx serverless deploy function --function createMoment --stage prod
```

### 3. **Check Logs**

After deployment, check CloudWatch logs:

```bash
aws logs tail /aws/lambda/LifeScape-prod-createMoment --follow --profile lifescape
```

### 4. **Monitor Deployment**

Watch CloudFormation console during deployment:
- AWS Console → CloudFormation → Stacks → LifeScape-prod

---

## Next Steps

1. **Check CloudFormation Errors**
   - Go to AWS Console
   - CloudFormation → Stacks → LifeScape-prod-LambdasNestedStack
   - View failed resources and error messages

2. **Review Function Code**
   - Check for syntax errors
   - Verify all imports are correct
   - Ensure dependencies are installed

3. **Fix Issues and Redeploy**
   - Fix identified problems
   - Test locally
   - Redeploy

---

## Summary

**Serverless Framework deployment:**
1. ✅ Reads `serverless.yml` configuration
2. ✅ Packages code and dependencies
3. ✅ Creates/updates CloudFormation stacks
4. ✅ Deploys Lambda functions
5. ✅ Configures API Gateway
6. ✅ Sets up IAM permissions
7. ⚠️ Currently encountering Lambda update failures

**Status:** Deployment attempted but Lambda functions failed to update. Need to investigate specific errors in CloudFormation console.

---

**For detailed error information, check the CloudFormation console in AWS.**

