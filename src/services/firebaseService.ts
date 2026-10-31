import { initializeApp, getApps, getApp, deleteApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getDatabase, ref, onValue, off, Database, get } from 'firebase/database';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  Auth, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  FirebaseEditableConfig, 
  FirebaseConnectionTestResult, 
  FirebaseConnectionStatus 
} from '../types';
import { 
  getStoredFirebaseConfig, 
  validateFirebaseConfig 
} from './systemDiagnosticsService';

const DEFAULT_FIREBASE_APP_NAME = '[DEFAULT]';

/**
 * Safely masks API keys for diagnostics without exposing sensitive key material.
 */
export function maskSecretString(value: string | undefined | null, visibleStart = 6, visibleEnd = 4): string {
  if (!value) return 'Not Provided';
  const clean = value.trim();
  if (clean.length <= visibleStart + visibleEnd) {
    return 'Configured (Masked)';
  }
  return `${clean.slice(0, visibleStart)}...${clean.slice(-visibleEnd)}`;
}

/**
 * Determines whether the active config is derived from Vercel environment variables,
 * a saved local override, or default placeholder template.
 */
export function getFirebaseConfigOrigin(): 'vercel_env' | 'local_storage_override' | 'fallback_template' {
  if (typeof localStorage !== 'undefined') {
    const custom = localStorage.getItem('nexus_custom_firebase_config_v1');
    if (custom) return 'local_storage_override';
  }
  const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : ({} as Record<string, string>);
  if (env.VITE_FIREBASE_API_KEY && !env.VITE_FIREBASE_API_KEY.includes('ExampleKey')) {
    return 'vercel_env';
  }
  return 'fallback_template';
}

/**
 * Normalizes FirebaseEditableConfig into standard FirebaseOptions.
 * CRITICAL: Firebase SDK expects `databaseURL` (uppercase URL), NOT `databaseUrl`.
 */
export function createFirebaseOptions(config: FirebaseEditableConfig): FirebaseOptions {
  const cleanDbUrl = (config.databaseUrl || '').trim().replace(/\/$/, '');
  return {
    apiKey: config.apiKey?.trim() || '',
    authDomain: config.authDomain?.trim() || '',
    databaseURL: cleanDbUrl, // Uppercase URL required by Firebase Realtime Database SDK
    projectId: config.projectId?.trim() || '',
    storageBucket: config.storageBucket?.trim() || '',
    messagingSenderId: config.messagingSenderId?.trim() || '',
    appId: config.appId?.trim() || ''
  };
}

/**
 * Safely gets or initializes the FirebaseApp instance.
 * Avoids duplicate app errors and cleanly re-initializes when configuration changes.
 */
export async function getOrReinitializeFirebaseApp(
  config?: FirebaseEditableConfig,
  forceReinit = false
): Promise<{ app: FirebaseApp | null; safeLogs: string[]; error?: string }> {
  const safeLogs: string[] = [];
  const targetConfig = config || getStoredFirebaseConfig();
  const options = createFirebaseOptions(targetConfig);

  safeLogs.push(`[Config Check] Project ID: "${targetConfig.projectId || 'empty'}"`);
  safeLogs.push(`[Config Check] Database URL: "${targetConfig.databaseUrl || 'empty'}"`);
  safeLogs.push(`[Config Check] Auth Domain: "${targetConfig.authDomain || 'empty'}"`);
  safeLogs.push(`[Config Check] API Key: ${maskSecretString(targetConfig.apiKey)}`);

  try {
    const existingApps = getApps();
    const existing = existingApps.find(a => a.name === DEFAULT_FIREBASE_APP_NAME);

    if (existing) {
      const existingOpts = existing.options;
      const optionsMatch = 
        existingOpts.apiKey === options.apiKey &&
        existingOpts.databaseURL === options.databaseURL &&
        existingOpts.projectId === options.projectId;

      if (optionsMatch && !forceReinit) {
        safeLogs.push('[SDK] Reusing active FirebaseApp instance with identical configuration.');
        return { app: existing, safeLogs };
      }

      safeLogs.push('[SDK] Configuration changed or reinitialization forced. Disposing previous FirebaseApp.');
      await deleteApp(existing);
    }

    safeLogs.push('[SDK] Initializing new FirebaseApp instance.');
    const app = initializeApp(options, DEFAULT_FIREBASE_APP_NAME);
    safeLogs.push('[SDK] FirebaseApp initialized successfully.');
    return { app, safeLogs };
  } catch (err: any) {
    const errMessage = err?.message || String(err);
    safeLogs.push(`[SDK Error] Failed to initialize FirebaseApp: ${errMessage}`);
    return { app: null, safeLogs, error: errMessage };
  }
}

