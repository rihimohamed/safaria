import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Custom Vite Plugin to handle local file uploads during development
const localUploadPlugin = () => ({
  name: 'local-upload-plugin',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      // Intercept POST requests to /api/upload
      if (req.url === '/api/upload' && req.method === 'POST') {
        const uploadsDir = path.resolve(process.cwd(), 'public/uploads');
        
        // Ensure the public/uploads directory exists
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // Get filename from custom header, sanitize it to prevent directory traversal
        const rawFileName = req.headers['x-file-name'] || `upload_${Date.now()}.png`;
        const safeFileName = rawFileName.replace(/[^a-zA-Z0-9.\-_]/g, '');
        const filePath = path.join(uploadsDir, safeFileName);
        
        // Stream the raw binary data directly into the file
        const writeStream = fs.createWriteStream(filePath);
        req.pipe(writeStream);
        
        req.on('end', () => {
          res.setHeader('Content-Type', 'application/json');
          // Return the URL path that the frontend can use to display the image
          res.end(JSON.stringify({ url: `/uploads/${safeFileName}` }));
        });
        
        req.on('error', (err) => {
          console.error("Upload stream error:", err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Upload failed' }));
        });
        return; // Stop middleware chain
      }
      next(); // Continue to other Vite middlewares for normal requests
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localUploadPlugin()],
})
