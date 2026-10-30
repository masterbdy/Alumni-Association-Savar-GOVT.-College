import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ServiceHealthCheckResult, 
  FirebaseSafeConfig,
  FirebaseEditableConfig,
  FirebaseConfigBackup,
  SmtpConfigPublic,
  SmtpSecurityMode,
  FirebaseConnectionTestResult,
  FirebaseConnectionStatus,
  EmailServiceStatus
} from '../types';
import { 
  getFirebaseSafeConfig, 
  getStoredFirebaseConfig,
  validateFirebaseConfig,
  saveFirebaseConfig,
  getFirebaseConfigBackups,
  rollbackFirebaseConfig,
  runServiceDiagnostics,
  fetchPublicSmtpConfig,
  saveSmtpConfig,
  triggerSmtpTest,
  getStoredPublicSmtpConfig,
  testFirebaseConnection,
  parseRawFirebaseConfig,
  formatRawFirebaseConfig
} from '../services/systemDiagnosticsService';
import {
  subscribeToFirebaseConnectionListener,
  probeFirebaseWithInfoConnected,
  getFirebaseConfigOrigin
} from '../services/firebaseService';
import { 
  Database, 
  Mail, 
  Shield, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  RefreshCw, 
  Send, 
  Lock, 
  Layers, 
  Sliders, 
  Power, 
  Image as ImageIcon, 
  Users, 
  ExternalLink, 
  Copy, 
  Check, 
  FileCode,
  Flame,
  Search,
  KeyRound,
  RotateCcw,
  Save,
  HelpCircle,
  Eye,
  EyeOff,
  History,
  X,
  Code,
  Server,
  Zap,
  Radio,
  FileText,
  ShieldCheck,
  Sparkles,
  Info
} from 'lucide-react';

type SettingsTab = 'cards' | 'firebase' | 'smtp' | 'security' | 'health';

