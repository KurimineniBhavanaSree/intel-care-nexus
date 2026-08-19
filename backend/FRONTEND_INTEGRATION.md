# Frontend to Backend Integration Guide

## Overview

This guide shows how to integrate the React frontend with the FastAPI backend. We'll replace mock data with real API calls using Axios.

## Setup

### 1. Install Axios

```bash
cd intel-care-nexus
npm install axios
```

### 2. Create API Configuration

Create `src/lib/api.ts`:

```typescript
import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

interface ApiClient {
  request: AxiosInstance;
  setToken: (token: string) => void;
  getToken: () => string | null;
}

const api: ApiClient = {
  request: axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  }),
  setToken(token: string) {
    localStorage.setItem('access_token', token);
    this.request.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },
  getToken() {
    return localStorage.getItem('access_token');
  },
};

// Set token on app load if exists
const token = api.getToken();
if (token) {
  api.setToken(token);
}

// Response interceptor for error handling
api.request.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 3. Create Service Files

Create `src/services/authService.ts`:

```typescript
import api from '@/lib/api';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  avatar_url?: string;
  date_of_birth?: string;
  gender?: string;
  emergency_contact?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export const authService = {
  async register(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    date_of_birth?: string;
    gender?: string;
    emergency_contact?: string;
  }): Promise<AuthResponse> {
    const response = await api.request.post('/auth/register', data);
    const tokens = response.data;
    api.setToken(tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    return tokens;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.request.post('/auth/login', { email, password });
    const tokens = response.data;
    api.setToken(tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    return tokens;
  },

  async logout(): Promise<void> {
    try {
      await api.request.post('/auth/logout');
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.request.get('/auth/me');
    return response.data;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.request.put('/auth/me', data);
    return response.data;
  },

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) throw new Error('No refresh token');

    const response = await api.request.post('/auth/refresh', { refresh_token: refreshToken });
    const tokens = response.data;
    api.setToken(tokens.access_token);
    return tokens;
  },
};
```

Create `src/services/reportService.ts`:

```typescript
import api from '@/lib/api';

export interface MedicalReport {
  id: number;
  user_id: number;
  filename: string;
  file_size: number;
  report_type: string;
  patient_name?: string;
  status: 'pending' | 'processing' | 'analyzed' | 'failed';
  summary?: string;
  key_findings?: any[];
  detected_conditions?: any[];
  recommendations?: string[];
  uploaded_at: string;
  analyzed_at?: string;
}

