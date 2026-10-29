import { initializeApp, getApps, getApp, deleteApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getDatabase, ref, onValue, off, Database, get } from 'firebase/database';
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

  // Step 2: Initialize Firebase App and Database
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
      safeLogs
    };
  }

  // Step 3: Listen on `/.info/connected` with timeout & cleanup
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
          } else if (val === false && !resolved) {
            // Firebase initially emits false before the websocket connects.
            // We wait to see if it flips to true within the timeout window.
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

    // Race between connection handshake and timeout
    const result = await Promise.race([listenerPromise, timeoutPromise]);
    const latencyMs = Math.round(performance.now() - startTime);

    if (result.isConnected) {
      safeLogs.push(`[Status] Connected to Firebase Realtime Database server in ${latencyMs}ms.`);
      
      // Step 4: Secondary probe to inspect Security Rules state (non-destructive)
      let rulesStatus: 'protected' | 'open' | 'denied' = 'protected';
      try {
        const testRef = ref(db, '__security_rules_probe__');
        await get(testRef);
        rulesStatus = 'open';
        safeLogs.push('[Security Rules Audit] Test path readable (Security Rules allow public reads).');
      } catch (ruleErr: any) {
        if (ruleErr?.code === 'PERMISSION_DENIED' || String(ruleErr).includes('Permission denied')) {
          rulesStatus = 'denied';
          safeLogs.push('[Security Rules Audit] Test path rejected with PERMISSION_DENIED. database.rules.json rules are actively enforced (HTTP 401/403).');
        } else {
          rulesStatus = 'protected';
          safeLogs.push(`[Security Rules Audit] Security probe response: ${ruleErr?.message || 'Protected'}`);
        }
      }

      return {
        status: 'connected',
        rtdbStatus: rulesStatus === 'denied' ? 'protected' : 'reachable',
        authStatus: 'reachable',
        latencyMs,
        message: `Connected (${latencyMs}ms) — Realtime Database socket active via "/.info/connected".`,
        details: rulesStatus === 'denied'
          ? 'Connected to Firebase server. Database Security Rules are active (Protected: unauthenticated reads denied by database.rules.json).'
          : 'Connected to Firebase server. Host responding normally.',
        testedAt,
        endpoint,
        configOrigin: origin,
        safeLogs
      };
    }

    // If we timed out or got error
    if ('timedOut' in result && result.timedOut) {
      safeLogs.push(`[Timeout] "/.info/connected" did not report true within ${timeoutMs}ms.`);

      // Probe if network or HTTP can reach the database host
      let httpReachable = false;
      let is401Protected = false;
      try {
        const controller = new AbortController();
        const fetchTimer = setTimeout(() => controller.abort(), 2000);
        const resp = await fetch(`${endpoint.replace(/\/$/, '')}/.json?shallow=true`, {
          method: 'GET',
          signal: controller.signal
        }).catch(() => null);
        clearTimeout(fetchTimer);

        if (resp) {
          httpReachable = true;
          if (resp.status === 401 || resp.status === 403) {
            is401Protected = true;
          }
        }
      } catch {
        httpReachable = false;
      }

      if (is401Protected) {
        safeLogs.push('[HTTP Ping] Host responded with HTTP 401 (Database Rules Active). Socket negotiation delayed.');
        return {
          status: 'connected',
          rtdbStatus: 'protected',
          authStatus: 'reachable',
          latencyMs,
          message: `Connected (${latencyMs}ms) — Database host online and secured by database.rules.json.`,
          details: 'Host is online. Security rules strictly require authenticated tokens for database access.',
          testedAt,
          endpoint,
          configOrigin: origin,
          safeLogs
        };
      }

      if (!httpReachable) {
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
          safeLogs
        };
      }

      return {
        status: 'disconnected',
        rtdbStatus: 'unreachable',
        authStatus: 'unreachable',
        latencyMs,
        message: 'Disconnected: Firebase Database server is currently offline or unreachable.',
        details: 'The client did not receive a connection acknowledgment from the Firebase backend.',
        testedAt,
        endpoint,
        configOrigin: origin,
        safeLogs
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
      safeLogs
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
      safeLogs
    };
  } finally {
    // Always clean up listener to prevent memory leaks and duplicate listeners
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
              safeLogs: ['[Socket Event] "/.info/connected" is TRUE']
            });
          } else {
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
              safeLogs: ['[Socket Event] "/.info/connected" is FALSE']
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
