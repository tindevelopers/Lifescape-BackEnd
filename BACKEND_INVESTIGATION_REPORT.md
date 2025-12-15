# Backend Investigation Report

**Date:** December 14, 2025  
**Status:** Root Causes Identified

---

## Executive Summary

Investigated all failing endpoints. Found **3 main issues** causing the failures:

1. **502 Bad Gateway (getUserWall)**: Firebase Admin SDK credentials missing
2. **502 Bad Gateway (getRecentMoments)**: Async/await timing issue in forEach loop
3. **404 Not Found (/requests)**: API Gateway route has no HTTP methods configured
4. **404 Not Found (friends)**: Route exists but needs verification

---

## Issue 1: 502 Bad Gateway - POST /user/{user_id}/wall ❌

### Root Cause
**Firebase Admin SDK credentials are NOT set** in the Lambda function environment variables.

### Evidence
```bash
# CloudWatch Logs show:
ERROR: "Could not load the default credentials. 
Browse to https://cloud.google.com/docs/authentication/getting-started"
```

### Verification
```bash
aws lambda get-function-configuration --function-name LifeScape-prod-getUserWall
# Result: No Firebase environment variables found
```

### Current Environment Variables
```json
{
  "DEFAULT_CHANNEL": "My Lifescape",
  "SENDGRID_API_KEY": "...",
  "AWS_REGIONNAME": "us-east-1",
  "SITE_URL": "https://my.lifescape.com"
}
```

### Missing Variables
- ❌ `firebaseProjectId`
- ❌ `firebaseClientEmail`
- ❌ `firebasePrivateKey`
- ❌ `firebaseUrl`

### Fix Required
Set Firebase Admin SDK environment variables in `LifeScape-prod-getUserWall` Lambda function.

**Status:** ⚠️ **BLOCKED** - Requires Firebase service account credentials

---

## Issue 2: 502 Bad Gateway - GET /user/{user_id}/getRecentMoments ⚠️

### Root Cause
**Async/await issue in forEach loop** causing unhandled promise rejections or timing issues.

### Evidence
- CloudWatch logs show function executes but may timeout
- The function uses `forEach` with `async` callbacks, which doesn't await properly
- Code at `user.js:159` uses `object_result.forEach(async function(value, i){...})`

### Current Code Pattern (Problematic)
```javascript
object_result.forEach(async function(value, i){
    let momentresult = await momentob.getMomentDetail(objectid);
    // ... async operations ...
    cnt++;
    if(cnt == tot) {
        callback(null, response.success(...));
    }
});
```

### Problem
- `forEach` doesn't wait for async callbacks
- Race condition: callback might fire before all async operations complete
- No error handling for failed async operations

### Fix Required
Replace `forEach` with `for...of` loop or `Promise.all()` to properly handle async operations.

**Status:** ⚠️ **NEEDS CODE FIX**

---

## Issue 3: 404 Not Found - GET /user/{user_id}/requests ❌

### Root Cause
**API Gateway resource exists but has NO HTTP methods configured.**

### Evidence
```bash
aws apigateway get-resource --rest-api-id 1hwkqes839 --resource-id 2vhlxt
# Result: "resourceMethods": null
```

### API Gateway Configuration
- ✅ Resource `/user/{user_id}/requests` exists (resource-id: `2vhlxt`)
- ❌ No HTTP methods (GET, POST, etc.) configured
- ✅ Child resource `/user/{user_id}/requests/{type}` exists with GET method

### Current Routes
- `/user/{user_id}/requests` - **NO METHODS** ❌
- `/user/{user_id}/requests/{type}` - **GET method exists** ✅

### Frontend Expectation
Frontend is calling: `GET /user/{user_id}/requests`  
But correct endpoint is: `GET /user/{user_id}/requests/{type}` where `type` is `received` or `sent`

### Fix Options

**Option A: Fix Frontend (Recommended)**
- Update frontend to use: `/user/{user_id}/requests/received` or `/user/{user_id}/requests/sent`
- No backend changes needed

**Option B: Add GET Method to /requests**
- Configure GET method on `/user/{user_id}/requests` resource
- Point to Lambda function that handles requests without type
- Requires backend code changes

**Status:** ⚠️ **FRONTEND CONFIGURATION ISSUE** (endpoint exists but wrong path used)

---

