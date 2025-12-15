# Firebase to Cognito Migration Plan

**Date:** December 14, 2025  
**Status:** Analysis Complete - Migration Feasibility Assessment

---

## Executive Summary

**Yes, Firebase can be eliminated and replaced with Cognito**, but it requires a **significant migration** of both authentication and data storage.

### Current Firebase Usage

1. **Firebase Authentication** - User login, signup, password management
2. **Firestore Database** - User profiles, friend relationships, friend requests
3. **Firebase Admin SDK** - Server-side access to Firestore data

### Proposed Solution

1. **AWS Cognito** - Replace Firebase Auth
2. **DynamoDB** - Replace Firestore (user data already partially in DynamoDB)
3. **API Gateway Authorizer** - Use Cognito JWT tokens instead of Firebase tokens

---

## Current Firebase Dependencies

### 1. Authentication (Firebase Client SDK)

**Location:** `serverless/sls-lifescape/firebase-client-user.js`

**Used For:**
- User signup (`signup()`)
- User login (`login()`)
- Password reset (`resetPassword()`)
- Password change (`changePassword()`)
- Token verification (via firebase-validator Lambda authorizer)

**Functions Affected:**
- `module.exports.signup`
- `module.exports.login`
- `module.exports.resetPassword`
- `module.exports.changePassword`

### 2. Database Access (Firebase Admin SDK)

**Location:** `serverless/sls-lifescape/lib/model/firebase-user.js`

**Firestore Collections Used:**
- `users2` - User profiles and data
- `user_friends` - Friend relationships (bidirectional)
- `user_friend_requests` - Friend request status

**Functions Using Firestore:**
- `getUserDetail()` - Get user profile
- `getUserFriendIDs()` - Get friend list
- `getUserFriendStatus()` - Check friend request status
- `getUserFriendDetails()` - Get friends' user details
- `checkEmailExist()` - Check duplicate emails
- `createUserDocument()` - Create user profile
- `updateUserDetail()` - Update user profile
- `deleteUserFriend()` - Remove friend
- Various friend request operations

### 3. Client SDK Firestore Access

**Location:** `serverless/sls-lifescape/firebase-client-user.js`, `firebase-client-user-group.js`

**Used For:**
- Reading user data in Lambda functions
- User groups management
- Profile updates

---

## Migration Strategy

### Phase 1: Data Migration (Firestore → DynamoDB)

#### Current Firestore Schema

**Collection: `users2`**
```
Document ID: user_id
Fields:
- user_id
- email
- displayName
- profile_picture
- about_text
- location
- gender
- created_datetime
- moment_counter
- devices (object with ios/android arrays)
- groups (array)
```

**Collection: `user_friends`**
```
Document ID: auto-generated
Fields:
- user_id
- friend_id
- created_datetime
```

**Collection: `user_friend_requests`**
```
Document ID: auto-generated
Fields:
- user_id
- to_user_id
- status (pending/accepted/denied)
- created_datetime
```

#### Proposed DynamoDB Schema

**Table: `Users` (needs to be created - currently only in Firestore)**
```
Partition Key: user_id (String)
Attributes:
- email (String)
- displayName (String)
- profile_picture (String)
- about_text (String)
- location (String)
- gender (String)
- created_datetime (Number)
- moment_counter (Number)
- devices (Map)
- groups (List)
```

**Table: `UserFriends` (new or existing)**
```
Partition Key: user_id (String)
Sort Key: friend_id (String)
Attributes:
- created_datetime (Number)
Global Secondary Index:
- friend_id-created_datetime-index (for reverse lookups)
```

**Table: `UserFriendRequests` (new or existing)**
```
Partition Key: user_id (String)
Sort Key: to_user_id (String)
Attributes:
- status (String)
- created_datetime (Number)
Global Secondary Index:
- to_user_id-status-index (for incoming requests)
```

---

### Phase 2: Authentication Migration (Firebase Auth → Cognito)

#### Cognito User Pool Setup

