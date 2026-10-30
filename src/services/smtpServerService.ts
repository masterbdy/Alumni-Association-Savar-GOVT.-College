import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import type { SmtpConfigPublic, SmtpConfigSavePayload, SmtpSecurityMode } from '../types/index.ts';

interface ServerSmtpStore {
  service: 'gmail' | 'custom';
  host: string;
  port: number;
  securityMode: SmtpSecurityMode;
  senderEmail: string;
  senderDisplayName: string;
  replyToEmail?: string;
  appPassword?: string;
  lastTestStatus: 'success' | 'failed' | 'untested';
  lastTestTimestamp?: string;
  lastTestError?: string;
  lastTestLatencyMs?: number;
}

const CONFIG_FILE_PATH = path.resolve(process.cwd(), '.smtp-config.json');
const FALLBACK_FILE_PATH = path.resolve('/tmp', '.smtp-config.json');

let persistedLocation: 'primary_file' | 'fallback_file' | 'memory_only' = 'memory_only';

// Memory store initialized from server environment variables if available
let inMemoryStore: ServerSmtpStore = {
  service: 'gmail',
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 465,
  securityMode: (process.env.SMTP_PORT === '587' || process.env.SMTP_SECURE === 'false') ? 'STARTTLS' : 'SSL',
  senderEmail: process.env.SMTP_USER || process.env.GMAIL_USER || '',
  senderDisplayName: process.env.SMTP_FROM_NAME || 'Department Of Management, Savar Govt. College',
  replyToEmail: process.env.SMTP_REPLY_TO || '',
  appPassword: process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '',
  lastTestStatus: 'untested'
};

// Try to hydrate from local server file (primary or fallback /tmp)
try {
  let loadedRaw: string | null = null;
  if (fs.existsSync(CONFIG_FILE_PATH)) {
    loadedRaw = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
    persistedLocation = 'primary_file';
  } else if (fs.existsSync(FALLBACK_FILE_PATH)) {
    loadedRaw = fs.readFileSync(FALLBACK_FILE_PATH, 'utf-8');
    persistedLocation = 'fallback_file';
  }

  if (loadedRaw) {
    const parsed = JSON.parse(loadedRaw);
    inMemoryStore = {
      ...inMemoryStore,
      ...parsed,
      // Environment variable takes precedence if provided
      appPassword: process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || parsed.appPassword || ''
    };
  }
} catch (e) {
  console.warn('[SMTP Service] Could not read .smtp-config.json:', e);
}

const saveStoreToFile = (): boolean => {
  // 1. Try primary file path
  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(inMemoryStore, null, 2), { mode: 0o600 });
    persistedLocation = 'primary_file';
    return true;
  } catch (errPrimary) {
    // 2. Try fallback in /tmp (e.g. read-only container/serverless)
    try {
      fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify(inMemoryStore, null, 2), { mode: 0o600 });
      persistedLocation = 'fallback_file';
      return true;
    } catch (errFallback) {
      console.warn('[SMTP Service] Could not persist to file system (operating in protected memory):', errFallback);
      persistedLocation = 'memory_only';
      return false;
    }
  }
};

let lastTestDispatchTime = 0;
const TEST_COOLDOWN_MS = 15000; // 15 seconds rate limit between test dispatches

/**
 * Validates whether an entered string consists of masked bullets or asterisks.
 */
export function isMaskOrPlaceholder(val: string): boolean {
  if (!val) return false;
  // Unicode bullets, asterisks, black circles, middots: •, ●, ·, ◦, *
  return /[•●·◦*]/.test(val);
}

/**
 * Returns public, non-sensitive configuration to the client.
 * Strictly avoids returning the appPassword.
 */
