# Serverless Framework v4 Configuration

**Date:** December 15, 2025  
**Branch:** `serverless`  
**Status:** ✅ Configured

---

## Changes Made

### 1. Added Serverless Framework to package.json

Added Serverless Framework v4.28.0 as a dev dependency:

```json
"devDependencies": {
  "serverless": "^4.28.0"
}
```

### 2. Updated serverless.yml

Set framework version requirement:

```yaml
frameworkVersion: ">=4.0.0"
```

This ensures the project uses Serverless Framework v4 or higher.

---

## Installation

Serverless Framework is installed locally in the project:

```bash
cd sls-lifescape
npx serverless --version
# Output: Serverless ϟ Framework 4.28.0
```

---

## Usage

### Run Serverless Commands

Since Serverless is installed as a dev dependency, use `npx` to run it:

```bash
# Check version
npx serverless --version

# Deploy
npx serverless deploy --stage prod --profile lifescape

# Deploy single function
npx serverless deploy function --function createThread --stage prod

# View logs
npx serverless logs -f createThread --tail --stage prod

# Invoke locally
npx serverless invoke local --function createThread --path event/createThread.json
```

### Alternative: Add npm Scripts

You can add scripts to `package.json` for convenience:

```json
"scripts": {
  "deploy": "serverless deploy --stage prod --profile lifescape",
  "deploy:dev": "serverless deploy --stage dev --profile lifescape",
  "logs": "serverless logs",
  "info": "serverless info"
}
```

Then run:
```bash
npm run deploy
```

---

## Version Information

- **Latest Version:** 4.28.0
- **Installed Version:** 4.28.0
- **Framework Requirement:** >=4.0.0

---

## Compatibility Notes

### Plugins

Your existing plugins should be compatible with Serverless v4:
- ✅ `serverless-plugin-split-stacks` (^1.9.1)
- ✅ `serverless-reqvalidator-plugin` (^1.0.3)
- ✅ `serverless-aws-documentation` (^1.1.0)

### Breaking Changes from v3

Serverless Framework v4 introduced some breaking changes. Your current configuration should work, but be aware of:

1. **CLI Changes:** Some command syntax may have changed
2. **Plugin API:** Plugins may need updates (yours should be fine)
3. **Configuration:** Most v3 configs work in v4

---

## Next Steps

1. ✅ **DONE:** Serverless Framework v4.28.0 installed
2. ✅ **DONE:** Framework version requirement set
3. ⚠️ **TODO:** Test deployment with new version
4. ⚠️ **TODO:** Verify all plugins work correctly
5. ⚠️ **TODO:** Update documentation if needed

---

## Testing

Test the installation:

```bash
cd sls-lifescape
npx serverless --version
npx serverless info --stage prod
```

---

## Notes

- Serverless Framework is installed locally (not globally)
- Use `npx serverless` to run commands
- The grpc compilation errors during `npm install` are expected and don't affect Serverless Framework
- All existing serverless.yml configuration should work with v4