/**
 * Returns the Firebase Database instance for Realtime Database.
 */
export async function getFirebaseDatabaseInstance(
  config?: FirebaseEditableConfig
): Promise<{ db: Database | null; safeLogs: string[]; error?: string }> {
  const { app, safeLogs, error } = await getOrReinitializeFirebaseApp(config);
  if (!app) {
    return { db: null, safeLogs, error: error || 'FirebaseApp initialization failed' };
  }

  try {
    const targetConfig = config || getStoredFirebaseConfig();
    const cleanDbUrl = (targetConfig.databaseUrl || '').trim().replace(/\/$/, '');
    
    // Explicitly pass databaseURL to ensure multi-region or custom RTDB clusters are accurately targeted
    const db = cleanDbUrl ? getDatabase(app, cleanDbUrl) : getDatabase(app);
    safeLogs.push(`[RTDB] Database instance attached to URL: "${cleanDbUrl || app.options.databaseURL}"`);
    return { db, safeLogs };
  } catch (err: any) {
    const errMessage = err?.message || String(err);
    safeLogs.push(`[RTDB Error] Failed to attach database instance: ${errMessage}`);
    return { db: null, safeLogs, error: errMessage };
  }
}

/**
 * Returns the Firebase Authentication instance.
 */
export async function getFirebaseAuthInstance(
  config?: FirebaseEditableConfig
): Promise<{ auth: Auth | null; safeLogs: string[]; error?: string }> {
  const { app, safeLogs, error } = await getOrReinitializeFirebaseApp(config);
  if (!app) {
    return { auth: null, safeLogs, error: error || 'FirebaseApp initialization failed' };
  }

  try {
    const auth = getAuth(app);
    return { auth, safeLogs };
  } catch (err: any) {
    const errMessage = err?.message || String(err);
    safeLogs.push(`[Auth Error] Failed to initialize Firebase Auth: ${errMessage}`);
    return { auth: null, safeLogs, error: errMessage };
  }
}

/**
 * Signs in using Firebase Authentication.
 */
export async function signInWithFirebaseAuth(
  email: string,
  pass: string
): Promise<{ success: boolean; user?: FirebaseUser; error?: string; errorCode?: string }> {
  try {
    const { auth } = await getFirebaseAuthInstance();
    if (!auth) {
      return { success: false, error: 'Firebase Auth is not available' };
    }
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return { success: true, user: userCredential.user };
  } catch (err: any) {
    return { 
      success: false, 
      error: err?.message || String(err),
      errorCode: err?.code || 'AUTH_ERROR'
    };
  }
}

/**
 * Sends a native Firebase Authentication password reset email.
 */
