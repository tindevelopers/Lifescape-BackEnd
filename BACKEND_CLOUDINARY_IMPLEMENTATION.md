# Backend Cloudinary Implementation

## ✅ Implementation Complete

All Cloudinary operations are now handled in the backend Lambda functions.

## Changes Made

### 1. Added Cloudinary SDK Dependency
**File:** `serverless/sls-lifescape/package.json`
- Added `cloudinary: ^1.41.0` to dependencies

### 2. Created New Upload Function
**File:** `serverless/sls-lifescape/media.js`
- Added `uploadAndSaveMedia()` function
- Handles image upload to Cloudinary
- Saves media record to DynamoDB
- Returns media_id and Cloudinary URL

### 3. Maintained Backward Compatibility
- Kept existing `saveMedia()` function for old flow
- Both functions work side-by-side during migration

## New Function: `uploadAndSaveMedia`

### Purpose
Uploads images to Cloudinary and saves media records to DynamoDB - all handled by backend.

### Request Format
```json
{
  "user_id": "required",
  "image": "data:image/jpeg;base64,/9j/4AAQ...",  // OR
  "image_base64": "/9j/4AAQ...",  // Base64 string (without data URI prefix)
  "media_desc": "optional description",
  "media_order": "0",
  "folder": "angular_sample",
  "tags": ["moment", "lifescape"],
  "metadata": {},
  "datalineobject_id": "optional moment_id"
}
```

### Response Format
```json
{
  "statusCode": 200,
  "body": {
    "message": "Media uploaded and saved successfully!",
    "body": {
      "media_id": "uuid",
      "cloudinary_url": "https://res.cloudinary.com/...",
      "cloudinary_id": "public_id",
      "width": 1920,
      "height": 1080,
      "format": "jpg",
      "bytes": 123456
    }
  }
}
```

### Features
- ✅ Uploads images to Cloudinary
- ✅ Converts HEIC to JPG automatically
- ✅ Saves media record to DynamoDB
- ✅ Returns media_id for moment creation
- ✅ Handles base64 data URIs
- ✅ Error handling and validation
- ✅ Preserves metadata

## Environment Variables Required

Add these to Lambda function environment variables:

```
CLOUDINARY_CLOUD_NAME=lifescape
CLOUDINARY_API_KEY=<your_api_key>
CLOUDINARY_API_SECRET=<your_api_secret>
CLOUDINARY_UPLOAD_PRESET=lifescape_angular
```

## API Gateway Configuration

### Option 1: New Endpoint (Recommended)
- **Path:** `POST /media/upload`
- **Integration:** Lambda Proxy
- **Handler:** `media.uploadAndSaveMedia`

### Option 2: Update Existing Endpoint
- **Path:** `POST /media`
- **Integration:** Lambda Proxy
- **Handler:** `media.saveMedia` (update to route based on request body)

## Next Steps

### 1. Install Dependencies
```bash
cd "/Users/gene/Projects/Lifescape Backend/serverless/sls-lifescape"
npm install
```

### 2. Set Environment Variables
Add Cloudinary credentials to Lambda function environment variables.

### 3. Deploy Lambda Function
```bash
# Deploy the updated media.js function
./scripts/deploy-lambda.sh uploadAndSaveMedia
```

### 4. Configure API Gateway
- Add new route: `POST /media/upload` → `uploadAndSaveMedia`
- OR update existing `/media` route

### 5. Update Frontend (Next Phase)
- Change frontend to send base64 images to backend
- Remove Cloudinary SDK from frontend
- Use new `/media/upload` endpoint

## Testing

### Test with curl:
```bash
# Convert image to base64
IMAGE_BASE64=$(base64 -i test-image.jpg)

# Create data URI
IMAGE_DATA_URI="data:image/jpeg;base64,${IMAGE_BASE64}"

# Upload via backend
curl -X POST https://1hwkqes839.execute-api.us-east-1.amazonaws.com/prod/media/upload \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": \"test_user_id\",
    \"image\": \"${IMAGE_DATA_URI}\",
    \"media_desc\": \"Test image\",
    \"media_order\": \"0\"
  }"
```

## Benefits

✅ **Security**: API keys stay on server  
✅ **Control**: Server-side validation and processing  
✅ **Consistency**: All uploads go through same logic  
✅ **Maintainability**: Single source of truth  
✅ **Scalability**: Can add rate limiting, quotas, etc.  
✅ **Best Practices**: Backend handles external integrations  

## Migration Path

1. **Phase 1**: Deploy backend function (done)
2. **Phase 2**: Update frontend to use backend upload
3. **Phase 3**: Remove Cloudinary SDK from frontend
4. **Phase 4**: Remove old `saveMedia` function (optional)

---

**Date:** December 14, 2025  
**Status:** ✅ Backend Implementation Complete - Ready for Deployment