export const SystemSettingsView: React.FC = () => {
  const { 
    currentUser, 
    isSystemController, 
    navigateToAdminSection,
    emergencyControls,
    permissionMatrix,
    adminLimits,
    activityLogs,
    appLogo
  } = useApp();

  const [activeTab, setActiveTab] = useState<SettingsTab>('cards');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // ==========================================
  // Card A: Firebase Configuration State
  // ==========================================
  const [firebaseSafe, setFirebaseSafe] = useState<FirebaseSafeConfig>(getFirebaseSafeConfig());
  const [editableFbConfig, setEditableFbConfig] = useState<FirebaseEditableConfig>(getStoredFirebaseConfig());
  const [fbEditorMode, setFbEditorMode] = useState<'form' | 'multiline'>('form');
  const [fbRawJson, setFbRawJson] = useState<string>(() => formatRawFirebaseConfig(getStoredFirebaseConfig()));
  const [fbValidationErrors, setFbValidationErrors] = useState<string[]>([]);
  const [fbValidationWarnings, setFbValidationWarnings] = useState<string[]>([]);
  const [fbValidationMessage, setFbValidationMessage] = useState<string | null>(null);
  const [fbSaveReason, setFbSaveReason] = useState('');
  const [isConfirmingFbSave, setIsConfirmingFbSave] = useState(false);
  const [fbBackups, setFbBackups] = useState<FirebaseConfigBackup[]>(getFirebaseConfigBackups());
  const [fbFeedback, setFbFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [selectedBackupId, setSelectedBackupId] = useState<string | null>(null);
  
  // Real live connection probe state
  const [fbConnTestResult, setFbConnTestResult] = useState<FirebaseConnectionTestResult | null>(null);
  const [isTestingFbConn, setIsTestingFbConn] = useState(false);
  const [showApiKeyPlain, setShowApiKeyPlain] = useState(false);
  const [showFbDiagnostics, setShowFbDiagnostics] = useState(false);

  // ==========================================
  // Card B: Email / SMTP Configuration State
  // ==========================================
  const initialSmtp = getStoredPublicSmtpConfig();
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfigPublic>(initialSmtp);
  const [smtpHost, setSmtpHost] = useState(initialSmtp.host || 'smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState<number>(initialSmtp.port || 465);
  const [smtpSecurityMode, setSmtpSecurityMode] = useState<SmtpSecurityMode>(initialSmtp.securityMode || 'SSL');
  const [smtpSenderEmail, setSmtpSenderEmail] = useState(initialSmtp.senderEmail || 'mehedihasan1303@gmail.com');
  const [smtpAppPassword, setSmtpAppPassword] = useState('');
  const [showAppPassword, setShowAppPassword] = useState(false);
  const [isReplacingPassword, setIsReplacingPassword] = useState(false);
  const [smtpDisplayName, setSmtpDisplayName] = useState(initialSmtp.senderDisplayName || 'Department Of Management, Savar Govt. College');
  const [smtpReplyTo, setSmtpReplyTo] = useState(initialSmtp.replyToEmail || '');
  const [smtpTestRecipient, setSmtpTestRecipient] = useState(currentUser?.email || 'mehedihasan1303@gmail.com');

  const [isLoadingSmtp, setIsLoadingSmtp] = useState(false);
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpFeedback, setSmtpFeedback] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);
  const [isConfirmingSmtpSave, setIsConfirmingSmtpSave] = useState(false);

  // ==========================================
  // Telemetry & Health State
  // ==========================================
  const [healthResults, setHealthResults] = useState<ServiceHealthCheckResult[]>([]);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [lastDiagnosedTime, setLastDiagnosedTime] = useState<string | null>(null);
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logFilterCategory, setLogFilterCategory] = useState<'all' | 'settings' | 'auth' | 'security' | 'emergency'>('all');

  // Load diagnostics and SMTP config on mount + attach reactive SDK connection listener
  useEffect(() => {
    handleRunDiagnostics();
    loadServerSmtpConfig();

    let isMounted = true;
    const unsubscribeFirebase = subscribeToFirebaseConnectionListener((status) => {
      if (isMounted) {
        setFbConnTestResult(status);
      }
    });

    return () => {
      isMounted = false;
      unsubscribeFirebase();
    };
  }, []);

  const loadServerSmtpConfig = async () => {
    setIsLoadingSmtp(true);
    try {
      const res = await fetchPublicSmtpConfig(currentUser?.email || 'mehedihasan1303@gmail.com');
      if (res.success && res.config) {
        setSmtpConfig(res.config);
        setSmtpHost(res.config.host || 'smtp.gmail.com');
        setSmtpPort(res.config.port || 465);
        setSmtpSecurityMode(res.config.securityMode || 'SSL');
        setSmtpSenderEmail(res.config.senderEmail || '');
        setSmtpDisplayName(res.config.senderDisplayName || 'Department Of Management, Savar Govt. College');
        setSmtpReplyTo(res.config.replyToEmail || '');
      }
    } catch (e) {
      console.warn('Could not load SMTP config from server:', e);
    } finally {
      setIsLoadingSmtp(false);
    }
  };

  const handleRunDiagnostics = async () => {
    setIsDiagnosing(true);
    try {
      const results = await runServiceDiagnostics();
      setHealthResults(results);
      setLastDiagnosedTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error running diagnostics:', err);
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Real connection probe for Firebase (RTDB & Auth)
  const handleProbeFirebaseConnection = async (configToProbe?: FirebaseEditableConfig) => {
    setIsTestingFbConn(true);
    try {
      const target = configToProbe || editableFbConfig;
      const res = await probeFirebaseWithInfoConnected(target);
      setFbConnTestResult(res);
    } catch (err: any) {
      setFbConnTestResult({
        status: 'error',
        rtdbStatus: 'unreachable',
        authStatus: 'unreachable',
        latencyMs: 0,
        message: 'Probe execution failed.',
        details: err.message || 'Network exception',
        testedAt: new Date().toISOString(),
        endpoint: editableFbConfig.databaseUrl,
        safeLogs: [`[Probe Error] ${err.message || String(err)}`]
      });
    } finally {
      setIsTestingFbConn(false);
    }
  };

  const copyToClipboard = (text: string, keyName: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(keyName);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  // Live validator as fields change
  const handleValidateFbInput = (updated: FirebaseEditableConfig) => {
    setEditableFbConfig(updated);
    setFbRawJson(formatRawFirebaseConfig(updated));
    const val = validateFirebaseConfig(updated);
    setFbValidationErrors(val.errors);
    setFbValidationWarnings(val.warnings);
    setFbValidationMessage(null);
  };

  // Multiline raw JSON editor sync
  const handleRawJsonChange = (rawText: string) => {
    setFbRawJson(rawText);
    const parsed = parseRawFirebaseConfig(rawText);
    if (parsed.success && parsed.config) {
      setEditableFbConfig(parsed.config);
      setFbValidationErrors([]);
      setFbValidationWarnings([]);
      setFbValidationMessage(null);
    } else {
      setFbValidationErrors([parsed.error || 'Invalid JSON format']);
    }
  };

  // Manual Trigger: Validate Configuration button
  const handleManualValidateFb = () => {
    let configToTest = editableFbConfig;
    if (fbEditorMode === 'multiline') {
      const parsed = parseRawFirebaseConfig(fbRawJson);
      if (!parsed.success || !parsed.config) {
        setFbValidationErrors([parsed.error || 'Invalid JSON format in multiline editor.']);
        setFbValidationMessage('Validation failed. Please correct syntax.');
        return;
      }
      configToTest = parsed.config;
      setEditableFbConfig(parsed.config);
    }

    const val = validateFirebaseConfig(configToTest);
    setFbValidationErrors(val.errors);
    setFbValidationWarnings(val.warnings);
    if (val.isValid) {
      setFbValidationMessage('✓ Configuration parameters syntax validated successfully.');
    } else {
      setFbValidationMessage('Configuration has validation errors that must be resolved.');
    }
  };

  // Cancel / Revert edits back to current stored config
  const handleCancelFbEdit = () => {
    const stored = getStoredFirebaseConfig();
    setEditableFbConfig(stored);
    setFbRawJson(formatRawFirebaseConfig(stored));
    setFbValidationErrors([]);
    setFbValidationWarnings([]);
    setFbValidationMessage(null);
    setIsConfirmingFbSave(false);
    setFbSaveReason('');
    setFbFeedback({ success: true, message: 'Changes discarded. Restored current active configuration.' });
    setTimeout(() => setFbFeedback(null), 3000);
  };

  // Save Firebase configuration with validation, backup, and post-save probe
  const handleCommitFbConfig = async () => {
    if (!fbSaveReason.trim()) {
      setFbFeedback({ success: false, message: 'An audited justification reason is required to record the change.' });
      return;
    }

    let configToSave = editableFbConfig;
    if (fbEditorMode === 'multiline') {
      const parsed = parseRawFirebaseConfig(fbRawJson);
      if (!parsed.success || !parsed.config) {
        setFbFeedback({ success: false, message: `Cannot save: ${parsed.error}` });
        return;
      }
      configToSave = parsed.config;
    }

    const res = saveFirebaseConfig(configToSave, currentUser?.email || '', fbSaveReason.trim());
    if (res.success) {
      setFirebaseSafe(getFirebaseSafeConfig());
      setFbBackups(getFirebaseConfigBackups());
      setIsConfirmingFbSave(false);
      setFbSaveReason('');
      setFbFeedback({ 
        success: true, 
        message: 'Firebase configuration saved successfully. A pre-change safety backup snapshot was created.' 
      });
      // Immediate post-save connection test
      await handleProbeFirebaseConnection(configToSave);
      handleRunDiagnostics();
      setTimeout(() => setFbFeedback(null), 6000);
    } else {
      setFbFeedback({ success: false, message: res.error || 'Failed to save Firebase configuration.' });
    }
  };

  // Rollback Firebase configuration to a selected snapshot
  const handleExecuteRollback = async (backupId: string) => {
    const res = rollbackFirebaseConfig(backupId, currentUser?.email || '');
    if (res.success && res.restoredConfig) {
      setEditableFbConfig(res.restoredConfig);
      setFbRawJson(formatRawFirebaseConfig(res.restoredConfig));
      setFirebaseSafe(getFirebaseSafeConfig());
      setIsRollingBack(false);
      setSelectedBackupId(null);
      setFbFeedback({ success: true, message: 'Configuration successfully rolled back to safety backup snapshot.' });
      await handleProbeFirebaseConnection(res.restoredConfig);
      handleRunDiagnostics();
      setTimeout(() => setFbFeedback(null), 6000);
    } else {
      setFbFeedback({ success: false, message: res.error || 'Rollback failed.' });
    }
  };

  // Save Gmail SMTP configuration to server
  const handleSaveSmtp = async () => {
    setIsSavingSmtp(true);
    setSmtpFeedback(null);

    // Validate Sender Email
    const cleanedEmail = smtpSenderEmail.trim().toLowerCase();
    if (!cleanedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail)) {
      setIsSavingSmtp(false);
      setIsConfirmingSmtpSave(false);
      setSmtpFeedback({ success: false, message: 'Please enter a valid Sender Gmail address before saving.' });
      return;
    }

    // Validate Password if explicit replacement was initiated
    if (isReplacingPassword) {
      const trimmedPass = smtpAppPassword.trim();
      if (!trimmedPass) {
        setIsSavingSmtp(false);
        setIsConfirmingSmtpSave(false);
        setSmtpFeedback({ success: false, message: 'Please enter the new 16-character Google App Password, or click "Keep Existing" to retain current password.' });
        return;
      }
      if (/[•●·◦*]/.test(trimmedPass)) {
        setIsSavingSmtp(false);
        setIsConfirmingSmtpSave(false);
        setSmtpFeedback({ success: false, message: 'Masked placeholder characters (bullets/asterisks) are not accepted as an App Password.' });
        return;
      }
    }

    try {
      const res = await saveSmtpConfig({
        host: smtpHost.trim(),
        port: Number(smtpPort),
        securityMode: smtpSecurityMode,
        senderEmail: cleanedEmail,
        senderDisplayName: smtpDisplayName.trim(),
        replyToEmail: smtpReplyTo.trim(),
        // Only submit new password if explicit replacement occurred
        appPassword: (isReplacingPassword && smtpAppPassword.trim()) ? smtpAppPassword.trim() : undefined
      }, currentUser?.email || 'mehedihasan1303@gmail.com');

      if (res.success && res.config) {
        setSmtpConfig(res.config);
        setSmtpAppPassword(''); // Clear client memory of password immediately
        setIsReplacingPassword(false);
        setIsConfirmingSmtpSave(false);
        setSmtpFeedback({
          success: true,
          message: res.message || 'Gmail SMTP configuration saved securely to server. Secret app password stored exclusively on server runtime.'
        });
        setTimeout(() => setSmtpFeedback(null), 6000);
      } else {
        setSmtpFeedback({ success: false, message: res.error || 'Failed to save SMTP configuration.' });
      }
    } catch (err: any) {
      setSmtpFeedback({ success: false, message: `Server error: ${err.message}` });
    } finally {
      setIsSavingSmtp(false);
    }
  };

  // Send real test email via server Nodemailer
  const handleSendTestEmail = async () => {
    if (!smtpTestRecipient.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(smtpTestRecipient.trim())) {
      setSmtpFeedback({ success: false, message: 'Please enter a valid recipient email address for testing.' });
      return;
    }

    setIsTestingSmtp(true);
    setSmtpFeedback(null);
    try {
      const res = await triggerSmtpTest(smtpTestRecipient.trim(), currentUser?.email || '');
      if (res.success) {
        setSmtpFeedback({
          success: true,
          message: res.message,
          latencyMs: res.latencyMs
        });
        loadServerSmtpConfig();
      } else {
        setSmtpFeedback({
          success: false,
          message: res.error || 'SMTP delivery failed.',
          latencyMs: res.latencyMs
        });
        loadServerSmtpConfig();
      }
    } catch (err: any) {
      setSmtpFeedback({
        success: false,
        message: `Network error reaching mailer server: ${err.message}`
      });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  // Compute email service status
  const getEmailServiceStatus = (): { status: EmailServiceStatus; label: string; color: string; badgeBg: string } => {
    if (!smtpConfig.senderEmail || !smtpConfig.isPasswordConfigured) {
      return {
        status: 'not_configured',
        label: 'Not Configured',
        color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
        badgeBg: 'bg-amber-400'
      };
    }
    if (smtpConfig.lastTestStatus === 'success') {
      return {
        status: 'connected',
        label: 'Connected & Verified',
        color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
        badgeBg: 'bg-emerald-400'
      };
    }
    if (smtpConfig.lastTestStatus === 'failed') {
      return {
        status: 'error',
        label: 'Error (Test Failed)',
        color: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
        badgeBg: 'bg-rose-500'
      };
    }
    return {
      status: 'configured',
      label: 'Configured (Untested)',
      color: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
      badgeBg: 'bg-sky-400'
    };
  };

  const emailStatus = getEmailServiceStatus();

  // Compute Firebase connection status display with all 6 authenticated/diagnostic states
  const getFirebaseStatusBadge = () => {
    if (isTestingFbConn || fbConnTestResult?.status === 'checking') {
      return {
        label: 'Checking Connection...',
        color: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
        pulse: 'bg-sky-400 animate-ping',
        statusKey: 'checking'
      };
    }
    if (!fbConnTestResult) {
      return {
        label: 'Checking Status',
        color: 'text-slate-300 border-slate-500/30 bg-slate-500/10',
        pulse: 'bg-slate-400',
        statusKey: 'checking'
      };
    }
    if (fbConnTestResult.status === 'connected') {
      return {
        label: `Connected (${fbConnTestResult.latencyMs}ms)`,
        color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
        pulse: 'bg-emerald-400 animate-pulse',
        statusKey: 'connected'
      };
    }
    if (fbConnTestResult.status === 'permission_denied') {
      return {
        label: 'Permission Denied (Rules Enforced)',
        color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
        pulse: 'bg-indigo-400',
        statusKey: 'permission_denied'
      };
    }
    if (fbConnTestResult.status === 'configuration_error') {
      return {
        label: 'Configuration Error',
        color: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
        pulse: 'bg-rose-500',
        statusKey: 'configuration_error'
      };
    }
    if (fbConnTestResult.status === 'network_error') {
      return {
        label: 'Network Error',
        color: 'text-red-400 border-red-500/30 bg-red-500/10',
        pulse: 'bg-red-500',
        statusKey: 'network_error'
      };
    }
    if (fbConnTestResult.status === 'error') {
      return {
        label: 'Configuration Error',
        color: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
        pulse: 'bg-rose-500',
        statusKey: 'error'
      };
    }
    return {
      label: 'Disconnected',
      color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      pulse: 'bg-amber-400',
      statusKey: 'disconnected'
    };
  };

  const fbStatusBadge = getFirebaseStatusBadge();

  // Filtered system logs for Telemetry section
  const filteredLogs = activityLogs.filter(log => {
    const actionUpper = log.action.toUpperCase();
    const detailsUpper = log.details.toUpperCase();
    const query = logSearchQuery.trim().toUpperCase();

    if (logFilterCategory === 'settings' && !actionUpper.includes('SETTING') && !actionUpper.includes('LOGO') && !actionUpper.includes('FIREBASE') && !actionUpper.includes('SMTP')) return false;
    if (logFilterCategory === 'auth' && !actionUpper.includes('LOGIN') && !actionUpper.includes('AUTH') && !actionUpper.includes('PASSWORD') && !actionUpper.includes('OTP')) return false;
    if (logFilterCategory === 'security' && !actionUpper.includes('ROLE') && !actionUpper.includes('PERMISSION') && !actionUpper.includes('LIMIT')) return false;
    if (logFilterCategory === 'emergency' && !actionUpper.includes('EMERGENCY')) return false;

    if (query) {
      return (
        actionUpper.includes(query) ||
        detailsUpper.includes(query) ||
        log.actorName.toUpperCase().includes(query) ||
        (log.actorRole && log.actorRole.toUpperCase().includes(query))
      );
    }
    return true;
  });

  // Authoritative Security Gate
  if (!isSystemController) {
    return (
      <div className="bg-rose-50 border-2 border-rose-300 rounded-3xl p-8 text-center max-w-xl mx-auto my-8 shadow-xl">
        <div className="w-14 h-14 bg-rose-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
          <Lock size={26} />
        </div>
        <h2 className="text-xl font-black text-rose-950 mb-2">Access Prohibited</h2>
        <p className="text-xs text-rose-800 mb-6 leading-relaxed">
          The Executive Settings Center contains sensitive architectural configurations, security rule audits, and diagnostic controls. Access is strictly restricted to the authoritative System Controller (<code className="font-mono font-bold">mehedihasan1303@gmail.com</code>).
        </p>
        <button
          onClick={() => navigateToAdminSection('overview')}
          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* ============================================================== */}
      {/* 1. EXECUTIVE GLASS HEADER & CONTEXT                           */}
      {/* ============================================================== */}
      <div className="relative rounded-3xl p-6 sm:p-7 overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white border border-purple-500/20 shadow-2xl shadow-indigo-950/40">
        {/* Ambient Glows */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5 backdrop-blur-md">
                <Sparkles size={11} className="text-amber-300" />
                Premium System Controller Settings Center
              </span>
              <span className="text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                SGC Management Alumni
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>System Controller Infrastructure Center</span>
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Official control plane for Firebase Realtime Database, Authentication, Google Gmail SMTP transactional mailer, and security access invariants.
            </p>
          </div>

          {/* Quick Status Pill Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {/* Firebase Status Pill */}
            <div 
              onClick={() => handleProbeFirebaseConnection()} 
              title="Click to re-probe Firebase"
              className={`px-3.5 py-2 rounded-2xl border text-xs font-bold flex items-center justify-between sm:justify-start gap-2.5 backdrop-blur-md transition cursor-pointer hover:opacity-90 shadow-sm ${fbStatusBadge.color}`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${fbStatusBadge.pulse}`} />
                <span className="font-mono text-[11px]">Firebase:</span>
              </div>
              <span className="text-[11px] font-semibold">{fbStatusBadge.label}</span>
            </div>

            {/* Email Status Pill */}
            <div 
              onClick={() => loadServerSmtpConfig()} 
              title="Click to refresh SMTP status"
              className={`px-3.5 py-2 rounded-2xl border text-xs font-bold flex items-center justify-between sm:justify-start gap-2.5 backdrop-blur-md transition cursor-pointer hover:opacity-90 shadow-sm ${emailStatus.color}`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${emailStatus.badgeBg}`} />
                <span className="font-mono text-[11px]">SMTP:</span>
              </div>
              <span className="text-[11px] font-semibold">{emailStatus.label}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Pill Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          <button
            onClick={() => setActiveTab('cards')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'cards'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40 border border-purple-400/40'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
            }`}
          >
            <Sliders size={14} className={activeTab === 'cards' ? 'text-amber-300' : 'text-slate-400'} />
            <span>Executive Cards (Firebase & Email)</span>
          </button>

          <button
            onClick={() => setActiveTab('firebase')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'firebase'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40 border border-purple-400/40'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
            }`}
          >
            <Flame size={14} className="text-amber-400" />
            <span>Firebase RTDB & Auth</span>
          </button>

          <button
            onClick={() => setActiveTab('smtp')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'smtp'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40 border border-purple-400/40'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
            }`}
          >
            <Mail size={14} className="text-cyan-400" />
            <span>Gmail SMTP Mailer</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40 border border-purple-400/40'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
            }`}
          >
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Security & Rules Audit</span>
          </button>

          <button
            onClick={() => setActiveTab('health')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'health'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40 border border-purple-400/40'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
            }`}
          >
            <Activity size={14} className="text-pink-400" />
            <span>Telemetry & Snapshots</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. FEEDBACK / STATUS NOTICES                                   */}
      {/* ============================================================== */}
      {fbFeedback && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 shadow-md animate-in fade-in ${
          fbFeedback.success 
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200' 
            : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {fbFeedback.success ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> : <AlertCircle size={16} className="text-rose-400 shrink-0" />}
            <span>{fbFeedback.message}</span>
          </div>
          <button onClick={() => setFbFeedback(null)} className="text-slate-400 hover:text-white p-1">
            <X size={14} />
          </button>
        </div>
      )}

      {smtpFeedback && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 shadow-md animate-in fade-in ${
          smtpFeedback.success 
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200' 
            : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {smtpFeedback.success ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0" /> : <AlertCircle size={16} className="text-rose-400 shrink-0" />}
            <div>
              <span>{smtpFeedback.message}</span>
              {smtpFeedback.latencyMs !== undefined && (
                <span className="font-mono ml-2 text-[11px] opacity-80 font-bold">({smtpFeedback.latencyMs}ms)</span>
              )}
            </div>
          </div>
          <button onClick={() => setSmtpFeedback(null)} className="text-slate-400 hover:text-white p-1">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. PREMIUM 3D / GLASS SETTINGS CARDS (CARDS TAB / DUAL VIEW)   */}
      {/* ============================================================== */}
      {(activeTab === 'cards' || activeTab === 'firebase' || activeTab === 'smtp') && (
        <div className={`grid grid-cols-1 ${activeTab === 'cards' ? 'xl:grid-cols-2' : ''} gap-6 items-start`}>
          
          {/* ========================================================== */}
          {/* CARD A: FIREBASE CONFIGURATION                             */}
          {/* ========================================================== */}
          {(activeTab === 'cards' || activeTab === 'firebase') && (
            <div className="relative rounded-3xl p-6 sm:p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-purple-500/20 shadow-xl shadow-slate-200/50 dark:shadow-indigo-950/20 overflow-hidden space-y-6">
              
              {/* Card Header & Live Connection Status Banner */}
              <div className="space-y-3 pb-5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0 shadow-xs">
                      <Flame size={20} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Card A: Firebase Configuration</span>
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Realtime Database & Authentication Parameters
                      </p>
                    </div>
                  </div>

                  {/* Mode Selector (Form Fields vs Multiline JSON) */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 self-start sm:self-auto">
                    <button
                      onClick={() => setFbEditorMode('form')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        fbEditorMode === 'form'
                          ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <Sliders size={13} />
                      <span>Form View</span>
                    </button>
                    <button
                      onClick={() => {
                        setFbEditorMode('multiline');
                        setFbRawJson(formatRawFirebaseConfig(editableFbConfig));
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                        fbEditorMode === 'multiline'
                          ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <Code size={13} />
                      <span>Multiline JSON</span>
                    </button>
                  </div>
                </div>

                {/* Live Real-Time Connection Diagnostic Banner */}
                <div className={`p-4 rounded-2xl border text-xs space-y-2 transition-all ${
                  fbConnTestResult?.status === 'connected'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
                    : fbConnTestResult?.status === 'permission_denied'
                    ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-500/40 text-indigo-900 dark:text-indigo-200'
                    : fbConnTestResult?.status === 'configuration_error' || fbConnTestResult?.status === 'error'
                    ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-500/40 text-rose-900 dark:text-rose-200'
                    : fbConnTestResult?.status === 'network_error'
                    ? 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-500/40 text-red-900 dark:text-red-200'
                    : fbConnTestResult?.status === 'checking'
                    ? 'bg-sky-50 dark:bg-sky-950/30 border-sky-300 dark:border-sky-500/40 text-sky-900 dark:text-sky-200'
                    : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-500/40 text-amber-900 dark:text-amber-200'
                }`}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="font-bold flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${fbStatusBadge.pulse}`} />
                      <span>Live Status: {fbStatusBadge.label}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Origin Source Badge */}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/70 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        {fbConnTestResult?.configOrigin === 'vercel_env' ? 'Source: Vercel Env (VITE_FIREBASE_*)' :
                         fbConnTestResult?.configOrigin === 'local_storage_override' ? 'Source: Saved Local Override' :
                         'Source: Template Defaults'}
                      </span>
                      {fbConnTestResult?.testedAt && (
                        <span className="text-[10px] opacity-75 font-mono">
                          Last tested: {new Date(fbConnTestResult.testedAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] leading-relaxed opacity-95">
                    {fbConnTestResult?.message || 'Probing live Firebase Realtime Database socket via "/.info/connected"...'}
                  </p>

                  {fbConnTestResult?.details && (
                    <div className="text-[10px] font-mono opacity-85 pt-0.5">
                      {fbConnTestResult.details}
                    </div>
                  )}

                  {/* Diagnostic safe logs toggle */}
                  {fbConnTestResult?.safeLogs && fbConnTestResult.safeLogs.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                      <button
                        type="button"
                        onClick={() => setShowFbDiagnostics(!showFbDiagnostics)}
                        className="text-[11px] font-bold underline hover:opacity-80 cursor-pointer flex items-center gap-1"
                      >
                        <FileText size={12} />
                        <span>{showFbDiagnostics ? 'Hide Diagnostic Trace' : 'View Safe Diagnostic Trace'}</span>
                      </button>

                      {showFbDiagnostics && (
                        <div className="mt-2 p-2.5 rounded-xl bg-slate-900/90 text-slate-100 font-mono text-[10px] space-y-1 overflow-x-auto border border-slate-800">
                          {fbConnTestResult.safeLogs.map((logLine: string, idx: number) => (
                            <div key={idx} className="leading-tight">
                              <span className="text-slate-500 select-none mr-2">{idx + 1}.</span>
                              <span className={logLine.includes('Error') ? 'text-rose-400 font-bold' : logLine.includes('Connected') || logLine.includes('TRUE') ? 'text-emerald-400' : 'text-slate-300'}>
                                {logLine}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Vercel Deployment Guidance Banner */}
                <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-500/20 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-indigo-500" />
                    <span>GitHub → Vercel Deployment Tip:</span>
                  </div>
                  <p className="text-[11px] text-indigo-900 dark:text-indigo-300 leading-relaxed">
                    Saving settings here updates the active configuration immediately on your current browser. To persist these Firebase credentials across all team members and devices automatically, configure <code className="font-mono bg-indigo-100 dark:bg-indigo-900/50 px-1 py-0.5 rounded text-[10px]">VITE_FIREBASE_*</code> environment variables in your <strong>Vercel Project Settings → Environment Variables</strong> and redeploy.
                  </p>
                </div>
              </div>

              {/* Validation Feedback Messages */}
              {fbValidationMessage && (
                <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                  fbValidationErrors.length === 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-200 font-semibold'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-200'
                }`}>
                  {fbValidationErrors.length === 0 ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                  <span>{fbValidationMessage}</span>
                </div>
              )}

              {fbValidationErrors.length > 0 && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/40 rounded-xl text-rose-800 dark:text-rose-200 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle size={14} className="text-rose-600 dark:text-rose-400" />
                    <span>Configuration Validation Errors:</span>
                  </div>
                  <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                    {fbValidationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {fbValidationWarnings.length > 0 && (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/40 rounded-xl text-amber-900 dark:text-amber-200 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />
                    <span>Advisory Notices:</span>
                  </div>
                  <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                    {fbValidationWarnings.map((warn, i) => (
                      <li key={i}>{warn}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mode A: Visual Form Fields */}
              {fbEditorMode === 'form' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Project ID */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Firebase Project ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editableFbConfig.projectId}
                      onChange={e => handleValidateFbInput({ ...editableFbConfig, projectId: e.target.value })}
                      placeholder="alumni-association-sgc"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Realtime Database URL */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Realtime Database URL <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editableFbConfig.databaseUrl}
                      onChange={e => handleValidateFbInput({ ...editableFbConfig, databaseUrl: e.target.value })}
                      placeholder="https://alumni-association-default-rtdb.firebaseio.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Auth Domain */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Auth Domain <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editableFbConfig.authDomain}
                      onChange={e => handleValidateFbInput({ ...editableFbConfig, authDomain: e.target.value })}
                      placeholder="alumni-association.firebaseapp.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Web API Key with Mask/Reveal and Copy */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Web API Key <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowApiKeyPlain(!showApiKeyPlain)}
                        className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {showApiKeyPlain ? <EyeOff size={12} /> : <Eye size={12} />}
                        <span>{showApiKeyPlain ? 'Mask' : 'Reveal'}</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showApiKeyPlain ? 'text' : 'password'}
                        value={editableFbConfig.apiKey}
                        onChange={e => handleValidateFbInput({ ...editableFbConfig, apiKey: e.target.value })}
                        placeholder="AIzaSyExampleKey123456789"
                        className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(editableFbConfig.apiKey, 'apiKey')}
                        title="Copy API key"
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
                      >
                        {copiedKey === 'apiKey' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Storage Bucket */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Cloud Storage Bucket
                    </label>
                    <input
                      type="text"
                      value={editableFbConfig.storageBucket}
                      onChange={e => handleValidateFbInput({ ...editableFbConfig, storageBucket: e.target.value })}
                      placeholder="alumni-association.appspot.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Web App ID */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Firebase Web App ID
                    </label>
                    <input
                      type="text"
                      value={editableFbConfig.appId}
                      onChange={e => handleValidateFbInput({ ...editableFbConfig, appId: e.target.value })}
                      placeholder="1:88144623713:web:example"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Mode B: Multiline Raw JSON Editor */}
              {fbEditorMode === 'multiline' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Code size={13} className="text-purple-500" />
                      <span>Mobile-Friendly Multiline Raw JSON Configuration</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const formatted = formatRawFirebaseConfig(editableFbConfig);
                          setFbRawJson(formatted);
                        }}
                        className="text-purple-600 dark:text-purple-400 hover:underline text-[11px] cursor-pointer"
                      >
                        Format JSON
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(fbRawJson, 'fbRawJson')}
                        className="text-purple-600 dark:text-purple-400 hover:underline text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'fbRawJson' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        <span>{copiedKey === 'fbRawJson' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={10}
                    value={fbRawJson}
                    onChange={e => handleRawJsonChange(e.target.value)}
                    spellCheck={false}
                    className="w-full p-3.5 bg-slate-900 text-purple-300 border border-slate-700 rounded-2xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Edits made in JSON format are dynamically validated before saving. Previous working configuration is preserved intact if errors are found.
                  </p>
                </div>
              )}

              {/* Action Buttons Toolbar (4 Mandatory Buttons: Validate, Test, Save, Cancel) */}
              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                {/* 1. Validate Configuration Button */}
                <button
                  type="button"
                  onClick={handleManualValidateFb}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 size={14} className="text-purple-600 dark:text-purple-400" />
                  <span>Validate Configuration</span>
                </button>

                {/* 2. Test Connection Button */}
                <button
                  type="button"
                  onClick={() => handleProbeFirebaseConnection()}
                  disabled={isTestingFbConn}
                  className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <RefreshCw size={14} className={isTestingFbConn ? 'animate-spin' : ''} />
                  <span>{isTestingFbConn ? 'Testing Host...' : 'Test Connection'}</span>
                </button>

                {/* 3. Save Changes Button (Opens Safety Confirmation Modal) */}
                <button
                  type="button"
                  onClick={() => {
                    const val = validateFirebaseConfig(editableFbConfig);
                    if (!val.isValid) {
                      setFbValidationErrors(val.errors);
                      setFbFeedback({ success: false, message: 'Please fix validation errors before saving.' });
                      return;
                    }
                    setIsConfirmingFbSave(true);
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-purple-900/30 ml-auto"
                >
                  <Save size={14} />
                  <span>Save Changes</span>
                </button>

                {/* 4. Cancel Button (Reverts to working state) */}
                <button
                  type="button"
                  onClick={handleCancelFbEdit}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* Safety Snapshot Rollback Drawer Quick Bar */}
              {fbBackups.length > 0 && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <History size={14} className="text-purple-500" />
                    <span>Safety Backups: <strong>{fbBackups.length} snapshot(s)</strong> available for instant rollback.</span>
                  </div>
                  <button
                    onClick={() => setIsRollingBack(true)}
                    className="text-purple-600 dark:text-purple-400 hover:underline font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Snapshots</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================== */}
          {/* CARD B: EMAIL NOTIFICATION SETTINGS (GMAIL SMTP)           */}
          {/* ========================================================== */}
          {(activeTab === 'cards' || activeTab === 'smtp') && (
            <div className="relative rounded-3xl p-6 sm:p-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-purple-500/20 shadow-xl shadow-slate-200/50 dark:shadow-indigo-950/20 overflow-hidden space-y-6">
              
              {/* Card Header & Email Service Status Banner */}
              <div className="space-y-3 pb-5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0 shadow-xs">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Card B: Email Notification Settings</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Gmail SMTP Transactional Verification Engine
                    </p>
                  </div>
                </div>

                {/* Email Service Status Banner */}
                <div className={`p-4 rounded-2xl border text-xs space-y-1.5 transition-all ${
                  emailStatus.status === 'connected'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                    : emailStatus.status === 'error'
                    ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-500/30 text-rose-900 dark:text-rose-200'
                    : emailStatus.status === 'not_configured'
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-200'
                    : 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-500/30 text-sky-900 dark:text-sky-200'
                }`}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="font-bold flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${emailStatus.badgeBg}`} />
                      <span>Email Service Status: {emailStatus.label}</span>
                    </div>
                    {smtpConfig.lastTestTimestamp && (
                      <span className="text-[10px] opacity-75 font-mono">
                        Last check: {new Date(smtpConfig.lastTestTimestamp).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  
                  {smtpConfig.lastTestStatus === 'success' && (
                    <p className="text-[11px] leading-relaxed text-emerald-800 dark:text-emerald-200">
                      Gmail SMTP handshake verified. Outbound verification emails active through {smtpConfig.senderEmail} ({smtpConfig.lastTestLatencyMs || 0}ms).
                    </p>
                  )}

                  {smtpConfig.lastTestStatus === 'failed' && (
                    <p className="text-[11px] leading-relaxed text-rose-800 dark:text-rose-200">
                      {smtpConfig.lastTestError || 'Last delivery attempt encountered an error.'}
                    </p>
                  )}

                  {emailStatus.status === 'not_configured' && (
                    <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-200">
                      SMTP credentials are not yet configured. Supply your Sender Gmail address and 16-character Google App Password below to activate real email delivery.
                    </p>
                  )}
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* SMTP Host */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      SMTP Host <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={smtpHost}
                      onChange={e => setSmtpHost(e.target.value)}
                      placeholder="smtp.gmail.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Port & Security Mode Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Port & Encryption <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSmtpPort(465);
                          setSmtpSecurityMode('SSL');
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                          smtpPort === 465
                            ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-700 dark:text-purple-300 font-bold shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        465 (SSL)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSmtpPort(587);
                          setSmtpSecurityMode('STARTTLS');
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                          smtpPort === 587
                            ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-700 dark:text-purple-300 font-bold shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        587 (STARTTLS)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sender Gmail Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sender Gmail Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={smtpSenderEmail}
                    onChange={e => setSmtpSenderEmail(e.target.value)}
                    placeholder="alumni.mgmt.sgc@gmail.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Gmail App Password Section */}
                <div className="space-y-2">
                  {smtpConfig.isPasswordConfigured && !isReplacingPassword ? (
                    /* Clear Indication: Password Already Configured on Server */
                    <div className="p-3.5 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                          <ShieldCheck size={16} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
                            <span>Google App Password Active & Configured</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/80 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-100 font-mono font-bold">
                              Server Stored
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-snug mt-0.5">
                            Active in protected server secret store. Leaving this untouched preserves your current credentials without exposing or overwriting them.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsReplacingPassword(true);
                          setSmtpAppPassword('');
                        }}
                        className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-600 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold hover:bg-emerald-50 dark:hover:bg-slate-700 transition cursor-pointer shrink-0 shadow-xs self-start sm:self-auto flex items-center gap-1.5"
                      >
                        <KeyRound size={13} />
                        <span>Change Password</span>
                      </button>
                    </div>
                  ) : (
                    /* Active Entry / Intentional Password Replacement */
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {isReplacingPassword ? 'New Google App Password (16 characters)' : 'Google App Password (16 characters)'} <span className="text-rose-500">*</span>
                        </label>
                        <div className="flex items-center gap-2.5">
                          {isReplacingPassword && smtpConfig.isPasswordConfigured && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsReplacingPassword(false);
                                setSmtpAppPassword('');
                              }}
                              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                            >
                              Keep Current Password
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setShowAppPassword(!showAppPassword)}
                            className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            {showAppPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                            <span>{showAppPassword ? 'Mask' : 'Reveal'}</span>
                          </button>
                        </div>
                      </div>
                      <input
                        type={showAppPassword ? 'text' : 'password'}
                        value={smtpAppPassword}
                        onChange={e => setSmtpAppPassword(e.target.value)}
                        autoComplete="new-password"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}

                  {/* Google App Password Guidance Notice */}
                  <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-500/20 rounded-xl text-[11px] text-purple-950 dark:text-purple-200 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-purple-800 dark:text-purple-300">
                      <Info size={13} />
                      <span>Google Account Security Requirement</span>
                    </div>
                    <p className="leading-relaxed opacity-90">
                      Use a dedicated <strong>App Password</strong> generated under <em>Google Account → Security → 2-Step Verification → App passwords</em>.
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      Security Invariant: The secret password is held exclusively on server runtime and is never returned in client bundles, localStorage, or public database.
                    </p>
                  </div>
                </div>

                {/* Sender Display Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sender Display Name
                  </label>
                  <input
                    type="text"
                    value={smtpDisplayName}
                    onChange={e => setSmtpDisplayName(e.target.value)}
                    placeholder="Department Of Management, Savar Govt. College"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Test Recipient Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Test Recipient Email
                  </label>
                  <input
                    type="email"
                    value={smtpTestRecipient}
                    onChange={e => setSmtpTestRecipient(e.target.value)}
                    placeholder="mehedihasan1303@gmail.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Vercel Environment Variables Integration Guidance */}
                <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-500/20 rounded-xl text-xs space-y-1.5">
                  <div className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={13} className="text-indigo-500" />
                      <span>Vercel Permanent Storage Tip:</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-indigo-700 dark:text-indigo-300">
                      {smtpConfig.envConfigured ? '✓ Vercel Env Active' : 'Server Memory / File Active'}
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-900 dark:text-indigo-300 leading-relaxed">
                    Saving settings here updates the active server runtime immediately. For permanent resilience across Vercel cold restarts without filesystem dependencies, define <code className="font-mono bg-indigo-100 dark:bg-indigo-900/50 px-1 py-0.5 rounded text-[10px]">SMTP_USER</code> and <code className="font-mono bg-indigo-100 dark:bg-indigo-900/50 px-1 py-0.5 rounded text-[10px]">SMTP_PASS</code> in your <strong>Vercel Project Settings → Environment Variables</strong>.
                  </p>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="pt-2 flex flex-wrap items-center gap-2.5">
                {/* Test Email Button */}
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={isTestingSmtp || !smtpConfig.isPasswordConfigured && !smtpAppPassword.trim()}
                  className="px-4 py-2.5 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/60 dark:hover:bg-cyan-900/60 text-cyan-800 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-800 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Send size={14} className={isTestingSmtp ? 'animate-pulse' : ''} />
                  <span>{isTestingSmtp ? 'Sending Test...' : 'Test Email'}</span>
                </button>

                {/* Save Settings Button */}
                <button
                  type="button"
                  onClick={() => setIsConfirmingSmtpSave(true)}
                  disabled={isSavingSmtp}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-purple-900/30 ml-auto disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>Save Settings</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. SECURITY & RULES AUDIT TAB                                  */}
      {/* ============================================================== */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-purple-500/20 shadow-xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Security Architecture & Rules Audit</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Firebase Realtime Database Security Invariants & System Controller Role Isolation
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Database size={15} className="text-purple-600" />
                  <span>database.rules.json Enforcement</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  Public access is strictly disabled (<code className="font-mono text-rose-500">.read: false, .write: false</code>). Only the official application logo is public read. Role promotions, system emergency controls, and admin limit allocations are cryptographically locked to <code className="font-mono font-bold text-purple-600 dark:text-purple-400">mehedihasan1303@gmail.com</code>.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Lock size={15} className="text-indigo-600" />
                  <span>SMTP Secret Storage Invariant</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                  Google App Passwords are never sent back via any API endpoint. Passwords are stored in server-side configuration memory with zero exposure to client-side localStorage, IndexedDB, or public RTDB nodes.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => navigateToAdminSection('matrix')}
                className="px-4 py-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/60 text-purple-800 dark:text-purple-200 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Inspect Permission Matrix
              </button>
              <button
                onClick={() => navigateToAdminSection('emergency')}
                className="px-4 py-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Emergency Control Center
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. TELEMETRY & HEALTH TAB                                      */}
      {/* ============================================================== */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          <div className="rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-purple-500/20 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Activity size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">System Diagnostics & Health Telemetry</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Live end-to-end ping telemetry and audit logging
                  </p>
                </div>
              </div>

              <button
                onClick={handleRunDiagnostics}
                disabled={isDiagnosing}
                className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <RefreshCw size={14} className={isDiagnosing ? 'animate-spin' : ''} />
                <span>{isDiagnosing ? 'Testing Services...' : 'Re-Run Diagnostics'}</span>
              </button>
            </div>

            {/* Health Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {healthResults.map(item => (
                <div key={item.id} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-white truncate">{item.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      item.status === 'online' || item.status === 'protected'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : item.status === 'degraded'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                    {item.notes}
                  </p>
                  {item.latencyMs !== undefined && (
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      Latency: <strong>{item.latencyMs}ms</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. CONFIRMATION MODAL: SAVE FIREBASE CONFIG                    */}
      {/* ============================================================== */}
      {isConfirmingFbSave && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-purple-500/30 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-500">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Confirm Firebase Configuration Change</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">An automatic backup snapshot will be recorded.</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1 font-mono text-slate-700 dark:text-slate-300">
              <div>Project ID: <strong>{editableFbConfig.projectId}</strong></div>
              <div className="truncate">Database URL: {editableFbConfig.databaseUrl}</div>
              <div>Auth Domain: {editableFbConfig.authDomain}</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Audited Change Justification <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={fbSaveReason}
                onChange={e => setFbSaveReason(e.target.value)}
                placeholder="State the technical reason for updating Firebase configuration..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingFbSave(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCommitFbConfig}
                disabled={!fbSaveReason.trim()}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
              >
                Commit & Backup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. CONFIRMATION MODAL: SAVE SMTP CONFIG                        */}
      {/* ============================================================== */}
      {isConfirmingSmtpSave && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-purple-500/30 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-300 dark:border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Confirm Gmail SMTP Update</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Settings will be saved to server memory and verified.</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1 font-mono text-slate-700 dark:text-slate-300">
              <div>Host: {smtpHost}:{smtpPort} ({smtpSecurityMode})</div>
              <div>Sender: {smtpSenderEmail}</div>
              <div>Password: {isReplacingPassword && smtpAppPassword.trim() ? 'New 16-character password will be committed' : (smtpConfig.isPasswordConfigured ? 'Existing server-configured password retained' : 'Not configured')}</div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingSmtpSave(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSmtp}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
              >
                Save Server Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. ROLLBACK SNAPSHOTS MODAL                                    */}
      {/* ============================================================== */}
      {isRollingBack && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-purple-500/30 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <History size={18} className="text-purple-600 dark:text-purple-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Safety Backup Snapshots</h3>
              </div>
              <button onClick={() => setIsRollingBack(false)} className="text-slate-400 hover:text-white p-1">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {fbBackups.map(b => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBackupId(b.id)}
                  className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition ${
                    selectedBackupId === b.id
                      ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-900 dark:text-purple-200'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:border-purple-400'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span>{new Date(b.backupTimestamp).toLocaleString()}</span>
                    <span className="font-mono text-[10px] text-purple-600 dark:text-purple-400">{b.config.projectId}</span>
                  </div>
                  <p className="text-[11px] opacity-80">{b.reason}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsRollingBack(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => selectedBackupId && handleExecuteRollback(selectedBackupId)}
                disabled={!selectedBackupId}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
              >
                Restore Selected Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
