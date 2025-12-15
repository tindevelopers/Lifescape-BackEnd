# Lifescape Backend API Guide

**Last Updated:** December 14, 2024  
**API Version:** Production  
**Runtime:** Node.js 20.x  
**Status:** ✅ **OPERATIONAL**

---

## Quick Start

### Base URL

```
https://1hwkqes839.execute-api.us-east-1.amazonaws.com/prod
```

### Environment Configuration

```typescript
// environment.ts
export const environment = {
  production: true,
  apiURL: "https://1hwkqes839.execute-api.us-east-1.amazonaws.com/prod/v1/",
  apiURLNew: "https://1hwkqes839.execute-api.us-east-1.amazonaws.com/prod/s1/",
  cloud_name: "lifescape",
  upload_preset: "lifescape_angular"
};
```

---

## Authentication

All authenticated endpoints require the `Authorization` header:

```http
Authorization: Bearer <idToken>
```

The `idToken` is a Firebase ID token returned from the login endpoint.

---

## Endpoints

### Authentication

#### Login

Authenticates a user and returns user details with an ID token.

```http
POST /v1/user/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "user_id": "abc123xyz",
  "email": "user@example.com",
  "displayName": "John Doe",
  "profile_picture": "https://...",
  "created_datetime": 1699999999999,
  "moment_counter": 42,
  "idToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (401):**
```json
{
  "statusCode": 401,
  "message": "The password is invalid or the user does not have a password."
}
```

---

#### Signup

Creates a new user account. Sends verification email automatically.

```http
POST /v1/user/signup
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "John Doe",
  "redirect_url": "https://yourapp.com/verify"
}
```

**Success Response (200):**
```json
{
  "message": "User is created successfully. Please check your inbox to verify your email address!",
  "body": {
    "user_id": "abc123xyz"
  }
}
```

**Error Response (400):**
```json
{
  "statusCode": 400,
  "message": "The email address is already in use by another account."
}
```

---

#### Reset Password

Sends a password reset email to the user.

```http
POST /v1/user/resetPassword
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "message": "Email with reset password link is sent successfully!"
}
```

---

#### Change Password

Changes the user's password (requires current password).

```http
POST /v1/user/changePassword
Content-Type: application/json
Authorization: Bearer <idToken>
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "old_password": "currentPassword123",
  "new_password": "newPassword456"
}
```

**Success Response (200):**
```json
{
  "message": "Password is updated successfully!"
}
```

---

### User Management

#### Get User Detail

Retrieves a user's profile information.

```http
GET /v1/user/{user_id}
Authorization: Bearer <idToken>
```

**Success Response (200):**
```json
{
  "user_id": "abc123xyz",
  "email": "user@example.com",
  "displayName": "John Doe",
  "profile_picture": "https://...",
  "about_text": "Bio text here",
  "location": "New York, NY",
  "gender": "male",
  "created_datetime": 1699999999999,
  "moment_counter": 42,
  "devices": {
    "ios": ["device_token_1", "device_token_2"]
  }
}
```

---

#### Edit Profile

Updates the current user's profile. Only the authenticated user can edit their own profile.

```http
PATCH /v1/user/{user_id}
Content-Type: application/json
Authorization: Bearer <idToken>
```

**Request Body (all fields optional):**
```json
{
  "name": "New Display Name",
  "email": "newemail@example.com",
  "about_text": "Updated bio",
  "profile_picture": "https://cloudinary.com/...",
  "location": "Los Angeles, CA",
  "latitude": 34.0522,
  "longitude": -118.2437,
  "gender": "female",
  "spoken_lang": "en",
  "social_profiles": {
    "twitter": "username",
    "instagram": "username"
  }
}
```

**Success Response (200):**
```json
{
  "message": "User Data updated successfully!"
}
```

---

#### Register Device

Registers a device for push notifications.

```http
POST /v1/user/{user_id}/device
Content-Type: application/json
Authorization: Bearer <idToken>
```

**Request Body:**
```json
{
  "device_id": "apns_device_token_here",
  "device_type": "ios"
}
```

**Success Response (200):**
```json
{
  "message": "User Devices updated successfully!"
}
```

---

### Friends

#### Send Friend Request

Sends a friend request to another user.

```http
POST /v1/user/{user_id}/friend/{to_user_id}
Authorization: Bearer <idToken>
```

**Success Response (200):**
```json
{
  "message": "Request sent successfully!"
}
```

**Already Sent Response (200):**
```json
{
  "message": "Request is already sent!"
}
```

---

#### Get Friend Status

Checks the friendship status between two users.

```http
GET /v1/user/{user_id}/friend/{to_user_id}/status
Authorization: Bearer <idToken>
```

**Response (200):**
```json
{
  "status": 0,
  "message": "Request is not sent yet!"
}
```

**Status Codes:**
| Status | Meaning |
|--------|---------|
| `0` | No relationship |
| `1` | Friends (accepted) |
| `2` | Request received (pending) |
| `3` | Request sent (pending) |
| `4` | Request denied |

---

#### Act on Friend Request

Accept, deny, or cancel a friend request.

```http
POST /v1/user/{user_id}/friend/{to_user_id}/{action}
Authorization: Bearer <idToken>
```

**Actions:**
- `accept` - Accept a received friend request
- `deny` - Deny a received friend request  
- `cancel` - Cancel a sent friend request

**Success Response (200):**
```json
{
  "message": "Request accepted successfully!"
}
```

---

#### Get Friend List

Retrieves the user's friends.

```http
GET /v1/user/{user_id}/friends
Authorization: Bearer <idToken>
```

**Success Response (200):**
```json
[
  {
    "user_id": "friend1_id",
    "displayName": "Friend One",
    "profile_picture": "https://...",
    "email": "friend1@example.com"
  },
  {
    "user_id": "friend2_id",
    "displayName": "Friend Two",
    "profile_picture": "https://...",
    "email": "friend2@example.com"
  }
]
```

**No Friends Response (404):**
```json
{
  "statusCode": 404,
  "message": "Records Not Found"
}
```

---

#### Unfriend User

Removes a user from friends list.

```http
DELETE /v1/user/{user_id}/friend/{to_user_id}
Authorization: Bearer <idToken>
```

**Success Response (200):**
```json
{
  "message": "User is successfully deleted from friend list!"
}
```

---

#### List Friend Requests

Lists pending friend requests.

```http
GET /v1/user/{user_id}/requests/{type}
Authorization: Bearer <idToken>
```

**Types:**
- `received` - Requests you've received
- `sent` - Requests you've sent

**Success Response (200):**
```json
[
  {
    "user_id": "requester_id",
    "displayName": "Requester Name",
    "profile_picture": "https://..."
  }
]
```

---

#### Get Suggested Friends

Retrieves friend suggestions based on activity.

```http
GET /v1/user/{user_id}/suggested
Authorization: Bearer <idToken>
```

**Success Response (200):**
```json
[
  {
    "user_id": "suggested_id",
    "displayName": "Suggested User",
    "profile_picture": "https://...",
    "friendrequest": 0
  }
]
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `400` | Bad Request - Invalid request body or parameters |
| `401` | Unauthorized - Invalid or expired token |
| `404` | Not Found - Resource doesn't exist |
| `500` | Server Error - Internal error |

