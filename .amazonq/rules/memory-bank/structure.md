# Lifescape Backend - Project Structure

## Directory Organization

### Root Structure
```
/Users/gene/Projects/Lifescape Backend/
├── serverless/                 # Main serverless services
├── scripts/                    # Deployment and utility scripts
├── *.md                       # Documentation and guides
└── test-*.json               # API testing files
```

### Core Services (`serverless/`)

#### **sls-lifescape/** - Main API Service
The primary service containing 65+ Lambda functions and core business logic:

```
sls-lifescape/
├── lib/model/                 # Data models and business logic
│   ├── activitylog.js        # User activity tracking
│   ├── comment.js            # Comment management
│   ├── firebase-user.js      # Firebase user integration
│   ├── mapbox.js            # Location services
│   ├── media.js             # Media upload/management
│   ├── moment.js            # Core moment functionality
│   ├── object_permissions.js # Access control
│   ├── oneall.js            # Social login integration
│   ├── sns.js               # Push notifications
│   └── thread.js            # Thread management
├── event/                    # Lambda event test files
├── ses_template/            # Email templates
├── .serverless/             # Deployment artifacts
├── cognito-*.js            # Authentication handlers
├── firebase-*.js           # Firebase integration
├── migration.js            # Data migration utilities
├── moment.js               # Moment API endpoints
├── thread.js               # Thread API endpoints
├── user.js                 # User API endpoints
├── comment.js              # Comment API endpoints
├── media.js                # Media API endpoints
└── serverless.yml          # Service configuration
```

#### **sls-firebase-validator/** - Authentication Service
Firebase JWT token validation and authorization:
- `firebase-validator.js` - Token validation logic
- `package.json` - Dependencies for JWT handling

#### **sls-getstream/** - Social Feed Service
GetStream.io integration for activity feeds:
- `feed.js` - Feed management
- `user.js` - User feed operations

#### **sls-elasticsearch/** - Search Service
Elasticsearch integration for content search:
- `connection.js` - Elasticsearch client setup
- `user.js` - User search functionality

## Core Components & Relationships

### API Layer
- **API Gateway**: REST endpoints with request validation
- **Lambda Functions**: Serverless compute for business logic
- **Authorizers**: Firebase/Cognito token validation

### Data Layer
- **DynamoDB**: Primary NoSQL database for user data, moments, threads
- **Elasticsearch**: Search index for content discovery
- **Cloudinary**: Media storage and transformation

### Integration Layer
- **Firebase**: Authentication and real-time features
- **GetStream.io**: Social activity feeds
- **SendGrid**: Email notifications
- **Mapbox**: Location services
- **SNS**: Push notifications

### Security Layer
- **JWT Validation**: Token-based authentication
- **Object Permissions**: Fine-grained access control
- **API Gateway**: Request validation and rate limiting

## Architectural Patterns

### Microservices Architecture
- **Service Separation**: Each `sls-*` directory is an independent service
- **Single Responsibility**: Services focused on specific domains
- **Independent Deployment**: Services can be deployed separately

### Serverless Patterns
- **Function per Endpoint**: Each API endpoint has dedicated Lambda function
- **Event-Driven**: Asynchronous processing with SNS/SQS
- **Stateless Design**: No server-side session management

### Data Access Patterns
- **Model Layer**: Centralized data access in `lib/model/`
- **Response Formatting**: Standardized API responses via `lib/response.js`
- **Permission Checks**: Consistent authorization via `object_permissions.js`

### Configuration Management
- **Environment Variables**: Sensitive data via Lambda environment
- **YAML Configuration**: Service definitions in `serverless.yml`
- **Stage-based Deployment**: Production/development environment separation

## Development Workflow
1. **Local Development**: Test functions locally with `serverless invoke local`
2. **Event Testing**: Use JSON files in `event/` directories for testing
3. **Deployment**: Stage-based deployment with AWS profiles
4. **Monitoring**: CloudWatch logs and API Gateway metrics