export function getPublicSmtpConfig(): SmtpConfigPublic {
  const isEnvSet = Boolean(process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD);
  return {
    service: inMemoryStore.service,
    host: inMemoryStore.host,
    port: inMemoryStore.port,
    securityMode: inMemoryStore.securityMode,
    senderEmail: inMemoryStore.senderEmail,
    senderDisplayName: inMemoryStore.senderDisplayName,
    replyToEmail: inMemoryStore.replyToEmail,
    isPasswordConfigured: Boolean(inMemoryStore.appPassword && inMemoryStore.appPassword.trim().length > 0),
    persistedLocation,
    envConfigured: isEnvSet,
    persistenceMessage: persistedLocation === 'primary_file' 
      ? 'Configured in secure server file (.smtp-config.json)'
      : persistedLocation === 'fallback_file'
      ? 'Configured in server runtime fallback (/tmp/.smtp-config.json)'
      : 'Configured in server runtime memory',
    lastTestStatus: inMemoryStore.lastTestStatus,
    lastTestTimestamp: inMemoryStore.lastTestTimestamp,
    lastTestError: inMemoryStore.lastTestError,
    lastTestLatencyMs: inMemoryStore.lastTestLatencyMs
  };
}

/**
 * Updates SMTP configuration.
 * Retains existing password if empty or omitted.
 * Explicitly rejects masked placeholder characters (bullets/asterisks).
 */
export function updateSmtpConfig(
  payload: SmtpConfigSavePayload,
  actorEmail: string
): { success: boolean; config?: SmtpConfigPublic; message?: string; error?: string } {
  // Authoritative authorization gate
  if (actorEmail.toLowerCase() !== 'mehedihasan1303@gmail.com') {
    return {
      success: false,
      error: 'Security Violation: Only the authoritative System Controller (mehedihasan1303@gmail.com) can modify SMTP configuration.'
    };
  }

  // Validate Host
  const host = (payload.host || 'smtp.gmail.com').trim();
  const port = Number(payload.port) || 465;
  if (![465, 587].includes(port)) {
    return { success: false, error: 'Invalid port. Gmail SMTP supports port 465 (SSL/TLS) or 587 (STARTTLS).' };
  }

  // Validate Sender Email
  const senderEmail = (payload.senderEmail || '').trim().toLowerCase();
  if (!senderEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
    return { success: false, error: 'Please provide a valid sender Gmail address.' };
  }

  // Password handling:
  // 1. If password is provided: validate it's not bullets or placeholder
  let newPassword = inMemoryStore.appPassword || '';
  if (payload.appPassword !== undefined && payload.appPassword !== null && payload.appPassword.trim() !== '') {
    const rawInput = payload.appPassword.trim();
    if (isMaskOrPlaceholder(rawInput)) {
      return {
        success: false,
        error: 'Masked placeholder characters (bullets/asterisks) cannot be used as an App Password. Enter the actual 16-character Google App Password or leave blank to retain existing password.'
      };
    }

    // Strip accidental spaces commonly copied from Google 2-Step Verification (e.g. "abcd efgh ijkl mnop")
    const cleaned = rawInput.replace(/\s+/g, '');
    if (cleaned.length < 8) {
      return {
        success: false,
        error: 'Google App Password is too short. Google App Passwords are 16 characters.'
      };
    }
    newPassword = cleaned;
  }

  inMemoryStore = {
    ...inMemoryStore,
    host,
    port,
    securityMode: payload.securityMode || (port === 465 ? 'SSL' : 'STARTTLS'),
    senderEmail,
    senderDisplayName: (payload.senderDisplayName || 'Department Of Management, Savar Govt. College').trim(),
    replyToEmail: (payload.replyToEmail || '').trim(),
    appPassword: newPassword
  };

  const fileSaved = saveStoreToFile();

  console.log(`[SMTP Service] System Controller updated SMTP settings for ${senderEmail} (Port ${port}, ${inMemoryStore.securityMode})`);
  return { 
    success: true, 
    config: getPublicSmtpConfig(),
    message: fileSaved
      ? 'Gmail SMTP configuration saved securely to server. Secret password is held exclusively on server runtime.'
      : 'Gmail SMTP configuration updated in active server memory (Read-only container filesystem detected; configure Vercel Environment Variables for permanent redeployment persistence).'
  };
}

/**
 * Executes a real connection test and sends a test email via Nodemailer.
 */
