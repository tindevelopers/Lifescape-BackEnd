# Moment Creation Test Guide

## Overview

This guide explains how to test moment creation with image upload using the test page and both Cloudinary and Wasabi storage options.

---

## Files Created

1. **`test-moment-creation.html`** - Interactive test page for creating moments
2. **`WASABI_STORAGE_RECOMMENDATION.md`** - Detailed Wasabi integration guide
3. **`MOMENT_CREATION_TEST_GUIDE.md`** - This guide

---

## Test Page Features

The test page (`test-moment-creation.html`) includes:

- ✅ **Moment Creation Form**
  - User ID input
  - Authorization token input
  - Title, description, date fields
  - Published status toggle

- ✅ **Image Upload**
  - Drag and drop support
  - Multiple image selection
  - Image preview with remove option
  - Support for both Cloudinary and Wasabi

- ✅ **Storage Options**
  - Cloudinary (current implementation)
  - Wasabi (S3-compatible, cost-effective)

- ✅ **Real-time Status**
  - Upload progress
  - Success/error messages
  - Loading indicators

---

## How to Use the Test Page

### 1. Open the Test Page

```bash
# Open in browser
open test-moment-creation.html

# Or serve via local server
python3 -m http.server 8000
# Then visit http://localhost:8000/test-moment-creation.html
```

### 2. Get Authorization Token

You need a Cognito ID token to authenticate:

```javascript
// Example: Get token from Cognito login
// After successful Cognito authentication:
const idToken = cognitoUser.getSignInUserSession().getIdToken().getJwtToken();
```

### 3. Fill Out the Form

1. **User ID**: Enter your Cognito user ID
2. **Authorization Token**: Paste your Cognito ID token
3. **Title**: Enter moment title
4. **Description**: (Optional) Add description
5. **Start Date**: (Optional) Select date
6. **Published**: Choose Yes/No

### 4. Upload Images

- **Click** the upload area or **drag and drop** images
- Multiple images supported
- Preview shows thumbnails
- Click × to remove images

### 5. Select Storage

- **Cloudinary**: Current implementation (requires Cloudinary setup)
- **Wasabi**: S3-compatible storage (requires Wasabi credentials)

### 6. Create Moment

Click "Create Moment" button. The page will:
1. Upload images to selected storage
2. Save media records to DynamoDB
3. Create the moment with image references
4. Display success message with moment ID

---

## API Endpoints Used

### 1. Upload Image to Wasabi
**POST** `/media/wasabi/upload`
- **Auth Required:** ✅ Yes
- **Request:**
```json
{
  "user_id": "user123",
  "imageBase64": "data:image/jpeg;base64,...",
  "filename": "photo.jpg",
  "contentType": "image/jpeg",
  "saveToDb": true
}
```
- **Response:**
```json
{
  "statusCode": 200,
  "body": {
    "message": "Image uploaded to Wasabi successfully!",
    "body": {
      "media_id": "uuid",
      "wasabi_url": "https://s3.us-east-1.wasabisys.com/...",
      "wasabi_key": "moments/user123/1234567890-photo.jpg",
      "url": "https://s3.us-east-1.wasabisys.com/...",
      "bucket": "lifescape-images",
      "size": 123456
    }
  }
}
```

### 2. Save Media (Cloudinary)
**POST** `/media`
- **Auth Required:** ✅ Yes
- **Request:**
```json
{
  "user_id": "user123",
  "cloudinary_url": "https://res.cloudinary.com/...",
  "cloudinary_id": "public_id",
  "media_type": "image",
  "media_ext": "jpg",
  "media_size": 123456,
  "media_width": 1920,
  "media_height": 1080,
  "media_order": 0
}
```

### 3. Create Moment
**POST** `/moment`
- **Auth Required:** ✅ Yes
- **Request:**
```json
{
  "user_id": "user123",
  "object_title": "My Moment",
  "object_desc": "Description",
  "start_date": 1234567890,
  "is_published": "1",
  "media_id": ["media-id-1", "media-id-2"]
}
```

---

## Setup Instructions

### For Cloudinary (Current)

1. **Set Environment Variables** in Lambda:
   ```
   CLOUDINARY_CLOUD_NAME=lifescape
   CLOUDINARY_API_KEY=your_key
   CLOUDINARY_API_SECRET=your_secret
   CLOUDINARY_UPLOAD_PRESET=lifescape_angular
   ```

2. **Upload Flow:**
   - Frontend uploads to Cloudinary
   - Gets Cloudinary URL
   - Saves URL to backend via `/media` endpoint
   - Creates moment with media IDs

