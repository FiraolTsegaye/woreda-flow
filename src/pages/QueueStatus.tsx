import { useNavigate } from "react-router-dom";
import { useQueueStore } from "@/lib/queue-store";
import { SERVICES } from "@/lib/data";
import { SERVICE_ICONS } from "@/lib/icons";
import { Clock, Users, Hash } from "lucide-react";

const QueueStatusPage = () => {
  const navigate = useNavigate();
  const userTickets = useQueueStore((s) => s.userTickets);
  const entries = useQueueStore((s) => s.entries);

  const activeTickets = userTickets.filter((t) => t.status !== "done");

  if (activeTickets.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground text-xl mb-4">You have not joined any queues yet.</p>
          <button
            onClick={() => navigate("/services")}
            className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
          >
            Browse Services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-foreground">My Queues</h1>

        {activeTickets.map((ticket) => {
          const service = SERVICES.find((s) => s.id === ticket.service_id)!;
          const Icon = SERVICE_ICONS[service.icon];

          const nowServing = entries.find(
            (e) => e.service_id === ticket.service_id && e.status === "serving"
          );

          const waitingAhead = entries.filter(
            (e) =>
              e.service_id === ticket.service_id &&
              e.status === "waiting" &&
              e.created_at < ticket.created_at
          ).length;

          const peopleAhead =
            ticket.status === "serving"
              ? 0
              : waitingAhead + (nowServing && nowServing.id !== ticket.id ? 1 : 0);

          const estimatedWait = peopleAhead * service.average_service_time_minutes;

          const statusLabel =
            ticket.status === "serving"
              ? "You're being served!"
              : "Waiting";

          return (
            <div key={ticket.id} className="civic-card border-primary/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-foreground">{service.name}</span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    ticket.status === "serving"
                      ? "bg-serving/20 text-serving"
                      : "bg-waiting/20 text-waiting"
                  }`}
                >
                  {statusLabel}
                </span>
              </div>

              <p className="text-muted-foreground text-sm mb-2 uppercase tracking-wider">Your Number</p>
              <p className="now-serving-display text-5xl text-primary mb-4">
                {ticket.queue_number}
              </p>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <Hash className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground uppercase">Now Serving</p>
                  <p className="queue-number-display text-xl text-serving">
                    {nowServing?.queue_number || "—"}
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <Users className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground uppercase">Ahead</p>
                  <p className="queue-number-display text-xl text-foreground">
                    {peopleAhead}
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <Clock className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground uppercase">Est. Wait</p>
                  <p className="queue-number-display text-xl text-accent">
                    {estimatedWait} min
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QueueStatusPage;
