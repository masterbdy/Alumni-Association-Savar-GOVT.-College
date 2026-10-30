import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { 
  getPublicSmtpConfig, 
  updateSmtpConfig, 
  executeSmtpTest, 
  sendOtpEmailViaSmtp 
} from './src/services/smtpServerService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProduction = process.env.NODE_ENV === 'production' && !process.env.K_SERVICE?.includes('dev');
const PORT = 3000;

app.use(express.json());

// Helper to authenticate caller is authoritative System Controller
const isSystemControllerCaller = (req: Request): boolean => {
  const callerEmail = req.headers['x-caller-email'] || req.body?.callerEmail || req.query?.callerEmail;
  if (typeof callerEmail === 'string' && callerEmail.trim().toLowerCase() === 'mehedihasan1303@gmail.com') {
    return true;
  }
  return false;
};

// ==========================================
// API Routes: SMTP Configuration & Diagnostics
// ==========================================

// 1. Get current public SMTP config (Password is never returned)
app.get('/api/smtp/config', (req: Request, res: Response) => {
  if (!isSystemControllerCaller(req)) {
    res.status(403).json({ 
      success: false, 
      error: 'Security Violation: Only the verified System Controller (mehedihasan1303@gmail.com) can inspect SMTP configuration.' 
    });
    return;
  }

  const config = getPublicSmtpConfig();
  res.json({ success: true, config });
});

// 2. Update SMTP config (Password stored server-side only)
app.post('/api/smtp/config', (req: Request, res: Response) => {
  if (!isSystemControllerCaller(req)) {
    res.status(403).json({ 
      success: false, 
      error: 'Security Violation: Only the verified System Controller (mehedihasan1303@gmail.com) can modify SMTP configuration.' 
    });
    return;
  }

  const actorEmail = String(req.headers['x-caller-email'] || req.body?.callerEmail || '');
  const result = updateSmtpConfig(req.body, actorEmail);

  if (!result.success) {
    res.status(400).json(result);
    return;
  }

  res.json(result);
});

// 3. Send test email via Gmail SMTP
app.post('/api/smtp/test', async (req: Request, res: Response) => {
  if (!isSystemControllerCaller(req)) {
    res.status(403).json({ 
      success: false, 
      error: 'Security Violation: Only the verified System Controller can trigger SMTP test dispatches.' 
    });
    return;
  }

  const actorEmail = String(req.headers['x-caller-email'] || req.body?.callerEmail || '');
  const recipientEmail = String(req.body?.recipientEmail || '');

  const result = await executeSmtpTest(recipientEmail, actorEmail);
  if (!result.success) {
    res.status(400).json(result);
    return;
  }

  res.json(result);
});

// 4. Send transactional OTP verification email
app.post('/api/auth/send-otp', async (req: Request, res: Response) => {
  const { email, code, purpose } = req.body;
  if (!email || !code) {
    res.status(400).json({ success: false, error: 'Email and code are required.' });
    return;
  }

  const result = await sendOtpEmailViaSmtp(email, code, purpose);
  if (result.success) {
    res.json({ success: true, message: `Verification code sent to ${email} via Gmail SMTP.` });
  } else {
    // If SMTP is not configured yet on server, notify caller gracefully
    res.json({ 
      success: true, 
      isFallback: true, 
      message: `Generated OTP code for ${email} (Local verification active). ${result.error || ''}` 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    smtpConfigured: getPublicSmtpConfig().isPasswordConfigured
  });
});

// ==========================================
// Vite Dev Server / Static File Serving
// ==========================================
async function startServer() {
  if (!isProduction) {
    // Development mode: Mount Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);

    // Fallback for SPA routing in development: transform and serve index.html
    app.use('*', async (req: Request, res: Response, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const url = req.originalUrl;
        const indexPath = path.resolve(__dirname, 'index.html');
        if (!fs.existsSync(indexPath)) {
          return next();
        }
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        if (vite) {
          vite.ssrFixStacktrace(e);
        }
        next(e);
      }
    });
  } else {
    // Production mode: Serve built client files
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    } else {
      // Fallback if build hasn't run yet
      app.use(express.static(__dirname));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.resolve(__dirname, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Alumni Association Server] Running on http://0.0.0.0:${PORT} (Mode: ${isProduction ? 'production' : 'development'})`);
  });
}

// Only start listening if not running in a serverless environment like Vercel
if (process.env.VERCEL !== '1') {
  startServer().catch(err => {
    console.error('[Server Error] Failed to start server:', err);
    process.exit(1);
  });
}

export { app };
export default app;