### Error Response Format

```json
{
  "statusCode": 401,
  "message": "Human-readable error message"
}
```

### Common Errors

| Error Message | Cause | Solution |
|---------------|-------|----------|
| `"The password is invalid..."` | Wrong password | Check credentials |
| `"Email ID is not verified yet."` | Unverified email | Check inbox for verification email |
| `"The email address is already in use..."` | Duplicate signup | Use login instead |
| `"Invalid request body"` | Missing required fields | Check request payload |
| `"Records Not Found"` | No data exists | Handle empty state in UI |

---

## Code Examples

### JavaScript/TypeScript

```typescript
// api.service.ts
const API_BASE = 'https://1hwkqes839.execute-api.us-east-1.amazonaws.com/prod/v1';

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  // Authentication
  async login(email: string, password: string) {
    const user = await this.request('/user/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(user.idToken);
    return user;
  }

  async signup(email: string, password: string, name: string) {
    return this.request('/user/signup', {
      method: 'POST',
      body: JSON.stringify({ 
        email, 
        password, 
        name,
        redirect_url: window.location.origin 
      }),
    });
  }

  async resetPassword(email: string) {
    return this.request('/user/resetPassword', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // User
  async getUser(userId: string) {
    return this.request(`/user/${userId}`);
  }

  async updateProfile(userId: string, data: Partial<UserProfile>) {
    return this.request(`/user/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Friends
  async getFriends(userId: string) {
    return this.request(`/user/${userId}/friends`);
  }

  async sendFriendRequest(userId: string, toUserId: string) {
    return this.request(`/user/${userId}/friend/${toUserId}`, {
      method: 'POST',
    });
  }

  async acceptFriendRequest(userId: string, fromUserId: string) {
    return this.request(`/user/${userId}/friend/${fromUserId}/accept`, {
      method: 'POST',
    });
  }
}

