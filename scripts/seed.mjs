// scripts/seed.mjs
// Run with: node scripts/seed.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
config({ path: path.join(__dirname, '..', '.env.local') });

// ---- Env ----
const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
  });
} else {
  console.warn('Cloudinary credentials not set. Image upload will be skipped, and a demo URL used instead.');
}

// ---- Helpers ----
const readJSON = (relPath) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test_data', relPath), 'utf-8'));
const fileExists = (p) => { try { fs.accessSync(p); return true; } catch { return false; } };

async function upsertTransformer(rec) {
  const { data, error } = await supabase
    .from('transformers')
    .upsert([{
      code: rec.code,
      pole_no: rec.pole_no,
      region: rec.region,
      type: rec.type,
      capacity: rec.capacity,
      location: rec.location,
      status: rec.status
    }], { onConflict: 'code' })
    .select();
  if (error) throw error;
  return data[0];
}

async function findTransformerByCode(code) {
  const { data, error } = await supabase
    .from('transformers')
    .select('id, code')
    .eq('code', code)
    .single();
  if (error) throw error;
  return data;
}

async function insertImage(transformer_id, url, label, captured_at) {
  const { error } = await supabase
    .from('images')
    .insert([{ transformer_id, url, label, captured_at }]);
  if (error) throw error;
}

async function main() {
  const seed = readJSON('seed.json');
  for (const rec of seed.transformers) {
    console.log(`\nSeeding transformer ${rec.code}...`);
    await upsertTransformer(rec);
    const t = await findTransformerByCode(rec.code);

    if (!rec.images) continue;
    for (const img of rec.images) {
      const localPath = path.join(__dirname, '..', 'test_data', 'images', img.file);
      let url = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';

      if (CLOUDINARY_CLOUD_NAME && fileExists(localPath)) {
        try {
          const upload = await cloudinary.uploader.upload(localPath, {
            folder: `transformers/${rec.code}`
          });
          url = upload.secure_url;
        } catch (e) {
          console.warn(`Cloudinary upload failed for ${img.file}. Using demo URL.`, e.message);
        }
      } else {
        console.warn(`Skipping Cloudinary upload for ${img.file} (no creds or file missing). Using demo URL.`);
      }

      await insertImage(t.id, url, img.label, img.captured_at);
      console.log(`  -> inserted image ${img.file} (${img.label})`);
    }
  }
  console.log('\nSeed complete ✅');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
