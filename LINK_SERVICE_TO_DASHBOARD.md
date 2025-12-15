# How to Link Your Service to Serverless.com Dashboard

**Service:** LifeScape-prod  
**Goal:** Make your deployed service appear in the Serverless.com dashboard

---

## Step-by-Step Instructions

### Step 1: Login to Serverless Framework

First, authenticate with Serverless.com:

```bash
cd sls-lifescape
npx serverless login
```

This will:
- Open your browser
- Ask you to log in to Serverless.com
- Authenticate your CLI

**Note:** You're already logged in (you can see apps in the dashboard), so you can skip this if already authenticated.

---

### Step 2: Get Your Org Name

From the dashboard URL you showed: `app.serverless.com/informationnetwork/apps`

Your **org name** is: `informationnetwork`

---

### Step 3: Add Org and App to serverless.yml

Add these lines to your `serverless.yml` file:

```yaml
service: LifeScape

# Add these two lines:
org: informationnetwork
app: lifescape-backend  # or any name you prefer

frameworkVersion: ">=3.0.0"
```

**Where to add:**
- Right after `service: LifeScape`
- Before `frameworkVersion`

---

### Step 4: Deploy with Platform Integration

Now deploy again (this will link it to the dashboard):

```bash
cd sls-lifescape
export AWS_PROFILE=lifescape
npx serverless deploy --stage prod
```

**What happens:**
- Serverless Framework will detect the `org` and `app` configuration
- It will link your CloudFormation stack to the dashboard
- Your service will appear in the dashboard after deployment

---

## Alternative: Link Existing Stack Without Redeploying

If you want to link without redeploying everything:

### Option A: Use Serverless Framework v4 (Has Better Linking)

```bash
# Upgrade to v4 (if not already)
npm install serverless@^4.28.0 --save-dev

# Login
npx serverless login

# Link existing stack
npx serverless link --stage prod
```

### Option B: Manual Link via Dashboard

1. Go to: https://app.serverless.com/informationnetwork/apps
2. Click **"+ Create App"**
3. Select **"Link Existing Service"** or **"Import from AWS"**
4. Choose:
   - **AWS Account:** Select your linked AWS account
   - **Region:** us-east-1
   - **Stack Name:** LifeScape-prod
5. Click **"Link"** or **"Import"**

---

## Quick Fix: Update serverless.yml Now

I can update your `serverless.yml` file to add the org and app configuration. Then you just need to deploy again.

**Would you like me to:**
1. ✅ Add `org: informationnetwork` to serverless.yml
2. ✅ Add `app: lifescape-backend` (or your preferred name)
3. ✅ Then you run `npx serverless deploy --stage prod`

---

## What You'll See After Linking

Once linked, in the dashboard you'll see:
- ✅ **LifeScape-prod** (or your app name)
- ✅ Function list with metrics
- ✅ API Gateway endpoints
- ✅ CloudWatch logs integration
- ✅ Deployment history
- ✅ Performance monitoring

---

## Troubleshooting

### "Org not found" error
- Make sure you're logged in: `npx serverless login`
- Verify org name matches dashboard URL

### "App already exists" error
- The app name might already be used
- Try a different name: `app: lifescape-prod` or `app: lifescape-backend-prod`

### Still not showing in dashboard
- Wait a few minutes after deployment
- Refresh the dashboard
- Check if you're in the correct org: `informationnetwork`

---

## Current Configuration

**Your service:**
- Name: `LifeScape`
- Stage: `prod`
- Region: `us-east-1`
- Stack: `LifeScape-prod`

**Your org:**
- Name: `informationnetwork`

**Suggested app name:**
- `lifescape-backend` or `lifescape-prod`

---

**Ready to link? I can update your serverless.yml file now!**

