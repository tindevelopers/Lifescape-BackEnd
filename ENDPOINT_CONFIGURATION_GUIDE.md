# How to Configure Endpoints in Serverless Framework

**Complete Guide: Defining API Endpoints and How Serverless Framework Sets Them Up**

---

## Overview

Serverless Framework reads your `serverless.yml` file to determine:
1. **What endpoints you need** (from the `events` section)
2. **Which Lambda function handles each endpoint** (from the `handler` field)
3. **How to configure API Gateway** (from the `http` event configuration)

---

## The Connection: YAML → Code → API Gateway

```
serverless.yml (Configuration)
    ↓
    Defines: handler, path, method
    ↓
Your Code (thread.js, user.js, etc.)
    ↓
    Exports: module.exports.create, module.exports.edit, etc.
    ↓
API Gateway (Created by Serverless)
    ↓
    Routes: POST /thread → Lambda function
```

---

## Step-by-Step: How to Define an Endpoint

### 1. Define the Function in `serverless.yml`

Here's how your `createThread` endpoint is defined:

```yaml
functions:
  createThread:                    # Function name (internal to Serverless)
    handler: thread.create          # Points to thread.js → create() function
    events:                         # What triggers this function
      - http:                       # HTTP event (API Gateway)
          path: /thread             # URL path
          method: post              # HTTP method
          cors: true                 # Enable CORS
          integration: lambda        # Integration type
          authorizer:                # Authentication
            arn: arn:aws:lambda:us-east-1:872469723818:function:Auth-dev-authorizer
```

### 2. Create the Handler Function in Your Code

In `thread.js`, you export a function that matches the handler:

```javascript
// thread.js
module.exports.create = (event, context, callback) => {
    // This function is called when POST /thread is hit
    const data = event.body;
    var user_id = event.body.user_id;
    // ... your logic ...
    callback(null, JSON.stringify(response));
}
```

### 3. Serverless Framework Automatically Creates:

- ✅ **API Gateway Resource:** `/thread`
- ✅ **API Gateway Method:** `POST`
- ✅ **Lambda Function:** `LifeScape-prod-createThread`
- ✅ **Integration:** Connects API Gateway → Lambda
- ✅ **CORS Configuration:** Adds CORS headers
- ✅ **Authorizer:** Protects endpoint with Firebase auth

---

## Complete Endpoint Configuration Examples

### Example 1: Simple POST Endpoint

```yaml
functions:
  createThread:
    handler: thread.create
    events:
      - http:
          path: /thread
          method: post
          cors: true
          integration: lambda
          authorizer: 
            arn: arn:aws:lambda:us-east-1:872469723818:function:Auth-dev-authorizer
```

**What This Creates:**
- **Endpoint:** `POST https://1hwkqes839.execute-api.us-east-1.amazonaws.com/prod/thread`
- **Handler:** `thread.js` → `create()` function
- **Protected:** Requires Firebase token in Authorization header

### Example 2: GET with Path Parameters

```yaml
functions:
  getThread:
    handler: thread.get
    events:
      - http:
          path: /user/{user_id}/thread/{thread_id}
          method: GET
          cors: true
          integration: lambda
          request:
            parameters:
              paths:
                thread_id: true    # Makes thread_id required
          authorizer: 
            arn: arn:aws:lambda:us-east-1:872469723818:function:Auth-dev-authorizer
```

**What This Creates:**
- **Endpoint:** `GET /user/{user_id}/thread/{thread_id}`
- **Example:** `GET /user/abc123/thread/xyz789`
- **Path Parameters:** Available in `event.pathParameters` or `event.path`
- **Handler:** `thread.js` → `get()` function

**In Your Code:**
```javascript
module.exports.get = (event, context, callback) => {
    // Access path parameters
    var user_id = event.path.user_id;        // or event.pathParameters.user_id
    var thread_id = event.path.thread_id;    // or event.pathParameters.thread_id
    // ... your logic ...
}
```

### Example 3: PATCH with Path Parameters

```yaml
functions:
  editThread:
    handler: thread.edit
    events:
      - http:
          path: /user/{user_id}/thread/{thread_id}
          method: PATCH
          cors: true
          integration: lambda
          authorizer: 
            arn: arn:aws:lambda:us-east-1:872469723818:function:Auth-dev-authorizer
```

**What This Creates:**
- **Endpoint:** `PATCH /user/{user_id}/thread/{thread_id}`
- **Handler:** `thread.js` → `edit()` function
- **Body:** Available in `event.body`

### Example 4: DELETE Endpoint

```yaml
functions:
  deleteThread:
    handler: thread.delete
    events:
      - http:
          path: /user/{user_id}/thread/{thread_id}
          method: delete
          cors: true
          integration: lambda
          authorizer: 
            arn: arn:aws:lambda:us-east-1:872469723818:function:Auth-dev-authorizer
```

**What This Creates:**
- **Endpoint:** `DELETE /user/{user_id}/thread/{thread_id}`
- **Handler:** `thread.js` → `delete()` function

---

## Understanding the Configuration Structure

### Function Definition

