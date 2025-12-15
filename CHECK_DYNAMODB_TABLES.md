# DynamoDB Tables Check

**Current AWS Account:** `720671021642` (from lifescape profile)  
**Expected Production Account:** `872469723818` (from serverless.yml)  
**Expected Development Account:** `834616002870` (from README)

---

## Issue

The `lifescape` AWS profile is currently configured for account `720671021642`, but the backend expects:
- **Production:** Account `872469723818`
- **Development:** Account `834616002870`

---

## Required DynamoDB Tables

Based on the new user module (`lib/model/user.js`), we need these tables:

1. **Users** - User profiles
   - Partition Key: `user_id` (String)

2. **UserFriends** - Friend relationships  
   - Partition Key: `user_id` (String)
   - Sort Key: `friend_id` (String)

3. **UserFriendRequests** - Friend requests
   - Partition Key: `user_id` (String)
   - Sort Key: `to_user_id` (String)

---

## Next Steps

### Option 1: Update AWS Profile to Correct Account

If you have credentials for account `872469723818` (production):

```bash
aws configure --profile lifescape
# Enter credentials for account 872469723818
```

Then verify:
```bash
aws sts get-caller-identity --profile lifescape
# Should show Account: 872469723818
```

### Option 2: Check Tables in Current Account

If the tables exist in account `720671021642`:

```bash
aws dynamodb list-tables --profile lifescape --region us-east-1
aws dynamodb describe-table --table-name Users --profile lifescape --region us-east-1
aws dynamodb describe-table --table-name UserFriends --profile lifescape --region us-east-1
aws dynamodb describe-table --table-name UserFriendRequests --profile lifescape --region us-east-1
```

### Option 3: Use Environment Variables for Table Names

If tables exist with different names, update the user module to use environment variables:

```yaml
# In serverless.yml
provider:
  environment:
    USERS_TABLE: YourActualUsersTableName
    USER_FRIENDS_TABLE: YourActualUserFriendsTableName
    USER_FRIEND_REQUESTS_TABLE: YourActualUserFriendRequestsTableName
```

---

## Current Status

✅ **Code is ready** - User module uses environment variables with defaults  
⚠️ **Need to verify** - Which AWS account has the tables?  
⚠️ **Need to verify** - Do the tables exist with these exact names?

---

**Action Required:** Please confirm:
1. Which AWS account should we use? (872469723818 for production?)
2. Do the tables already exist, or do we need to create them?
3. If they exist, what are their exact names?

