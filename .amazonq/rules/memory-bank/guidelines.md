# Lifescape Backend - Development Guidelines

## Code Quality Standards

### File Structure & Organization
- **Strict 'use strict' Mode**: All JavaScript files begin with `'use strict';` directive
- **Consistent Imports**: AWS SDK and local modules imported at file top using `require()`
- **Module Pattern**: Each file exports specific functions using `module.exports.functionName`
- **Separation of Concerns**: Business logic separated into `lib/model/` directory
- **Response Standardization**: All API responses use centralized `lib/response.js` module

### Variable Naming Conventions
- **Snake Case for IDs**: `user_id`, `object_id`, `datalineobject_id`, `thread_id`
- **Camel Case for Objects**: `momentob`, `mediaob`, `threadob`, `firebaseuserob`
- **Descriptive Names**: `momentMediaList`, `checkMyLikeStatus`, `userMomentList`
- **Consistent Prefixes**: Database table names use PascalCase (`DatalineObject`, `UserRecentViews`)

### Error Handling Patterns
- **Consistent Error Responses**: Use `context.fail(JSON.stringify({ statusCode: 500, message: "Server Error" }))`
- **DynamoDB Error Handling**: Always check for errors in DynamoDB operations before proceeding
- **Promise-based Error Handling**: Use `.then()` and `.catch()` for async operations
- **Graceful Degradation**: Return empty arrays instead of errors when no data found

## Architectural Patterns

### Lambda Function Structure
```javascript
module.exports.functionName = (event, context, callback) => {
    response.normalizeEvent(event);
    console.log(event);
    
    // Validation
    if(typeof(event["path"]) != "undefined" && typeof(event["path"]["param"]) != "undefined") {
        // Main logic
        return new Promise(async function(resolve, reject) {
            // Async operations
        });
    } else {
        return context.fail(JSON.stringify({ statusCode: 400, message: "Invalid request body" }));
    }
}
```

### Database Access Patterns
- **DynamoDB DocumentClient**: Use `new AWS.DynamoDB.DocumentClient()` for all operations
- **Pagination Handling**: Implement recursive queries with `LastEvaluatedKey` for large datasets
- **Index Usage**: Leverage GSI indexes like `user_id-created_datetime-index` for efficient queries
- **Batch Operations**: Process multiple items using `forEach` with async/await patterns

### Promise Chain Patterns
```javascript
let myProm = new Promise(async function(resolve, reject) {
    // Initial async operations
})
.then(function(object_result) {
    // Process results
    return new Promise(function(resolve, reject) {
        // Additional processing
    });
})
.catch(function(error) {
    return context.fail(JSON.stringify({ statusCode: 500, message: "Server Error" }));
});
```

## API Development Standards

### Request Validation
- **Path Parameter Validation**: Always validate `event["path"]` parameters exist before use
- **Body Parameter Validation**: Check `event["body"]` parameters with `typeof()` checks
- **Authorization Checks**: Verify `event.principalId` matches `user_id` for protected operations
- **Input Sanitization**: Trim strings and validate required fields before processing

### Response Formatting
- **Success Responses**: Use `callback(null, response.success(data))` for successful operations
- **Error Responses**: Use `callback(null, response.serverError())` or `response.notFound()`
- **CORS Headers**: Include proper CORS headers in direct callback responses
- **Consistent Message Format**: Use standardized message objects with `message` and `body` properties

### Data Processing Patterns
- **Async/Await Usage**: Prefer `async/await` over callback patterns for cleaner code
- **Counter Management**: Update counters (likes, comments) atomically using DynamoDB UpdateExpression
- **Media Handling**: Always delete metadata before storing media data in moments
- **User Data Integration**: Fetch and embed user profile data (displayName, profile_picture) in responses

## Security & Performance Guidelines

### Authentication & Authorization
- **Firebase Integration**: Use Firebase user validation through `firebaseuserob.getUserDetail()`
- **Permission Checks**: Implement object-level permissions via `object_permissions.js`
- **Token Validation**: Validate JWT tokens using `jsonwebtoken` and `jwk-to-pem` libraries
- **Resource Cleanup**: Always call `firebaseuserob.firebasedelete()` after Firebase operations

### Performance Optimization
- **Connection Reuse**: Reuse AWS SDK clients across Lambda invocations
- **Efficient Queries**: Use specific indexes and projection expressions to minimize data transfer
- **Pagination**: Implement proper pagination with configurable `page_rec` limits
- **Caching Strategy**: Cache frequently accessed data like user details within request scope

### Data Migration & Maintenance
- **UUID Generation**: Use `uuid.v1()` for generating unique identifiers
- **Timestamp Handling**: Store timestamps as `Date.now()` milliseconds for consistency
- **Legacy Support**: Maintain `old_thread_id` and `old_moment_id` fields for migration tracking
- **Batch Processing**: Use recursive functions for processing large datasets with rate limiting

## Integration Patterns

### External Service Integration
- **AWS Lambda Invocation**: Use `lambda.invoke()` for cross-function communication
- **SendGrid Email**: Implement template-based emails with dynamic data
- **Cloudinary Media**: Handle media uploads with proper URL validation
- **Mapbox Location**: Integrate location services for geographic data

### Database Schema Conventions
- **Primary Keys**: Use descriptive names like `datalineobject_id`, `thread_id`, `media_id`
- **Foreign Keys**: Maintain relationships through consistent ID references
- **Timestamps**: Include `created_datetime` and `updated_datetime` for all entities
- **Status Fields**: Use string values like `"1"` for published status, `"public"` for access levels

### Testing & Debugging
- **Console Logging**: Use `console.log(event)` and `console.log(params)` for debugging
- **Event Files**: Maintain test event files in `event/` directory for local testing
- **Parameter Logging**: Log DynamoDB parameters before execution for troubleshooting
- **Error Context**: Include meaningful error messages with operation context