```yaml
functions:
  functionName:              # Internal name (used for Lambda function name)
    handler: file.function   # JavaScript file and exported function
    events:                  # What triggers this function
      - http:                # HTTP event type
          # HTTP configuration...
```

### Handler Mapping

The `handler` field tells Serverless Framework:
- **File:** Which JavaScript file contains the code
- **Function:** Which exported function to call

```yaml
handler: thread.create
         ↑     ↑
         |     └─ Function name (module.exports.create)
         └─────── File name (thread.js)
```

**In Your Code:**
```javascript
// thread.js
module.exports.create = (event, context, callback) => { ... }
module.exports.edit = (event, context, callback) => { ... }
module.exports.get = (event, context, callback) => { ... }
```

### HTTP Event Configuration

```yaml
events:
  - http:
      path: /thread                    # URL path
      method: post                     # HTTP method (get, post, put, patch, delete)
      cors: true                       # Enable CORS
      integration: lambda              # Integration type (lambda = AWS_PROXY)
      authorizer:                      # Authentication
        arn: arn:aws:lambda:...        # Authorizer Lambda ARN
      request:                         # Request configuration
        parameters:                    # Path/query parameters
          paths:
            thread_id: true            # Required path parameter
      documentation:                   # API documentation
        summary: "Create a Thread"
        description: "Create New Thread"
```

---

## How Serverless Framework Determines What to Create

### 1. **Reads `serverless.yml`**

Serverless Framework scans your configuration file and finds:
- All functions under `functions:`
- All events under each function's `events:`
- All HTTP events with their paths and methods

### 2. **Creates Lambda Functions**

For each function, it creates a Lambda function:
- **Name:** `{service}-{stage}-{functionName}`
- **Example:** `LifeScape-prod-createThread`
- **Handler:** Points to your exported function
- **Runtime:** From `provider.runtime` (nodejs12.x)

### 3. **Creates API Gateway Resources**

For each HTTP event, it creates:
- **Resource:** The path (e.g., `/thread`, `/user/{user_id}/thread/{thread_id}`)
- **Method:** The HTTP method (GET, POST, etc.)
- **Integration:** Connects the method to your Lambda function

### 4. **Configures Integration**

Based on `integration: lambda`, it sets up:
- **Integration Type:** AWS_PROXY (passes request directly to Lambda)
- **Request Mapping:** Passes event to Lambda
- **Response Mapping:** Returns Lambda response as HTTP response

### 5. **Sets Up Authorization**

If `authorizer` is specified:
- Configures API Gateway to call authorizer Lambda first
- Passes token validation result to your function
- Sets `event.principalId` with user ID

### 6. **Configures CORS**

If `cors: true`:
- Adds OPTIONS method for preflight requests
- Adds CORS headers to responses
- Configures allowed origins, headers, methods

---

## Path Parameters: How They Work

### Defining Path Parameters

```yaml
path: /user/{user_id}/thread/{thread_id}
      └─────┘        └──────┘
      Parameter 1    Parameter 2
```

### Accessing in Your Code

**With AWS_PROXY integration:**
```javascript
module.exports.get = (event, context, callback) => {
    // Path parameters are in event.pathParameters
    var user_id = event.pathParameters.user_id;
    var thread_id = event.pathParameters.thread_id;
    
    // OR (if normalizeEvent was called)
    var user_id = event.path.user_id;
    var thread_id = event.path.thread_id;
}
```

### Making Parameters Required

```yaml
request:
  parameters:
    paths:
      thread_id: true    # Required
      user_id: false     # Optional (default)
```

---

## Query Parameters

### Defining Query Parameters

```yaml
path: /threads
method: GET
request:
  parameters:
    querystrings:
      page: true          # Required query parameter
      limit: false        # Optional query parameter
```

### Accessing in Your Code

```javascript
module.exports.list = (event, context, callback) => {
    // Query parameters are in event.queryStringParameters
    var page = event.queryStringParameters?.page || 1;
    var limit = event.queryStringParameters?.limit || 10;
}
```

---

## Request Body

### POST/PUT/PATCH with Body

```yaml
path: /thread
method: post
reqValidatorName: onlyBody    # Validates request body
```

### Accessing in Your Code

```javascript
module.exports.create = (event, context, callback) => {
    // Body is a string (needs parsing if JSON)
    const body = JSON.parse(event.body);
    // OR (if already parsed)
    const body = event.body;
    
    var user_id = body.user_id;
    var thread_name = body.thread_name;
}
```

---

## Complete Example: Adding a New Endpoint

### Step 1: Add to `serverless.yml`

```yaml
functions:
  # ... existing functions ...
  
  getThreadComments:
    handler: comment.getByThread
    events:
      - http:
          path: /thread/{thread_id}/comments
          method: GET
          cors: true
          integration: lambda
          request:
            parameters:
              paths:
                thread_id: true
          authorizer: 
            arn: arn:aws:lambda:us-east-1:872469723818:function:Auth-dev-authorizer
```

### Step 2: Create Handler in Code

