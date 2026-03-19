import { useNavigate } from "react-router-dom";
import { useQueueStore } from "@/lib/queue-store";
import { SERVICES } from "@/lib/data";
import { SERVICE_ICONS } from "@/lib/icons";
import { Clock, Users, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const QueueStatusPage = () => {
  const navigate = useNavigate();
  const userTickets = useQueueStore((s) => s.userTickets);
  const entries = useQueueStore((s) => s.entries);

  // Sync user ticket statuses with main entries
  const syncedTickets = userTickets.map((t) => {
    const current = entries.find((e) => e.id === t.id);
    return current || t;
  });

  // Show active first, then completed
  const activeTickets = syncedTickets.filter((t) => t.status !== "done");
  const completedTickets = syncedTickets.filter((t) => t.status === "done");

  if (syncedTickets.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground text-xl mb-4">You haven't joined any queues yet.</p>
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

  const renderTicket = (ticket: typeof syncedTickets[0]) => {
    const service = SERVICES.find((s) => s.id === ticket.service_id)!;
    if (!service) return null;
    const Icon = SERVICE_ICONS[service.icon];

    const nowServing = entries.find(
      (e) => e.service_id === ticket.service_id && e.status === "serving"
    );

    const isServing = ticket.status === "serving";
    const isDone = ticket.status === "done";

    const waitingAhead = isDone || isServing
      ? 0
      : entries.filter(
          (e) =>
            e.service_id === ticket.service_id &&
            e.status === "waiting" &&
            e.created_at < ticket.created_at
        ).length;

    const peopleAhead = isServing || isDone
      ? 0
      : waitingAhead + (nowServing && nowServing.id !== ticket.id ? 1 : 0);

    const estimatedWait = Math.max(0, peopleAhead * service.average_service_time_minutes);

    const statusConfig = isDone
      ? { label: "⚪ Completed", classes: "bg-muted text-muted-foreground" }
      : isServing
        ? { label: "🟢 Being Served", classes: "bg-serving/20 text-serving" }
        : { label: "🟡 Waiting", classes: "bg-waiting/20 text-waiting" };

    return (
      <div key={ticket.id} className={`civic-card ${isDone ? "opacity-60" : "border-primary/30"}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">{service.name}</span>
          </div>
          <Badge className={statusConfig.classes}>{statusConfig.label}</Badge>
        </div>

        <p className="text-muted-foreground text-sm mb-2 uppercase tracking-wider">Your Number</p>
        <p className="now-serving-display text-5xl text-primary mb-4">
          {ticket.queue_number}
        </p>

        {!isDone && (
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
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-foreground">My Queues</h1>
        {activeTickets.map(renderTicket)}
        {completedTickets.length > 0 && (
          <>
            <h2 className="text-lg font-semibold text-muted-foreground pt-4">Completed</h2>
            {completedTickets.map(renderTicket)}
          </>
        )}
      </div>
    </div>
  );
};

export default QueueStatusPage;
