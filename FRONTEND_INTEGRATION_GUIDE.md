# Frontend Integration Guide

**Last Updated:** December 15, 2025  
**API Version:** Production  
**Status:** ✅ **READY FOR INTEGRATION**

---

## Quick Start

### API Base URLs

**Production:**
```
https://1hwkqes839.execute-api.us-east-1.amazonaws.com/prod
```

**Development:**
```
https://2hezou3hhe.execute-api.us-east-1.amazonaws.com/prod
```

### Environment Configuration

```typescript
// environment.ts or config.ts
export const environment = {
  production: true,
  apiBaseUrl: 'https://1hwkqes839.execute-api.us-east-1.amazonaws.com/prod',
  // Optional: For legacy endpoints
  apiURL: 'https://1hwkqes839.execute-api.us-east-1.amazonaws.com/prod/v1/',
  apiURLNew: 'https://1hwkqes839.execute-api.us-east-1.amazonaws.com/prod/s1/',
};
```

---

## Authentication

### Overview

The backend uses **Firebase Authentication** with a Lambda authorizer. All protected endpoints require a Firebase ID token in the Authorization header.

### Getting Firebase ID Token

**Firebase SDK (JavaScript/TypeScript):**
```typescript
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth();
const userCredential = await signInWithEmailAndPassword(auth, email, password);
const idToken = await userCredential.user.getIdToken();
```

**React Example:**
```typescript
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

function useAuthToken() {
  const [token, setToken] = useState<string | null>(null);
  
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        setToken(token);
      } else {
        setToken(null);
      }
    });
    
    return unsubscribe;
  }, []);
  
  return token;
}
```

### Authorization Header

Include the token in all authenticated requests:

```http
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

---

## API Client Setup

### Axios Example (React/TypeScript)

```typescript
import axios from 'axios';
import { getAuth } from 'firebase/auth';

const apiClient = axios.create({
  baseURL: 'https://1hwkqes839.execute-api.us-east-1.amazonaws.com/prod',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use(async (config) => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Fetch API Example

```typescript
async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const auth = getAuth();
  const user = auth.currentUser;
  
  const token = user ? await user.getIdToken() : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  
  const response = await fetch(
    `https://1hwkqes839.execute-api.us-east-1.amazonaws.com/prod${endpoint}`,
    {
      ...options,
      headers,
    }
  );
  
  if (!response.ok) {
    if (response.status === 401) {
      // Handle unauthorized
      throw new Error('Unauthorized');
    }
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }
  
  return response.json();
}
```

---

## Common Endpoints

### Moments

#### Create Moment
```typescript
POST /moment
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": "user123",
  "thread_id": "thread456",
  "object_title": "My Moment",
  "object_desc": "Description",
  "media_id": ["media-id-1"],
  "start_date": 1553012135000,
  "location": {
    "latitude": 23,
    "longitude": -72
  },
  "access": "public",
  "is_published": "1",
  "tags": ["tag1", "tag2"]
}
```

**Response:**
```json
{
  "message": "Moment Data inserted successfully!",
  "body": {
    "object_id": "moment-id-123"
  }
}
```

#### Get Moment
```typescript
GET /moment/{object_id}
// Public endpoint - no auth required

GET /user/{user_id}/moment/{object_id}
// Authenticated endpoint
```

**Response:**
```json
{
  "datalineobject_id": "moment-id",
  "object_title": "My Moment",
  "object_desc": "Description",
  "user_id": "user123",
  "mediadata": [...],
  "tags": ["tag1", "tag2"],
  "created_datetime": 1553012135000
}
```

#### Edit Moment
```typescript
PATCH /user/{user_id}/moment/{object_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "object_title": "Updated Title",
  "object_desc": "Updated Description"
}
```

#### Delete Moment
```typescript
DELETE /user/{user_id}/moment/{object_id}
Authorization: Bearer <token>
```

---

### Threads

#### Create Thread
```typescript
POST /thread
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": "user123",
  "thread_name": "My Thread",
  "thread_desc": "Description",
  "thread_type": "test",
  "cover_pic": "http_url",
  "privacy": "public"
}
```

**Response:**
```json
{
  "message": "Channel Data inserted successfully!",
  "body": {
    "thread_id": "thread-id-123"
  }
}
```

#### Get Thread
```typescript
GET /user/{user_id}/thread/{thread_id}
Authorization: Bearer <token>
```

#### List Threads
```typescript
GET /{byfilter}/{byfilter_id}/threads/{flag}
Authorization: Bearer <token>

