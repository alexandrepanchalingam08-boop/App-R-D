// Uploads photo bytes to a Supabase Storage bucket over its REST API using
// Node's built-in fetch — no SDK dependency needed for this one call.
//
// Required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// Optional: SUPABASE_STORAGE_BUCKET (default "photos"); create it as a
// *public* bucket in the Supabase dashboard so the stored URL is directly
// servable without generating signed URLs.

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'photos';

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être configurés pour uploader des photos.');
  }
  return { url: url.replace(/\/$/, ''), key };
}

export async function uploadPhoto(buffer, filename, contentType) {
  const { url, key } = config();
  const objectPath = `${Date.now()}-${filename}`;

  const res = await fetch(`${url}/storage/v1/object/${BUCKET}/${objectPath}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      'Content-Type': contentType || 'application/octet-stream',
      'x-upsert': 'false'
    },
    body: buffer
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Échec de l'upload vers Supabase Storage (${res.status}): ${text}`);
  }

  return `${url}/storage/v1/object/public/${BUCKET}/${objectPath}`;
}