export async function executeSmtpTest(
  recipientEmail: string,
  actorEmail: string
): Promise<{ success: boolean; message?: string; latencyMs?: number; error?: string }> {

  // Authoritative authorization gate
  if (actorEmail.toLowerCase() !== 'mehedihasan1303@gmail.com') {
    return {
      success: false,
      error: 'Security Violation: Only the authoritative System Controller can trigger test email dispatches.'
    };
  }

  const recipient = (recipientEmail || '').trim().toLowerCase();
  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    return {
      success: false,
      error: 'Please enter a valid recipient email address for testing.'
    };
  }

  // Rate limit / cooldown check
  const now = Date.now();
  const elapsed = now - lastTestDispatchTime;
  if (elapsed < TEST_COOLDOWN_MS) {
    const remaining = Math.ceil((TEST_COOLDOWN_MS - elapsed) / 1000);
    return {
      success: false,
      error: `Rate limit: Please wait ${remaining}s before sending another test email.`
    };
  }

  // Validate that credentials exist
  if (!inMemoryStore.senderEmail || !inMemoryStore.appPassword) {
    inMemoryStore.lastTestStatus = 'failed';
    inMemoryStore.lastTestError = 'Sender Gmail address or Google App Password is not configured.';
    inMemoryStore.lastTestTimestamp = new Date().toISOString();
    return {
      success: false,
      error: 'Gmail SMTP is not configured yet. Please configure the Sender Gmail and 16-character Google App Password first.'
    };
  }

  lastTestDispatchTime = now;
  const startTime = performance.now();

  try {
    const isSsl = inMemoryStore.port === 465 || inMemoryStore.securityMode === 'SSL';

    const transporter = nodemailer.createTransport({
      host: inMemoryStore.host,
      port: inMemoryStore.port,
      secure: isSsl,
      auth: {
        user: inMemoryStore.senderEmail,
        pass: inMemoryStore.appPassword
      },
      tls: {
        rejectUnauthorized: true
      },
      connectionTimeout: 12000,
      greetingTimeout: 10000
    });

    // 1. Verify connection credentials with SMTP server
    await transporter.verify();

    // 2. Dispatch real test email
    const info = await transporter.sendMail({
      from: `"${inMemoryStore.senderDisplayName}" <${inMemoryStore.senderEmail}>`,
      to: recipient,
      replyTo: inMemoryStore.replyToEmail || inMemoryStore.senderEmail,
      subject: `[Alumni Association] Gmail SMTP Verification Test — ${new Date().toLocaleTimeString()}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #1e1b4b, #312e81); padding: 24px; border-radius: 12px; color: #ffffff; text-align: center; margin-bottom: 24px;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">Alumni Association</h1>
            <p style="margin: 6px 0 0; font-size: 13px; color: #c7d2fe;">Department Of Management, Savar Govt. College</p>
          </div>
          
          <div style="padding: 0 8px;">
            <div style="display: inline-block; background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px;">
              ✓ Gmail SMTP Connection Verified
            </div>
            
            <h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-top: 0;">System Controller SMTP Test</h2>
            <p style="font-size: 13px; color: #334155; line-height: 1.6;">
              This diagnostic message confirms that your Gmail SMTP credentials are configured correctly and active on the server.
            </p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px;">
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b; font-weight: 600;">SMTP Host:</td>
                <td style="padding: 8px 0; color: #0f172a; font-family: monospace; font-weight: bold;">${inMemoryStore.host}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Port & Security:</td>
                <td style="padding: 8px 0; color: #0f172a; font-family: monospace; font-weight: bold;">${inMemoryStore.port} (${inMemoryStore.securityMode})</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Sender Address:</td>
                <td style="padding: 8px 0; color: #0f172a; font-family: monospace; font-weight: bold;">${inMemoryStore.senderEmail}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Target Recipient:</td>
                <td style="padding: 8px 0; color: #0f172a; font-family: monospace; font-weight: bold;">${recipient}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Timestamp:</td>
                <td style="padding: 8px 0; color: #0f172a;">${new Date().toISOString()}</td>
              </tr>
            </table>

            <div style="background-color: #f8fafc; border-left: 4px solid #6366f1; padding: 12px 16px; border-radius: 6px; font-size: 11px; color: #475569; margin-top: 24px;">
              <strong>Security Invariant:</strong> The 16-character Google App Password remains strictly contained on the server runtime and is never transmitted to web clients or stored in browser storage.
            </div>
          </div>
        </div>
      `,
      text: `[Alumni Association] Gmail SMTP Verification Test\n\nSMTP Host: ${inMemoryStore.host}\nPort: ${inMemoryStore.port} (${inMemoryStore.securityMode})\nSender: ${inMemoryStore.senderEmail}\nRecipient: ${recipient}\nTimestamp: ${new Date().toISOString()}\n\nGmail SMTP connection is verified and operational.`
    });

    const latencyMs = Math.round(performance.now() - startTime);

    inMemoryStore.lastTestStatus = 'success';
    inMemoryStore.lastTestTimestamp = new Date().toISOString();
    inMemoryStore.lastTestError = undefined;
    inMemoryStore.lastTestLatencyMs = latencyMs;
    saveStoreToFile();

    return {
      success: true,
      message: `Test email successfully delivered to ${recipient} via Gmail SMTP (Message ID: ${info.messageId || 'ok'}).`,
      latencyMs
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    const rawError = err.message || 'SMTP Handshake or Authentication Failure';

    inMemoryStore.lastTestStatus = 'failed';
    inMemoryStore.lastTestTimestamp = new Date().toISOString();
    inMemoryStore.lastTestError = rawError;
    inMemoryStore.lastTestLatencyMs = latencyMs;
    saveStoreToFile();

    // Meaningful error decoding for Gmail
    let userFriendlyError = rawError;
    if (rawError.includes('535-5.7.8') || rawError.includes('Username and Password not accepted')) {
      userFriendlyError = 'Gmail Authentication Failed (535): Invalid username or Google App Password. Ensure 2-Step Verification is active on the Google Account and a dedicated 16-character App Password is used (not your regular Gmail password).';
    } else if (rawError.includes('ETIMEDOUT') || rawError.includes('ESOCKETTIMEDOUT')) {
      userFriendlyError = `Connection to ${inMemoryStore.host}:${inMemoryStore.port} timed out. Ensure outbound SMTP traffic is allowed and check if port 465 (SSL) or 587 (STARTTLS) is reachable.`;
    }

    return {
      success: false,
      error: userFriendlyError,
      latencyMs
    };
  }
}