export const api = new ApiService();
```

### Usage Example

```typescript
// Login
try {
  const user = await api.login('user@example.com', 'password123');
  console.log('Logged in as:', user.displayName);
  
  // Get friends
  const friends = await api.getFriends(user.user_id);
  console.log('Friends:', friends);
} catch (error) {
  console.error('Error:', error.message);
}
```

---

---

## Moments

#### Create Moment

Creates a new moment.

```http
POST /v1/moment
Content-Type: application/json
Authorization: Bearer <idToken>
```

**Request Body:**
```json
{
  "user_id": "zvrZyrUEqbSJjtq3IDv1uPlOMwh1",
  "thread_id": "1",
  "brand_id": "1",
  "object_title": "My Moment Title",
  "object_desc": "Description of the moment",
  "moment_link": "",
  "media_id": [],
  "post_to_social": [],
  "start_date": 1765672853203,
  "access": "Public",
  "is_published": "1",
  "tags": ["tag1", "tag2"],
  "location": {
    "latitude": 43.61369,
    "longitude": -72.51832
  }
}
```

**Success Response (200):**
```json
{
  "message": "Moment Data inserted successfully!",
  "body": {
    "object_id": "e41acc70-d8e4-11f0-8b6f-73b6cd60d5d2"
  }
}
```

---

#### Get Moment Detail

Retrieves a moment by ID.

```http
GET /v1/moment/{object_id}
Authorization: Bearer <idToken>
```

---

#### Edit Moment

Updates an existing moment.

```http
PATCH /v1/user/{user_id}/moment/{object_id}
Content-Type: application/json
Authorization: Bearer <idToken>
```

**Request Body (all fields optional except object_title):**
```json
{
  "object_title": "Updated Title",
  "object_desc": "Updated description",
  "start_date": 1765672853203,
  "access": "Public",
  "tags": ["updated", "tags"]
}
```

---

#### Delete Moment

Deletes a moment (owner only).

```http
DELETE /v1/user/{user_id}/moment/{object_id}
Authorization: Bearer <idToken>
```

---

## Notes

### Token Management

- Firebase ID tokens expire after **1 hour**
- Implement token refresh using Firebase SDK on the client
- Store token securely (avoid localStorage for sensitive apps)

### Rate Limits

- No explicit rate limits, but avoid excessive requests
- API Gateway timeout: **29 seconds**

### CORS

CORS is configured on the API Gateway. Allowed origins should include your frontend domain.

### Image Uploads

For profile pictures and media, use **Cloudinary**:
- Cloud Name: `lifescape`
- Upload Preset: `lifescape_angular`

---

## Support

For backend issues or questions, contact the backend team.


