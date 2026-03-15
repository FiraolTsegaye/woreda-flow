import { useNavigate } from "react-router-dom";
import { useQueueStore } from "@/lib/queue-store";
import { SERVICES } from "@/lib/data";
import { SERVICE_ICONS } from "@/lib/icons";
import { Clock, Users, Hash } from "lucide-react";

const QueueStatusPage = () => {
  const navigate = useNavigate();
  const userTicket = useQueueStore((s) => s.userTicket);
  const entries = useQueueStore((s) => s.entries);

  if (!userTicket) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground text-xl mb-4">You haven't joined any queue yet</p>
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

  const service = SERVICES.find((s) => s.id === userTicket.service_id)!;
  const Icon = SERVICE_ICONS[service.icon];

  const nowServing = entries.find(
    (e) => e.service_id === userTicket.service_id && e.status === "serving"
  );

  const waitingAhead = entries.filter(
    (e) =>
      e.service_id === userTicket.service_id &&
      e.status === "waiting" &&
      e.created_at < userTicket.created_at
  ).length;

  const peopleAhead =
    userTicket.status === "serving"
      ? 0
      : userTicket.status === "done"
      ? 0
      : waitingAhead + (nowServing && nowServing.id !== userTicket.id ? 1 : 0);

  const estimatedWait = peopleAhead * service.average_service_time_minutes;

  const statusLabel =
    userTicket.status === "serving"
      ? "You're being served!"
      : userTicket.status === "done"
      ? "Service complete"
      : "Waiting";

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-muted-foreground mb-2">
            <Icon className="w-5 h-5" />
            <span className="text-sm font-medium">{service.name}</span>
          </div>
          <div
            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
              userTicket.status === "serving"
                ? "bg-serving/20 text-serving"
                : userTicket.status === "done"
                ? "bg-done/20 text-done"
                : "bg-waiting/20 text-waiting"
            }`}
          >
            {statusLabel}
          </div>
        </div>

        {/* Your number */}
        <div className="civic-card text-center mb-6">
          <p className="text-muted-foreground text-sm mb-2 uppercase tracking-wider">Your Number</p>
          <p className="queue-number-display text-6xl text-primary glow-primary">
            {userTicket.queue_number}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="civic-card text-center">
            <Hash className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Now Serving</p>
            <p className="queue-number-display text-2xl text-serving">
              {nowServing?.queue_number || "—"}
            </p>
          </div>

          <div className="civic-card text-center">
            <Users className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Ahead</p>
            <p className="queue-number-display text-2xl text-foreground">
              {peopleAhead}
            </p>
          </div>

          <div className="civic-card text-center">
            <Clock className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Est. Wait</p>
            <p className="queue-number-display text-2xl text-accent">
              {estimatedWait}m
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueStatusPage;