// Examples:
// GET /user/user123/threads/all
// GET /thread/thread456/threads/all
```

#### Edit Thread
```typescript
PATCH /user/{user_id}/thread/{thread_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "thread_name": "Updated Name",
  "thread_desc": "Updated Description"
}
```

#### Delete Thread
```typescript
DELETE /user/{user_id}/thread/{thread_id}
Authorization: Bearer <token>
```

---

### Comments

#### Create Comment
```typescript
POST /user/{user_id}/moment/{object_id}/comment
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": "user123",
  "comment_text": "This is a comment"
}
```

**Response:**
```json
{
  "message": "Comment Data inserted successfully!",
  "body": {
    "comment_id": "comment-id-123"
  }
}
```

#### Get Comments
```typescript
GET /moment/{object_id}/comments
// Public endpoint

GET /user/{user_id}/moment/{object_id}/comments
// Authenticated endpoint
```

#### Get Latest Comments
```typescript
GET /user/{user_id}/moment/{object_id}/comments/latest
Authorization: Bearer <token>
```

#### Delete Comment
```typescript
DELETE /user/{user_id}/moment/{object_id}/comment/{comment_id}
Authorization: Bearer <token>
```

---

### User Operations

#### Get User Details
```typescript
GET /user/{user_id}
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user_id": "user123",
  "email": "user@example.com",
  "displayName": "John Doe",
  "profile_picture": "https://...",
  "about_text": "About me",
  "created_datetime": 1553012135000
}
```

#### Edit Profile
```typescript
PATCH /user/{user_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "displayName": "New Name",
  "about_text": "New about text"
}
```

#### Invite Friend by Email
```typescript
POST /user/{user_id}/inviteFriendByEmail
Authorization: Bearer <token>
Content-Type: application/json

{
  "to_email": "friend@example.com"
}
```

**Response:**
```json
{
  "message": "Invitation Sent successfully!"
}
```

---

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Error message here"
}
```

### Common Status Codes