export const reportService = {
  async uploadReport(file: File, reportType: string, patientName?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('report_type', reportType);
    if (patientName) formData.append('patient_name', patientName);

    const response = await api.request.post('/reports/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getReports(): Promise<MedicalReport[]> {
    const response = await api.request.get('/reports');
    return response.data;
  },

  async getReport(id: number): Promise<MedicalReport> {
    const response = await api.request.get(`/reports/${id}`);
    return response.data;
  },

  async deleteReport(id: number): Promise<void> {
    await api.request.delete(`/reports/${id}`);
  },
};
```

Create `src/services/chatService.ts`:

```typescript
import api from '@/lib/api';

export interface Citation {
  title: string;
  source: string;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  created_at: string;
}

export const chatService = {
  async sendMessage(content: string, sessionId?: string): Promise<ChatMessage> {
    const response = await api.request.post('/chat', {
      content,
      session_id: sessionId,
    });
    return response.data.message;
  },

  async getChatHistory(sessionId?: string): Promise<ChatMessage[]> {
    const response = await api.request.get('/chat/history', {
      params: { session_id: sessionId },
    });
    return response.data;
  },

  async clearChatHistory(): Promise<void> {
    await api.request.delete('/chat/clear');
  },
};
```

Create `src/services/imageService.ts`:

```typescript
import api from '@/lib/api';

export interface MedicalImage {
  id: number;
  user_id: number;
  filename: string;
  image_type: string;
  status: 'pending' | 'processing' | 'analyzed' | 'failed';
  detected_condition?: string;
  confidence?: number;
  findings?: string[];
  uploaded_at: string;
  analyzed_at?: string;
}

export interface ImageAnalysis {
  condition: string;
  confidence: number;
  modality: string;
  findings: string[];
  recommendations: string[];
}

export const imageService = {
  async uploadImage(file: File, imageType: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('image_type', imageType);

    const response = await api.request.post('/images/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getImages(): Promise<MedicalImage[]> {
    const response = await api.request.get('/images');
    return response.data;
  },

  async getImage(id: number): Promise<MedicalImage> {
    const response = await api.request.get(`/images/${id}`);
    return response.data;
  },

  async analyzeImage(id: number): Promise<ImageAnalysis> {
    const response = await api.request.post(`/images/${id}/analyze`);
    return response.data;
  },

  async deleteImage(id: number): Promise<void> {
    await api.request.delete(`/images/${id}`);
  },
};
```

Create `src/services/prescriptionService.ts`:

```typescript
import api from '@/lib/api';

export interface Medicine {
  name: string;
  dosage: string;
  timing: string;
  duration: string;
  warnings: string[];
  side_effects: string[];
  interactions: string[];
}

export interface Prescription {
  id: number;
  user_id: number;
  filename: string;
  doctor_name?: string;
  prescription_date?: string;
  medicines: Medicine[];
  uploaded_at: string;
}

export const prescriptionService = {
  async uploadPrescription(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.request.post('/prescriptions/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getPrescriptions(): Promise<Prescription[]> {
    const response = await api.request.get('/prescriptions');
    return response.data;
  },

  async getPrescription(id: number): Promise<Prescription> {
    const response = await api.request.get(`/prescriptions/${id}`);
    return response.data;
  },

  async deletePrescription(id: number): Promise<void> {
    await api.request.delete(`/prescriptions/${id}`);
  },
};
```

Create `src/services/libraryService.ts`:

```typescript
import api from '@/lib/api';

export interface Article {
  id: number;
  external_id: string;
  title: string;
  category: string;
  organization: string;
  publication_date: string;
  tags: string[];
  source_url?: string;
}

export const libraryService = {
  async getArticles(category?: string, search?: string, skip = 0, limit = 20): Promise<Article[]> {
    const response = await api.request.get('/library', {
      params: { category, search, skip, limit },
    });
    return response.data;
  },

  async getCategories(): Promise<string[]> {
    const response = await api.request.get('/library/categories');
    return response.data;
  },

  async getArticle(id: number): Promise<Article> {
    const response = await api.request.get(`/library/${id}`);
    return response.data;
  },
};
```

Create `src/services/bookmarkService.ts`:

```typescript
import api from '@/lib/api';

export interface Bookmark {
  id: number;
  user_id: number;
  report_id?: number;
  article_id?: string;
  created_at: string;
}

export const bookmarkService = {
  async createBookmark(reportId?: number, articleId?: string): Promise<Bookmark> {
    const response = await api.request.post('/bookmarks', {
      report_id: reportId,
      article_id: articleId,
    });
    return response.data;
  },

  async getBookmarks(): Promise<Bookmark[]> {
    const response = await api.request.get('/bookmarks');
    return response.data;
  },

  async deleteBookmark(id: number): Promise<void> {
    await api.request.delete(`/bookmarks/${id}`);
  },
};
```

## Integration Examples

### Login Page

Update `src/routes/login.tsx`:

```typescript
import { authService } from '@/services/authService';

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    
    try {
      setLoading(true);
      await authService.login(email, password);
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component
}
```

### Register Page

Update `src/routes/register.tsx`:

```typescript
import { authService } from '@/services/authService';

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({...});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    // ... validation
    
    try {
      setLoading(true);
      await authService.register(form);
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component
}
```

### Reports Upload

Update `src/routes/dashboard.upload.tsx`:

```typescript
import { reportService } from '@/services/reportService';

function UploadPage() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList) return;
    
    for (const file of Array.from(fileList)) {
      try {
        setUploading(true);
        const result = await reportService.uploadReport(file, "General");
        setFiles(prev => [...prev, { id: result.upload_id, name: file.name, status: "done" }]);
      } catch (err) {
        console.error("Upload failed:", err);
      } finally {
        setUploading(false);
      }
    }
  };

  // ... rest of component
}
```

### Reports List

Update `src/routes/dashboard.reports.tsx`:

```typescript
import { reportService } from '@/services/reportService';

function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const data = await reportService.getReports();
        setReports(data);
      } catch (err) {
        console.error("Failed to load reports:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadReports();
  }, []);

  const handleDelete = async (reportId: number) => {
    try {
      await reportService.deleteReport(reportId);
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (err) {
      console.error("Failed to delete report:", err);
    }
  };

  // ... rest of component
}
```

### Chat Integration

Update `src/routes/dashboard.chat.tsx`:

```typescript
import { chatService } from '@/services/chatService';

function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const send = async (text: string) => {
    if (!text.trim()) return;
    
    // Add user message
    const userMsg = { id: `u-${Date.now()}`, role: "user" as const, content: text };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setTyping(true);

    try {
      // Get AI response
      const assistantMsg = await chatService.sendMessage(text);
      setMessages(m => [...m, assistantMsg]);
    } catch (err) {
      console.error("Chat failed:", err);
    } finally {
      setTyping(false);
    }
  };

  // ... rest of component
}
```

## Environment Configuration

Add to `.env.local`:

```env
REACT_APP_API_URL=http://localhost:8000/api/v1
```

For production:

```env
REACT_APP_API_URL=https://api.yourdomain.com/api/v1
```

## Error Handling

Implement global error handling:

```typescript
// src/lib/error-handler.ts
export const handleApiError = (error: any): string => {
  if (error.response?.status === 401) {
    return "Unauthorized - Please login";
  }
  if (error.response?.status === 403) {
    return "Forbidden - You don't have access";
  }
  if (error.response?.status === 404) {
    return "Resource not found";
  }
  if (error.response?.status === 500) {
    return "Server error - Please try again later";
  }
  return error.response?.data?.detail || "An error occurred";
};
```

## Testing

```bash
# Test API connectivity
curl http://localhost:8000/health

# Test with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/auth/me
```

## Deployment Checklist

- [ ] Update API URL for production environment
- [ ] Enable HTTPS
- [ ] Configure CORS for frontend domain
- [ ] Setup error logging (Sentry)
- [ ] Implement token refresh logic
- [ ] Add request timeout handling
- [ ] Setup API rate limiting
- [ ] Configure API versioning
