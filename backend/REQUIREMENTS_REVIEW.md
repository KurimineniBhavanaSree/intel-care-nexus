# Requirements Review

## Result

The backend dependency set was cleaned up for Python 3.13 on Windows and verified in an isolated virtual environment.

Validation performed:
- `python -m pip install -r requirements.txt` in a fresh workspace venv
- `python -m pip check` in that venv
- `python -m uvicorn app.main:app --reload --reload-dir app --host 127.0.0.1 --port 8014`
- Live health check: `GET /health` returned `{"status":"healthy","version":"1.0.0","environment":"development"}`

## Package Changes

### Core backend

- `fastapi==0.104.1` -> `fastapi==0.135.0`
  - Updated for Python 3.13 compatibility and current Starlette/Pydantic support.

- `uvicorn==0.24.0` -> `uvicorn==0.41.0`
  - Updated to a Windows/Python 3.13 compatible release with current dependency support.

- `sqlalchemy==2.0.23` -> `sqlalchemy==2.0.51`
  - Updated to match current dependency stack and improve Python 3.13 compatibility.

- `psycopg[binary]==3.2.9` -> `psycopg[binary]==3.3.4`
  - Kept PostgreSQL on psycopg v3, using the binary wheel that installs cleanly on Windows 11 / Python 3.13.

- `pydantic==2.5.0` -> `pydantic==2.12.5`
  - Updated to work cleanly with the current FastAPI and settings packages.

- `pydantic-settings==2.1.0` -> `pydantic-settings==2.14.2`
  - Updated for Python 3.13 and compatibility with the newer Pydantic release.

- `python-jose==3.3.0` -> `python-jose==3.5.0`
  - Updated JWT support while keeping the existing auth implementation.

- `passlib==1.7.4` retained
  - Still used by the auth layer.

- `bcrypt==4.1.1` -> `bcrypt==5.0.0`
  - Updated to a wheel that installs correctly on Python 3.13 for Windows.

- `python-multipart==0.0.6` -> `python-multipart==0.0.32`
  - Updated for current FastAPI upload handling support.

- `aiofiles==23.2.1` -> `aiofiles==25.1.0`
  - Updated for Python 3.13 compatibility.

- `python-dotenv==1.0.0` -> `python-dotenv==1.2.2`
  - Updated to the current stable release.

- `alembic==1.12.1` -> `alembic==1.18.5`
  - Updated for SQLAlchemy 2.x and Python 3.13 support.

- `email-validator==2.1.0` -> `email-validator==2.3.0`
  - Updated for current Pydantic/FastAPI validation support.

### RAG and Gemini

- `langchain==0.1.4` -> `langchain==1.3.14`
  - Updated to the current LangChain major line.

- Added `langchain-core==1.5.0`
  - Required because the backend code now imports `Document`, prompt, and message classes from LangChain Core.

- `langchain-community==0.0.10` -> `langchain-community==0.4.2`
  - Updated to the current community integrations package.

- Added `langchain-text-splitters==1.1.2`
  - Required because the backend now imports text splitters from the split-out package.

- `langchain-google-genai==0.0.1` -> `langchain-google-genai==4.3.1`
  - Updated for the current Gemini integration path.

- Removed `google-generativeai==0.3.0`
  - The backend now uses the modern `google-genai` client that is brought in by `langchain-google-genai`.

- Added `google-genai==2.14.0`
  - Explicitly pins the current Gemini client used by the LangChain integration.

- `sentence-transformers==2.2.2` -> `sentence-transformers==5.6.0`
  - Updated to a Python 3.13 compatible release.

- `faiss-cpu==1.7.4` -> `faiss-cpu==1.14.3`
  - Updated to a Windows 11 / Python 3.13 wheel that installs successfully.

- `numpy==1.26.2` -> `numpy==2.3.1`
  - Updated to satisfy current downstream wheels and avoid Python 3.13 build issues.

### OCR and file processing

- `Pillow==10.1.0` -> `Pillow==12.3.0`
  - Updated because `pdfplumber` and OCR-related packages require a newer wheel for Python 3.13.

- `pytesseract==0.3.10` -> `pytesseract==0.3.13`
  - Updated for current OCR wrapper support.

- `pdfplumber==0.10.3` -> `pdfplumber==0.11.10`
  - Updated for Python 3.13 compatibility.

- `PyMuPDF==1.23.8` -> `PyMuPDF==1.28.0`
  - Updated for current Windows wheels.

- `opencv-python==4.8.1.78` -> `opencv-python==5.0.0.93`
  - Updated to a Python 3.13 compatible wheel.

### Removed as unnecessary or duplicate

These packages were removed because they were not used by the current backend code path, were only test/dev helpers, or duplicated functionality already covered by transitive dependencies:

- `PyJWT`
- `openai`
- `chromadb`
- `pypdf`
- `unstructured`
- `python-magic-bin`
- `PyPDF2`
- `python-docx`
- `pandas`
- `python-logging-loki`
- `sentry-sdk`
- `pytest`
- `pytest-asyncio`
- `httpx`
- `requests`
- `click`
- `colorama`

## Code Files Updated

- [`app/core/config.py`](./app/core/config.py)
  - Changed the default database URL from `postgresql://...` to `postgresql+psycopg://...` so the backend aligns with psycopg v3.

- [`app/rag/document_loader.py`](./app/rag/document_loader.py)
  - Switched LangChain document loader imports to `langchain_community` / `langchain_core`.

- [`app/rag/chunking_strategy.py`](./app/rag/chunking_strategy.py)
  - Switched text splitter and document imports to `langchain_text_splitters` / `langchain_core`.

- [`app/rag/prompt_templates.py`](./app/rag/prompt_templates.py)
  - Switched prompt and message imports to `langchain_core`.

- [`app/rag/retriever.py`](./app/rag/retriever.py)
  - Switched document import to `langchain_core`.

- [`app/rag/embeddings_manager.py`](./app/rag/embeddings_manager.py)
  - Switched document import to `langchain_core`.

- [`app/rag/vector_store_manager.py`](./app/rag/vector_store_manager.py)
  - Switched document import to `langchain_core`.

- [`app/rag/llm_manager.py`](./app/rag/llm_manager.py)
  - Removed the deprecated `google.generativeai` import and the old `genai.configure(...)` call.
  - Switched message imports to `langchain_core.messages`.

## Why These Code Changes Were Necessary

The old LangChain import paths used by the backend no longer exist in the current package family. The backend logic did not need redesign, but the import locations had to move to:

- `langchain_community.document_loaders`
- `langchain_core.documents`
- `langchain_core.prompts`
- `langchain_core.messages`
- `langchain_text_splitters`

The Gemini setup also had to stop relying on the deprecated `google.generativeai` package because the current LangChain integration uses `google-genai`.

## Manual Steps Remaining

- Set `DATABASE_URL` to a real PostgreSQL psycopg URL in deployment, for example:
  - `postgresql+psycopg://user:password@host:5432/medintel_db`
- Provide a valid `GOOGLE_API_KEY` if Gemini features are used.
- Install the OS-level Tesseract OCR binary and ensure it is on `PATH`.
- If production uses PostgreSQL, ensure the database server is reachable from the host running the API.

## Notes

- The backend install was verified in a clean workspace venv, not only in the global Python environment.
- A `pip check` run in that venv returned `No broken requirements found.`
- The backend started successfully under `uvicorn` with `--reload` and served `/health` successfully on port `8014`.
