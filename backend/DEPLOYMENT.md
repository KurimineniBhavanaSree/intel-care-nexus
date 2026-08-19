# Production Deployment Guide

## Pre-Deployment Checklist

### Security
- [ ] Change `SECRET_KEY` to a cryptographically secure random string
- [ ] Update `CORS_ORIGINS` to match your frontend domain
- [ ] Enable HTTPS/SSL certificates
- [ ] Setup API rate limiting
- [ ] Enable request size limits
- [ ] Configure CSRF protection
- [ ] Setup security headers (HSTS, CSP, etc.)
- [ ] Configure allowed hosts

### Environment
- [ ] Set `APP_ENV=production`
- [ ] Set `APP_DEBUG=false`
- [ ] Configure production database
- [ ] Setup Redis for caching (optional)
- [ ] Configure email service
- [ ] Setup S3 or CDN for file storage

### Database
- [ ] Create production PostgreSQL database
- [ ] Run migrations
- [ ] Configure database backups
- [ ] Setup connection pooling
- [ ] Enable SSL for database connection

### Monitoring
- [ ] Configure logging service (ELK, Datadog, etc.)
- [ ] Setup error tracking (Sentry)
- [ ] Configure performance monitoring (New Relic, Datadog)
- [ ] Setup health check monitoring
- [ ] Configure alerting

---

## Docker Deployment

### Build Docker Image

```bash
docker build -t medintel-api:latest .
```

### Run with Docker Compose

```bash
docker-compose up -d
```

### Push to Registry

```bash
# Docker Hub
docker tag medintel-api:latest your-registry/medintel-api:latest
docker push your-registry/medintel-api:latest

# AWS ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
docker tag medintel-api:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/medintel-api:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/medintel-api:latest
```

---

## Cloud Deployment

### AWS ECS

```yaml
# ecs-task-definition.json
{
  "family": "medintel-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "medintel-api",
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/medintel-api:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "hostPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DATABASE_URL",
          "value": "postgresql://user:pass@rds-endpoint:5432/medintel_db"
        }
      ],
      "secrets": [
        {
          "name": "SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:medintel/SECRET_KEY"
        }
      ]
    }
  ]
}
```

### Google Cloud Run

```bash
# Build and deploy
gcloud run deploy medintel-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --memory 1Gi \
  --cpu 1 \
  --timeout 3600 \
  --set-env-vars DATABASE_URL=postgresql://... \
  --allow-unauthenticated
```

### Heroku

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Create app
heroku create medintel-api

# Add Postgres addon
heroku addons:create heroku-postgresql:standard-0 -a medintel-api

# Deploy
git push heroku main

# Run migrations
heroku run alembic upgrade head -a medintel-api
```

### DigitalOcean App Platform

```yaml
# app.yaml
name: medintel-api
services:
- name: api
  github:
    branch: main
    repo: your-username/medintel
  build_command: pip install -r requirements.txt
  http_port: 8000
  run_command: uvicorn app.main:app --host 0.0.0.0 --port 8000
  envs:
  - key: DATABASE_URL
    scope: RUN_AND_BUILD_TIME
    value: ${db.connection_string}
  - key: APP_ENV
    value: production
databases:
- engine: PG
  name: postgres
  version: "14"
```

---

## Kubernetes Deployment

### Deployment Manifest

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: medintel-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: medintel-api
  template:
    metadata:
      labels:
        app: medintel-api
    spec:
      containers:
      - name: api
        image: your-registry/medintel-api:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: medintel-secrets
              key: database-url
        - name: SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: medintel-secrets
              key: secret-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: medintel-api-service
spec:
  selector:
    app: medintel-api
  type: LoadBalancer
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: medintel-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: medintel-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Deploy to Kubernetes

```bash
# Create namespace
kubectl create namespace medintel

# Create secrets
kubectl create secret generic medintel-secrets \
  --from-literal=database-url='postgresql://...' \
  --from-literal=secret-key='your-secret-key' \
  -n medintel

# Deploy
kubectl apply -f k8s-deployment.yaml -n medintel

# Check status
kubectl get pods -n medintel
kubectl logs -f deployment/medintel-api -n medintel
```

---

## Monitoring & Logging

### Sentry Error Tracking

```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=settings.SENTRY_DSN,
    integrations=[FastApiIntegration()],
    traces_sample_rate=0.1,
    environment=settings.APP_ENV,
)
```

### Datadog Monitoring

```bash
# Install agent
pip install datadog

# Configure in main.py
from datadog import api
api.api_key = os.getenv('DATADOG_API_KEY')
```

### ELK Stack Logging

```python
from pythonjsonlogger import jsonlogger

