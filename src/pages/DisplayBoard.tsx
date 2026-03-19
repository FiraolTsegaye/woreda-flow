import { useQueueStore } from "@/lib/queue-store";
import { SERVICES } from "@/lib/data";
import { SERVICE_ICONS } from "@/lib/icons";

const DisplayBoard = () => {
  const entries = useQueueStore((s) => s.entries);

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-3xl font-bold text-center text-foreground mb-8 tracking-tight">
        WOREDA SERVICE — QUEUE DISPLAY
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {SERVICES.map((service) => {
          const Icon = SERVICE_ICONS[service.icon];
          const serviceEntries = entries.filter((e) => e.service_id === service.id);
          const serving = serviceEntries.find((e) => e.status === "serving");
          const waiting = serviceEntries.filter((e) => e.status === "waiting");
          const nextUp = waiting.slice(0, 3);

          return (
            <div key={service.id} className="civic-card">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                <Icon className="w-6 h-6 text-primary" />
                <h2 className="text-lg font-bold text-foreground uppercase tracking-wider">
                  {service.name}
                </h2>
              </div>

              <div className="text-center mb-6 bg-muted/50 border border-primary/20 rounded-xl py-8">
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] mb-3 font-semibold">
                  Now Serving
                </p>
                <p className="now-serving-display text-8xl lg:text-9xl text-primary">
                  {serving?.queue_number || "—"}
                </p>
              </div>

              {nextUp.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3 text-center">
                    Next
                  </p>
                  <div className="flex justify-center gap-3">
                    {nextUp.map((entry) => (
                      <span
                        key={entry.id}
                        className="queue-number-display text-xl text-accent bg-muted px-3 py-1.5 rounded-md"
                      >
                        {entry.queue_number}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!serving && nextUp.length === 0 && (
                <p className="text-center text-muted-foreground text-sm">No active queue</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DisplayBoard;
