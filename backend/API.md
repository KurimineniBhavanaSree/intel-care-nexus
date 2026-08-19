# API Documentation

## MedIntel Backend API

Complete REST API for the MedIntel Healthcare Assistant platform.

### Base URL

```
http://localhost:8000/api/v1
```

### Authentication

All endpoints (except `/auth/register` and `/auth/login`) require authentication via JWT token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

### Response Format

All responses are in JSON format:

```json
{
  "data": {...},
  "status": "success",
  "timestamp": "2026-07-22T10:30:00Z"
}
```

Errors:

```json
{
  "detail": "Error message",
  "error_code": "ERROR_CODE",
  "timestamp": "2026-07-22T10:30:00Z"
}
```

---

## Authentication Endpoints

### Register User

**POST** `/auth/register`

Create a new user account.

Request:
```json
{
  "name": "Dr. Jane Doe",
  "email": "jane@hospital.com",
  "phone": "+91 98765 43210",
  "password": "SecurePassword123",
  "date_of_birth": "1992-04-18",
  "gender": "Female",
  "emergency_contact": "+91 91234 56789"
}
```

Response (201):
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

### Login

**POST** `/auth/login`

Authenticate user and get tokens.

Request:
```json
{
  "email": "jane@hospital.com",
  "password": "SecurePassword123"
}
```

Response (200):
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

### Refresh Token

**POST** `/auth/refresh`

Get new access token using refresh token.

Request:
```json
{
  "refresh_token": "eyJhbGc..."
}
```

Response (200):
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

### Get Current User

**GET** `/auth/me`

Get authenticated user profile.

Response (200):
```json
{
  "id": 1,
  "name": "Dr. Jane Doe",
  "email": "jane@hospital.com",
  "phone": "+91 98765 43210",
  "role": "physician",
  "avatar_url": "https://...",
  "date_of_birth": "1992-04-18",
  "gender": "Female",
  "emergency_contact": "+91 91234 56789",
  "is_active": true,
  "created_at": "2026-07-19T10:30:00Z"
}
```

### Update Profile

**PUT** `/auth/me`

Update user profile.

Request:
```json
{
  "name": "Dr. Jane Smith",
  "phone": "+91 98765 54321",
  "date_of_birth": "1992-04-18",
  "gender": "Female",
  "emergency_contact": "+91 91234 56789"
}
```

Response (200):
```json
{
  "id": 1,
  "name": "Dr. Jane Smith",
  ...
}
```

### Logout

**POST** `/auth/logout`

Logout user (client should discard token).

Response (200):
```json
{
  "message": "Logged out successfully"
}
```

---

## Medical Reports Endpoints

### Upload Report

**POST** `/reports/upload`

Upload a medical report file (PDF, DOCX, TXT).

Parameters:
- `file` (multipart/form-data): Report file
- `report_type` (query): Type of report (CBC, MRI, etc.)
- `patient_name` (query, optional): Patient name

Response (201):
```json
{
  "filename": "cbc_report_20260719_143022.pdf",
  "file_size": 412160,
  "file_path": "./app/uploads/reports/2026/07/19/cbc_report_20260719_143022.pdf",
  "upload_id": "123"
}
```

### List Reports

**GET** `/reports`

Get all reports for current user.

Response (200):
```json
[
  {
    "id": 1,
    "user_id": 1,
    "filename": "cbc_report.pdf",
    "file_size": 412160,
    "report_type": "Complete Blood Count",
    "patient_name": "Ravi Kumar",
    "status": "analyzed",
    "summary": "Blood work indicates...",
    "key_findings": [...],
    "detected_conditions": [...],
    "recommendations": [...],
    "uploaded_at": "2026-07-19T10:30:00Z",
    "analyzed_at": "2026-07-19T10:35:00Z"
  }
]
```

### Get Report

**GET** `/reports/{report_id}`

Get specific report details.

Response (200):
```json
{
  "id": 1,
  ...
}
```

### Delete Report

**DELETE** `/reports/{report_id}`

Delete a report.

Response (204): No Content

---

## Chat Endpoints

### Send Message

**POST** `/chat`

Send a chat message and get AI response.

Request:
```json
{
  "content": "What should I do about high cholesterol?",
  "session_id": "session-123" (optional)
}
```

Response (200):
```json
{
  "message": {
    "id": 1,
    "role": "assistant",
    "content": "Based on your recent labs...",
    "citations": [
      {
        "title": "ACC/AHA Guideline",
        "source": "acc.org"
      }
    ],
    "created_at": "2026-07-19T10:30:00Z"
  },
  "citations": [...]
}
```

### Get Chat History

**GET** `/chat/history`

Get chat conversation history.

Query Parameters:
- `session_id` (optional): Filter by session

Response (200):
```json
[
  {
    "id": 1,
    "role": "user",
    "content": "What should I do about high cholesterol?",
    "created_at": "2026-07-19T10:30:00Z"
  },
  {
    "id": 2,
    "role": "assistant",
    "content": "Based on your recent labs...",
    "citations": [...],
    "created_at": "2026-07-19T10:31:00Z"
  }
]
```

### Clear Chat History

**DELETE** `/chat/clear`

Delete all chat messages.

Response (204): No Content

---

