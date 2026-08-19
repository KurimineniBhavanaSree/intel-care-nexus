# MedIntel Backend

Explainable Multimodal Healthcare Assistant Backend API built with FastAPI, PostgreSQL, and AI/ML.

## Features

- **Authentication**: JWT-based user registration, login, and refresh tokens
- **Medical Report Upload & Analysis**: PDF, DOCX, TXT file processing with AI analysis
- **Medical Image Analysis**: X-ray, MRI, CT scan analysis with AI models
- **AI Chat with RAG**: Cited answers using Retrieval-Augmented Generation
- **Knowledge Library**: Searchable medical knowledge base (WHO, PubMed, etc.)
- **Prescription Analysis**: Medicine extraction with dosage, warnings, interactions
- **Bookmarks & History**: Save reports and track chat history
- **User Profiles**: Manage user information and settings

## Tech Stack

- **Framework**: FastAPI 0.104+
- **Database**: PostgreSQL 14+
- **ORM**: SQLAlchemy 2.0+
- **Authentication**: JWT with python-jose
- **Password Hashing**: bcrypt with passlib
- **File Processing**: PyPDF2, python-docx, Pillow, pytesseract
- **AI/ML**: LangChain, OpenAI API, ChromaDB, Sentence Transformers
- **Validation**: Pydantic 2.0+
- **Server**: Uvicorn
- **Testing**: Pytest

## Quick Start

### 1. Prerequisites

- Python 3.11+
- PostgreSQL 14+
- OpenAI API key

### 2. Installation

Clone and setup:

```bash
cd backend
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/medintel_db
SECRET_KEY=your-super-secret-key
OPENAI_API_KEY=your_openai_key
```

### 4. Database Setup

```bash
# Create database
createdb medintel_db

# Run migrations (optional, if using Alembic)
alembic upgrade head
```

### 5. Run the Server

```bash
# Development
python main.py

# Or with uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

Server runs at `http://localhost:8000`

- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user profile
- `PUT /api/v1/auth/me` - Update user profile
- `POST /api/v1/auth/logout` - Logout

### Medical Reports
- `POST /api/v1/reports/upload` - Upload medical report
- `GET /api/v1/reports` - List all reports
- `GET /api/v1/reports/{id}` - Get report details
- `DELETE /api/v1/reports/{id}` - Delete report

### Chat
- `POST /api/v1/chat` - Send chat message
- `GET /api/v1/chat/history` - Get chat history
- `DELETE /api/v1/chat/clear` - Clear chat history

### Medical Images
- `POST /api/v1/images/upload` - Upload medical image
- `GET /api/v1/images` - List all images
- `GET /api/v1/images/{id}` - Get image details
- `POST /api/v1/images/{id}/analyze` - Analyze image
- `DELETE /api/v1/images/{id}` - Delete image

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app factory
│   ├── api/
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   └── endpoints/
│   │   │       ├── __init__.py
│   │   │       ├── auth.py
│   │   │       ├── reports.py
│   │   │       ├── chat.py
│   │   │       └── images.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py           # Settings & configuration
│   │   └── security.py         # JWT & password utilities
│   ├── db/
│   │   ├── __init__.py
│   │   └── database.py         # Database connection
│   ├── models/
│   │   ├── __init__.py
│   │   └── models.py           # SQLAlchemy ORM models
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── schemas.py          # Pydantic request/response schemas
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py     # Authentication logic
│   │   └── report_service.py   # Report processing logic
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── logger.py           # Logging configuration
│   │   └── file_handler.py     # File upload handling
│   ├── rag/                    # RAG pipeline
│   │   └── vectorstore/        # ChromaDB vector store
│   └── uploads/                # Uploaded files storage
├── alembic/                    # Database migrations
├── tests/
├── .env.example
├── .gitignore
├── main.py                     # Entry point
├── requirements.txt
├── pyproject.toml
└── README.md
```

## Database Models

- **User**: Authentication and profile
- **MedicalReport**: Uploaded reports with analysis
- **MedicalImage**: Uploaded medical images
- **ChatMessage**: Chat conversation history
- **Prescription**: Prescription data
- **Bookmark**: Saved reports/articles
- **KnowledgeArticle**: Medical knowledge base

## Testing

Run tests with pytest:

```bash
pytest tests/
pytest tests/test_auth.py -v
pytest tests/test_reports.py -v
```

## Deployment

### Docker

```bash
docker build -t medintel-api .
docker run -p 8000:8000 --env-file .env medintel-api
```

### Production Checklist

- [ ] Set `APP_ENV=production`
- [ ] Generate secure `SECRET_KEY`
- [ ] Use strong database password
- [ ] Enable HTTPS/SSL
- [ ] Setup proper logging (Sentry, LogRocket)
- [ ] Configure monitoring and alerts
- [ ] Setup automated backups
- [ ] Use production database (RDS, managed PostgreSQL)
- [ ] Setup CI/CD pipeline
- [ ] Configure rate limiting
- [ ] Setup API key management

## Security

- All passwords hashed with bcrypt
- JWT tokens with secure signature
- CORS configuration for frontend
- Input validation with Pydantic
- SQL injection protection (SQLAlchemy ORM)
- File upload validation and size limits
- Sensitive data in environment variables

## Performance

- Connection pooling with SQLAlchemy
- Database query optimization
- Async file operations
- Caching strategy (Redis optional)
- Efficient pagination

## Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Create Pull Request

## License

Proprietary - MedIntel Project

## Support

For issues or questions, contact: support@medintel.io
