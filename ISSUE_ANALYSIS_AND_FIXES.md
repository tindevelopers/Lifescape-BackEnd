# Issue Analysis and Fixes

**Date:** December 14, 2025  
**Status:** Analysis Complete - Fixes Required

## Summary of Issues

### 1. ✅ 502 Bad Gateway: POST /user/{user_id}/wall

**Root Cause:** The `getUserWall` function calls `firebaseuserob.getUserFriendDetails()` which requires Firebase Admin SDK credentials. The Lambda environment variables for Firebase Admin SDK are not properly configured.

**Error Message:**
```
Error: Could not load the default credentials.
```

**Location:** `serverless/sls-lifescape/moment.js:787`

**Fix Required:**
1. Ensure Lambda environment variables are set:
   - `firebaseProjectId`
   - `firebaseClientEmail`
   - `firebasePrivateKey`
   - `firebaseUrl` (optional)

2. The function also uses `context.fail()` which doesn't work with AWS_PROXY integration. Need to replace with `callback(null, response.error())`.

**Status:** ⚠️ Needs Lambda environment variable configuration + code fix

---

### 2. ✅ 502 Bad Gateway: GET /user/{user_id}/getRecentMoments

**Root Cause:** The function uses deprecated `context.fail()` which doesn't work with AWS_PROXY integration. It should use `callback(null, response.error())` instead.

**Location:** `serverless/sls-lifescape/user.js:113, 203`

**Current Code Issues:**
- Line 113: `return context.fail(JSON.stringify({ statusCode:500, message: "Server Error" }));`
- Line 203: `return context.fail(JSON.stringify({ statusCode:500, message: "Server Error" }));`

**Fix Required:** Replace all `context.fail()` calls with `callback(null, response.error())` or `callback(null, response.serverError())`.

**Status:** ⚠️ Needs code fix

---

### 3. ✅ 404 Not Found: GET /user/{user_id}/friends

**Root Cause:** The endpoint exists (`getUserFriendList` in `firebase-client-user.js:968`), but there may be:
1. API Gateway routing issue
2. The endpoint path might be incorrect in the frontend

**Location:** `serverless/sls-lifescape/firebase-client-user.js:968`

**Verification:** The function exists and should work. Check:
- API Gateway resource configuration
- Frontend is calling the correct path: `/v1/user/{user_id}/friends`

**Status:** ⚠️ Needs verification of API Gateway configuration

---

### 4. ✅ CORS Error: GET /user/{user_id}/requests

**Root Cause:** According to the API documentation (`FRONTEND_API_GUIDE.md:415`), the correct endpoint is:
```
GET /v1/user/{user_id}/requests/{type}
```

Where `type` is either `received` or `sent`.

The frontend is likely calling `/user/{user_id}/requests` without the `{type}` parameter, which doesn't exist.

**Fix Required:** Frontend should update to use:
- `/user/{user_id}/requests/received` - for received requests
- `/user/{user_id}/requests/sent` - for sent requests

**Status:** ⚠️ Frontend configuration issue

---

### 5. ✅ Pubnub Not Initialized

**Analysis:** After searching the entire codebase, **Pubnub is NOT used in the backend**. This is a frontend-only configuration issue.

**Why Pubnub Might Be Needed (Frontend):**
Pubnub is typically used for:
- **Real-time messaging** - Chat features, notifications
- **Presence** - Who's online, typing indicators
- **Pub/Sub** - Real-time updates without polling
- **Push notifications** - Cross-platform push notifications

**Current Backend Real-time Solutions:**
The backend currently uses:
- **GetStream** (`sls-getstream/`) - For activity feeds and notifications
- **AWS SNS** (`lib/model/sns.js`) - For push notifications to iOS devices
- **Firebase** - For user data and authentication

**Recommendation:**
If the frontend needs real-time features (chat, live updates), Pubnub would be a good addition. However, if the app only needs:
- Activity feeds → GetStream (already implemented)
- Push notifications → AWS SNS (already implemented)
- User presence → Could use Firebase Realtime Database or GetStream

**Status:** ℹ️ Frontend configuration issue - not a backend problem

---

### 6. ✅ Cloudinary Image 404s

**Analysis:** Cloudinary URLs are stored in the database and used throughout the application. The URLs follow this pattern:
```
https://res.cloudinary.com/lifescape/image/upload/v{version}/{path}/{filename}
```

**Common Issues:**
1. **Old/migrated images** - Some URLs may reference old paths that no longer exist
2. **Missing images** - Images may have been deleted from Cloudinary
3. **URL encoding** - Some URLs have `%20` (spaces) that need proper encoding
4. **HEIC conversion** - Code converts `.heic` to `.jpg` but the original URL might still be `.heic`

**Location of Cloudinary Usage:**
- `serverless/sls-lifescape/media.js:67, 123` - Media storage
- `serverless/sls-lifescape/lib/model/oneall.js:86, 107` - Social sharing
- `serverless/sls-lifescape/migration.js:738` - Migration script

**Cloudinary Configuration:**
- Cloud Name: `lifescape`
- Upload Preset: `lifescape_angular`

**How to Check if URLs Work:**
1. Extract a sample URL from the database
2. Test in browser: `https://res.cloudinary.com/lifescape/image/upload/v{version}/{path}`
3. Check Cloudinary dashboard for missing images

**Fix Options:**
1. **Validate URLs before storing** - Add validation in media upload
2. **Add fallback images** - Return default image if Cloudinary returns 404
3. **Migration script** - Check all existing URLs and flag broken ones
4. **Cloudinary transformations** - Use Cloudinary's `f_auto` format to handle missing formats

**Status:** ⚠️ Needs investigation - may require database cleanup or URL validation

---

## Recommended Fixes

### Priority 1: Critical (502 Errors)

1. **Fix `getUserWall` function:**
   - Replace `context.fail()` with `callback(null, response.error())`
   - Ensure Firebase Admin SDK credentials are set in Lambda environment

2. **Fix `getRecentMoments` function:**
   - Replace all `context.fail()` calls with `callback(null, response.error())`

### Priority 2: Configuration

3. **Verify API Gateway routing** for `/user/{user_id}/friends`

4. **Frontend updates:**
   - Fix `/user/{user_id}/requests` → `/user/{user_id}/requests/{type}`
   - Configure Pubnub if real-time features are needed

### Priority 3: Data Quality

5. **Cloudinary URL validation:**
   - Add URL validation in media upload
   - Create script to check existing URLs
   - Add fallback for broken images

---

## Next Steps

1. ✅ Fix Lambda functions (replace `context.fail()`)
2. ⚠️ Configure Firebase Admin SDK environment variables
3. ⚠️ Verify API Gateway endpoints
4. ⚠️ Update frontend API calls
5. ⚠️ Investigate Cloudinary 404s
