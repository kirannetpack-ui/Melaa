import { build } from 'esbuild';

await build({
  entryPoints: ['src/blob-upload.js'],
  bundle: true,
  format: 'esm',
  minify: true,
  outfile: 'public/blob-upload.js'
});
console.log('Melaa browser uploader built.');

if (process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production') {
  await import('./migrate.js');
}
