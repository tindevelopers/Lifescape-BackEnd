# How to Get Cloudinary Credentials

**Date:** December 14, 2025  
**Purpose:** Step-by-step guide to retrieve Cloudinary API credentials

---

## Step 1: Access Cloudinary Dashboard

1. **Go to Cloudinary Console:**
   - URL: https://cloudinary.com/console
   - Or: https://console.cloudinary.com/

2. **Sign In:**
   - Use your Cloudinary account credentials
   - If you don't have access, contact the account owner/admin

---

## Step 2: Select Your Account

1. **Verify Account Name:**
   - The account should be: **`lifescape`**
   - You can see this in the top-left corner of the dashboard
   - URL will show: `https://console.cloudinary.com/settings/lifescape/...`

---

## Step 3: Navigate to API Settings

**Option A: Via Settings Menu**
1. Click on **"Settings"** in the top navigation bar
2. Look for **"Security"** or **"API Keys"** section
3. Click on it

**Option B: Direct URL**
- Go directly to: https://console.cloudinary.com/settings/lifescape/security

---

## Step 4: Find Your Credentials

On the Security/API Keys page, you'll see:

### 1. Cloud Name
- **Label:** "Cloud name"
- **Value:** `lifescape`
- **Location:** Usually at the top of the page
- **Note:** This is already known and used in the code

### 2. API Key
- **Label:** "API Key" or "API Key (Environment variable: CLOUDINARY_API_KEY)"
- **Value:** A long string like: `123456789012345`
- **Location:** In the "API Keys" section
- **Action:** Click "Reveal" or "Show" to see the full key

### 3. API Secret
- **Label:** "API Secret" or "API Secret (Environment variable: CLOUDINARY_API_SECRET)"
- **Value:** A long string like: `abcdefghijklmnopqrstuvwxyz123456`
- **Location:** In the "API Keys" section
- **Action:** Click "Reveal" or "Show" to see the full secret
- **⚠️ Important:** This is sensitive - keep it secure!

### 4. Upload Preset
- **Label:** "Upload presets"
- **Value:** `lifescape_angular`
- **Location:** Go to Settings → Upload tab
- **URL:** https://console.cloudinary.com/settings/lifescape/upload_presets
- **Note:** This is already known and used in the code

---

## Step 5: Copy the Credentials

**What you need to copy:**

1. **CLOUDINARY_CLOUD_NAME:** `lifescape` (already known)
2. **CLOUDINARY_API_KEY:** Copy the full API Key value
3. **CLOUDINARY_API_SECRET:** Copy the full API Secret value
4. **CLOUDINARY_UPLOAD_PRESET:** `lifescape_angular` (already known)

---

## Step 6: Set Environment Variables

Once you have the credentials, set them in Lambda:

### Using AWS CLI:

```bash
aws lambda update-function-configuration \
  --function-name LifeScape-prod-saveMedia \
  --environment "Variables={
    DEFAULT_CHANNEL=My Lifescape,
    SENDGRID_API_KEY=YOUR_SENDGRID_API_KEY,
    AWS_REGIONNAME=us-east-1,
    SITE_URL=https://my.lifescape.com,
    CLOUDINARY_CLOUD_NAME=lifescape,
    CLOUDINARY_API_KEY=YOUR_API_KEY_HERE,
    CLOUDINARY_API_SECRET=YOUR_API_SECRET_HERE,
    CLOUDINARY_UPLOAD_PRESET=lifescape_angular
  }" \
  --profile lifescape \
  --region us-east-1
```

**Replace:**
- `YOUR_API_KEY_HERE` with the actual API Key
- `YOUR_API_SECRET_HERE` with the actual API Secret

### Using AWS Console:

