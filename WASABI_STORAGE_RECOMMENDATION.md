# Wasabi Storage Integration Recommendation

## Overview

Wasabi is an S3-compatible object storage service that offers cost-effective storage solutions. This document evaluates Wasabi as an alternative to Cloudinary for image storage in the Lifescape backend.

---

## Current Implementation: Cloudinary

### Pros
- ✅ **Image Processing**: Built-in transformations, resizing, format conversion
- ✅ **CDN**: Global content delivery network included
- ✅ **Easy Integration**: Simple API, good documentation
- ✅ **Automatic Optimization**: Image compression and optimization
- ✅ **Already Implemented**: Currently in use

### Cons
- ❌ **Cost**: Can be expensive at scale ($0.10/GB storage + bandwidth)
- ❌ **Vendor Lock-in**: Proprietary API (though has SDKs)
- ❌ **Limited Control**: Less control over storage infrastructure

---

## Wasabi Alternative

### Pros
- ✅ **Cost-Effective**: ~$5.99/TB/month (much cheaper than Cloudinary)
- ✅ **S3-Compatible**: Works with AWS SDK (already in your stack)
- ✅ **No Egress Fees**: Free data transfer (huge cost savings)
- ✅ **High Performance**: Fast upload/download speeds
- ✅ **More Control**: Full control over storage buckets and policies

### Cons
- ❌ **No Built-in Image Processing**: Need to handle transformations separately
- ❌ **No CDN**: Would need to add CloudFront or similar
- ❌ **More Setup**: Requires bucket configuration, CORS, policies
- ❌ **Manual Optimization**: Need to implement image optimization

---

## Cost Comparison

### Cloudinary (Estimated Monthly)
- Storage: 100GB × $0.10 = $10
- Bandwidth: 500GB × $0.10 = $50
- **Total: ~$60/month**

### Wasabi (Estimated Monthly)
- Storage: 100GB × $5.99/TB = $0.60
- Bandwidth: FREE (no egress fees)
- CloudFront CDN (optional): ~$10-20/month
- **Total: ~$1-21/month**

**Savings: ~$40-60/month** (67-97% cost reduction)

---

## Recommendation: Hybrid Approach

### Best Solution: Use Both

1. **Wasabi for Storage** (Primary)
   - Store original images
   - Cost-effective bulk storage
   - S3-compatible API

2. **Cloudinary for Processing** (On-demand)
   - Transform images when needed
   - Generate thumbnails/resized versions
   - Serve optimized images via CDN

3. **CloudFront CDN** (Optional)
   - Serve Wasabi images globally
   - Lower latency
   - Additional cost savings

---

## Implementation Strategy

### Option 1: Full Migration to Wasabi (Recommended for Cost Savings)

**Steps:**
1. Create Wasabi bucket
2. Configure CORS and bucket policies
3. Create Lambda function for image upload
4. Implement image optimization (sharp library)
5. Optionally add CloudFront CDN

**Code Changes:**
- New Lambda function: `uploadToWasabi`
- Update `saveMedia` to accept Wasabi URLs
- Add image processing with `sharp` library

### Option 2: Hybrid Approach

**Steps:**
1. Upload original to Wasabi
2. Process with Cloudinary on-demand
3. Store both URLs in DynamoDB

**Code Changes:**
- Upload to Wasabi first
- Generate Cloudinary URL for processed versions
- Store both URLs

### Option 3: Keep Cloudinary (Current)

**Best if:**
- Current costs are acceptable
- Image processing features are critical
- Don't want to manage infrastructure

---

## Wasabi Integration Code Example

### Lambda Function for Wasabi Upload

