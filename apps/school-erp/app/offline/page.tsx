import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#F8FAFC] text-center px-6">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
        <WifiOff className="w-7 h-7" />
      </div>
      <h1 className="text-lg font-bold text-slate-900">You&apos;re offline</h1>
      <p className="text-sm text-slate-500 max-w-sm">
        AcademiX needs a connection to load live data. Reconnect and try again — your
        session is safe.
      </p>
    </div>
  );
}
