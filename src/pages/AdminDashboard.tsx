import { useEffect, useRef, useState } from "react";
import { useSupabaseQueue } from "@/hooks/use-supabase-queue";
import { SERVICES } from "@/lib/data";
import { SERVICE_ICONS } from "@/lib/icons";
import { Play, RotateCcw, Users, Clock, CheckCircle2, Timer, TrendingUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const AdminDashboard = () => {
  const { entries, serveNext, resetQueue, seedQueue, loading } = useSupabaseQueue();
  const [autoSimulation, setAutoSimulation] = useState(false);
  const intervalsRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  // Seed queues on first load if empty
  useEffect(() => {
    if (!loading && entries.length === 0) {
      SERVICES.forEach((s) => seedQueue(s.id, Math.floor(Math.random() * 8) + 3));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Auto simulation
  useEffect(() => {
    if (autoSimulation) {
      SERVICES.forEach((service) => {
        intervalsRef.current[service.id] = setInterval(() => {
          serveNext(service.id);
        }, service.average_service_time_minutes * 1000);
      });
    } else {
      Object.values(intervalsRef.current).forEach(clearInterval);
      intervalsRef.current = {};
    }

    return () => {
      Object.values(intervalsRef.current).forEach(clearInterval);
    };
  }, [autoSimulation, serveNext]);

  // Analytics: today's served tickets, average wait, busiest service
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startMs = startOfToday.getTime();

  const todaysEntries = entries.filter(
    (e) => new Date(e.created_at).getTime() >= startMs
  );
  const doneToday = todaysEntries.filter((e) => e.status === "done");
  const servedToday = doneToday.length;

  // True average wait = avg of (served_at - created_at) across done tickets today
  let avgWaitMinutes = 0;
  const waitedMs = doneToday
    .filter((e) => e.served_at)
    .map((e) => new Date(e.served_at as string).getTime() - new Date(e.created_at).getTime())
    .filter((ms) => ms >= 0);
  if (waitedMs.length > 0) {
    const totalMs = waitedMs.reduce((a, b) => a + b, 0);
    avgWaitMinutes = Math.round(totalMs / waitedMs.length / 60000);
  }

  // Busiest = service with most tickets today (any status)
  const counts = SERVICES.map((s) => ({
    service: s,
    count: todaysEntries.filter((e) => e.service_id === s.id).length,
  }));
  const busiest = counts.reduce((a, b) => (b.count > a.count ? b : a), counts[0]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <div className="flex items-center gap-3 civic-card py-3 px-5">
            <span className="text-sm text-muted-foreground">Auto Simulation</span>
            <Switch checked={autoSimulation} onCheckedChange={setAutoSimulation} />
            <span className={`text-xs font-semibold ${autoSimulation ? "text-serving" : "text-muted-foreground"}`}>
              {autoSimulation ? "ON" : "OFF"}
            </span>
          </div>
        </div>

        {/* Analytics summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="civic-card flex items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <CheckCircle2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">Served Today</p>
              <p className="now-serving-display text-3xl text-foreground">{servedToday}</p>
            </div>
          </div>
          <div className="civic-card flex items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Timer className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">Avg Wait</p>
              <p className="now-serving-display text-3xl text-foreground">{avgWaitMinutes}<span className="text-base text-muted-foreground ml-1">min</span></p>
            </div>
          </div>
          <div className="civic-card flex items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-semibold">Busiest Service</p>
              <p className="text-lg font-semibold text-foreground leading-tight">
                {busiest.count > 0 ? busiest.service.name : "—"}
              </p>
              <p className="text-xs text-muted-foreground">{busiest.count} tickets</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {SERVICES.map((service) => {
            const Icon = SERVICE_ICONS[service.icon];
            const serviceEntries = entries.filter((e) => e.service_id === service.id);
            const serving = serviceEntries.find((e) => e.status === "serving");
            const waiting = serviceEntries.filter((e) => e.status === "waiting");
            const estimatedWait = waiting.length * service.average_service_time_minutes;

            return (
              <div key={service.id} className="civic-card">
                <div className="flex items-center gap-3 mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">{service.name}</h2>
                </div>

                <div className="text-center bg-muted/60 border border-primary/20 rounded-xl p-6 mb-4">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.25em] mb-2 font-semibold">Now Serving</p>
                  <p className="now-serving-display text-6xl xl:text-7xl text-primary">
                    {serving?.queue_number || "—"}
                  </p>
                </div>

                <div className="flex gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{waiting.length} waiting</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>~{estimatedWait} min</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4 max-h-24 overflow-y-auto">
                  {waiting.map((entry) => (
                    <span
                      key={entry.id}
                      className="queue-number-display text-xs bg-queue-chip text-queue-chip-foreground px-2.5 py-1 rounded-md"
                    >
                      {entry.queue_number}
                    </span>
                  ))}
                  {waiting.length === 0 && (
                    <span className="text-xs text-muted-foreground">No one waiting</span>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => serveNext(service.id)}
                    disabled={waiting.length === 0 && !serving}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Play className="w-4 h-4" />
                    Serve Next
                  </button>
                  <button
                    onClick={() => resetQueue(service.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-destructive py-2.5 px-4 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
