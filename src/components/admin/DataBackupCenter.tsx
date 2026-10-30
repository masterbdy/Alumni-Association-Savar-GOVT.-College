import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  validateBackupFile, 
  getBackupHistory 
} from '../../services/dataBackupService';
import { 
  ApplicationBackupData, 
  BackupRestoreMode, 
  BackupRecordCounts 
} from '../../types';
import { 
  Download, 
  Upload, 
  Database, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  RefreshCw, 
  Layers, 
  Check, 
  X, 
  AlertCircle,
  HardDrive,
  Cloud,
  FileCode,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const DataBackupCenter: React.FC = () => {
  const { 
    currentUser,
    isSystemController, 
    exportDataBackup, 
    importDataBackup, 
    backupHistory,
    cloudSyncState,
    triggerCloudSync,
    testCloudWriteRead,
    users,
    posts,
    campaigns,
    donations,
    activityLogs,
    messages
  } = useApp();

  // Export State
  const [selectedExportModules, setSelectedExportModules] = useState<string[]>([
    'users', 'posts', 'conversations', 'messages', 'campaigns', 'donations',
    'activityLogs', 'adminLimits', 'permissionMatrix', 'emergencyControls',
    'appLogo', 'emailSettings', 'communityReports', 'moderationActions', 'moderationAppeals'
  ]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [parsedBackup, setParsedBackup] = useState<ApplicationBackupData | null>(null);
  const [importSummary, setImportSummary] = useState<{
    recordCounts: BackupRecordCounts;
    totalRecords: number;
    exportedAt: string;
    exportedBy: string;
    schemaVersion: string;
    modulesIncluded: string[];
  } | null>(null);
  const [importMode, setImportMode] = useState<BackupRestoreMode>('merge');
  const [selectedImportModules, setSelectedImportModules] = useState<string[]>(['posts', 'campaigns', 'donations']);
  const [fullRestoreConfirmed, setFullRestoreConfirmed] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Live Cloud Test State
  const [isTestingCloud, setIsTestingCloud] = useState(false);
  const [cloudTestFeedback, setCloudTestFeedback] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);

  if (!isSystemController) {
    return (
      <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center max-w-xl mx-auto space-y-3 shadow-xs">
        <AlertTriangle size={36} className="text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">System Controller Authorization Required</h2>
        <p className="text-xs text-slate-500">
          The Data Backup, Recovery & Migration Center is exclusively restricted to the authoritative System Controller (mehedihasan1303@gmail.com).
        </p>
      </div>
    );
  }

  // Handle Export
  const handleTriggerExport = () => {
    setIsExporting(true);
    setExportSuccess(null);
    setExportError(null);
    try {
      const res = exportDataBackup(selectedExportModules);
      if (res.success && res.filename) {
        setExportSuccess(`Backup downloaded successfully as "${res.filename}". All passwords and secrets scrubbed.`);
        setTimeout(() => setExportSuccess(null), 6000);
      } else {
        setExportError(res.error || 'Failed to generate backup.');
      }
    } catch (err: any) {
      setExportError(err.message || 'Export error');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle File Upload & Validation
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportFeedback(null);
    setFullRestoreConfirmed(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJsonText(content);
      const validation = validateBackupFile(content);

      if (validation.isValid && validation.backup && validation.summary) {
        setParsedBackup(validation.backup);
        setImportSummary(validation.summary);
      } else {
        setParsedBackup(null);
        setImportSummary(null);
        setImportFeedback({
          success: false,
          message: validation.error || 'Backup file validation failed.'
        });
      }
    };
    reader.readAsText(file);
  };

  // Handle Import Execution
  const handleTriggerImport = () => {
    if (!parsedBackup) return;

    if (importMode === 'full_restore' && !fullRestoreConfirmed) {
      setImportFeedback({
        success: false,
        message: 'Explicit confirmation checkbox must be checked before proceeding with Full Restore.'
      });
      return;
    }

    setIsImporting(true);
    setImportFeedback(null);

    try {
      const res = importDataBackup(parsedBackup, importMode, selectedImportModules);
      if (res.success) {
        setImportFeedback({
          success: true,
          message: `Import completed successfully (${importMode.toUpperCase()} mode). An automatic safety snapshot was saved before changes.`
        });
        setParsedBackup(null);
        setImportFile(null);
        setImportSummary(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setImportFeedback({
          success: false,
          message: res.error || 'Import failed.'
        });
      }
    } catch (err: any) {
      setImportFeedback({
        success: false,
        message: err.message || 'Error executing import.'
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Handle Cloud Test
  const handleTestCloudSync = async () => {
    setIsTestingCloud(true);
    setCloudTestFeedback(null);
    try {
      const res = await testCloudWriteRead();
      setCloudTestFeedback({
        success: res.success,
        message: res.message,
        latencyMs: res.latencyMs
      });
    } catch (e: any) {
      setCloudTestFeedback({
        success: false,
        message: e.message || 'Connection test failed'
      });
    } finally {
      setIsTestingCloud(false);
    }
  };

  const handleFlushSync = async () => {
    setIsTestingCloud(true);
    setCloudTestFeedback(null);
    try {
      const res = await triggerCloudSync();
      setCloudTestFeedback({
        success: res.success,
        message: res.message
      });
    } catch (e: any) {
      setCloudTestFeedback({
        success: false,
        message: e.message || 'Sync flush failed'
      });
    } finally {
      setIsTestingCloud(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-300 bg-purple-900/50 px-3 py-1 rounded-full border border-purple-700/50">
              <Database size={13} className="text-purple-400" />
              <span>System Controller Master Recovery Center</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Data Backup, Recovery & Cloud Migration
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Export complete platform records with zero credential leakage, restore snapshots with safe merge mode, inspect local device stores, and audit cloud database synchronization.
            </p>
          </div>

          <div className="shrink-0 flex sm:flex-col items-end gap-2">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] flex items-center gap-2">
              <span className="text-slate-400">Local Records:</span>
              <span className="font-bold text-emerald-400">
                {users.length + posts.length + campaigns.length + donations.length} items
              </span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] flex items-center gap-2">
              <span className="text-slate-400">Cloud Status:</span>
              <span className={`font-bold capitalize ${
                cloudSyncState.status === 'synced' ? 'text-emerald-400' :
                cloudSyncState.status === 'sync_pending' ? 'text-amber-400' : 'text-slate-300'
              }`}>
                {cloudSyncState.status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Synchronization Diagnostic Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Cloud size={16} className="text-indigo-600" />
              <span>Realtime Cloud Database Diagnostics</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify live write and read access to Firebase Realtime Database without false connected claims
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestCloudSync}
              disabled={isTestingCloud}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw size={14} className={isTestingCloud ? 'animate-spin' : ''} />
              <span>Test Live Write/Read</span>
            </button>
            <button
              onClick={handleFlushSync}
              disabled={isTestingCloud || cloudSyncState.pendingCount === 0}
              className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Upload size={14} />
              <span>Flush Sync Queue ({cloudSyncState.pendingCount})</span>
            </button>
          </div>
        </div>

        {cloudTestFeedback && (
          <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 mb-3 ${
            cloudTestFeedback.success 
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
              : 'bg-amber-50 border border-amber-200 text-amber-800'
          }`}>
            {cloudTestFeedback.success ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
            )}
            <div className="flex-1">
              <span>{cloudTestFeedback.message}</span>
              {cloudTestFeedback.latencyMs !== undefined && (
                <span className="font-mono ml-2 text-[11px] opacity-80">({cloudTestFeedback.latencyMs}ms)</span>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[11px]">Sync State</span>
            <span className="font-bold text-slate-800 capitalize mt-0.5 block">
              {cloudSyncState.status.replace('_', ' ')}
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[11px]">Pending Offline Writes</span>
            <span className="font-bold text-slate-800 mt-0.5 block">
              {cloudSyncState.pendingCount} queued
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[11px]">Target RTDB Host</span>
            <span className="font-mono text-slate-700 text-[11px] truncate block mt-0.5">
              {cloudSyncState.verifiedEndpoint || 'Configured via Settings'}
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-400 block text-[11px]">Local Resilience</span>
            <span className="font-bold text-emerald-600 mt-0.5 block">
              IndexedDB Active
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Card A (Export) & Card B (Import) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD A: Data Export */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Download size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Export Application Backup</h3>
                  <p className="text-xs text-slate-500">Download sanitized, timestamped JSON snapshot</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                JSON v2.1
              </span>
            </div>

            {exportSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{exportSuccess}</span>
              </div>
            )}
            {exportError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
                <span>{exportError}</span>
              </div>
            )}

            {/* Record Counts Breakdown */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Current Records Ready for Backup:
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Alumni Users</span>
                  <span className="font-bold text-slate-800">{users.length}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Feed Posts</span>
                  <span className="font-bold text-slate-800">{posts.length}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Campaigns</span>
                  <span className="font-bold text-slate-800">{campaigns.length}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Donations</span>
                  <span className="font-bold text-slate-800">{donations.length}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Direct Messages</span>
                  <span className="font-bold text-slate-800">{messages.length}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Audit Logs</span>
                  <span className="font-bold text-slate-800">{activityLogs.length}</span>
                </div>
              </div>
            </div>

            {/* Security Guarantee Note */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <div className="font-bold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-purple-600" />
                <span>Zero-Credential Exposure Guarantee</span>
              </div>
              <p className="leading-snug">
                Password hashes, session tokens, private SMTP secrets, and Google App Passwords are automatically sanitized and never included in exported files.
              </p>
            </div>
          </div>

          <button
            onClick={handleTriggerExport}
            disabled={isExporting}
            className="w-full py-3 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 mt-4"
          >
            <Download size={15} />
            <span>{isExporting ? 'Preparing Backup...' : 'Download Complete Backup (JSON)'}</span>
          </button>
        </div>

        {/* CARD B: Data Import & Recovery */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Upload size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Restore Application Data</h3>
                  <p className="text-xs text-slate-500">Upload and restore previously exported JSON backup</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                Safe Restore
              </span>
            </div>

            {importFeedback && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                importFeedback.success 
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}>
                {importFeedback.success ? (
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle size={16} className="text-rose-600 shrink-0" />
                )}
                <span>{importFeedback.message}</span>
              </div>
            )}

            {/* File Picker */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Select Backup JSON File:
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-slate-200 rounded-xl p-1"
              />
            </div>

            {/* Validation & Preview Card */}
            {importSummary && (
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2.5 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>Backup Validation Verified ✓</span>
                  <span className="text-indigo-600">{importSummary.totalRecords} total items</span>
                </div>
                <div className="text-[11px] text-slate-500 grid grid-cols-2 gap-1.5">
                  <span>Exported: {new Date(importSummary.exportedAt).toLocaleDateString()}</span>
                  <span>Schema: {importSummary.schemaVersion}</span>
                  <span>Author: {importSummary.exportedBy}</span>
                  <span>Users: {importSummary.recordCounts.users} | Posts: {importSummary.recordCounts.posts}</span>
                </div>

                {/* Mode Selector */}
                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Restore Mode:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setImportMode('merge')}
                      className={`p-2 rounded-xl text-center font-bold text-[11px] transition cursor-pointer border ${
                        importMode === 'merge'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Merge (Safe)
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportMode('selected_modules')}
                      className={`p-2 rounded-xl text-center font-bold text-[11px] transition cursor-pointer border ${
                        importMode === 'selected_modules'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Selected Modules
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportMode('full_restore')}
                      className={`p-2 rounded-xl text-center font-bold text-[11px] transition cursor-pointer border ${
                        importMode === 'full_restore'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Full Restore
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {importMode === 'merge' && 'Merge Mode: Adds missing records without altering existing records.'}
                    {importMode === 'selected_modules' && 'Selected Modules: Overwrites only chosen modules from the backup.'}
                    {importMode === 'full_restore' && 'Full Restore: Replaces supported records. Pre-import safety snapshot is always taken.'}
                  </p>
                </div>

                {/* Full Restore Confirmation Checkbox */}
                {importMode === 'full_restore' && (
                  <div className="pt-2 border-t border-rose-200 bg-rose-50 p-2.5 rounded-lg flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="confirmFullRestore"
                      checked={fullRestoreConfirmed}
                      onChange={(e) => setFullRestoreConfirmed(e.target.checked)}
                      className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                    <label htmlFor="confirmFullRestore" className="text-[11px] font-semibold text-rose-900 cursor-pointer">
                      I understand this replaces current records with the backup file. A pre-import snapshot will be automatically saved.
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleTriggerImport}
            disabled={!parsedBackup || isImporting || (importMode === 'full_restore' && !fullRestoreConfirmed)}
            className={`w-full py-3 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 mt-4 ${
              importMode === 'full_restore'
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            <Upload size={15} />
            <span>{isImporting ? 'Restoring Data...' : `Execute ${importMode.replace('_', ' ').toUpperCase()}`}</span>
          </button>
        </div>
      </div>

      {/* History Log */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-purple-600" />
            <h3 className="text-sm font-bold text-slate-800">Backup & Restore Activity History</h3>
          </div>
          <span className="text-xs text-slate-400">
            {backupHistory.length} audit entries
          </span>
        </div>

        {backupHistory.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            No previous exports or restores recorded on this device yet.
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {backupHistory.slice(0, 10).map((item) => (
              <div 
                key={item.id} 
                className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.type === 'export' ? 'bg-purple-100 text-purple-700' :
                      item.type === 'pre_import_snapshot' ? 'bg-amber-100 text-amber-800' :
                      'bg-indigo-100 text-indigo-700'
                    }`}>
                      {item.type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="font-mono text-[11px] truncate max-w-xs">{item.filename}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {item.details || (item.status === 'success' ? 'Completed successfully' : item.errorMessage)}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block">
                    {new Date(item.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                  <span className="text-[11px] font-bold text-slate-700">
                    {item.recordCount} items
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