```javascript
const AWS = require('aws-sdk');

// Configure Wasabi S3 client
const s3 = new AWS.S3({
    endpoint: 'https://s3.us-east-1.wasabisys.com',
    region: 'us-east-1',
    credentials: {
        accessKeyId: process.env.WASABI_ACCESS_KEY,
        secretAccessKey: process.env.WASABI_SECRET_KEY
    },
    s3ForcePathStyle: true // Required for Wasabi
});

module.exports.uploadToWasabi = async (event) => {
    const { imageBase64, userId, filename } = JSON.parse(event.body);
    
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    
    // Generate unique key
    const key = `moments/${userId}/${Date.now()}-${filename}`;
    
    // Upload to Wasabi
    const params = {
        Bucket: process.env.WASABI_BUCKET_NAME,
        Key: key,
        Body: imageBuffer,
        ContentType: 'image/jpeg',
        ACL: 'public-read' // Or use bucket policy
    };
    
    try {
        const result = await s3.upload(params).promise();
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                url: result.Location,
                key: key,
                bucket: process.env.WASABI_BUCKET_NAME
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
```

### Environment Variables Needed

```bash
WASABI_ACCESS_KEY=your_access_key
WASABI_SECRET_KEY=your_secret_key
WASABI_BUCKET_NAME=lifescape-images
WASABI_ENDPOINT=https://s3.us-east-1.wasabisys.com
```

---

## Setup Instructions for Wasabi

### 1. Create Wasabi Account
- Sign up at https://wasabi.com
- Choose region (us-east-1 recommended for AWS compatibility)

### 2. Create Bucket
```bash
# Using AWS CLI (configured for Wasabi)
aws s3 mb s3://lifescape-images \
  --endpoint-url https://s3.us-east-1.wasabisys.com \
  --region us-east-1
```

### 3. Configure CORS
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

### 4. Set Bucket Policy (Public Read)
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

---

## Image Processing with Sharp

Since Wasabi doesn't provide image processing, use Sharp library:

```javascript
const sharp = require('sharp');

async function processImage(imageBuffer) {
    // Generate thumbnail
    const thumbnail = await sharp(imageBuffer)
        .resize(300, 300, { fit: 'inside' })
        .jpeg({ quality: 80 })
        .toBuffer();
    
    // Generate medium size
    const medium = await sharp(imageBuffer)
        .resize(1200, 1200, { fit: 'inside' })
        .jpeg({ quality: 85 })
        .toBuffer();
    
    return { thumbnail, medium };
}
```

---

## Migration Plan

### Phase 1: Setup (Week 1)
1. Create Wasabi account and bucket
2. Configure CORS and policies
3. Add Wasabi credentials to Lambda
4. Create upload function

### Phase 2: Implementation (Week 2)
1. Implement image upload to Wasabi
2. Add image processing with Sharp
3. Update `saveMedia` function
4. Test with test page

### Phase 3: Migration (Week 3)
1. Migrate existing images (optional)
2. Update frontend to use new endpoint
3. Monitor costs and performance

### Phase 4: Optimization (Week 4)
1. Add CloudFront CDN (optional)
2. Implement caching strategies
3. Optimize image sizes

---

## Recommendation Summary

**For Maximum Cost Savings:** Use Wasabi + Sharp for processing
- **Savings:** ~$40-60/month (67-97% reduction)
- **Effort:** Medium (requires image processing implementation)
- **Best for:** High volume, cost-sensitive applications

**For Ease of Use:** Keep Cloudinary
- **Savings:** None
- **Effort:** Low (already implemented)
- **Best for:** Quick deployment, image processing critical

**For Best of Both:** Hybrid approach
- **Savings:** Moderate (~$30-40/month)
- **Effort:** High (managing two systems)
- **Best for:** Complex requirements

---

## Next Steps

1. **Evaluate current Cloudinary costs** - Check actual usage
2. **Test Wasabi** - Create test bucket and upload sample images
3. **Implement upload function** - Create Lambda for Wasabi upload
4. **Update test page** - Add Wasabi option to test page
5. **Cost analysis** - Compare actual costs after testing

Would you like me to:
1. Create the Wasabi upload Lambda function?
2. Update the test page to support Wasabi?
3. Implement image processing with Sharp?
4. Set up CloudFront CDN integration?





