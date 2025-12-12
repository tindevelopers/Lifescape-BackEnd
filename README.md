# Lifescape Backend

AWS Serverless API Gateway and Lambda functions for the Lifescape application.

## Overview

This repository contains the serverless backend infrastructure for Lifescape, including:

- **API Gateway** endpoints for REST API
- **Lambda functions** for business logic
- **Firebase Authentication** integration
- **DynamoDB** data models
- **GetStream.io** integration for social feeds
- **Elasticsearch** integration for search
- **SendGrid** integration for email

## Architecture

### Services

- **sls-lifescape/** - Main Lifescape API (60+ Lambda functions)
- **sls-firebase-validator/** - Firebase authentication authorizer
- **sls-getstream/** - GetStream.io social feed integration
- **sls-elasticsearch/** - Elasticsearch search integration

### API Gateway

**Production API:**
- **Base URL:** `https://1hwkqes839.execute-api.us-east-1.amazonaws.com/prod`
- **Account:** `872469723818` (production)
- **Region:** `us-east-1`

**Development API:**
- **Base URL:** `https://2hezou3hhe.execute-api.us-east-1.amazonaws.com/prod`
- **Account:** `834616002870` (development)
- **Region:** `us-east-1`

## Quick Start

### Prerequisites

- Node.js 12.x or higher
- AWS CLI configured
- Serverless Framework v3
- Firebase Admin SDK credentials

### Installation

```bash
# Install dependencies
cd sls-lifescape
npm install

# Install Serverless Framework plugins
npm install --save-dev serverless-plugin-split-stacks serverless-reqvalidator-plugin serverless-aws-documentation
```

### Configuration

1. **Set up AWS credentials:**
   ```bash
   aws configure --profile lifescape
   ```

2. **Set environment variables:**
   ```bash
   export AWS_PROFILE=lifescape
   export AWS_REGION=us-east-1
   export SENDGRID_API_KEY=your_sendgrid_key
   ```

3. **Configure Firebase:**
   - Set Firebase credentials in environment variables
   - See `sls-firebase-validator/` for setup

### Deployment

```bash
# Deploy to production
cd sls-lifescape
serverless deploy --stage prod --profile lifescape

# Deploy specific function
serverless deploy function --function createThread --stage prod
```

## API Endpoints

### Threads
- `POST /thread` - Create thread
- `GET /user/{user_id}/thread/{thread_id}` - Get thread
- `GET /{byfilter}/{byfilter_id}/threads/{flag}` - List threads
- `PUT /user/{user_id}/thread/{thread_id}` - Edit thread
- `DELETE /user/{user_id}/thread/{thread_id}` - Delete thread

### Moments
- `POST /moment` - Create moment
- `GET /moment/{object_id}` - Get moment (public)
- `GET /user/{user_id}/moment/{object_id}` - Get moment (auth)
- `PATCH /user/{user_id}/moment/{object_id}` - Edit moment
- `DELETE /user/{user_id}/moment/{object_id}` - Delete moment

See `FRONTEND_INTEGRATION_GUIDE.md` for complete API documentation.

## Authentication

All endpoints require Firebase Authentication. Include the Firebase ID token in the `Authorization` header:

```
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

## Frontend Integration

See `FRONTEND_INTEGRATION_GUIDE.md` for:
- API client setup
- Authentication examples
- React/TypeScript integration
- Error handling

## Documentation

- **FRONTEND_INTEGRATION_GUIDE.md** - Complete frontend integration guide
- **FRONTEND_QUICK_REFERENCE.md** - Quick API reference
- **ENDPOINT_TEST_RESULTS.md** - Endpoint testing results
- **API_GATEWAY_RECONNECTION_COMPLETE.md** - API Gateway reconnection details
- **DEPLOYED_BRANCH_CONFIRMED.md** - Deployment branch analysis

## Security

⚠️ **Important:** This repository does not contain secrets or credentials. All sensitive values use environment variables:

- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` - AWS credentials
- `SENDGRID_API_KEY` - SendGrid API key
- Firebase credentials - Set in Lambda environment variables

See `.gitignore` for excluded files.

## Development

### Local Testing

```bash
# Test Lambda function locally
serverless invoke local --function createThread --path event/createThread.json

# Start API Gateway locally
serverless offline
```

### Testing

```bash
# Test endpoints
curl -X POST https://1hwkqes839.execute-api.us-east-1.amazonaws.com/prod/thread \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"Test"}'
```

## Deployment Status

- ✅ **Production:** Deployed and functional
- ✅ **Endpoints:** 14+ endpoints connected and tested
- ✅ **Lambda Functions:** 65 functions deployed
- ✅ **API Gateway:** Connected and active

## Contributing

1. Create a feature branch
2. Make your changes
3. Test locally
4. Submit a pull request

## License

See individual service directories for license information.

## Support

For issues or questions:
- Check CloudWatch logs for Lambda errors
- Review API Gateway deployment status
- See documentation files for integration guides

---

**Last Updated:** 2025-12-11  
**Status:** ✅ Production Ready
