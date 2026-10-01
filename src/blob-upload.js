import { upload } from '@vercel/blob/client';

export async function uploadPrivateMedia(file) {
  const extensions = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'video/mp4': 'mp4' };
  const extension = extensions[file.type];
  if (!extension) throw new Error('Use a JPG, PNG, WebP image or MP4 video');
  if (file.size > 25 * 1024 * 1024) throw new Error('Media must be at most 25 MB');
  const blob = await upload(`melaa/${crypto.randomUUID()}.${extension}`, file, {
    access: 'private', handleUploadUrl: '/api/media/blob'
  });
  for (let attempt = 0; attempt < 12; attempt++) {
    const response = await fetch(`/api/media/claim?blob_url=${encodeURIComponent(blob.url)}`);
    if (response.ok) return await response.json();
    if (response.status !== 404) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Upload could not be confirmed');
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('Upload finished but is still processing. Please try again shortly.');
}