**Required Configuration:**
- User pool name: `lifescape-users`
- Sign-in options: Email
- Password policy: Configure as needed
- MFA: Optional
- Attributes: email (required), name (custom)
- Email verification: Required

#### Code Changes Required

**1. Replace Signup Function**
```javascript
// Current: Firebase Client SDK
firebase.auth().createUserWithEmailAndPassword(email, password)

// New: AWS Cognito
const cognito = new AWS.CognitoIdentityServiceProvider();
await cognito.signUp({
  ClientId: process.env.COGNITO_CLIENT_ID,
  Username: email,
  Password: password,
  UserAttributes: [
    { Name: 'email', Value: email },
    { Name: 'name', Value: displayName }
  ]
}).promise();
```

**2. Replace Login Function**
```javascript
// Current: Firebase Client SDK
firebase.auth().signInWithEmailAndPassword(email, password)

// New: AWS Cognito
await cognito.initiateAuth({
  AuthFlow: 'USER_PASSWORD_AUTH',
  ClientId: process.env.COGNITO_CLIENT_ID,
  AuthParameters: {
    USERNAME: email,
    PASSWORD: password
  }
}).promise();
```

**3. Replace Password Reset**
```javascript
// Current: Firebase
firebase.auth().sendPasswordResetEmail(email)

// New: Cognito
await cognito.forgotPassword({
  ClientId: process.env.COGNITO_CLIENT_ID,
  Username: email
}).promise();
```

**4. Update API Gateway Authorizer**
- Current: `firebase-validator` Lambda (validates Firebase tokens)
- New: Cognito JWT authorizer or Lambda authorizer using Cognito token

---

### Phase 3: Database Access Migration (Firestore → DynamoDB)

#### Replace Firestore Queries with DynamoDB

**Example: Get User Detail**
```javascript
// Current: Firestore
var db = admin.firestore();
var getDoc = db.collection("users2").doc(user_id).get()

// New: DynamoDB
const params = {
  TableName: 'Users',
  Key: { user_id: user_id }
};
const result = await dynamo.get(params).promise();
```

**Example: Get Friend IDs**
```javascript
// Current: Firestore
db.collection("user_friends")
  .where("user_id", "==", user_id)
  .get()

// New: DynamoDB
const params = {
  TableName: 'UserFriends',
  KeyConditionExpression: 'user_id = :user_id',
  ExpressionAttributeValues: {
    ':user_id': user_id
  }
};
const result = await dynamo.query(params).promise();
```

**Example: Friend Request Status**
```javascript
// Current: Firestore
db.collection("user_friend_requests")
  .where("user_id", "==", user_id)
  .where("to_user_id", "==", to_user_id)
  .get()

// New: DynamoDB
const params = {
  TableName: 'UserFriendRequests',
  Key: {
    user_id: user_id,
    to_user_id: to_user_id
  }
};
const result = await dynamo.get(params).promise();
```

---

## Migration Steps

### Step 1: Setup Cognito User Pool

1. Create Cognito User Pool
2. Configure attributes (email, name)
3. Set password policy
4. Create App Client
5. Note Client ID and User Pool ID

### Step 2: Data Migration Script

1. Export all data from Firestore
2. Transform to DynamoDB format
3. Import to DynamoDB tables
4. Verify data integrity

### Step 3: Code Changes

1. Remove Firebase dependencies
2. Add AWS Cognito SDK
3. Replace authentication functions
4. Replace Firestore queries with DynamoDB
5. Update API Gateway authorizer

### Step 4: Testing

1. Test user signup
2. Test user login
3. Test password reset
4. Test friend operations
5. Test user profile operations

### Step 5: Deployment

1. Deploy updated Lambda functions
2. Update API Gateway authorizer
3. Migrate existing users (optional - they can re-register or migrate tokens)
4. Monitor for errors

---

## Benefits of Migration

### Advantages