```javascript
// comment.js
module.exports.getByThread = (event, context, callback) => {
    var thread_id = event.pathParameters.thread_id;
    
    // Your logic here
    commentob.getByThread(thread_id)
        .then(function(comments) {
            callback(null, {
                statusCode: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                body: JSON.stringify(comments)
            });
        })
        .catch(function(error) {
            callback(null, {
                statusCode: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                body: JSON.stringify({
                    statusCode: 500,
                    message: error.message
                })
            });
        });
}
```

### Step 3: Deploy

```bash
cd sls-lifescape
serverless deploy function --function getThreadComments --stage prod
```

### Step 4: Test

```bash
curl https://1hwkqes839.execute-api.us-east-1.amazonaws.com/prod/thread/abc123/comments \
  -H "Authorization: Bearer <token>"
```

---

## Common Configuration Options

### CORS Configuration

```yaml
cors: true  # Simple: enables default CORS

# OR detailed CORS:
cors:
  origin: '*'
  headers:
    - Content-Type
    - Authorization
  allowCredentials: false
```

### Custom Headers

```yaml
http:
  path: /thread
  method: post
  request:
    headers:
      X-Custom-Header: true  # Require custom header
```

### Request Validation

```yaml
reqValidatorName: onlyBody    # Uses a request validator
```

### Response Templates (Legacy - AWS integration)

```yaml
response:
  template: $input.path('$')
  statusCodes:
    200:
      pattern: ''
      template: $input.path('$')
    400:
      pattern: '.*"statusCode":400.*'
      template: '#set ($errorMessageObj = $util.parseJson($input.path("$.errorMessage"))) { "message" : "$errorMessageObj.message" }'
```

**Note:** With `integration: lambda` (AWS_PROXY), response templates are not used. Lambda returns HTTP responses directly.

---

## How Serverless Framework Names Things

### Lambda Function Names

```
{service}-{stage}-{functionName}
LifeScape-prod-createThread
```

### API Gateway Resource Names

```
/{path}
/thread
/user/{user_id}/thread/{thread_id}
```

### API Gateway Method Names

```
{HTTP_METHOD}
POST
GET
PATCH
DELETE
```

---

## Multiple Events Per Function

You can have multiple HTTP endpoints trigger the same function:

```yaml
functions:
  getThread:
    handler: thread.get
    events:
      - http:
          path: /thread/{thread_id}
          method: GET
      - http:
          path: /user/{user_id}/thread/{thread_id}
          method: GET
```

Both endpoints call the same `thread.get` function.

---

## Environment-Specific Configuration

### Using Different Configs

```yaml
# serverless.yml (default)
provider:
  stage: prod
  environment:
    API_URL: https://api.prod.com

# serverless.yml.dev
provider:
  stage: dev
  environment:
    API_URL: https://api.dev.com
```

### Deploying to Different Stages

```bash
serverless deploy --stage prod --config serverless.yml
serverless deploy --stage dev --config serverless.yml.dev
```

---

## Troubleshooting: How to Check What Was Created

### 1. List All Functions

```bash
serverless info --stage prod
```

### 2. Check API Gateway

```bash
aws apigateway get-rest-apis --profile lifescape --region us-east-1
aws apigateway get-resources --rest-api-id 1hwkqes839 --profile lifescape
```

### 3. Test Endpoint

```bash
curl -X POST https://1hwkqes839.execute-api.us-east-1.amazonaws.com/prod/thread \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "123", "thread_name": "Test"}'
```

### 4. Check Lambda Logs

```bash
serverless logs -f createThread --tail --stage prod
```

---

## Summary: The Flow

1. **You define** endpoints in `serverless.yml` under `functions` → `events` → `http`
2. **You write** handler functions in your JavaScript files (e.g., `thread.js`)
3. **You export** functions using `module.exports.functionName`
4. **Serverless Framework reads** your `serverless.yml` configuration
5. **Serverless Framework creates:**
   - Lambda functions (one per function definition)
   - API Gateway resources (one per HTTP path)
   - API Gateway methods (one per HTTP method)
   - Integrations (connects methods to Lambda)
   - Authorizers (if specified)
   - CORS (if enabled)
6. **When deployed**, endpoints are available at: `https://{api-id}.execute-api.{region}.amazonaws.com/{stage}/{path}`

---

## Key Takeaways

✅ **Define endpoints in `serverless.yml`** under `functions` → `events` → `http`  
✅ **Handler format:** `file.function` (e.g., `thread.create`)  
✅ **Path parameters:** Use `{param_name}` in path, access via `event.pathParameters`  
✅ **One function = One Lambda**, but can have multiple HTTP events  
✅ **Serverless Framework automatically creates** all API Gateway resources  
✅ **Deploy with:** `serverless deploy` or `serverless deploy function --function name`

---

## Your Current Setup

Based on your `serverless.yml`, you have:
- **65+ functions** defined
- **65+ Lambda functions** created
- **65+ API Gateway endpoints** configured
- **Multiple paths** with path parameters
- **CORS enabled** on all endpoints
- **Firebase authorizer** protecting endpoints

All of this is automatically managed by Serverless Framework based on your YAML configuration!

