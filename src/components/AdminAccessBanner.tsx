import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, Clock, LogOut, AlertTriangle } from 'lucide-react';

export const AdminAccessBanner: React.FC = () => {
  const { adminSession, exitAdministrativeAccess } = useApp();
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  useEffect(() => {
    if (!adminSession || !adminSession.isActive) return;

    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((new Date(adminSession.expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
      if (diff <= 0) {
        exitAdministrativeAccess();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [adminSession, exitAdministrativeAccess]);

  if (!adminSession || !adminSession.isActive) {
    return null;
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <aside
      aria-label="Administrative access banner"
      className="sticky top-0 z-50 bg-amber-50 border-b border-amber-300 px-3 sm:px-6 py-2.5 text-amber-900 shadow-sm transition-all"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        {/* Left: Security Warning & Target Info */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
            <ShieldAlert size={16} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold tracking-wide uppercase text-amber-900 text-[11px] flex items-center gap-1">
                <AlertTriangle size={12} className="text-amber-600" /> System Controller Privileged Access Active
              </span>
              <span className="bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded font-mono text-[10px] font-semibold">
                Target: {adminSession.targetName} ({adminSession.targetRole.replace('_', ' ')})
              </span>
            </div>
            <div className="text-[11px] text-amber-800 truncate max-w-md sm:max-w-xl">
              <strong>Audit Purpose:</strong> &ldquo;{adminSession.reason}&rdquo;
            </div>
          </div>
        </div>

        {/* Right: Lease Countdown & Exit Action */}
        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-900 bg-white px-2.5 py-1 rounded-lg border border-amber-300 shadow-xs">
            <Clock size={13} className="text-amber-600" />
            <span>Lease: <strong>{formattedTime}</strong></span>
          </div>

          <button
            onClick={exitAdministrativeAccess}
            className="px-3 py-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <LogOut size={13} />
            <span>Exit Administrative Session</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
