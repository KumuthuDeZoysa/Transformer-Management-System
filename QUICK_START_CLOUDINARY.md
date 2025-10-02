# Quick Start - Cloudinary Setup

## 🎯 3-Minute Setup

### 1. Get Credentials (1 min)
Visit: https://cloudinary.com/console
Copy: Cloud Name, API Key, API Secret

### 2. Configure (30 sec)
```bash
# Windows PowerShell
$env:CLOUDINARY_CLOUD_NAME="your-cloud-name"
$env:CLOUDINARY_API_KEY="your-api-key"  
$env:CLOUDINARY_API_SECRET="your-api-secret"
```

### 3. Rebuild & Run (1.5 min)
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### 4. Test (30 sec)
- Go to http://localhost:3000/upload
- Upload an image
- Check console for: ✅ Image uploaded to Cloudinary

---

## 📋 What Was Changed

### Backend (5 files)
1. `pom.xml` - Added cloudinary-http44 v1.36.0
2. `CloudinaryConfig.java` - NEW - Spring Bean config
3. `CloudinaryService.java` - NEW - Upload/delete methods
4. `ImageController.java` - Replaced placeholder with real upload
5. `application.properties` - Added Cloudinary config

### Frontend (3 files)
1. `app/inspections/[id]/page.tsx` - Added getImageUrl() helper
2. `app/gallery/page.tsx` - Added getImageUrl() helper
3. `app/upload/page.tsx` - Added getImageUrl() helper

### Navigation (1 file)
1. `components/layout/sidebar.tsx` - Removed duplicate "Add Inspection"

---

## ✅ Verification

Run backend → Look for:
```
✅ Cloudinary configuration initialized successfully
```

Upload image → Look for:
```
☁️ Uploading image to Cloudinary...
✅ Image uploaded to Cloudinary: https://res.cloudinary.com/...
```

Check database → Image.url should be:
```
https://res.cloudinary.com/your-cloud/image/upload/v.../transformer-images/...
```

---

## 🚨 Troubleshooting

**"Cloudinary credentials not found"**
→ Set environment variables (see step 2)

**"Failed to upload to Cloudinary"**
→ Check credentials are correct
→ Check internet connection
→ Check Cloudinary account is active

**Images not displaying**
→ Check browser console for errors
→ Verify backend is running on port 8080
→ Check Cloudinary URL starts with https://res.cloudinary.com/

---

## 📖 Full Documentation
See: `CLOUDINARY_INTEGRATION.md`