### For Wasabi (New)

1. **Create Wasabi Account**
   - Sign up at https://wasabi.com
   - Choose region (us-east-1 recommended)

2. **Create Bucket**
   ```bash
   aws s3 mb s3://lifescape-images \
     --endpoint-url https://s3.us-east-1.wasabisys.com \
     --region us-east-1
   ```

3. **Configure CORS** (for browser uploads)
   ```json
   [
       {
           "AllowedHeaders": ["*"],
           "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
           "AllowedOrigins": ["*"],
           "ExposeHeaders": ["ETag"],
           "MaxAgeSeconds": 3000
       }
   ]
   ```

4. **Set Bucket Policy** (for public read)
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Effect": "Allow",
               "Principal": "*",
               "Action": "s3:GetObject",
               "Resource": "arn:aws:s3:::lifescape-images/*"
           }
       ]
   }
   ```

5. **Set Environment Variables** in Lambda:
   ```
   WASABI_ENDPOINT=https://s3.us-east-1.wasabisys.com
   WASABI_REGION=us-east-1
   WASABI_BUCKET_NAME=lifescape-images
   WASABI_ACCESS_KEY=your_access_key
   WASABI_SECRET_KEY=your_secret_key
   ```

6. **Deploy Updated Code**
   ```bash
   cd sls-lifescape
   npx serverless deploy --stage prod
   ```

---

## Testing Steps

### Test 1: Create Moment with Cloudinary

1. Open test page
2. Select "Cloudinary" storage option
3. Fill in form fields
4. Upload images
5. Click "Create Moment"
6. Verify success message

### Test 2: Create Moment with Wasabi

1. Ensure Wasabi credentials are set in Lambda
2. Open test page
3. Select "Wasabi" storage option
4. Fill in form fields
5. Upload images
6. Click "Create Moment"
7. Verify success message
8. Check Wasabi bucket for uploaded images

### Test 3: Verify Moment Creation

```bash
# Get moment details
curl -X GET \
  "https://xj78ujjf44.execute-api.us-east-1.amazonaws.com/prod/moment/{moment_id}" \
  -H "Content-Type: application/json"
```

---

## Troubleshooting

### Issue: "Authentication failed"
**Solution:** 
- Verify Cognito token is valid
- Check token hasn't expired
- Ensure token is in correct format: `Bearer <token>`

### Issue: "Wasabi upload failed"
**Solution:**
- Verify Wasabi credentials in Lambda environment variables
- Check bucket exists and is accessible
- Verify CORS configuration
- Check Lambda execution role has S3 permissions

### Issue: "Media upload failed"
**Solution:**
- Check image size (Lambda has 6MB limit for direct uploads)
- Verify base64 encoding is correct
- Check DynamoDB table exists and is accessible

### Issue: "Moment creation failed"
**Solution:**
- Verify media IDs are valid
- Check user_id exists
- Verify DynamoDB permissions

---

## Cost Comparison

### Cloudinary
- Storage: $0.10/GB/month
- Bandwidth: $0.10/GB
- **Example:** 100GB storage + 500GB bandwidth = $60/month

### Wasabi
- Storage: $5.99/TB/month (~$0.006/GB)
- Bandwidth: FREE (no egress fees)
- **Example:** 100GB storage + unlimited bandwidth = $0.60/month

**Savings:** ~$59/month (98% reduction)

---

## Next Steps

1. ✅ **Test Page Created** - Ready to use
2. ✅ **Wasabi Function Added** - Ready to deploy
3. ⚠️ **Set Wasabi Credentials** - Required for Wasabi option
4. ⚠️ **Deploy Updated Code** - Deploy serverless.yml changes
5. ⚠️ **Test Both Options** - Verify Cloudinary and Wasabi work
6. ⚠️ **Monitor Costs** - Compare actual usage costs

---

## Files Modified

1. **`sls-lifescape/media.js`**
   - Added `uploadToWasabi()` function
   - S3-compatible Wasabi upload
   - Automatic DynamoDB save

2. **`sls-lifescape/serverless.yml`**
   - Added `uploadToWasabi` Lambda function
   - Added `/media/wasabi/upload` endpoint
   - Added Wasabi environment variables

3. **`test-moment-creation.html`**
   - Complete test interface
   - Cloudinary and Wasabi support
   - Image upload and preview
   - Moment creation

---

## Support

For issues or questions:
1. Check CloudWatch logs for Lambda errors
2. Verify environment variables are set
3. Test API endpoints directly with curl/Postman
4. Review Wasabi documentation: https://docs.wasabi.com





