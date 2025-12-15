# Frontend Quick Reference

**Last Updated:** December 15, 2025

---

## API Base URL

```
Production: https://1hwkqes839.execute-api.us-east-1.amazonaws.com/prod
Development: https://2hezou3hhe.execute-api.us-east-1.amazonaws.com/prod
```

---

## Authentication

```http
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

---

## Common Endpoints

### Moments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/moment` | ✅ | Create moment |
| GET | `/moment/{object_id}` | ❌ | Get moment (public) |
| GET | `/user/{user_id}/moment/{object_id}` | ✅ | Get moment (auth) |
| PATCH | `/user/{user_id}/moment/{object_id}` | ✅ | Edit moment |
| DELETE | `/user/{user_id}/moment/{object_id}` | ✅ | Delete moment |

### Threads

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/thread` | ✅ | Create thread |
| GET | `/user/{user_id}/thread/{thread_id}` | ✅ | Get thread |
| GET | `/{byfilter}/{byfilter_id}/threads/{flag}` | ✅ | List threads |
| PATCH | `/user/{user_id}/thread/{thread_id}` | ✅ | Edit thread |
| DELETE | `/user/{user_id}/thread/{thread_id}` | ✅ | Delete thread |

### Comments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/user/{user_id}/moment/{object_id}/comment` | ✅ | Create comment |
| GET | `/moment/{object_id}/comments` | ❌ | Get comments (public) |
| GET | `/user/{user_id}/moment/{object_id}/comments` | ✅ | Get comments (auth) |
| DELETE | `/user/{user_id}/moment/{object_id}/comment/{comment_id}` | ✅ | Delete comment |

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/user/{user_id}` | ✅ | Get user details |
| PATCH | `/user/{user_id}` | ✅ | Edit profile |
| POST | `/user/{user_id}/inviteFriendByEmail` | ✅ | Invite friend |

---

## Request Examples

### Create Moment

```typescript
POST /moment
{
  "user_id": "user123",
  "thread_id": "thread456",
  "object_title": "My Moment",
  "object_desc": "Description",
  "media_id": ["media-id"],
  "access": "public",
  "is_published": "1",
  "tags": ["tag1", "tag2"]
}
```

### Create Thread

```typescript
POST /thread
{
  "user_id": "user123",
  "thread_name": "My Thread",
  "thread_desc": "Description",
  "thread_type": "test",
  "privacy": "public"
}
```

---

## Response Format

### Success
```json
{
  "message": "Success message",
  "body": { ... }
}
```

### Error
```json
{
  "statusCode": 400,
  "message": "Error message"
}
```

---

## Status Codes

- **200** - Success
- **400** - Bad Request
- **401** - Unauthorized
- **404** - Not Found
- **500** - Server Error

---

## Quick Setup

```typescript
// 1. Configure API client
const apiClient = axios.create({
  baseURL: 'https://1hwkqes839.execute-api.us-east-1.amazonaws.com/prod',
});

// 2. Add auth interceptor
apiClient.interceptors.request.use(async (config) => {
  const token = await getFirebaseToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 3. Use in components
const response = await apiClient.post('/moment', momentData);
```

---

For detailed documentation, see `FRONTEND_INTEGRATION_GUIDE.md`