# Configure JSON logging for ELK
logger_handler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter()
logger_handler.setFormatter(formatter)
```

---

## Performance Optimization

### Database Optimization

```python
# Configure connection pooling
SQLALCHEMY_POOL_SIZE = 20
SQLALCHEMY_POOL_RECYCLE = 3600
SQLALCHEMY_POOL_PRE_PING = True
SQLALCHEMY_MAX_OVERFLOW = 40

# Add database indexes
class MedicalReport(Base):
    __tablename__ = "medical_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    status = Column(SQLEnum(ReportStatus), index=True)
    created_at = Column(DateTime, index=True)
```

### Caching Strategy

```python
from redis import Redis
from app.core.config import settings

redis_client = Redis.from_url(settings.REDIS_URL) if settings.REDIS_URL else None

async def get_user_reports_cached(user_id: int):
    cache_key = f"user:{user_id}:reports"
    
    if redis_client:
        cached = redis_client.get(cache_key)
        if cached:
            return json.loads(cached)
    
    reports = db.query(MedicalReport).filter(
        MedicalReport.user_id == user_id
    ).all()
    
    if redis_client:
        redis_client.setex(cache_key, 3600, json.dumps([...]))
    
    return reports
```

### Load Balancing

```nginx
# nginx.conf
upstream medintel_api {
    least_conn;
    server api1:8000 max_fails=3 fail_timeout=30s;
    server api2:8000 max_fails=3 fail_timeout=30s;
    server api3:8000 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name api.medintel.io;
    
    location / {
        proxy_pass http://medintel_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

---

## Backup & Disaster Recovery

### Database Backup

```bash
#!/bin/bash
# backup-db.sh

BACKUP_DIR="/backups/medintel"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Backup PostgreSQL
pg_dump $DATABASE_URL > $BACKUP_DIR/medintel_$TIMESTAMP.sql

# Compress
gzip $BACKUP_DIR/medintel_$TIMESTAMP.sql

# Upload to S3
aws s3 cp $BACKUP_DIR/medintel_$TIMESTAMP.sql.gz s3://medintel-backups/

# Keep only last 30 days
find $BACKUP_DIR -mtime +30 -delete
```

### Restore from Backup

```bash
# Download from S3
aws s3 cp s3://medintel-backups/medintel_20260719_100000.sql.gz .

# Decompress
gunzip medintel_20260719_100000.sql.gz

# Restore
psql $DATABASE_URL < medintel_20260719_100000.sql
```

---

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Build Docker image
      run: docker build -t medintel-api:${{ github.sha }} .
    
    - name: Push to registry
      run: |
        docker login -u ${{ secrets.DOCKER_USERNAME }} -p ${{ secrets.DOCKER_PASSWORD }}
        docker tag medintel-api:${{ github.sha }} your-registry/medintel-api:latest
        docker push your-registry/medintel-api:latest
    
    - name: Deploy to production
      run: |
        curl -X POST https://api.heroku.com/apps/medintel-api/dynos \
          -H "Authorization: Bearer ${{ secrets.HEROKU_TOKEN }}" \
          -H "Content-Type: application/json" \
          -d '{}'
```

---

## Rollback Procedure

```bash
# If deployment fails, rollback to previous version
docker service update --image previous-registry/medintel-api:v1.0.0 medintel_api

# Or with Kubernetes
kubectl rollout undo deployment/medintel-api -n medintel
kubectl rollout history deployment/medintel-api -n medintel
```

---

## Post-Deployment Verification

```bash
# Check API health
curl https://api.yourdomain.com/health

# Test authentication
curl -X POST https://api.yourdomain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass"
  }'

# Monitor logs
kubectl logs -f deployment/medintel-api -n medintel

# Check database connection
psql $DATABASE_URL -c "SELECT 1;"
```

---

## Troubleshooting

### High Memory Usage

```bash
# Check container memory
docker stats medintel_api

# Reduce Python memory
export PYTHONUNBUFFERED=1
export PYTHONHASHSEED=random
```

### Database Connection Errors

```python
# Verify connection string
DATABASE_URL = "postgresql://user:password@host:5432/dbname"

# Check pool size
SQLALCHEMY_POOL_SIZE = 10  # Reduce if memory-constrained
```

### Slow Queries

```sql
-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM medical_reports
WHERE user_id = 1 AND created_at > NOW() - INTERVAL '30 days';

-- Add indexes if needed
CREATE INDEX idx_reports_user_date ON medical_reports(user_id, created_at);
```

---

## Support

For deployment issues:
- Check logs: `kubectl logs deployment/medintel-api`
- Monitor metrics: Datadog/New Relic dashboard
- Contact: devops@medintel.io
