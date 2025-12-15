# Deployment Options Guide

**Cloud Provider:** AWS (Amazon Web Services)  
**Framework:** Serverless Framework v4.28.0  
**Region:** us-east-1

---

## ⚠️ Important Clarification

This project deploys to **AWS (Amazon Web Services)**, not Google Cloud. Serverless Framework supports multiple cloud providers, but your configuration is set for AWS.

---

## Deployment Options Overview

You have several deployment options, from safest to most comprehensive:

1. **Dry Run / Validation** - Test without deploying
2. **Single Function Deployment** - Update one function (fastest, safest)
3. **Package Only** - Create deployment package without deploying
4. **Full Deployment** - Deploy all functions and infrastructure
5. **Custom Script Deployment** - Use your custom deployment script

---

## Option 1: Dry Run / Validation (Safest - No Changes)

Test your configuration without making any changes:

```bash
cd sls-lifescape

# Validate configuration
npx serverless print

# Check what would be deployed
npx serverless package --stage prod --profile lifescape
```

**What it does:**
- ✅ Validates your `serverless.yml` configuration
- ✅ Checks for syntax errors
- ✅ Shows what would be deployed
- ✅ Creates deployment package (but doesn't deploy)
- ❌ **No changes to AWS** - completely safe

---

## Option 2: Deploy Single Function (Fast & Safe)

Deploy only one function for testing:

```bash
cd sls-lifescape

# Deploy a single function (e.g., createThread)
npx serverless deploy function --function createThread --stage prod --profile lifescape
```

**What it does:**
- ✅ Updates only the specified Lambda function
- ✅ Fast (30 seconds - 2 minutes)
- ✅ Low risk - only affects one function
- ✅ Other functions remain unchanged

**Available Functions to Test:**
- `createThread`
- `createMoment`
- `getUserWall`
- `getRecentMoments`
- And 60+ others (see `serverless.yml`)

**Example:**
```bash
# Test with a simple function
npx serverless deploy function --function createThread --stage prod --profile lifescape
```

---

## Option 3: Package Only (Create Deployment Package)

Create the deployment package without deploying:

```bash
cd sls-lifescape

# Create package
npx serverless package --stage prod --profile lifescape
```

**What it does:**
- ✅ Packages all code and dependencies
- ✅ Creates `.serverless/` directory with deployment artifacts
- ✅ Validates configuration
- ❌ **Doesn't deploy** - just creates the package

**Use case:** Test packaging process, check package size, verify dependencies

---

## Option 4: Full Deployment (All Functions)

Deploy everything - all functions, API Gateway, infrastructure:

```bash
cd sls-lifescape

# Full deployment to production
npx serverless deploy --stage prod --profile lifescape

# Or use specific config file
npx serverless deploy --config serverless.yml --stage prod --profile lifescape
```

**What it does:**
- ✅ Deploys all 65+ Lambda functions
- ✅ Updates API Gateway configuration
- ✅ Updates CloudFormation stacks
- ✅ Creates/updates IAM roles
- ⏱️ Takes 5-10 minutes
- ⚠️ **Affects all functions** - use carefully

**When to use:**
- Initial deployment
- Major configuration changes
- After updating `serverless.yml`
- When you want everything in sync

---

## Option 5: Deploy to Development Stage

Deploy to development environment (safer for testing):

```bash
cd sls-lifescape

# Deploy to dev stage
npx serverless deploy --config serverless.yml.dev --stage dev --profile lifescape
```

**What it does:**
- ✅ Deploys to development AWS account (834616002870)
- ✅ Uses dev configuration
- ✅ Safer for testing changes
- ✅ Doesn't affect production

**Development API:**
- Base URL: `https://2hezou3hhe.execute-api.us-east-1.amazonaws.com/prod`

---

## Option 6: Custom Script Deployment

Use your custom deployment script for faster function updates:

```bash
cd /Users/foo/projects/Deepagent/Lifescape-BackEnd

# Deploy specific functions
./scripts/deploy-lambda.sh LifeScape-prod-createThread

# Deploy multiple functions
./scripts/deploy-lambda.sh LifeScape-prod-createThread LifeScape-prod-createMoment
```

**What it does:**
- ✅ Packages code into ZIP
- ✅ Uploads to S3 if >50MB
- ✅ Updates Lambda function code directly
- ✅ Faster than full Serverless deployment
- ⚠️ Doesn't update API Gateway configuration

**Use case:** Quick code updates without infrastructure changes

---

## Recommended Testing Approach

### Step 1: Validate Configuration (No Risk)

```bash
cd sls-lifescape
npx serverless print
```

This shows your configuration without making any changes.

### Step 2: Package Test (No Risk)

```bash
npx serverless package --stage prod --profile lifescape
```

Creates deployment package to verify everything packages correctly.

### Step 3: Deploy Single Function (Low Risk)

```bash
npx serverless deploy function --function createThread --stage prod --profile lifescape
```

Test with one function first.

### Step 4: Verify Deployment

```bash
# Check function info
npx serverless info --stage prod --profile lifescape

# View logs
npx serverless logs -f createThread --tail --stage prod --profile lifescape
```

### Step 5: Full Deployment (If Needed)

Only after testing single function:

```bash
npx serverless deploy --stage prod --profile lifescape
```

---

## Prerequisites

Before deploying, ensure:

### 1. AWS Credentials Configured

```bash
# Check AWS credentials
aws sts get-caller-identity --profile lifescape

# Should return your AWS account info
```

### 2. Environment Variables Set

```bash
# Set required environment variables
export AWS_PROFILE=lifescape
export SENDGRID_API_KEY=your_key_here  # If needed
```

### 3. Node.js Dependencies Installed

```bash
cd sls-lifescape
npm install
```

---

## Deployment Stages

Your project has multiple stages/environments:

| Stage | Config File | AWS Account | API Gateway ID | Use Case |
|-------|-------------|-------------|----------------|----------|
| **prod** | `serverless.yml` | 872469723818 | 1hwkqes839 | Production |
| **dev** | `serverless.yml.dev` | 834616002870 | 2hezou3hhe | Development |
| **lifescape** | `serverless.yml.lifescape` | 872469723818 | - | Alternative prod config |

---

## Cloud Provider Options

### Current Setup: AWS

Your project is configured for **AWS**:
- Provider: `aws` (in `serverless.yml`)
- Region: `us-east-1`
- Services: Lambda, API Gateway, DynamoDB, IAM

### Other Cloud Providers (Not Currently Configured)

Serverless Framework supports other providers, but your project is AWS-only:

- ❌ **Google Cloud Functions** - Not configured
- ❌ **Azure Functions** - Not configured
- ❌ **IBM Cloud** - Not configured
- ✅ **AWS Lambda** - Currently configured

**To use Google Cloud**, you would need to:
1. Change `provider.name` from `aws` to `google`
2. Configure Google Cloud credentials
3. Rewrite all functions for Google Cloud Functions
4. Update all AWS-specific code (DynamoDB → Firestore, etc.)

**This is a major migration and not recommended** unless you have a specific reason.

---

## Deployment Commands Reference

### Validation & Testing

```bash
# Print configuration
npx serverless print

# Validate configuration
npx serverless validate

# Package without deploying
npx serverless package --stage prod --profile lifescape
```

### Single Function Deployment

```bash
# Deploy one function
npx serverless deploy function --function FUNCTION_NAME --stage prod --profile lifescape

# Examples
npx serverless deploy function --function createThread --stage prod --profile lifescape
npx serverless deploy function --function createMoment --stage prod --profile lifescape
```

### Full Deployment

```bash
# Deploy everything
npx serverless deploy --stage prod --profile lifescape

# Deploy with specific config
npx serverless deploy --config serverless.yml.dev --stage dev --profile lifescape
```

### Information & Logs

```bash
# Get service info
npx serverless info --stage prod --profile lifescape

# View function logs
npx serverless logs -f FUNCTION_NAME --tail --stage prod --profile lifescape

# List all functions
npx serverless invoke list --stage prod --profile lifescape
```

### Local Testing

```bash
# Invoke function locally
npx serverless invoke local --function createThread --path event/thread.json

# Start local API Gateway
npx serverless offline
```

---

## Safety Checklist

Before deploying to production:

- [ ] Tested configuration with `serverless print`
- [ ] Created package successfully with `serverless package`
- [ ] Tested single function deployment
- [ ] Verified AWS credentials are correct
- [ ] Checked environment variables are set
- [ ] Reviewed `serverless.yml` changes
- [ ] Tested locally with `serverless invoke local`
- [ ] Have rollback plan ready

---

## Rollback Options

If something goes wrong:

### Rollback Single Function

```bash
# Deploy previous version
npx serverless deploy function --function FUNCTION_NAME --stage prod --profile lifescape
```

### Rollback Full Deployment

```bash
# Use CloudFormation to rollback
aws cloudformation rollback-stack --stack-name LifeScape-prod --profile lifescape --region us-east-1
```

### View Deployment History

```bash
# Check CloudFormation stack events
aws cloudformation describe-stack-events --stack-name LifeScape-prod --profile lifescape --region us-east-1
```

---

## Troubleshooting

### Deployment Fails

```bash
# Check CloudFormation events
aws cloudformation describe-stack-events --stack-name LifeScape-prod --profile lifescape --region us-east-1 --max-items 20

# Check Lambda function status
aws lambda get-function --function-name LifeScape-prod-createThread --profile lifescape --region us-east-1
```

### Credentials Error

```bash
# Verify credentials
aws sts get-caller-identity --profile lifescape

# Reconfigure if needed
aws configure --profile lifescape
```

### Package Too Large

If package > 50MB, Serverless automatically uses S3. Check:
```bash
# Package size
du -sh .serverless/*.zip

# S3 bucket
aws s3 ls s3://lifescape-lambda-deployments --profile lifescape
```

---

## Next Steps: Recommended Test Deployment

1. **Start with validation:**
   ```bash
   cd sls-lifescape
   npx serverless print
   ```

2. **Package test:**
   ```bash
   npx serverless package --stage prod --profile lifescape
   ```

3. **Deploy single function:**
   ```bash
   npx serverless deploy function --function createThread --stage prod --profile lifescape
   ```

4. **Verify it works:**
   ```bash
   npx serverless info --stage prod --profile lifescape
   ```

---

## Summary

**Your deployment options:**
1. ✅ **Dry run** - Validate without changes
2. ✅ **Single function** - Fast, safe testing
3. ✅ **Package only** - Test packaging
4. ✅ **Full deployment** - Deploy everything
5. ✅ **Custom script** - Fast function updates
6. ✅ **Dev stage** - Test in development environment

**Cloud Provider:** AWS (not Google Cloud)

**Recommended:** Start with validation, then single function deployment for testing.

