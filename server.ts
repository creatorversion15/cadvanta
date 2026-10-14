import fs from 'fs';
import path from 'path';

/**
 * CADVANTA Main Production & Development Entrypoint
 *
 * In production (Cloud Run), loads the pre-bundled dist/server.cjs.
 * In development (tsx server.ts), loads the live server-app.ts with Vite middleware.
 */
async function bootstrap() {
  const distServerPath = path.join(process.cwd(), 'dist', 'server.cjs');
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev && fs.existsSync(distServerPath)) {
    // Production Cloud Run execution
    // @ts-ignore - Generated at build time
    await import('./dist/server.cjs');
  } else {
    // Development runtime (tsx server.ts)
    await import('./server-app.js');
  }
}

bootstrap().catch((err) => {
  console.error('Fatal: Failed to start CADVANTA server:', err);
  process.exit(1);
});
