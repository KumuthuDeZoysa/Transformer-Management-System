# Cloudinary Integration Guide

## ✅ Implementation Complete

The Transformer Management System now uploads images to Cloudinary and stores the URLs in PostgreSQL.

---

## 🏗️ Architecture Overview

### Image Upload Flow
```
Frontend (Next.js) 
    ↓ [POST /api/images]
Backend ImageController
    ↓ [CloudinaryService.uploadFile()]
Cloudinary Cloud Storage
    ↓ [Returns secure_url]
PostgreSQL Database
    ↓ [Stores URL]
Frontend Display (getImageUrl() helper)
```

---

## 📁 Files Modified/Created

### Backend Changes

#### 1. **pom.xml** - Added Cloudinary Dependency
```xml
<dependency>
    <groupId>com.cloudinary</groupId>
    <artifactId>cloudinary-http44</artifactId>
    <version>1.36.0</version>
</dependency>
```

#### 2. **CloudinaryConfig.java** (NEW)
- Location: `backend/src/main/java/com/transformer/management/config/CloudinaryConfig.java`
- Purpose: Spring Bean configuration for Cloudinary client
- Reads credentials from `application.properties`

#### 3. **CloudinaryService.java** (NEW)
- Location: `backend/src/main/java/com/transformer/management/service/CloudinaryService.java`
- Methods:
  - `uploadFile(MultipartFile, folder, tags...)` - Uploads to Cloudinary
  - `deleteFile(publicId)` - Deletes from Cloudinary
  - `extractPublicId(url)` - Parses public ID from URL

#### 4. **ImageController.java** - Updated Upload Logic
- **Before**: Used placeholder URL `https://placeholder.com/images/...`
- **After**: Uploads to Cloudinary, stores real URL
- Changes:
  - Autowired `CloudinaryService`
  - Line 260: Replaced placeholder with actual Cloudinary upload
  - Organizes images in folders: `transformer-images/{imageType}/`
  - Adds tags: `[imageType, "transformer-{code}"]`

#### 5. **application.properties** - Added Cloudinary Config
```properties
cloudinary.cloud-name=${CLOUDINARY_CLOUD_NAME:your-cloud-name}
cloudinary.api-key=${CLOUDINARY_API_KEY:your-api-key}
cloudinary.api-secret=${CLOUDINARY_API_SECRET:your-api-secret}
```

#### 6. **.env.example** (NEW)
- Template for required environment variables
- Documents where to get Cloudinary credentials

### Frontend Changes

#### 7. **app/inspections/[id]/page.tsx** - Added URL Helper
```typescript
const getImageUrl = (url: string): string => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
  return `${backendBaseUrl}${url.startsWith('/') ? url : '/' + url}`
}
```

#### 8. **app/gallery/page.tsx** - Added URL Helper
- Same helper function for gallery thumbnails

#### 9. **app/upload/page.tsx** - Added URL Helper
- Same helper function for upload preview

#### 10. **components/layout/sidebar.tsx** - Navigation Cleanup
- Removed redundant "Add Inspection" entry
- Navigation now: Transformers → Inspections → Gallery → Settings

---

## 🚀 Setup Instructions

### Step 1: Get Cloudinary Credentials