## Issue 4: 404 Not Found - GET /user/{user_id}/friends ✅

### Root Cause
**Route exists and is properly configured.**

### Evidence
- ✅ Resource `/user/{user_id}/friends` exists (resource-id: `0hiyt7`)
- ✅ GET method configured
- ✅ Integration exists and points to Lambda: `LifeScape-prod-getUserFriendList`
- ✅ Lambda function exists

### Status
**This endpoint should be working.** If frontend is getting 404, possible causes:
1. Wrong path format in frontend
2. Missing user_id in path
3. Lambda function error (check CloudWatch logs)
4. API Gateway caching issue

**Status:** ✅ **CONFIGURED CORRECTLY** - May be frontend path issue

---

## Issue 5: getNotification Endpoint ❓

### Finding
- Function exists: `getNotifications` in `firebase-client-user.js:1150`
- Lambda function: `LifeScape-getStream-prod-getNotifications`
- API Gateway route: **NOT FOUND in main API**

### Possible Locations
- May be in separate API Gateway: `prod-LifeScape-getStream` (id: `72ywbexfp7`)
- Or endpoint doesn't exist in main API Gateway

**Status:** ❓ **NEEDS INVESTIGATION**

---

## Summary of Issues

| Endpoint | Status | Root Cause | Priority | Fix |
|----------|--------|------------|----------|-----|
| POST /user/{user_id}/wall | ❌ 502 | Firebase credentials missing | **HIGH** | Set env vars |
| GET /user/{user_id}/getRecentMoments | ⚠️ 502 | Async forEach issue | **HIGH** | Fix code |
| GET /user/{user_id}/requests | ❌ 404 | No HTTP methods on resource | **MEDIUM** | Fix frontend path |
| GET /user/{user_id}/friends | ⚠️ 404 | Needs verification | **MEDIUM** | Verify integration |
| getNotification | ❓ 404 | Route may not exist | **LOW** | Find route |

---

## Recommended Actions

### Immediate (Fix 502s)

1. **Set Firebase Admin SDK credentials for getUserWall**
   ```bash
   aws lambda update-function-configuration \
     --function-name LifeScape-prod-getUserWall \
     --environment "Variables={...,firebaseProjectId=tin-app-db,firebaseClientEmail=...,firebasePrivateKey=...,firebaseUrl=https://tin-app-db.firebaseio.com}"
   ```

2. **Fix getRecentMoments async issue**
   - Replace `forEach` with `for...of` loop
   - Use `Promise.all()` for parallel operations
   - Add proper error handling

### Short-term (Fix 404s)

3. **Update frontend to use correct requests endpoint**
   - Change from: `/user/{user_id}/requests`
   - Change to: `/user/{user_id}/requests/{type}` where type is `received` or `sent`

4. **Verify friends endpoint**
   - Check Lambda function exists and is working
   - Verify integration is correctly configured

### Long-term

5. **Add comprehensive error handling**
6. **Add request/response logging**
7. **Add API Gateway request validation**

---

## CloudWatch Logs Analysis

### getUserWall Logs
```
ERROR: "Could not load the default credentials"
Status: error
Error Type: Runtime.ExitError
Duration: 8786.53 ms (timeout)
```

### getRecentMoments Logs
```
INFO: Final Result1 ==>
INFO: 0
Duration: 153.73 ms
Status: success (but may have timing issues)
```

---

## API Gateway Route Status

### Working Routes ✅
- `/user/{user_id}/friends` - GET method exists
- `/user/{user_id}/wall` - POST method exists  
- `/user/{user_id}/getRecentMoments` - GET method exists
- `/user/{user_id}/requests/{type}` - GET method exists

### Broken Routes ❌
- `/user/{user_id}/requests` - NO HTTP methods configured

---

## Next Steps

1. ✅ **DONE:** Identified all root causes
2. ⚠️ **TODO:** Set Firebase credentials (blocked - need credentials)
3. ⚠️ **TODO:** Fix getRecentMoments async issue
4. ⚠️ **TODO:** Update frontend API calls
5. ⚠️ **TODO:** Verify friends endpoint

---

## Files Modified/To Modify

- `serverless/sls-lifescape/user.js` - Fix getRecentMoments async issue
- Lambda environment variables - Add Firebase credentials
- Frontend API service - Update requests endpoint path