/**
 * Dispatches a transactional OTP verification code email using configured Gmail SMTP.
 */
export async function sendOtpEmailViaSmtp(
  recipientEmail: string,
  code: string,
  purpose: 'email_verification' | 'password_reset'
): Promise<{ success: boolean; error?: string }> {
  if (!inMemoryStore.senderEmail || !inMemoryStore.appPassword) {
    return { success: false, error: 'SMTP not configured on server.' };
  }

  try {
    const isSsl = inMemoryStore.port === 465 || inMemoryStore.securityMode === 'SSL';
    const transporter = nodemailer.createTransport({
      host: inMemoryStore.host,
      port: inMemoryStore.port,
      secure: isSsl,
      auth: {
        user: inMemoryStore.senderEmail,
        pass: inMemoryStore.appPassword
      },
      connectionTimeout: 10000
    });

    const isReset = purpose === 'password_reset';
    const subject = isReset 
      ? `[Alumni Association] Password Reset Code: ${code}`
      : `[Alumni Association] Verification Code: ${code}`;

    await transporter.sendMail({
      from: `"${inMemoryStore.senderDisplayName}" <${inMemoryStore.senderEmail}>`,
      to: recipientEmail,
      replyTo: inMemoryStore.replyToEmail || inMemoryStore.senderEmail,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #1e1b4b; margin-top: 0;">Alumni Association</h2>
          <p style="color: #64748b; font-size: 13px;">Department Of Management, Savar Govt. College</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
          <p style="color: #334155; font-size: 14px;">
            ${isReset ? 'You requested a password reset for your alumni account.' : 'Please use the verification code below to complete your alumni registration.'}
          </p>
          <div style="background-color: #f8fafc; border: 2px dashed #6366f1; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #312e81;">${code}</span>
          </div>
          <p style="color: #64748b; font-size: 12px; margin: 0;">
            This code expires in 10 minutes. If you did not make this request, please disregard this email.
          </p>
        </div>
      `,
      text: `${isReset ? 'Your password reset code' : 'Your verification code'} is: ${code}\n\nThis code expires in 10 minutes.\nAlumni Association, Dept of Management, Savar Govt. College`
    });

    return { success: true };
  } catch (err: any) {
    console.error('[SMTP Service] Error sending OTP:', err.message);
    return { success: false, error: err.message };
  }
}