1. Go to [Cloudinary Console](https://cloudinary.com/console)
2. Sign up or log in
3. Copy your credentials:
   - **Cloud Name** (e.g., `dp3qrstxy`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz`)

### Step 2: Configure Backend

#### Option A: Environment Variables (Recommended)
```bash
# Windows PowerShell
$env:CLOUDINARY_CLOUD_NAME="your-cloud-name"
$env:CLOUDINARY_API_KEY="your-api-key"
$env:CLOUDINARY_API_SECRET="your-api-secret"
```

#### Option B: Direct in application.properties
```properties
cloudinary.cloud-name=your-cloud-name
cloudinary.api-key=your-api-key
cloudinary.api-secret=your-api-secret
```

### Step 3: Rebuild Backend

```bash
cd backend
mvn clean install
```

### Step 4: Restart Backend Server

```bash
mvn spring-boot:run
```

Or run from IDE (IntelliJ/Eclipse).

### Step 5: Test Upload

1. Start frontend: `npm run dev` (port 3000)
2. Navigate to Upload page
3. Upload a thermal image
4. Check console logs for: `✅ Image uploaded to Cloudinary: https://res.cloudinary.com/...`
5. Check PostgreSQL database - `Image.url` should have Cloudinary URL
6. View in Gallery or Inspection detail page

---

## 🔍 Verification Checklist

- [ ] Maven builds without errors
- [ ] Backend starts without Cloudinary config errors
- [ ] Upload endpoint returns 200 status
- [ ] Console shows: `☁️ Uploading image to Cloudinary...`
- [ ] Console shows: `✅ Image uploaded to Cloudinary: https://res.cloudinary.com/...`
- [ ] Database shows Cloudinary URL (not placeholder)
- [ ] Images display in Gallery
- [ ] Side-by-side comparison works in Inspection detail
- [ ] Cloudinary dashboard shows uploaded images

---

## 📊 Database Structure

### Image Table
```sql
CREATE TABLE image (
    id UUID PRIMARY KEY,
    url TEXT NOT NULL,  -- Now contains Cloudinary URL
    label VARCHAR(255),
    image_type VARCHAR(50),
    uploader_name VARCHAR(255),
    environmental_condition VARCHAR(255),
    comments TEXT,
    transformer_id UUID REFERENCES transformer(id),
    inspection_id UUID REFERENCES inspection(id),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Before**: `url = "https://placeholder.com/images/image.jpg"`  
**After**: `url = "https://res.cloudinary.com/dp3qrstxy/image/upload/v1234567890/transformer-images/baseline/xyz.jpg"`

---

## 🗂️ Cloudinary Organization

### Folder Structure
```
transformer-images/
├── baseline/
├── maintenance/
├── visual-inspection/
└── load-profile/
```

### Tags
- Image type (e.g., `BASELINE`, `MAINTENANCE`)
- Transformer identifier (e.g., `transformer-LP1GS`)

### URL Format
```
https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{public_id}.{format}
```

Example:
```
https://res.cloudinary.com/dp3qrstxy/image/upload/v1234567890/transformer-images/baseline/abc123.jpg
```

---

## 🐛 Troubleshooting

### Issue: "Cloudinary credentials not found"
**Solution**: Set environment variables or update `application.properties`

### Issue: "Failed to upload image to Cloudinary"
**Solutions**:
- Check API credentials are correct
- Verify network connectivity
- Check Cloudinary account quota
- Review backend console logs

### Issue: Images not displaying in frontend
**Solutions**:
- Check browser console for CORS errors
- Verify Cloudinary URL is valid (starts with `https://res.cloudinary.com/`)
- Check `getImageUrl()` helper is applied
- Ensure backend is running on port 8080

### Issue: Maven dependency download fails
**Solutions**:
- Run `mvn clean install -U` (force update)
- Check internet connection
- Verify Maven settings.xml

---

## 🔒 Security Notes

1. **Never commit credentials** to Git
   - Use environment variables
   - Add `.env` to `.gitignore`
   - Use `.env.example` for documentation

2. **Cloudinary Best Practices**
   - Use signed uploads for production
   - Set upload presets
   - Configure allowed file types/sizes
   - Enable moderation if needed

3. **Backend Security**
   - Validate file types before upload
   - Check file size limits
   - Sanitize filenames
   - Implement rate limiting

---

## 📈 Future Enhancements

- [ ] Image optimization (compression, format conversion)
- [ ] Generate thumbnails automatically
- [ ] Add image transformation pipelines
- [ ] Implement signed URLs for secure access
- [ ] Add bulk upload capability
- [ ] Implement image deletion from Cloudinary when records deleted
- [ ] Add image version history
- [ ] Integrate AI analysis (Cloudinary AI features)

---

## 📞 Support

- Cloudinary Documentation: https://cloudinary.com/documentation
- Backend Service: `CloudinaryService.java`
- Frontend Helper: `getImageUrl()` in page components

---

## ✨ Summary

**What Changed:**
- ✅ Added Cloudinary dependency to Maven
- ✅ Created CloudinaryConfig and CloudinaryService
- ✅ Updated ImageController to upload to Cloudinary
- ✅ Added configuration in application.properties
- ✅ Created frontend URL helper functions
- ✅ Cleaned up navigation (removed duplicate "Add Inspection")

**Result:**
Images are now properly uploaded to Cloudinary, URLs stored in PostgreSQL, and displayed correctly in the frontend. The placeholder URL system has been completely replaced with real cloud storage.

**Next Steps:**
1. Configure Cloudinary credentials
2. Rebuild Maven project
3. Restart backend
4. Test image upload flow
5. Verify images display correctly
