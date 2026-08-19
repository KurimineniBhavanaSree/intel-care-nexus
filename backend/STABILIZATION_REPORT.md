# Sprint 1 Stabilization Report

Date: July 23, 2026

## Scope

This sprint focused only on backend stabilization issues identified in the project review.

No database schema changes were made.
No frontend changes were made.
No RAG, agentic AI, GraphRAG, or multimodal redesign work was started.

## What Was Fixed

### 1. Broken imports

- Removed eager package imports that created startup side effects:
  - `app/__init__.py`
  - `app/core/__init__.py`
  - `app/api/v1/endpoints/__init__.py`
- Added a compatibility fallback in `app/core/config.py` so settings can load when `pydantic-settings` is not installed.
- Added a compatibility fallback in `app/core/security.py` so JWT utilities do not hard-require `python-jose` at import time.

### 2. Reusable JWT dependency

- Added a shared `verify_token` FastAPI dependency in `app/core/security.py`.
- The dependency reads the `Authorization: Bearer <token>` header and returns the authenticated user ID.
- Invalid or missing tokens now raise consistent `401` errors.

### 3. Protected route consistency

- Updated protected routes to use the same dependency pattern:
  - `app/api/v1/endpoints/auth.py`
  - `app/api/v1/endpoints/reports.py`
  - `app/api/v1/endpoints/chat.py`
  - `app/api/v1/endpoints/images.py`
  - `app/api/v1/endpoints/library.py`
  - `app/api/v1/endpoints/bookmarks.py`
  - `app/api/v1/endpoints/prescriptions.py`
  - `app/api/v1/endpoints/ocr.py`

### 4. OCR router integration

- Fixed the OCR router prefix from `"/api/v1/ocr"` to `"/ocr"` so the mounted path resolves to `/api/v1/ocr/...` as expected.
- Removed invalid OCR imports:
  - `ALLOWED_DOCUMENT_TYPES`
  - `ALLOWED_IMAGE_TYPES`
  - unused `OCRRequest`
- Replaced broken file-save calls with the new async file upload helper.

### 5. Prescription router integration

- Fixed prescription upload to use the shared JWT dependency.
- Replaced incorrect `FileHandler.save_upload_file(...)` usage with the new async upload helper.
- Preserved existing endpoint behavior and response structure.

### 6. FileHandler consistency

- Added `FileHandler.save_upload_file_from_upload(...)` for async `UploadFile` handling.
- Kept the existing byte-based `save_upload_file(...)` method unchanged for routes that already used it correctly.

### 7. Auth endpoint cleanup

- Updated `/auth/me`, `/auth/me` update, and `/auth/logout` to use the shared JWT dependency.
- Updated `/auth/refresh` to accept `RefreshTokenRequest`, which matches the existing frontend contract and schema definitions.

## Files Changed

- `app/core/config.py`
- `app/core/security.py`
- `app/__init__.py`
- `app/core/__init__.py`
- `app/api/v1/endpoints/__init__.py`
- `app/utils/file_handler.py`
- `app/schemas/__init__.py`
- `app/api/v1/endpoints/auth.py`
- `app/api/v1/endpoints/reports.py`
- `app/api/v1/endpoints/chat.py`
- `app/api/v1/endpoints/images.py`
- `app/api/v1/endpoints/library.py`
- `app/api/v1/endpoints/bookmarks.py`
- `app/api/v1/endpoints/prescriptions.py`
- `app/api/v1/endpoints/ocr.py`

## Validation Performed

- Ran `python -m compileall app` successfully.
- Performed static checks to confirm:
  - OCR prefix was corrected.
  - No protected route still used the old `token: str = None` pattern.
  - OCR/prescription upload paths now use the async upload helper.

## Validation Limits

The current workspace does not have all runtime dependencies installed, so full live import/startup validation could not be completed in this shell.

Observed missing runtime packages in this environment included:

- `pydantic-settings`
- `python-jose`
- `passlib`
- `sqlalchemy`

The code was updated to reduce reliance on some of these at import time, but a full backend boot test still requires the project dependencies to be installed.

## Intentionally Not Changed

- Database schema
- Alembic migrations
- Frontend code
- RAG pipeline implementation
- Agentic AI modules
- GraphRAG modules
- Multimodal reasoning beyond the existing OCR/image placeholders
- Existing API response shapes

## Result

Sprint 1 stabilization is complete at the code level.

The backend structure is unchanged, but the import surface, auth dependency flow, OCR routing, and upload handling are now materially more stable and aligned with the existing frontend contract.