- **200** - Success
- **400** - Bad Request (validation error, missing parameters)
- **401** - Unauthorized (invalid or missing token)
- **404** - Not Found (resource doesn't exist)
- **500** - Server Error (internal error)

### Error Handling Example

```typescript
try {
  const response = await apiClient.post('/moment', momentData);
  return response.data;
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Server responded with error
      const { statusCode, message } = error.response.data;
      
      switch (statusCode) {
        case 400:
          console.error('Validation error:', message);
          break;
        case 401:
          console.error('Unauthorized - redirect to login');
          // Redirect to login
          break;
        case 404:
          console.error('Resource not found:', message);
          break;
        case 500:
          console.error('Server error:', message);
          break;
        default:
          console.error('Unknown error:', message);
      }
    } else if (error.request) {
      // Request made but no response
      console.error('Network error - no response received');
    } else {
      // Error setting up request
      console.error('Request setup error:', error.message);
    }
  }
  throw error;
}
```

---

## CORS Configuration

The API Gateway is configured with CORS enabled. Allowed headers:

- `Content-Type`
- `Authorization`
- `Access-Control-Allow-Headers`
- `Access-Control-Allow-Origin`

**Note:** The API allows requests from any origin (`Access-Control-Allow-Origin: *`). For production, consider restricting this to your domain.

---

## React Hooks Example

### useMoments Hook

```typescript
import { useState, useEffect } from 'react';
import apiClient from './apiClient';

interface Moment {
  datalineobject_id: string;
  object_title: string;
  object_desc: string;
  user_id: string;
  created_datetime: number;
}

export function useMoments(userId?: string) {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchMoments() {
      try {
        setLoading(true);
        const endpoint = userId 
          ? `/user/${userId}/moments`
          : '/moments';
        const response = await apiClient.get(endpoint);
        setMoments(response.data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchMoments();
  }, [userId]);

  const createMoment = async (momentData: any) => {
    try {
      const response = await apiClient.post('/moment', momentData);
      setMoments(prev => [response.data.body, ...prev]);
      return response.data;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return { moments, loading, error, createMoment };
}
```

### useThreads Hook

```typescript
import { useState, useEffect } from 'react';
import apiClient from './apiClient';

export function useThreads(userId: string) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchThreads() {
      try {
        const response = await apiClient.get(`/user/${userId}/threads/all`);
        setThreads(response.data);
      } catch (err) {
        console.error('Error fetching threads:', err);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchThreads();
    }
  }, [userId]);

  return { threads, loading };
}
```

---

## TypeScript Types

```typescript
// types/api.ts

export interface Moment {
  datalineobject_id: string;
  user_id: string;
  object_title: string;
  object_title_lower?: string;
  object_desc?: string;
  thread_id?: string;
  brand_id?: string;
  start_date?: number;
  end_date?: number;
  latitude?: number;
  longitude?: number;
  location?: string;
  access?: string;
  is_published?: string;
  tags?: string[];
  like_counter?: number;
  comments_counter?: number;
  created_datetime: number;
  updated_datetime: number;
  mediadata?: Media[];
  user_profile_picture?: string;
  posted_by?: string;
}

export interface Thread {
  thread_id: string;
  user_id: string;
  thread_name: string;
  thread_desc?: string;
  thread_type?: string;
  cover_pic?: string;
  privacy?: string;
  created_datetime: number;
  updated_datetime: number;
}

export interface Comment {
  comment_id: string;
  user_id: string;
  datalineobject_id: string;
  comment_text: string;
  created_datetime: number;
  status: number;
  user_profile_picture?: string;
  posted_by?: string;
}

export interface User {
  user_id: string;
  email: string;
  displayName: string;
  profile_picture?: string;
  about_text?: string;
  location?: string;
  gender?: string;
  created_datetime: number;
  moment_counter?: number;
  devices?: {
    ios?: string[];
    android?: string[];
  };
  groups?: string[];
}

export interface ApiResponse<T> {
  message?: string;
  body?: T;
  statusCode?: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
}
```

---

## Testing

### Using cURL

```bash
# Get Firebase ID token first, then:
curl -X POST https://1hwkqes839.execute-api.us-east-1.amazonaws.com/prod/moment \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "object_title": "Test Moment",
    "object_desc": "Test Description",
    "access": "public",
    "is_published": "1"
  }'
```

### Using Postman

1. Create a new request
2. Set method (GET, POST, etc.)
3. Enter URL: `https://1hwkqes839.execute-api.us-east-1.amazonaws.com/prod/{endpoint}`
4. In Headers tab, add:
   - `Authorization: Bearer {your_firebase_token}`
   - `Content-Type: application/json`
5. In Body tab (for POST/PATCH), select "raw" and "JSON", enter your data

---

## Important Notes

### 1. Firebase Authentication Required

- All protected endpoints require a valid Firebase ID token
- Tokens expire after 1 hour - refresh automatically
- Invalid or expired tokens return 401 Unauthorized

### 2. Request Format

- All requests use JSON format
- Content-Type header must be `application/json`
- Path parameters are in the URL: `/user/{user_id}/moment/{object_id}`
- Query parameters can be added: `?page=1&limit=10`

### 3. Response Format

- Success responses include `message` and `body` fields
- Error responses include `statusCode` and `message` fields
- All responses are JSON

### 4. CORS

- CORS is enabled for all origins
- Preflight requests (OPTIONS) are handled automatically

### 5. Rate Limiting

- API Gateway has default rate limits
- Monitor usage in AWS CloudWatch
- Consider implementing client-side rate limiting

---

## Troubleshooting

### 401 Unauthorized

**Problem:** Token is missing, invalid, or expired

**Solution:**
1. Verify Firebase authentication is working
2. Check token is being sent in Authorization header
3. Refresh the token if expired
4. Verify user is logged in

### 400 Bad Request

**Problem:** Request validation failed

**Solution:**
1. Check required fields are present
2. Verify data types match expected format
3. Check request body is valid JSON
4. Review error message for specific validation errors

### 404 Not Found

**Problem:** Endpoint doesn't exist or resource not found

**Solution:**
1. Verify endpoint URL is correct
2. Check path parameters are correct
3. Verify resource exists in database

### 500 Server Error

**Problem:** Internal server error

**Solution:**
1. Check CloudWatch logs for Lambda errors
2. Verify DynamoDB tables exist
3. Check IAM permissions
4. Contact backend team with error details

---

## Next Steps

1. **Set up Firebase Authentication** in your frontend
2. **Configure API client** with base URL and auth interceptor
3. **Test endpoints** using Postman or cURL
4. **Implement error handling** for all API calls
5. **Add loading states** for better UX
6. **Monitor API usage** and errors

---

## Support

For issues or questions:
- Check CloudWatch logs for backend errors
- Review API Gateway deployment status
- See `BACKEND_ANALYSIS.md` for backend details
- Contact backend team for API changes

---

**Status:** ✅ **Ready for Frontend Integration**

