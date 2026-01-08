# Frontend API Endpoints Reference

**Base URL:** `https://xj78ujjf44.execute-api.us-east-1.amazonaws.com/prod`

**Authentication:** Most endpoints require authentication via `Authorization: Bearer <token>` header

---

## Base Configuration

```javascript
const API_BASE_URL = 'https://xj78ujjf44.execute-api.us-east-1.amazonaws.com/prod';

// For authenticated requests
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${cognitoToken}` // Cognito ID token
};
```

---

## Thread Endpoints

### 1. Create Thread
**POST** `/thread`
- **Auth Required:** ✅ Yes
- **Description:** Create a new thread
- **Example:**
```javascript
fetch(`${API_BASE_URL}/thread`, {
  method: 'POST',
  headers: headers,
  body: JSON.stringify({
    // thread data
  })
});
```

### 2. Get Thread
**GET** `/user/{user_id}/thread/{thread_id}`
- **Auth Required:** ✅ Yes
- **Path Parameters:**
  - `user_id` (required)
  - `thread_id` (required)
- **Example:**
```javascript
fetch(`${API_BASE_URL}/user/${userId}/thread/${threadId}`, {
  method: 'GET',
  headers: headers
});
```

### 3. Edit Thread
**PATCH** `/user/{user_id}/thread/{thread_id}`
- **Auth Required:** ✅ Yes
- **Path Parameters:**
  - `user_id` (required)
  - `thread_id` (required)
- **Example:**
```javascript
fetch(`${API_BASE_URL}/user/${userId}/thread/${threadId}`, {
  method: 'PATCH',
  headers: headers,
  body: JSON.stringify({
    // updated thread data
  })
});
```

### 4. Delete Thread
**DELETE** `/user/{user_id}/thread/{thread_id}`
- **Auth Required:** ✅ Yes
- **Path Parameters:**
  - `user_id` (required)
  - `thread_id` (required)
- **Example:**
```javascript
fetch(`${API_BASE_URL}/user/${userId}/thread/${threadId}`, {
  method: 'DELETE',
  headers: headers
});
```

### 5. Add/Remove Thread from Favorites
**GET** `/user/{user_id}/thread/{thread_id}/favourite/{action}`
- **Auth Required:** ✅ Yes
- **Path Parameters:**
  - `user_id` (required)
  - `thread_id` (required)
  - `action` (required) - e.g., "add" or "remove"
- **Example:**
```javascript
fetch(`${API_BASE_URL}/user/${userId}/thread/${threadId}/favourite/add`, {
  method: 'GET',
  headers: headers
});
```

### 6. Get Threads (Filtered)
**GET** `/{byfilter}/{byfilter_id}/threads/{flag}`
- **Auth Required:** ✅ Yes
- **Path Parameters:**
  - `byfilter` (required) - filter type
  - `byfilter_id` (required) - filter ID
  - `flag` (required) - flag value
- **Example:**
```javascript
fetch(`${API_BASE_URL}/user/${userId}/threads/all`, {
  method: 'GET',
  headers: headers
});
```

### 7. Get Public Threads
**GET** `/public/{byfilter}/{byfilter_id}/threads/{flag}`
- **Auth Required:** ❌ No (Public endpoint)
- **Path Parameters:**
  - `byfilter` (required)
  - `byfilter_id` (required)
  - `flag` (required)
- **Example:**
```javascript
fetch(`${API_BASE_URL}/public/user/${userId}/threads/all`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### 8. Search Public Threads by Keyword
**GET** `/public/{byfilter}/{byfilter_id}/threads/{flag}/kewyord/{kewyord}`
- **Auth Required:** ❌ No (Public endpoint)
- **Path Parameters:**
  - `byfilter` (required)
  - `byfilter_id` (required)
  - `flag` (required)
  - `kewyord` (required) - keyword to search
- **Note:** There's a typo in the endpoint (`kewyord` instead of `keyword`)
- **Example:**
```javascript
fetch(`${API_BASE_URL}/public/user/${userId}/threads/all/kewyord/${keyword}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### 9. Search User Threads
**POST** `/user/{user_id}/threads/search/{keyword}`
- **Auth Required:** ✅ Yes
- **Path Parameters:**
  - `user_id` (required)
  - `keyword` (required)
- **Example:**
```javascript
fetch(`${API_BASE_URL}/user/${userId}/threads/search/${keyword}`, {
  method: 'POST',
  headers: headers
});
```

### 10. Get User Threads Medias
**GET** `/user/{user_id}/threads/all/medias`
- **Auth Required:** ✅ Yes
- **Path Parameters:**
  - `user_id` (required)
- **Example:**
```javascript
fetch(`${API_BASE_URL}/user/${userId}/threads/all/medias`, {
  method: 'GET',
  headers: headers
});
```

---

## Moment Endpoints

### 11. Create Moment
**POST** `/moment`
- **Auth Required:** ✅ Yes
- **Description:** Create a new moment
- **Example:**
```javascript
fetch(`${API_BASE_URL}/moment`, {
  method: 'POST',
  headers: headers,
  body: JSON.stringify({
    // moment data
  })
});
```

### 12. Get Moment Detail (Public)
**GET** `/moment/{object_id}`
- **Auth Required:** ❌ No (Public endpoint)
- **Path Parameters:**
  - `object_id` (required)
- **Example:**
```javascript
fetch(`${API_BASE_URL}/moment/${momentId}`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### 13. Get Moment Detail (Authenticated)
**GET** `/user/{user_id}/moment/{object_id}`
- **Auth Required:** ✅ Yes
- **Path Parameters:**
  - `user_id` (required)
  - `object_id` (required)
- **Example:**
```javascript
fetch(`${API_BASE_URL}/user/${userId}/moment/${momentId}`, {
  method: 'GET',
  headers: headers
});
```

### 14. Edit Moment
**PATCH** `/user/{user_id}/moment/{object_id}`
- **Auth Required:** ✅ Yes
- **Path Parameters:**
  - `user_id` (required)
  - `object_id` (required)
- **Example:**
```javascript
fetch(`${API_BASE_URL}/user/${userId}/moment/${momentId}`, {
  method: 'PATCH',
  headers: headers,
  body: JSON.stringify({
    // updated moment data
  })
});
```

### 15. Block/Unblock Moment
**PATCH** `/user/{user_id}/moment/{object_id}/block/{block_status}`
- **Auth Required:** ✅ Yes
- **Path Parameters:**
  - `user_id` (required)
  - `object_id` (required)
  - `block_status` (required) - e.g., "true" or "false"
- **Example:**
```javascript
fetch(`${API_BASE_URL}/user/${userId}/moment/${momentId}/block/true`, {
  method: 'PATCH',
  headers: headers
});
```

### 16. Delete Moment
**DELETE** `/user/{user_id}/moment/{object_id}`
- **Auth Required:** ✅ Yes
- **Path Parameters:**
  - `user_id` (required)
  - `object_id` (required)
- **Example:**
```javascript
fetch(`${API_BASE_URL}/user/${userId}/moment/${momentId}`, {
  method: 'DELETE',
  headers: headers
});
```

### 17. Save Moment Like/Dislike
**POST** `/moment/{object_id}/saveLike`
- **Auth Required:** ✅ Yes
- **Path Parameters:**
  - `object_id` (required)
- **Example:**
```javascript
fetch(`${API_BASE_URL}/moment/${momentId}/saveLike`, {
  method: 'POST',
  headers: headers,
  body: JSON.stringify({
    // like/dislike data
  })
});
```

### 18. Get Moment Like Counter
**GET** `/moment/{object_id}/like/counter`
- **Auth Required:** ✅ Yes
- **Path Parameters:**
  - `object_id` (required)
- **Example:**
```javascript
fetch(`${API_BASE_URL}/moment/${momentId}/like/counter`, {
  method: 'GET',
  headers: headers
});
```

---

## Media Endpoints

### 19. Save Media
**POST** `/media`
- **Auth Required:** ✅ Yes
- **Description:** Save a single media URL and details
- **Example:**
```javascript
fetch(`${API_BASE_URL}/media`, {
  method: 'POST',
  headers: headers,
  body: JSON.stringify({
    // media data
  })
});
```

### 20. Save Multiple Medias
**POST** `/medias`
- **Auth Required:** ✅ Yes
- **Description:** Save multiple media URLs and details
- **Example:**
```javascript
fetch(`${API_BASE_URL}/medias`, {
  method: 'POST',
  headers: headers,
  body: JSON.stringify({
    // array of media data
  })
});
```

### 21. Get Moment Medias
**GET** `/moment/{object_id}/medias`
- **Auth Required:** ✅ Yes
- **Path Parameters:**
  - `object_id` (required)
- **Example:**
```javascript
fetch(`${API_BASE_URL}/moment/${momentId}/medias`, {
  method: 'GET',
  headers: headers
});
```

---

## Object Endpoints

### 22. Get Objects (Filtered)
**POST** `/{byfilter}/{byfilter_id}/objects/{object_type}`
- **Auth Required:** ✅ Yes
- **Path Parameters:**
  - `byfilter` (required)
  - `byfilter_id` (required)
  - `object_type` (required)
- **Example:**
```javascript
fetch(`${API_BASE_URL}/user/${userId}/objects/moment`, {
  method: 'POST',
  headers: headers,
  body: JSON.stringify({
    // filter criteria
  })
});
```

### 23. Get Public Objects
**POST** `/public/{byfilter}/{byfilter_id}/objects/{object_type}`
- **Auth Required:** ❌ No (Public endpoint)
- **Path Parameters:**
  - `byfilter` (required)
  - `byfilter_id` (required)
  - `object_type` (required)
- **Example:**
```javascript
fetch(`${API_BASE_URL}/public/user/${userId}/objects/moment`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    // filter criteria
  })
});
```

---

## User Endpoints

### 24. Invite Users to Object
**POST** `/user/{user_id}/invite`
- **Auth Required:** ✅ Yes
- **Path Parameters:**
  - `user_id` (required)
- **Description:** Send friend invitation
- **Example:**
```javascript
fetch(`${API_BASE_URL}/user/${userId}/invite`, {
  method: 'POST',
  headers: headers,
  body: JSON.stringify({
    // invitation data
  })
});
```

### 25. Global Search
**GET** `/user/{user_id}/search/{keyword}`
- **Auth Required:** ✅ Yes
- **Path Parameters:**
  - `user_id` (required)
  - `keyword` (required)
- **Description:** Search for people, moments, locations
- **Example:**
```javascript
fetch(`${API_BASE_URL}/user/${userId}/search/${keyword}`, {
  method: 'GET',
  headers: headers
});
```

---

## Quick Reference Summary

### Base URL
```
https://xj78ujjf44.execute-api.us-east-1.amazonaws.com/prod
```

### Authentication Header
```javascript
'Authorization': `Bearer ${cognitoIdToken}`
```

### Endpoints by Category

**Threads (10 endpoints):**
- Create, Get, Edit, Delete Thread
- Add/Remove Favorite
- Get Threads (filtered)
- Get Public Threads
- Search Threads
- Get Thread Medias

**Moments (8 endpoints):**
- Create, Get, Edit, Delete Moment
- Block/Unblock Moment
- Like/Dislike Moment
- Get Like Counter

**Media (3 endpoints):**
- Save Media (single)
- Save Medias (multiple)
- Get Moment Medias

**Objects (2 endpoints):**
- Get Objects (filtered)
- Get Public Objects

**User (2 endpoints):**
- Invite Users
- Global Search

---

## Error Handling

All endpoints return standard HTTP status codes:
- **200:** Success
- **400:** Bad Request
- **404:** Not Found
- **500:** Server Error

Error responses follow this format:
```json
{
  "statusCode": 400,
  "message": "Error message here"
}
```

---

## CORS

All endpoints have CORS enabled, so you can call them directly from the browser.

---

## Notes

1. **Path Parameters:** Replace `{user_id}`, `{thread_id}`, `{object_id}`, etc. with actual values
2. **Typo:** The search endpoint uses `kewyord` instead of `keyword` (endpoint #8)
3. **Public Endpoints:** These don't require authentication:
   - `/public/{byfilter}/{byfilter_id}/threads/{flag}`
   - `/public/{byfilter}/{byfilter_id}/threads/{flag}/kewyord/{kewyord}`
   - `/moment/{object_id}`
   - `/public/{byfilter}/{byfilter_id}/objects/{object_type}`
4. **POST vs GET:** Some endpoints use POST for complex queries (like `/objects/{object_type}`) to allow request body

---

## Example Frontend Integration

```javascript
// api.js
const API_BASE_URL = 'https://xj78ujjf44.execute-api.us-east-1.amazonaws.com/prod';

class LifescapeAPI {
  constructor(token) {
    this.token = token;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Thread methods
  async createThread(data) {
    const response = await fetch(`${API_BASE_URL}/thread`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async getThread(userId, threadId) {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/thread/${threadId}`, {
      method: 'GET',
      headers: this.headers
    });
    return response.json();
  }

  // Moment methods
  async createMoment(data) {
    const response = await fetch(`${API_BASE_URL}/moment`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data)
    });
    return response.json();
  }

  async getMoment(momentId) {
    const response = await fetch(`${API_BASE_URL}/moment/${momentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  }

  // Media methods
  async saveMedia(data) {
    const response = await fetch(`${API_BASE_URL}/media`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data)
    });
    return response.json();
  }
}

// Usage
const api = new LifescapeAPI(cognitoIdToken);
const moment = await api.createMoment({ /* moment data */ });
```





