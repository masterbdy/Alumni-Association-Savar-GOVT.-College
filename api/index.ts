import type { IncomingMessage, ServerResponse } from 'http';
import { 
  getPublicSmtpConfig, 
  updateSmtpConfig, 
  executeSmtpTest, 
  sendOtpEmailViaSmtp 
} from '../src/services/smtpServerService.ts';

// Helper to authenticate caller is authoritative System Controller
const isSystemControllerCaller = (callerEmail?: string | string[]): boolean => {
  if (typeof callerEmail === 'string' && callerEmail.trim().toLowerCase() === 'mehedihasan1303@gmail.com') {
    return true;
  }
  return false;
};

// Helper to parse JSON body from incoming stream if not already parsed
async function getParsedBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }
  if (req.body && typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        resolve({});
      }
    });
  });
}

function sendJson(res: any, status: number, data: any) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export default async function handler(req: any, res: any) {
  const url = req.url || '';
  const method = req.method || 'GET';

  // Extract path without query parameters
  const pathname = url.split('?')[0];

  // 1. GET /api/smtp/config
  if (method === 'GET' && (pathname === '/api/smtp/config' || pathname.endsWith('/smtp/config'))) {
    const callerEmail = req.headers['x-caller-email'];
    if (!isSystemControllerCaller(callerEmail)) {
      sendJson(res, 403, { 
        success: false, 
        error: 'Security Violation: Only the verified System Controller (mehedihasan1303@gmail.com) can inspect SMTP configuration.' 
      });
      return;
    }
    const config = getPublicSmtpConfig();
    sendJson(res, 200, { success: true, config });
    return;
  }

  // 2. POST /api/smtp/config
  if (method === 'POST' && (pathname === '/api/smtp/config' || pathname.endsWith('/smtp/config'))) {
    const callerEmail = req.headers['x-caller-email'];
    if (!isSystemControllerCaller(callerEmail)) {
      sendJson(res, 403, { 
        success: false, 
        error: 'Security Violation: Only the verified System Controller (mehedihasan1303@gmail.com) can modify SMTP configuration.' 
      });
      return;
    }
    const body = await getParsedBody(req);
    const actorEmail = String(callerEmail || body?.callerEmail || '');
    const result = updateSmtpConfig(body, actorEmail);
    if (!result.success) {
      sendJson(res, 400, result);
      return;
    }
    sendJson(res, 200, result);
    return;
  }

  // 3. POST /api/smtp/test
  if (method === 'POST' && (pathname === '/api/smtp/test' || pathname.endsWith('/smtp/test'))) {
    const callerEmail = req.headers['x-caller-email'];
    if (!isSystemControllerCaller(callerEmail)) {
      sendJson(res, 403, { 
        success: false, 
        error: 'Security Violation: Only the verified System Controller can trigger SMTP test dispatches.' 
      });
      return;
    }
    const body = await getParsedBody(req);
    const actorEmail = String(callerEmail || body?.callerEmail || '');
    const recipientEmail = String(body?.recipientEmail || '');
    const result = await executeSmtpTest(recipientEmail, actorEmail);
    if (!result.success) {
      sendJson(res, 400, result);
      return;
    }
    sendJson(res, 200, result);
    return;
  }

  // 4. POST /api/auth/send-otp
  if (method === 'POST' && (pathname === '/api/auth/send-otp' || pathname.endsWith('/auth/send-otp'))) {
    const body = await getParsedBody(req);
    const { email, code, purpose } = body;
    if (!email || !code) {
      sendJson(res, 400, { success: false, error: 'Email and code are required.' });
      return;
    }
    const result = await sendOtpEmailViaSmtp(email, code, purpose);
    if (result.success) {
      sendJson(res, 200, { success: true, message: `Verification code sent to ${email} via Gmail SMTP.` });
    } else {
      sendJson(res, 200, { 
        success: true, 
        isFallback: true, 
        message: `Generated OTP code for ${email} (Local verification active). ${result.error || ''}` 
      });
    }
    return;
  }

  // 5. GET /api/firebase/probe
  if (method === 'GET' && (pathname === '/api/firebase/probe' || pathname.endsWith('/firebase/probe'))) {
    const urlObj = new URL(url, 'http://localhost');
    const dbUrl = urlObj.searchParams.get('databaseUrl') || process.env.VITE_FIREBASE_DATABASE_URL || 'https://black-spider-football-default-rtdb.firebaseio.com';
    const cleanUrl = dbUrl.trim().replace(/\/$/, '');
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const resp = await fetch(`${cleanUrl}/.json?shallow=true`, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timer);

      const latencyMs = Date.now() - startTime;
      const isDeactivated = resp.status === 423;
      let deactivatedMessage = '';
      if (isDeactivated) {
        const body: any = await resp.json().catch(() => null);
        deactivatedMessage = body?.error || 'Database has been deactivated.';
      }

      sendJson(res, 200, {
        success: true,
        httpStatus: resp.status,
        latencyMs,
        endpoint: cleanUrl,
        isReachable: true,
        isDeactivated,
        deactivatedMessage,
        rulesEnforced: resp.status === 401 || resp.status === 403,
        readPermitted: resp.status === 200
      });
    } catch (err: any) {
      sendJson(res, 200, {
        success: false,
        httpStatus: 0,
        latencyMs: Date.now() - startTime,
        endpoint: cleanUrl,
        isReachable: false,
        isDeactivated: false,
        error: err?.message || String(err)
      });
    }
    return;
  }

  // 6. GET /api/health
  if (method === 'GET' && (pathname === '/api/health' || pathname.endsWith('/health'))) {
    sendJson(res, 200, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      smtpConfigured: getPublicSmtpConfig().isPasswordConfigured
    });
    return;
  }


  // Fallback 404
  sendJson(res, 404, { error: 'API route not found' });
}
