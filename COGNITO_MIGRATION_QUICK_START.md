# Cognito Migration Quick Start Guide

**Date:** December 14, 2025  
**Purpose:** Eliminate Firebase dependency and use Cognito for authentication

---

## Current Situation

**Firebase is used for:**
1. **Authentication** - Login, signup, password management (Firebase Auth)
2. **Database** - User profiles, friends, friend requests (Firestore)
3. **Authorization** - Token validation (Firebase tokens)

**Problem:**
- Firebase Admin SDK credentials missing (causing 502 errors)
- External dependency on Firebase
- Complex credential management

**Solution:**
- Migrate to **AWS Cognito** for authentication
- Migrate user data from **Firestore to DynamoDB**
- Use **Cognito JWT tokens** for API Gateway authorization

---

## Migration Overview

### Phase 1: Create DynamoDB Tables ✅ REQUIRED

Currently, **NO Users table exists in DynamoDB**. All user data is in Firestore.

**Tables to Create:**

1. **Users** (user profiles)
   - Partition Key: `user_id` (String)
   - Attributes: email, displayName, profile_picture, etc.

2. **UserFriends** (friend relationships)
   - Partition Key: `user_id` (String)
   - Sort Key: `friend_id` (String)
   - GSI: `friend_id-created_datetime-index`

3. **UserFriendRequests** (friend requests)
   - Partition Key: `user_id` (String)
   - Sort Key: `to_user_id` (String)
   - GSI: `to_user_id-status-index`

### Phase 2: Setup Cognito User Pool ✅ REQUIRED

1. Create Cognito User Pool
2. Configure email as username
3. Set password policy
4. Enable email verification
5. Create App Client
6. Note Client ID and User Pool ID

### Phase 3: Migrate Code ✅ REQUIRED

**Files to Modify:**
1. `firebase-client-user.js` - Replace auth functions
2. `lib/model/firebase-user.js` - Replace Firestore with DynamoDB
3. `sls-firebase-validator/firebase-validator.js` - Use Cognito tokens
4. Remove Firebase dependencies from `package.json`

### Phase 4: Data Migration ✅ REQUIRED

- Export data from Firestore
- Transform to DynamoDB format
- Import to DynamoDB tables

---

## Quick Decision Guide

### Option A: Full Migration (Recommended)

**Time:** 40-60 hours  
**Benefits:**
- Completely eliminate Firebase
- Native AWS integration
- No external dependencies
- Better long-term maintainability

**Steps:**
1. Create DynamoDB tables
2. Setup Cognito User Pool
3. Migrate code (auth + database)
4. Migrate data
5. Deploy and test

### Option B: Quick Fix (Temporary)

**Time:** 15 minutes  
**Benefits:**
- Immediate fix for 502 errors
- No code changes
- Users continue working

**Steps:**
1. Get Firebase credentials
2. Set environment variables
3. Deploy (already done)

**Trade-off:** Still dependent on Firebase

### Option C: Hybrid Approach

**Time:** 20-30 hours  
**Benefits:**
- Migrate auth first (Cognito)
- Keep Firestore for now
- Migrate data later

**Steps:**
1. Setup Cognito
2. Replace auth functions only
3. Update authorizer
4. Keep Firestore queries (still need Firebase credentials)

---

## Recommendation

**Immediate Action:** Set Firebase credentials (Option B) to fix 502 errors  
**Long-term:** Plan full migration (Option A) over 2-3 weeks

**Migration Strategy:**
- Week 1: Setup Cognito + DynamoDB tables
- Week 2: Code migration (auth first, then database)
- Week 3: Data migration + testing + deployment

---

## Next Steps

**If proceeding with migration:**
1. I'll create DynamoDB table definitions
2. I'll create Cognito User Pool setup script
3. I'll start migrating code functions one by one
4. We'll test each component as we go

**If keeping Firebase temporarily:**
1. Get Firebase credentials
2. Set environment variables
3. Continue using current setup

---

## Questions to Answer

1. **Timeline:** When do you want migration completed?
2. **Resources:** How many hours can you allocate?
3. **User Impact:** Can we migrate users gradually or need big bang?
4. **Data:** How many users need to be migrated?
5. **Rollback:** Do we need to keep Firebase as backup?

---

## Estimated Costs

**Cognito:**
- First 50,000 MAUs free
- $0.0055 per MAU after that

**DynamoDB:**
- On-demand pricing (pay per request)
- Estimated: $1-5/month for small user base

**Current Firebase:**
- Spark (free) plan available
- Blaze (pay-as-you-go) if exceeding limits

**Migration Cost:** Essentially free for most use cases

