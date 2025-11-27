# Transformer Management System

A full-stack application for managing electrical transformers, inspections, and thermal images with AI-powered anomaly detection and digital maintenance record generation. Built with Next.js, Spring Boot, and PostgreSQL.

## Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Usage Guide](#usage-guide)
- [Known Limitations](#known-limitations)

---

## Overview

This system digitalizes transformer inspection workflows from image capture to maintenance record generation. It combines AI-powered anomaly detection with manual annotation capabilities and role-based access control for secure maintenance record management.

**Tech Stack:** Next.js 15 (TypeScript) + Spring Boot 3.2.0 (Java 17) + PostgreSQL (Supabase) + Cloudinary

---

## Key Features

### Phase 1: Transformer & Image Management
- **CRUD Operations:** Create, read, update, delete transformer records
- **Image Upload:** Cloudinary integration with baseline/maintenance tagging
- **Environmental Tracking:** Categorize images by weather conditions (sunny, cloudy, rainy)
- **Search & Filter:** Region/type filters with global search

### Phase 2: AI Anomaly Detection
- **PatchCore Model:** Deep learning-based thermal anomaly detection via HuggingFace API
- **Fault Classification:** 6 fault types with confidence scoring and severity levels
- **Visual Feedback:** Color-coded bounding boxes (red=critical, yellow=warning, green=normal)
- **Uncertain Detection Flagging:** Confidence < 60% marked for manual review

### Phase 3: Interactive Annotation & Feedback
- **Canvas Editor:** Drag, resize, add, delete bounding boxes
- **Manual Refinement:** Correct AI predictions and add custom annotations
- **Metadata Persistence:** Timestamps, user IDs, and action tracking
- **Feedback Loop:** Export annotations for model improvement

### Phase 4: Digital Maintenance Records
- **Auto-Generated Forms:** Pre-filled with transformer details, thermal images, and detection data
- **Role-Based Access Control:** JWT authentication with 4 roles (ADMIN, ENGINEER, INSPECTOR, VIEWER)
- **Editable Fields:** Electrical readings, recommended actions, transformer status
- **Record Management:** Save, retrieve, and view historical maintenance records
- **Authorization:** ENGINEER/ADMIN can create/edit; ADMIN can delete; INSPECTOR/VIEWER read-only

---

## Architecture

**Frontend:** Next.js 15 + React 18 + TypeScript + Tailwind CSS  
**Backend:** Spring Boot 3.2.0 + Java 17 + Spring Security + JWT  
**Database:** PostgreSQL (Supabase)  
**Storage:** Cloudinary (images)  
**AI Detection:** HuggingFace PatchCore API  
**Authentication:** JWT tokens with role-based authorization (@PreAuthorize annotations)

### Anomaly Detection Pipeline
- **PatchCore Model:** Wide ResNet-50 with multi-scale feature extraction
- **6 Fault Types:** Normal, Loose Joint (Faulty/Potential), Point Overload (Faulty/Potential), Full Wire Overload
- **Color-Based Classification:** OpenCV analysis of thermal patterns
- **Confidence Scoring:** Threshold at 60% for uncertain detections
- **Visual Indicators:** Color-coded bounding boxes (red=critical, yellow=warning, green=normal)

---

## Project Structure

```
Transformer-Management-System/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Login/Signup/Logout
│   │   ├── transformers/         # Transformer CRUD
│   │   ├── inspections/          # Inspection management
│   │   ├── images/               # Image metadata
│   │   ├── upload-image/         # Cloudinary upload
│   │   └── maintenance-records/  # Maintenance record CRUD
│   ├── inspections/              # Inspection pages
│   ├── gallery/                  # Image gallery
│   ├── transformer/              # Transformer details & edit
│   └── page.tsx                  # Dashboard
├── backend/                      # Spring Boot service
│   └── src/main/java/com/transformer/management/
│       ├── controller/           # REST controllers
│       ├── entity/               # JPA entities
│       ├── repository/           # Spring Data repositories
│       └── config/               # Security & CORS
├── components/                   # React components
│   ├── forms/                    # Maintenance record form
│   ├── layout/                   # Header, sidebar
│   └── ui/                       # Reusable UI components
├── lib/                          # API clients & utilities
│   ├── auth-api.ts               # JWT & role checking
│   ├── backend-api.ts            # Transformer/Inspection APIs
│   ├── anomaly-api.ts            # AI detection integration
│   ├── annotation-api.ts         # Annotation CRUD
│   └── maintenance-record-api.ts # Record management
└── scripts/                      # Database seed scripts
```

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- Java 17
- Maven 3.6+
- PostgreSQL (Supabase account)
- Cloudinary account

### 1. Clone Repository
```powershell
git clone https://github.com/KumuthuDeZoysa/Transformer-Management-System.git
cd Transformer-Management-System
```

### 2. Frontend Setup
```powershell
npm install
# Create .env.local (see Environment Variables below)
npm run dev
```
Frontend runs at: `http://localhost:3000`

### 3. Backend Setup
```powershell
cd backend
# Configure application.properties or set environment variables
mvn clean compile spring-boot:run
```
Backend runs at: `http://localhost:8080`

### 4. Database Setup
- Create PostgreSQL database on Supabase
- Run migrations from `backend/database/migrations/`
- Seed test data: `node scripts/seed.mjs`

---

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Backend (application.properties or environment variables)
```properties
SPRING_DATASOURCE_URL=jdbc:postgresql://<host>:<port>/<database>
SPRING_DATASOURCE_USERNAME=your_username
SPRING_DATASOURCE_PASSWORD=your_password
SERVER_PORT=8080
SERVER_SERVLET_CONTEXT_PATH=/api
```

---

## Database Schema

### Core Tables

**users**
```sql
id UUID PRIMARY KEY
username TEXT UNIQUE NOT NULL
password TEXT NOT NULL  -- BCrypt hashed
role TEXT NOT NULL  -- ADMIN, ENGINEER, INSPECTOR, VIEWER
created_at TIMESTAMP DEFAULT NOW()
```

**transformers**
```sql
id UUID PRIMARY KEY
code TEXT UNIQUE NOT NULL
pole_no TEXT
region TEXT
type TEXT
capacity TEXT
location TEXT
status TEXT CHECK (status IN ('normal','warning','critical'))
last_inspection TIMESTAMP
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

**inspections**
```sql
id UUID PRIMARY KEY
transformer_id UUID REFERENCES transformers(id)
inspection_no TEXT
inspected_at TIMESTAMP
status TEXT  -- Pending, In Progress, Completed
notes TEXT
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

**images**
```sql
id UUID PRIMARY KEY
transformer_id UUID REFERENCES transformers(id)
inspection_id UUID REFERENCES inspections(id)
url TEXT NOT NULL  -- Cloudinary URL
type TEXT  -- baseline, maintenance
environmental_condition TEXT  -- sunny, cloudy, rainy
uploader TEXT
created_at TIMESTAMP DEFAULT NOW()
```

**anomaly_detections**
```sql
id UUID PRIMARY KEY
inspection_id UUID REFERENCES inspections(id)
transformer_id UUID REFERENCES transformers(id)
total_detections INTEGER
critical_count INTEGER
warning_count INTEGER
uncertain_count INTEGER
overlay_image_url TEXT  -- Annotated image URL
detected_at TIMESTAMP DEFAULT NOW()
```

**annotations**
```sql
id UUID PRIMARY KEY
anomaly_detection_id UUID REFERENCES anomaly_detections(id)
bbox_x INTEGER
bbox_y INTEGER
bbox_width INTEGER
bbox_height INTEGER
label TEXT
confidence DECIMAL
severity TEXT  -- critical, warning, normal
user_id UUID REFERENCES users(id)
action TEXT  -- added, edited, deleted
notes TEXT
created_at TIMESTAMP DEFAULT NOW()
```

**maintenance_records**
```sql
id UUID PRIMARY KEY
inspection_id UUID REFERENCES inspections(id)
transformer_id UUID REFERENCES transformers(id)
inspector_name TEXT
transformer_status TEXT  -- OK, Needs Maintenance, Urgent Attention
voltage TEXT
current TEXT
power_factor TEXT
oil_temperature TEXT
winding_temperature TEXT
recommended_action TEXT
additional_remarks TEXT
created_by UUID REFERENCES users(id)
created_at TIMESTAMP DEFAULT NOW()
updated_at TIMESTAMP DEFAULT NOW()
```

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password, returns JWT token
- `POST /api/auth/signup` - Register new user (defaults to VIEWER role)
- `GET /api/auth/me` - Get current user info from JWT
- `POST /api/auth/logout` - Invalidate session

### Transformers
- `GET /api/transformers` - List all transformers (pagination, search)
- `POST /api/transformers` - Create transformer
- `GET /api/transformers/{id}` - Get transformer by ID
- `PUT /api/transformers/{id}` - Update transformer
- `DELETE /api/transformers/{id}` - Delete transformer

### Inspections
- `GET /api/inspections` - List all inspections (sorted by date descending)
- `POST /api/inspections` - Create inspection
- `GET /api/inspections/{id}` - Get inspection details
- `PUT /api/inspections/{id}` - Update inspection
- `DELETE /api/inspections/{id}` - Delete inspection

### Images
- `GET /api/images` - List images (filter by transformer_id)
- `POST /api/images` - Create image metadata
- `POST /api/upload-image` - Upload image to Cloudinary (multipart/form-data)

### Anomaly Detection
- `POST /api/anomaly/detect` - Trigger AI detection on images
- `GET /api/anomaly/{inspectionId}` - Get detection results

### Annotations
- `GET /api/annotations/{detectionId}` - List annotations for detection
- `POST /api/annotations` - Create annotation
- `PUT /api/annotations/{id}` - Update annotation
- `DELETE /api/annotations/{id}` - Delete annotation

### Maintenance Records (Role-Based)
- `GET /api/maintenance-records` - List all records (all authenticated users)
- `POST /api/maintenance-records` - Create record (**ENGINEER/ADMIN only**)
- `GET /api/maintenance-records/{id}` - Get record details (all authenticated users)
- `PUT /api/maintenance-records/{id}` - Update record (**ENGINEER/ADMIN only**)
- `DELETE /api/maintenance-records/{id}` - Delete record (**ADMIN only**)

**Authorization:** All endpoints require JWT token in `Authorization: Bearer <token>` header. Role-based endpoints enforce permissions via `@PreAuthorize` annotations.

---

## Usage Guide

### 1. Login & Authentication
- Access the system at `http://localhost:3000`
- Login with credentials (default test users: admin/engineer/viewer)
- JWT token stored and sent with all API requests
- User role displayed in header badge (upper right corner)

### 2. Transformer Management
- Navigate to Dashboard to view all transformers
- Use filters (region/type) and search bar to find transformers
- Create/Edit/Delete transformers via dialog forms

### 3. Inspection Workflow
- Select a transformer → Create inspection
- Upload baseline image (with environmental condition: sunny/cloudy/rainy)
- Upload maintenance image for comparison
- Click "Analyze Images" to trigger AI anomaly detection

### 4. Anomaly Detection & Annotation
- View side-by-side image comparison with AI-detected anomalies
- Bounding boxes color-coded by severity (red=critical, yellow=warning)
- Open Canvas Editor to manually refine detections:
  - Drag boxes to reposition
  - Resize using corner handles
  - Add new boxes or delete false positives
  - Add notes to annotations
- Click "Save Changes" to persist edits

### 5. Maintenance Record Generation
- After analysis, click "Generate Record" button
- System auto-populates:
  - Transformer metadata (code, location, capacity)
  - Inspection details (date, inspector)
  - Annotated thermal image (with your edits)
  - Detection summary table (anomaly counts, confidence scores)
- **If role = ENGINEER or ADMIN:**
  - Fill in editable fields (electrical readings, status, recommended actions)
  - Click "Save Record" to store in database
- **If role = INSPECTOR or VIEWER:**
  - Read-only access with warning banner
  - All fields disabled, save button locked

### 6. Record Retrieval
- Navigate to Maintenance Records page
- View all saved records with filters
- Click on a record to view full details
- Export or print records as needed

---

## Known Limitations

- No database backup configured
  - There is currently no automated backup/restore strategy for the PostgreSQL database.
- Authentication not using a managed provider
  - The login interface does not integrate a managed identity provider (e.g., Auth0). Adding one would strengthen security and enterprise features, but may incur additional cost.
- No cache database (e.g., Redis)  
  - The system does not use a cache layer for quick retrieval of frequently accessed data. Adding Redis or similar would improve performance for large-scale deployments.

---

## License

This project is developed as part of the EN3350 Software Design Competition at the University of Moratuwa.

---

## Contributors

- Team: Pebble
- Department of Electronic & Telecommunication Engineering
- University of Moratuwa