export async function sendFirebaseAuthPasswordReset(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { auth } = await getFirebaseAuthInstance();
    if (!auth) {
      return { success: false, error: 'Firebase Auth is not available' };
    }
    await sendPasswordResetEmail(auth, email.trim());
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Signs out from Firebase Authentication.
 */
export async function signOutFirebaseAuth(): Promise<{ success: boolean; error?: string }> {
  try {
    const { auth } = await getFirebaseAuthInstance();
    if (auth) {
      await firebaseSignOut(auth);
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Performs a comprehensive probe of Firebase connection using:
 * 1. Configuration parameter integrity & origin check
 * 2. Firebase SDK App initialization
 * 3. Realtime Database SDK `/.info/connected` socket listener
 * 4. Protected database rules probe to distinguish rules protection vs connection failure
 * 
 * Accurately categorizes result into:
 * - 'checking'
 * - 'connected'
 * - 'disconnected'
 * - 'permission_denied'
 * - 'configuration_error'
 * - 'network_error'
 */
export async function probeFirebaseWithInfoConnected(
  configToTest?: FirebaseEditableConfig,
  timeoutMs = 5000
): Promise<FirebaseConnectionTestResult> {
  const startTime = performance.now();
  const testedAt = new Date().toISOString();
  const safeLogs: string[] = [];
  const origin = getFirebaseConfigOrigin();

  const config = configToTest || getStoredFirebaseConfig();
  const endpoint = config.databaseUrl || 'Unknown';

  safeLogs.push(`[Origin] Configuration Source: ${
    origin === 'vercel_env' ? 'Vercel Environment Variables (VITE_FIREBASE_*)' :
    origin === 'local_storage_override' ? 'Saved System Controller LocalStorage Override' :
    'Placeholder Template Defaults'
  }`);

  // Step 1: Validate configuration integrity
  const validation = validateFirebaseConfig(config);
  if (!validation.isValid) {
    const latencyMs = Math.round(performance.now() - startTime);
    safeLogs.push(`[Validation Error] ${validation.errors.join('; ')}`);
    return {
      status: 'configuration_error',
      rtdbStatus: 'unreachable',
      authStatus: 'unreachable',
      latencyMs,
      message: 'Configuration Error: Firebase parameters failed validation.',
      details: validation.errors.join(' '),
      testedAt,
      endpoint,
      configOrigin: origin,
      safeLogs
    };
  }

  // Check for placeholder or template configurations on Vercel
  if (config.apiKey.includes('ExampleKey') || config.projectId.includes('sgc-example')) {
    const latencyMs = Math.round(performance.now() - startTime);
    safeLogs.push('[Config Warning] API Key or Project ID contains placeholder values.');
    return {
      status: 'configuration_error',
      rtdbStatus: 'unreachable',
      authStatus: 'unreachable',
      latencyMs,
      message: 'Configuration Error: Placeholder Firebase credentials detected.',
      details: 'Please enter your actual Firebase Project credentials in the editor or set VITE_FIREBASE_* in your Vercel project settings.',
      testedAt,
      endpoint,
      configOrigin: origin,
      safeLogs
    };
  }

  // Step 2: Safe Endpoint Reachability & Status Check via REST
  let isEndpointReachable = false;
  let isDeactivated = false;
  let is401Protected = false;
  let is200Open = false;
  let httpStatus = 0;
  let deactivatedMessage = '';

  try {
    const controller = new AbortController();
    const fetchTimer = setTimeout(() => controller.abort(), 3500);
    const cleanUrl = endpoint.trim().replace(/\/$/, '');
    const resp = await fetch(`${cleanUrl}/.json?shallow=true`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(fetchTimer);
    httpStatus = resp.status;
    isEndpointReachable = true;

    if (resp.status === 423) {
      isDeactivated = true;
      const data: any = await resp.json().catch(() => null);
      deactivatedMessage = data?.error || 'Database has been deactivated.';
      safeLogs.push(`[Endpoint Audit] Host responded with HTTP 423 Locked: ${deactivatedMessage}`);
    } else if (resp.status === 401 || resp.status === 403) {
      is401Protected = true;
      safeLogs.push('[Endpoint Audit] Host responded with HTTP 401/403: Endpoint online, database.rules.json rules actively enforced.');
    } else if (resp.status === 200) {
      is200Open = true;
      safeLogs.push('[Endpoint Audit] Host responded with HTTP 200 OK: Public read operation allowed.');
    } else {
      safeLogs.push(`[Endpoint Audit] Host responded with HTTP ${resp.status}.`);
    }
  } catch (fetchErr: any) {
    safeLogs.push(`[Endpoint Audit] Direct REST ping error: ${fetchErr?.message || String(fetchErr)}`);
    isEndpointReachable = false;
  }

  // If database is specifically deactivated in Firebase Console, report with crystal clarity immediately
  if (isDeactivated) {
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      status: 'database_deactivated',
      rtdbStatus: 'deactivated',
      authStatus: 'reachable',
      latencyMs,
      message: `Firebase Database Deactivated in Firebase Console (HTTP 423 Locked).`,
      details: `${deactivatedMessage} The database host (${endpoint}) is online and responding, but the instance has been paused or deactivated. Action required: Open Firebase Console > Realtime Database and click "Enable database" or "Re-activate".`,
      testedAt,
      endpoint,
      configOrigin: origin,
      safeLogs,
      isConfigValid: true,
      isEndpointReachable: true,
      isDeactivated: true,
      httpStatus: 423
    };
  }

  // Step 3: Initialize Firebase App and Database SDK
  const { db, safeLogs: dbLogs, error: dbInitError } = await getFirebaseDatabaseInstance(config);
  safeLogs.push(...dbLogs);

  if (!db) {
    const latencyMs = Math.round(performance.now() - startTime);
    const isConfigProblem = dbInitError?.toLowerCase().includes('url') || dbInitError?.toLowerCase().includes('option');
    return {
      status: isConfigProblem ? 'configuration_error' : 'network_error',
      rtdbStatus: 'unreachable',
      authStatus: 'unreachable',
      latencyMs,
      message: isConfigProblem 
        ? `Configuration Error: ${dbInitError}` 
        : `Initialization Error: ${dbInitError}`,
      details: 'Firebase SDK could not initialize Realtime Database with the provided options.',
      testedAt,
      endpoint,
      configOrigin: origin,
      safeLogs,
      isConfigValid: !isConfigProblem,
      isEndpointReachable
    };
  }

  // Step 4: Listen on `/.info/connected` with timeout & cleanup
  safeLogs.push('[Listener] Subscribing to Firebase RTDB "/.info/connected" location...');
  let unsubscribeConnected: (() => void) | undefined;

  try {
    const connectedRef = ref(db, '.info/connected');

    const listenerPromise = new Promise<{ isConnected: boolean; error?: any }>((resolve) => {
      let resolved = false;

      const unsubscribe = onValue(
        connectedRef,
        (snapshot) => {
          const val = snapshot.val();
          safeLogs.push(`[Socket Event] "/.info/connected" emitted value: ${JSON.stringify(val)}`);
          if (val === true && !resolved) {
            resolved = true;
            resolve({ isConnected: true });
          }
        },
        (err) => {
          safeLogs.push(`[Socket Error] Listener error: ${err.message || String(err)}`);
          if (!resolved) {
            resolved = true;
            resolve({ isConnected: false, error: err });
          }
        }
      );

      unsubscribeConnected = unsubscribe;
    });

    const timeoutPromise = new Promise<{ isConnected: boolean; timedOut: boolean }>((resolve) => {
      setTimeout(() => {
        resolve({ isConnected: false, timedOut: true });
      }, timeoutMs);
    });

    const result = await Promise.race([listenerPromise, timeoutPromise]);
    const latencyMs = Math.round(performance.now() - startTime);

    if (result.isConnected) {
      safeLogs.push(`[Status] Connected to Firebase Realtime Database server in ${latencyMs}ms.`);
      
      // Secondary probe to inspect Security Rules state (non-destructive read on allowed node)
      let rulesStatus: 'protected' | 'reachable' = 'reachable';
      let readTestPassed = false;
      try {
        const logoRef = ref(db, 'app_logo');
        await get(logoRef);
        readTestPassed = true;
        safeLogs.push('[Read Probe] Read test on authorized path "app_logo" passed successfully.');
      } catch (readErr: any) {
        if (readErr?.code === 'PERMISSION_DENIED' || String(readErr).includes('Permission denied')) {
          rulesStatus = 'protected';
          safeLogs.push('[Read Probe] Read returned PERMISSION_DENIED. database.rules.json rules are strictly enforced.');
        } else {
          safeLogs.push(`[Read Probe] Read response: ${readErr?.message || 'Protected'}`);
        }
      }

      return {
        status: 'connected',
        rtdbStatus: rulesStatus === 'protected' ? 'protected' : 'reachable',
        authStatus: 'reachable',
        latencyMs,
        message: `Connected (${latencyMs}ms) — Realtime Database socket active via "/.info/connected".`,
        details: 'Live socket connection established. Firebase backend responded to connection acknowledgment.',
        testedAt,
        endpoint,
        configOrigin: origin,
        safeLogs,
        isConfigValid: true,
        isEndpointReachable: true,
        readTestPassed
      };
    }

    // If timeout occurred
    if ('timedOut' in result && result.timedOut) {
      safeLogs.push(`[Timeout] "/.info/connected" did not report true within ${timeoutMs}ms.`);

      if (is401Protected) {
        return {
          status: 'permission_denied',
          rtdbStatus: 'protected',
          authStatus: 'reachable',
          latencyMs,
          message: 'Permission Denied: Firebase server online, protected by database.rules.json.',
          details: 'The Firebase database endpoint is reachable over HTTPS, but unauthenticated requests are restricted by security rules.',
          testedAt,
          endpoint,
          configOrigin: origin,
          safeLogs,
          isConfigValid: true,
          isEndpointReachable: true,
          permissionDenied: true,
          errorCode: 'PERMISSION_DENIED',
          httpStatus: 401
        };
      }

      if (!isEndpointReachable) {
        return {
          status: 'network_error',
          rtdbStatus: 'unreachable',
          authStatus: 'unreachable',
          latencyMs,
          message: 'Network Error: Unable to reach Firebase host.',
          details: 'Connection timed out. Check network connectivity, DNS, or verify the databaseURL in Firebase Console.',
          testedAt,
          endpoint,
          configOrigin: origin,
          safeLogs,
          isConfigValid: true,
          isEndpointReachable: false
        };
      }

      return {
        status: 'disconnected',
        rtdbStatus: 'unreachable',
        authStatus: 'unreachable',
        latencyMs,
        message: 'Disconnected: Firebase Database socket acknowledgment pending.',
        details: 'The client did not receive a connection acknowledgment from the Firebase backend within the timeout period.',
        testedAt,
        endpoint,
        configOrigin: origin,
        safeLogs,
        isConfigValid: true,
        isEndpointReachable: true
      };
    }

    // Default error catch
    const resultErr = 'error' in result ? (result as any).error : null;
    return {
      status: 'error',
      rtdbStatus: 'unreachable',
      authStatus: 'unreachable',
      latencyMs,
      message: 'Connection probe encountered an unexpected issue.',
      details: resultErr?.message || 'Listener interrupted.',
      testedAt,
      endpoint,
      configOrigin: origin,
      safeLogs,
      isConfigValid: true,
      isEndpointReachable
    };

  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    safeLogs.push(`[Exception] Probe failed: ${err?.message || String(err)}`);
    return {
      status: 'error',
      rtdbStatus: 'unreachable',
      authStatus: 'unreachable',
      latencyMs,
      message: 'Probe exception encountered.',
      details: err?.message || 'Unknown exception during probe',
      testedAt,
      endpoint,
      configOrigin: origin,
      safeLogs,
      isConfigValid: true,
      isEndpointReachable
    };
  } finally {
    if (typeof unsubscribeConnected === 'function') {
      try {
        (unsubscribeConnected as () => void)();
        safeLogs.push('[Listener Cleanup] "/.info/connected" listener detached successfully.');
      } catch (cleanupErr) {
        console.warn('Listener cleanup notice:', cleanupErr);
      }
    }
  }
}

/**
 * Executes an authentic, safe diagnostic read and write test on Firebase Realtime Database.
 * Specifically satisfies security and diagnostic requirements:
 * 1. Checks endpoint deactivation state (HTTP 423).
 * 2. Reads authorized diagnostic path (`/app_logo` or `/users/${uid}`).
 * 3. Writes a uniquely identified temporary diagnostic record to a protected diagnostic path (`users/${uid}/__diagnostic_probe__/${probeId}`).
 * 4. Reads back the exact record to verify integrity.
 * 5. Cleans up only the temporary record created by the test.
 * 6. If permission denied, reports exact Firebase error code without loosening rules.
 */
export async function testAuthenticatedReadWrite(
  userSession?: { uid: string; email: string },
  config?: FirebaseEditableConfig
): Promise<{
  success: boolean;
  status: FirebaseConnectionStatus;
  readTestPassed: boolean;
  writeTestPassed: boolean;
  permissionDenied: boolean;
  errorCode?: string;
  errorMessage?: string;
  latencyMs: number;
  testRecordPath?: string;
  cleanedUp: boolean;
  safeLogs: string[];
}> {
  const startTime = performance.now();
  const safeLogs: string[] = [];
  const targetConfig = config || getStoredFirebaseConfig();
  const endpoint = targetConfig.databaseUrl || '';

  // 1. Initial endpoint check
  try {
    const resp = await fetch(`${endpoint.replace(/\/$/, '')}/.json?shallow=true`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (resp.status === 423) {
      const data: any = await resp.json().catch(() => null);
      const errorMsg = data?.error || 'Database has been deactivated.';
      safeLogs.push(`[Read/Write Test] Blocked: HTTP 423 Locked - ${errorMsg}`);
      return {
        success: false,
        status: 'database_deactivated',
        readTestPassed: false,
        writeTestPassed: false,
        permissionDenied: false,
        errorCode: 'DATABASE_DEACTIVATED',
        errorMessage: `Firebase Database is deactivated in Firebase Console: ${errorMsg}`,
        latencyMs: Math.round(performance.now() - startTime),
        cleanedUp: true,
        safeLogs
      };
    }
  } catch (netErr: any) {
    safeLogs.push(`[Read/Write Test] HTTP Ping error: ${netErr?.message}`);
  }

  // 2. Initialize Database Instance
  const { db, safeLogs: dbLogs, error: initErr } = await getFirebaseDatabaseInstance(targetConfig);
  safeLogs.push(...dbLogs);

  if (!db) {
    return {
      success: false,
      status: 'configuration_error',
      readTestPassed: false,
      writeTestPassed: false,
      permissionDenied: false,
      errorCode: 'INIT_FAILED',
      errorMessage: initErr || 'Database instance could not be initialized.',
      latencyMs: Math.round(performance.now() - startTime),
      cleanedUp: true,
      safeLogs
    };
  }

  let readTestPassed = false;
  let writeTestPassed = false;
  let permissionDenied = false;
  let errorCode: string | undefined;
  let errorMessage: string | undefined;
  let cleanedUp = false;

  // 3. Authenticated Read Test
  const readPath = userSession?.uid ? `users/${userSession.uid}` : 'app_logo';
  safeLogs.push(`[Read Test] Probing authorized path "${readPath}"...`);
  try {
    const readRef = ref(db, readPath);
    await get(readRef);
    readTestPassed = true;
    safeLogs.push(`[Read Test] Read probe succeeded on "${readPath}".`);
  } catch (rErr: any) {
    const errCode = rErr?.code || 'UNKNOWN';
    const errMsg = rErr?.message || String(rErr);
    safeLogs.push(`[Read Test Error] Code: ${errCode}, Message: ${errMsg}`);
    if (errCode === 'PERMISSION_DENIED' || errMsg.includes('Permission denied')) {
      permissionDenied = true;
      errorCode = 'PERMISSION_DENIED';
      errorMessage = 'Read operation denied by database.rules.json (Permission Denied).';
    }
  }

  // 4. Authenticated Write Test (with immediate cleanup)
  if (!userSession?.uid) {
    // Unauthenticated user attempting write to protected database
    permissionDenied = true;
    errorCode = 'PERMISSION_DENIED';
    errorMessage = 'Authentication Required: Cannot perform write test without an active authenticated session.';
    safeLogs.push('[Write Test] Skipped: No authenticated user session active. Protected write requires authentication.');
    return {
      success: readTestPassed,
      status: readTestPassed ? 'read_passed' : 'permission_denied',
      readTestPassed,
      writeTestPassed: false,
      permissionDenied,
      errorCode,
      errorMessage,
      latencyMs: Math.round(performance.now() - startTime),
      cleanedUp: true,
      safeLogs
    };
  }

  // Write temporary diagnostic record to authorized user path
  const testId = `diag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const writePath = `users/${userSession.uid}/__diagnostic_probe__/${testId}`;
  const testPayload = {
    testId,
    testerEmail: userSession.email,
    timestamp: new Date().toISOString(),
    purpose: 'System Controller Diagnostic Verification'
  };

  safeLogs.push(`[Write Test] Writing temporary record to "${writePath}"...`);
  try {
    const { set: firebaseSet } = await import('firebase/database');
    const writeRef = ref(db, writePath);

    // Commit temporary record
    await firebaseSet(writeRef, testPayload);
    safeLogs.push('[Write Test] Write operation committed. Reading back record to verify integrity...');

    // Read back to confirm data reached database
    const readbackSnap = await get(writeRef);
    if (readbackSnap.exists() && readbackSnap.val()?.testId === testId) {
      writeTestPassed = true;
      safeLogs.push('[Write Test] Readback verification confirmed: data matches written payload.');
    } else {
      safeLogs.push('[Write Test Warning] Write completed but readback returned empty snapshot.');
    }

    // Clean up temporary record immediately
    await firebaseSet(writeRef, null);
    cleanedUp = true;
    safeLogs.push(`[Write Test Cleanup] Diagnostic probe record "${writePath}" deleted successfully.`);

  } catch (wErr: any) {
    const errCode = wErr?.code || 'UNKNOWN';
    const errMsg = wErr?.message || String(wErr);
    safeLogs.push(`[Write Test Error] Code: ${errCode}, Message: ${errMsg}`);
    errorCode = errCode;
    errorMessage = errMsg;
    if (errCode === 'PERMISSION_DENIED' || errMsg.includes('Permission denied')) {
      permissionDenied = true;
      errorCode = 'PERMISSION_DENIED';
      errorMessage = 'Write operation denied by database.rules.json. Strict security rules enforced.';
    }
  }

  const latencyMs = Math.round(performance.now() - startTime);
  const success = readTestPassed && writeTestPassed;

  return {
    success,
    status: success ? 'write_passed' : permissionDenied ? 'permission_denied' : 'error',
    readTestPassed,
    writeTestPassed,
    permissionDenied,
    errorCode,
    errorMessage,
    latencyMs,
    testRecordPath: writePath,
    cleanedUp,
    safeLogs
  };
}

/**
 * Attaches a continuous listener to `/.info/connected` for real-time reactive UI.
 * Returns an unsubscribe callback for clean React useEffect lifecycle cleanup.
 */
export function subscribeToFirebaseConnectionListener(
  onStatusChange: (status: FirebaseConnectionTestResult) => void,
  config?: FirebaseEditableConfig
): () => void {
  let isSubscribed = true;
  let activeUnsubscribe: (() => void) | null = null;
  const targetConfig = config || getStoredFirebaseConfig();
  const endpoint = targetConfig.databaseUrl || 'Unknown';
  const origin = getFirebaseConfigOrigin();

  // 1. Initial State: Checking
  onStatusChange({
    status: 'checking',
    rtdbStatus: 'unreachable',
    authStatus: 'unreachable',
    latencyMs: 0,
    message: 'Establishing connection to Firebase Realtime Database...',
    details: 'Attaching SDK listener to "/.info/connected" location.',
    testedAt: new Date().toISOString(),
    endpoint,
    configOrigin: origin,
    safeLogs: ['[Lifecycle] Initializing reactive connection listener...']
  });

  // Fast pre-flight check to detect HTTP 423 Deactivated status immediately
  fetch(`${endpoint.trim().replace(/\/$/, '')}/.json?shallow=true`, { method: 'GET' })
    .then(async (resp) => {
      if (!isSubscribed) return;
      if (resp.status === 423) {
        const body: any = await resp.json().catch(() => null);
        const errMsg = body?.error || 'Database has been deactivated.';
        onStatusChange({
          status: 'database_deactivated',
          rtdbStatus: 'deactivated',
          authStatus: 'reachable',
          latencyMs: 100,
          message: 'Firebase Database Deactivated in Firebase Console (HTTP 423 Locked).',
          details: `${errMsg} Database host is online, but database instance is deactivated. Enable it in Firebase Console.`,
          testedAt: new Date().toISOString(),
          endpoint,
          configOrigin: origin,
          safeLogs: [`[Pre-flight Audit] HTTP 423 Locked: ${errMsg}`],
          isConfigValid: true,
          isEndpointReachable: true,
          isDeactivated: true,
          httpStatus: 423
        });
      }
    })
    .catch(() => {});

  // 2. Attach SDK listener
  getFirebaseDatabaseInstance(targetConfig)
    .then(({ db, safeLogs, error }) => {
      if (!isSubscribed) return;

      if (!db || error) {
        onStatusChange({
          status: 'configuration_error',
          rtdbStatus: 'unreachable',
          authStatus: 'unreachable',
          latencyMs: 0,
          message: error || 'Failed to initialize Firebase database',
          details: 'Verify databaseURL and apiKey in Settings or Vercel environment variables.',
          testedAt: new Date().toISOString(),
          endpoint,
          configOrigin: origin,
          safeLogs
        });
        return;
      }

      const connectedRef = ref(db, '.info/connected');
      const startConnectTime = performance.now();

      activeUnsubscribe = onValue(
        connectedRef,
        (snapshot) => {
          if (!isSubscribed) return;
          const isConnected = snapshot.val() === true;
          const latencyMs = Math.round(performance.now() - startConnectTime);

          if (isConnected) {
            onStatusChange({
              status: 'connected',
              rtdbStatus: 'reachable',
              authStatus: 'reachable',
              latencyMs,
              message: `Connected (${latencyMs}ms) — Realtime Database socket active.`,
              details: 'Live socket connection maintained with Firebase server via "/.info/connected".',
              testedAt: new Date().toISOString(),
              endpoint,
              configOrigin: origin,
              safeLogs: ['[Socket Event] "/.info/connected" is TRUE'],
              isConfigValid: true,
              isEndpointReachable: true
            });
          } else {
            // Keep existing status if deactivated was already detected
            onStatusChange({
              status: 'disconnected',
              rtdbStatus: 'unreachable',
              authStatus: 'unreachable',
              latencyMs,
              message: 'Disconnected from Firebase Database server.',
              details: 'Socket disconnected. Client waiting to reconnect.',
              testedAt: new Date().toISOString(),
              endpoint,
              configOrigin: origin,
              safeLogs: ['[Socket Event] "/.info/connected" is FALSE'],
              isConfigValid: true,
              isEndpointReachable: true
            });
          }
        },
        (listenerErr) => {
          if (!isSubscribed) return;
          onStatusChange({
            status: 'network_error',
            rtdbStatus: 'unreachable',
            authStatus: 'unreachable',
            latencyMs: 0,
            message: 'Firebase socket listener encountered a network error.',
            details: listenerErr.message || 'Socket error',
            testedAt: new Date().toISOString(),
            endpoint,
            configOrigin: origin,
            safeLogs: [`[Socket Error] ${listenerErr.message}`]
          });
        }
      );
    })
    .catch((err) => {
      if (!isSubscribed) return;
      onStatusChange({
        status: 'error',
        rtdbStatus: 'unreachable',
        authStatus: 'unreachable',
        latencyMs: 0,
        message: 'Listener attachment exception.',
        details: err?.message || 'Error attaching listener',
        testedAt: new Date().toISOString(),
        endpoint,
        configOrigin: origin,
        safeLogs: [`[Exception] ${err?.message}`]
      });
    });

  // Return clean unmount handler
  return () => {
    isSubscribed = false;
    if (activeUnsubscribe) {
      try {
        activeUnsubscribe();
      } catch (e) {
        console.warn('Error unsubscribing Firebase connection listener:', e);
      }
    }
  };
}
