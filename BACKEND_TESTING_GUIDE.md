# Backend Integration Testing Guide

## Test Status Report
Date: January 21, 2025
Status: ✅ READY FOR TESTING

## Current Setup

### ✅ Working Components
1. **Next.js Frontend**: Running on http://localhost:3000
2. **Supabase Database**: Connected and configured
3. **API Routes**: Next.js API routes implemented
4. **Backend Integration Layer**: Spring Boot integration code ready

### ⚠️ Pending Components
1. **Spring Boot Backend**: Not running (Maven not installed)
2. **Direct Backend Testing**: Requires Maven installation

## Testing Approach

Since Maven is not available, we'll test the backend integration through the frontend interface, which will demonstrate:
- Database connectivity
- API functionality
- Data persistence
- Backend integration readiness

## Manual Testing Procedures

### 1. Frontend Application Testing ✅

**Test the main application:**
1. Open http://localhost:3000 in browser
2. Verify the dashboard loads with transformer data
3. Check that statistics cards show data
4. Verify recent alerts are displayed

**Expected Results:**
- Dashboard loads successfully
- Data displays from Supabase database
- No console errors
- Responsive UI

### 2. Transformer CRUD Operations 🧪

**Test Create Operation:**
1. Click "Add Transformer" button
2. Fill in the form:
   - ID: TEST-001
   - Pole No: TEST-POLE-001
   - Region: Test Region
   - Type: Distribution
   - Capacity: 100kVA
   - Location: Test Location
3. Submit the form
4. Verify transformer appears in the list

**Test Read Operation:**
1. Verify transformers are displayed in the table
2. Check transformer details page (click on a transformer)
3. Verify all data fields are populated correctly

**Test Update Operation:**
1. Click edit button on a transformer
2. Modify some fields
3. Save changes
4. Verify changes are reflected in the list

**Test Delete Operation:**
1. Click delete button on a transformer
2. Confirm deletion
3. Verify transformer is removed from list

### 3. Authentication Testing 🧪

**Test Login:**
1. Navigate to /login
2. Try to login with test credentials
3. Verify authentication flow

**Test Session Management:**
1. Check if user session persists
2. Test logout functionality
3. Verify protected routes

### 4. Image Upload Testing 🧪

**Test Image Upload:**
1. Navigate to /upload
2. Select a transformer from dropdown
3. Choose image type (baseline/maintenance)
4. Upload an image file
5. Verify upload completion

**Test Image Gallery:**
1. Navigate to /gallery
2. Verify uploaded images are displayed
3. Test filtering by type, weather, status
4. Test image viewing modal

### 5. API Endpoint Testing 🧪

**Test through Browser DevTools:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Perform actions and verify API calls:
   - GET /api/transformers
   - POST /api/transformers
   - PUT /api/transformers/[id]
   - DELETE /api/transformers/[id]
   - GET /api/images
   - POST /api/images
   - GET /api/inspections

### 6. Backend Integration Testing (When Available) 🚀

**When Spring Boot backend is running:**
1. Frontend should automatically detect backend availability
2. Switch to backend data source
3. Test all CRUD operations through backend
4. Verify data consistency between frontend and backend

## Backend Setup Instructions

**To enable full backend testing:**

1. **Install Maven:**
   ```powershell
   winget install Maven.Maven
   ```

2. **Start Spring Boot Backend:**
   ```bash
   cd backend
   mvn spring-boot:run
   ```

3. **Verify Backend is Running:**
   - Check http://localhost:8080/api/transformers
   - Should return JSON response

4. **Test Backend APIs:**
   ```bash
   # Get all transformers
   curl http://localhost:8080/api/transformers
   
   # Create transformer
   curl -X POST http://localhost:8080/api/transformers \
     -H "Content-Type: application/json" \
     -d '{"code":"TEST-002","poleNo":"TEST-POLE-002","region":"Test","type":"Distribution","capacity":"100kVA","location":"Test Location"}'
   
   # Get specific transformer
   curl http://localhost:8080/api/transformers/{id}
   
   # Test auth
   curl -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   
   # Seed data
   curl -X POST http://localhost:8080/api/seed
   ```

## Test Results Checklist

### ✅ Completed Tests
- [x] Frontend loads successfully
- [x] Next.js development server running
- [x] Database connectivity through Supabase
- [x] Basic application functionality

### 🧪 In Progress Tests  
- [ ] Transformer CRUD operations
- [ ] Authentication flow
- [ ] Image upload/gallery
- [ ] API endpoint responses
- [ ] Error handling

### ⏳ Pending Tests (Requires Backend)
- [ ] Spring Boot backend connectivity
- [ ] Direct backend API testing
- [ ] Backend data synchronization
- [ ] Performance comparison (Supabase vs Backend)

## Expected Integration Flow

1. **Frontend Application** (Next.js) ↔️ **API Routes** (/api/*)
2. **API Routes** ↔️ **Supabase Database** (Current)
3. **API Routes** ↔️ **Spring Boot Backend** ↔️ **Supabase Database** (Target)

## Success Criteria

The backend integration is considered successful when:

1. ✅ Frontend loads and displays data
2. ✅ Database operations work through API routes
3. 🧪 CRUD operations complete successfully
4. 🧪 Authentication functions properly
5. 🧪 File uploads work correctly
6. ⏳ Spring Boot backend APIs respond correctly
7. ⏳ Data flows seamlessly between frontend and backend
8. ⏳ Error handling works across all layers

## Notes

- Current testing is limited by Maven not being available
- Supabase integration is working and can serve as fallback
- Backend integration code is implemented and ready
- Full testing can proceed once Maven is installed and backend is running

---

**Next Steps:**
1. Complete manual testing through browser interface
2. Install Maven to enable backend testing
3. Run comprehensive backend integration tests
4. Document any issues found and resolve them