## Medical Images Endpoints

### Upload Image

**POST** `/images/upload`

Upload medical image (PNG, JPG, DICOM).

Parameters:
- `file` (multipart/form-data): Image file
- `image_type` (query): Type (X-Ray, MRI, CT)

Response (201):
```json
{
  "filename": "chest_xray_20260719.jpg",
  "file_size": 2097152,
  "file_path": "./app/uploads/images/2026/07/19/chest_xray_20260719.jpg",
  "upload_id": "456"
}
```

### List Images

**GET** `/images`

Get all medical images.

Response (200):
```json
[
  {
    "id": 1,
    "user_id": 1,
    "filename": "chest_xray.jpg",
    "image_type": "X-Ray",
    "status": "analyzed",
    "detected_condition": "Mild pneumonia",
    "confidence": 0.85,
    "findings": ["Infiltrate in right lower lobe"],
    "uploaded_at": "2026-07-19T10:30:00Z",
    "analyzed_at": "2026-07-19T10:35:00Z"
  }
]
```

### Get Image

**GET** `/images/{image_id}`

Get image details.

Response (200):
```json
{
  "id": 1,
  ...
}
```

### Analyze Image

**POST** `/images/{image_id}/analyze`

Analyze medical image using AI.

Response (200):
```json
{
  "condition": "Mild pneumonia",
  "confidence": 0.85,
  "modality": "Chest X-Ray",
  "findings": [
    "Infiltrate in right lower lobe",
    "Normal cardiac silhouette"
  ],
  "recommendations": [
    "Follow-up chest X-ray in 2-4 weeks",
    "Monitor respiratory symptoms"
  ]
}
```

### Delete Image

**DELETE** `/images/{image_id}`

Delete medical image.

Response (204): No Content

---

## Knowledge Library Endpoints

### List Articles

**GET** `/library`

Get knowledge articles with filtering.

Query Parameters:
- `category` (optional): Filter by category
- `search` (optional): Search term
- `skip` (optional): Pagination skip (default: 0)
- `limit` (optional): Results per page (default: 20)

Response (200):
```json
[
  {
    "id": 1,
    "external_id": "ACC-2018-001",
    "title": "ACC/AHA 2018 Cholesterol Guideline",
    "category": "Cardiology",
    "organization": "American College of Cardiology",
    "publication_date": "2018-11-10",
    "tags": ["cholesterol", "cardiology", "guidelines"],
    "source_url": "https://acc.org/..."
  }
]
```

### Get Categories

**GET** `/library/categories`

Get all article categories.

Response (200):
```json
["Cardiology", "Neurology", "Oncology", "General"]
```

### Get Article

**GET** `/library/{article_id}`

Get article details.

Response (200):
```json
{
  "id": 1,
  ...
}
```

---

## Bookmarks Endpoints

### Create Bookmark

**POST** `/bookmarks`

Save a report or article.

Request:
```json
{
  "report_id": 1,
  "article_id": null
}
```

Response (201):
```json
{
  "id": 1,
  "user_id": 1,
  "report_id": 1,
  "article_id": null,
  "created_at": "2026-07-19T10:30:00Z"
}
```

### List Bookmarks

**GET** `/bookmarks`

Get all bookmarks.

Response (200):
```json
[
  {
    "id": 1,
    "user_id": 1,
    "report_id": 1,
    "created_at": "2026-07-19T10:30:00Z"
  }
]
```

### Delete Bookmark

**DELETE** `/bookmarks/{bookmark_id}`

Remove bookmark.

Response (204): No Content

---

## Prescriptions Endpoints

### Upload Prescription

**POST** `/prescriptions/upload`

Upload prescription image.

Parameters:
- `file` (multipart/form-data): Prescription image

Response (201):
```json
{
  "filename": "prescription_20260719.jpg",
  "file_size": 1048576,
  "file_path": "./app/uploads/prescriptions/2026/07/19/prescription_20260719.jpg",
  "upload_id": "789"
}
```

### List Prescriptions

**GET** `/prescriptions`

Get all prescriptions.

Response (200):
```json
[
  {
    "id": 1,
    "user_id": 1,
    "filename": "prescription.jpg",
    "doctor_name": "Dr. Meera Iyer",
    "prescription_date": "2026-07-19",
    "medicines": [
      {
        "name": "Atorvastatin 10 mg",
        "dosage": "1 tablet",
        "timing": "Once daily at bedtime",
        "duration": "3 months",
        "warnings": ["Take with water"],
        "side_effects": ["Muscle pain"],
        "interactions": []
      }
    ],
    "uploaded_at": "2026-07-19T10:30:00Z"
  }
]
```

### Get Prescription

**GET** `/prescriptions/{prescription_id}`

Get prescription details.

Response (200):
```json
{
  "id": 1,
  ...
}
```

### Delete Prescription

**DELETE** `/prescriptions/{prescription_id}`

Delete prescription.

Response (204): No Content

---

## Error Codes

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `500` - Internal Server Error

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated endpoints

---

## Versioning

Current API version: `v1`

Future versions will be available at `/api/v2`, etc.

---

## Webhooks (Future)

Future support for webhook notifications on:
- Report analysis complete
- Image analysis complete
- Chat message received
- New knowledge article available
