# Lifescape Backend - Technology Stack

## Programming Languages & Runtime

### JavaScript (Node.js)
- **Runtime**: Node.js 12.x or higher
- **Primary Language**: All Lambda functions written in JavaScript
- **ES6+ Features**: Modern JavaScript syntax and features

## Build System & Framework

### Serverless Framework v3
- **Infrastructure as Code**: YAML-based service definitions
- **Deployment**: Automated AWS resource provisioning
- **Plugins**: 
  - `serverless-plugin-split-stacks` - CloudFormation stack splitting
  - `serverless-reqvalidator-plugin` - Request validation
  - `serverless-aws-documentation` - API documentation

### Package Management
- **npm**: Node.js package manager
- **package-lock.json**: Dependency version locking

## Core Dependencies

### AWS SDK & Services
```json
"aws-sdk": "^2.616.0"
```
- **DynamoDB**: NoSQL database operations
- **S3**: File storage (if needed)
- **SNS**: Push notifications
- **SES**: Email services (backup to SendGrid)

### Authentication & Security
```json
"jsonwebtoken": "^9.0.3",
"jwk-to-pem": "^2.0.7"
```
- **JWT**: Token validation and parsing
- **JWK to PEM**: Convert JSON Web Keys to PEM format for verification

### External Service Integrations
```json
"@sendgrid/mail": "^6.4.0",
"sendgrid": "^5.2.3",
"cloudinary": "^1.41.3",
"mapbox": "^1.0.0-beta10"
```
- **SendGrid**: Email delivery service
- **Cloudinary**: Image/video upload and transformation
- **Mapbox**: Location services and geocoding

### Database & Utilities
```json
"mysql": "^2.17.1",
"url-exists": "^1.0.3"
```
- **MySQL**: Relational database support (legacy/migration)
- **URL Validation**: Check URL existence

## AWS Infrastructure

### Compute
- **AWS Lambda**: Serverless function execution
- **API Gateway**: REST API endpoints and request routing

### Storage
- **DynamoDB**: Primary NoSQL database
- **Elasticsearch**: Search and analytics
- **CloudWatch**: Logging and monitoring

### Security & Access
- **IAM**: Identity and access management
- **Cognito**: User authentication (migration target)
- **API Gateway Authorizers**: Custom authentication logic

## Development Commands

### Installation
```bash
# Install dependencies
cd sls-lifescape
npm install

# Install Serverless plugins
npm install --save-dev serverless-plugin-split-stacks serverless-reqvalidator-plugin serverless-aws-documentation
```

### Local Development
```bash
# Test function locally
serverless invoke local --function createThread --path event/createThread.json

# Start local API Gateway
serverless offline
```

### Deployment
```bash
# Deploy entire service
serverless deploy --stage prod --profile lifescape

# Deploy single function
serverless deploy function --function createThread --stage prod

# Remove service
serverless remove --stage prod
```

### Testing
```bash
# Run tests (when implemented)
npm test

# Validate serverless configuration
serverless print
```

## Environment Configuration

### AWS Credentials
```bash
export AWS_PROFILE=lifescape
export AWS_REGION=us-east-1
```

### Service Configuration
```bash
export SENDGRID_API_KEY=your_sendgrid_key
# Firebase credentials set in Lambda environment variables
```

### Deployment Targets
- **Production**: Account `872469723818`, Region `us-east-1`
- **Development**: Account `834616002870`, Region `us-east-1`

## Version Requirements
- **Node.js**: 12.x or higher
- **Serverless Framework**: v3.x
- **AWS CLI**: Latest version
- **npm**: 6.x or higher

## Performance Considerations
- **Cold Start Optimization**: Minimal dependencies in Lambda functions
- **Connection Pooling**: Reuse database connections across invocations
- **Async Operations**: Non-blocking I/O for external service calls
- **Memory Allocation**: Optimized Lambda memory settings per function