1. **Unified AWS Stack** - Everything in AWS ecosystem
2. **No External Dependencies** - No Firebase credentials needed
3. **Better Integration** - Native AWS service integration
4. **Cost Optimization** - Potential cost savings (Cognito free tier)
5. **Simplified Auth** - Cognito JWT tokens work natively with API Gateway
6. **Scalability** - DynamoDB better suited for Lambda/serverless

### Challenges

1. **Migration Effort** - Significant code changes required
2. **Data Migration** - Need to migrate existing user data
3. **User Disruption** - Users may need to reset passwords (depending on migration strategy)
4. **Testing** - Comprehensive testing required
5. **Dual Support** - May need to support both during transition

---

## Estimated Effort

### Development Time
- **Cognito Setup:** 2-4 hours
- **Code Migration:** 16-24 hours
- **Data Migration Script:** 4-8 hours
- **Testing:** 8-12 hours
- **Deployment & Verification:** 4-6 hours

**Total:** ~40-60 hours

### Files to Modify

**High Priority:**
1. `serverless/sls-lifescape/firebase-client-user.js` - Authentication functions
2. `serverless/sls-lifescape/lib/model/firebase-user.js` - All Firestore queries
3. `serverless/sls-firebase-validator/firebase-validator.js` - API Gateway authorizer
4. `serverless/sls-lifescape/firebase-client-user-group.js` - User groups

**Medium Priority:**
5. `serverless/sls-lifescape/moment.js` - getUserWall (uses getUserFriendDetails)
6. All Lambda functions using firebaseuserob module

**Configuration:**
7. `package.json` - Remove firebase-admin, firebase dependencies
8. Lambda environment variables - Add Cognito Client ID, User Pool ID
9. API Gateway authorizer configuration

---

## Alternative: Hybrid Approach

### Option: Keep Firestore, Replace Only Auth

**Simpler Migration:**
- Use Cognito for authentication only
- Keep Firestore for data storage
- Update authorizer to use Cognito tokens
- Gradually migrate data later

**Pros:**
- Faster implementation (8-16 hours)
- Less risky
- Can migrate data incrementally

**Cons:**
- Still need Firebase Admin SDK credentials
- Doesn't fully solve the credential issue
- Still dependent on Firebase

---

## Recommendation

**For Immediate Fix (getUserWall 502 error):**
1. Set Firebase credentials (quick fix - 15 minutes)
2. Fixes the immediate issue

**For Long-term Solution:**
1. **Recommend migrating to Cognito + DynamoDB**
2. Eliminates Firebase dependency completely
3. Better AWS integration
4. More maintainable long-term

**Migration Strategy:**
- Phase 1: Set Firebase credentials (temporary fix)
- Phase 2: Plan Cognito migration (2-3 weeks)
- Phase 3: Execute migration in phases
- Phase 4: Remove Firebase completely

---

## Next Steps

If proceeding with migration:

1. ✅ **Decision:** Confirm Cognito migration approach
2. ⚠️ **Setup:** Create Cognito User Pool
3. ⚠️ **Design:** Finalize DynamoDB table schema
4. ⚠️ **Development:** Start with authentication migration
5. ⚠️ **Testing:** Test auth flows first
6. ⚠️ **Data Migration:** Migrate Firestore → DynamoDB
7. ⚠️ **Code Updates:** Replace all Firestore queries
8. ⚠️ **Deployment:** Deploy and verify

---

## Questions to Consider

1. **User Data:** How many existing users? Migration strategy?
2. **Downtime:** Can we afford downtime for migration?
3. **Rollback:** Should we keep Firebase as backup?
4. **Timeline:** When do you want this completed?
5. **Resources:** Do you have bandwidth for 40-60 hour migration?

---

## Files Reference

- Firebase Auth: `serverless/sls-lifescape/firebase-client-user.js`
- Firestore Access: `serverless/sls-lifescape/lib/model/firebase-user.js`
- API Gateway Authorizer: `serverless/sls-firebase-validator/firebase-validator.js`

