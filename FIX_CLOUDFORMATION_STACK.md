# Fix CloudFormation Stack - DELETE_FAILED State

**Current Issue:** Stack `LifeScape-prod` is in `DELETE_FAILED` state  
**Blocking Resource:** `APINestedStack` (API Gateway REST API)

---

## Quick Fix in AWS Console

### Step 1: Continue Delete Rollback

1. **Go to CloudFormation Console:**
   https://us-east-1.console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks

2. **Select Stack:** `LifeScape-prod`

3. **Click "Stack actions" → "Continue update rollback"**

4. **Skip Resources (if prompted):**
   - Select `APINestedStack` or the nested stack causing issues
   - Click "Continue update rollback"

5. **Wait for completion** (2-5 minutes)

### Step 2: Delete the Stack (If Still Stuck)

If continue rollback doesn't work:

1. **In CloudFormation Console:**
   - Select `LifeScape-prod` stack
   - Click "Delete"
   - If it fails, you may need to manually delete the API Gateway REST API first

2. **Manual API Gateway Cleanup (if needed):**
   - Go to API Gateway Console
   - Find the REST API (ID: `1hwkqes839`)
   - Delete it manually
   - Then retry stack deletion

### Step 3: Redeploy

Once stack is deleted or in a good state:

```bash
cd sls-lifescape
export AWS_PROFILE=lifescape
npx serverless deploy --stage prod
```

---

## Alternative: Deploy with New Stack Name

If you can't fix the existing stack, deploy to a new stage:

```bash
npx serverless deploy --stage prod-new
```

Then update your frontend to use the new API URL.

---

## Current Stack Status

- **Stack Name:** LifeScape-prod
- **Status:** DELETE_FAILED
- **Failed Resource:** APINestedStack
- **Reason:** API Gateway REST API has dependencies that prevent deletion

---

**Once the stack is fixed in the console, run the deployment command again!**