1. Go to AWS Lambda Console: https://console.aws.amazon.com/lambda/
2. Select function: `LifeScape-prod-saveMedia`
3. Go to **Configuration** → **Environment variables**
4. Click **Edit**
5. Add each variable:
   - Key: `CLOUDINARY_CLOUD_NAME`, Value: `lifescape`
   - Key: `CLOUDINARY_API_KEY`, Value: `[paste your API key]`
   - Key: `CLOUDINARY_API_SECRET`, Value: `[paste your API secret]`
   - Key: `CLOUDINARY_UPLOAD_PRESET`, Value: `lifescape_angular`
6. Click **Save**

---

## Visual Guide

### Cloudinary Dashboard Layout:

```
┌─────────────────────────────────────────┐
│  Cloudinary Console                     │
│  [lifescape] ▼                          │
├─────────────────────────────────────────┤
│  Media Library | Transformations | ...  │
│  Settings ▼                              │
│    ├─ Security (API Keys) ← GO HERE     │
│    ├─ Upload (Upload Presets)           │
│    └─ ...                                │
└─────────────────────────────────────────┘
```

### API Keys Section:

```
┌─────────────────────────────────────────┐
│  API Keys                               │
├─────────────────────────────────────────┤
│  Cloud name: lifescape                  │
│                                          │
│  API Key:                               │
│  [123456789012345] [Reveal] ← Click    │
│                                          │
│  API Secret:                            │
│  [****************] [Reveal] ← Click    │
└─────────────────────────────────────────┘
```

---

## Troubleshooting

### "I don't see the API Keys section"
- **Solution:** Make sure you're logged in as an admin/owner
- Contact the Cloudinary account owner for access

### "I can't reveal the API Secret"
- **Solution:** Some accounts require additional permissions
- Contact account admin to grant you access

### "The credentials don't work"
- **Check:** Make sure you copied the full key/secret (no spaces)
- **Check:** Verify you're using the correct account (`lifescape`)
- **Check:** Ensure environment variables are set correctly in Lambda

### "Where is the upload preset?"
- **Location:** Settings → Upload → Upload presets
- **Direct URL:** https://console.cloudinary.com/settings/lifescape/upload_presets
- **Look for:** `lifescape_angular` in the list

---

## Security Best Practices

⚠️ **Important Security Notes:**

1. **Never commit credentials to Git**
   - Keep them in environment variables only
   - Use AWS Secrets Manager for production (optional)

2. **Don't share credentials**
   - API Secret is sensitive
   - Only share with authorized team members

3. **Rotate credentials if compromised**
   - Go to Cloudinary Settings → Security
   - Click "Regenerate" for API Secret if needed

4. **Use least privilege**
   - Only grant access to those who need it
   - Use separate API keys for different environments if possible

---

## Alternative: Check Existing Configuration

If credentials are already set somewhere, you can check:

### Check Lambda Environment Variables:
```bash
aws lambda get-function-configuration \
  --function-name LifeScape-prod-saveMedia \
  --profile lifescape \
  --region us-east-1 \
  --query 'Environment.Variables' \
  --output json
```

### Check if in AWS Secrets Manager:
```bash
aws secretsmanager list-secrets \
  --profile lifescape \
  --region us-east-1 \
  --query 'SecretList[?contains(Name, `cloudinary`) || contains(Name, `Cloudinary`)].Name' \
  --output text
```

---

## Need Help?

If you can't access the Cloudinary dashboard:
1. Contact the Cloudinary account owner/admin
2. Ask for:
   - Access to the `lifescape` account
   - API Key and API Secret
   - Confirmation of upload preset name

If you have access but can't find credentials:
1. Check if you're on the correct account (`lifescape`)
2. Look in Settings → Security → API Keys
3. Contact Cloudinary support if still having issues

---

## Quick Reference

**Cloudinary Dashboard:** https://console.cloudinary.com/  
**API Keys URL:** https://console.cloudinary.com/settings/lifescape/security  
**Upload Presets URL:** https://console.cloudinary.com/settings/lifescape/upload_presets

**Required Values:**
- Cloud Name: `lifescape`
- API Key: `[from dashboard]`
- API Secret: `[from dashboard]`
- Upload Preset: `lifescape_angular`

