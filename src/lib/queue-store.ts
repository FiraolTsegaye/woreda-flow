import { create } from "zustand";
import { QueueEntry, SERVICES } from "./data";

interface QueueState {
  entries: QueueEntry[];
  counters: Record<string, number>; // service_id -> last number
  userTickets: QueueEntry[];
  autoSimulation: boolean;

  joinQueue: (serviceId: string) => QueueEntry;
  serveNext: (serviceId: string) => void;
  resetQueue: (serviceId: string) => void;
  toggleAutoSimulation: () => void;
  getServiceQueue: (serviceId: string) => QueueEntry[];
  getNowServing: (serviceId: string) => QueueEntry | null;
  getWaitingCount: (serviceId: string) => number;
  seedQueue: (serviceId: string, count: number) => void;
}

function generateQueueNumber(prefix: string, num: number): string {
  return `${prefix}${String(num).padStart(3, "0")}`;
}

export const useQueueStore = create<QueueState>((set, get) => ({
  entries: [],
  counters: {},
  userTickets: [],
  autoSimulation: false,

  joinQueue: (serviceId: string) => {
    const service = SERVICES.find((s) => s.id === serviceId)!;
    const currentCount = get().counters[serviceId] || 0;
    const nextCount = currentCount + 1;
    const entry: QueueEntry = {
      id: crypto.randomUUID(),
      service_id: serviceId,
      queue_number: generateQueueNumber(service.prefix, nextCount),
      status: "waiting",
      created_at: Date.now(),
    };

    // If no one is being served, make this the serving one
    const hasServing = get().entries.some(
      (e) => e.service_id === serviceId && e.status === "serving"
    );

    if (!hasServing) {
      entry.status = "serving";
    }

    set((state) => ({
      entries: [...state.entries, entry],
      counters: { ...state.counters, [serviceId]: nextCount },
      userTickets: [...state.userTickets, entry],
    }));
    return entry;
  },

  seedQueue: (serviceId: string, count: number) => {
    const service = SERVICES.find((s) => s.id === serviceId)!;
    const currentCount = get().counters[serviceId] || 0;
    const newEntries: QueueEntry[] = [];

    for (let i = 1; i <= count; i++) {
      const num = currentCount + i;
      newEntries.push({
        id: crypto.randomUUID(),
        service_id: serviceId,
        queue_number: generateQueueNumber(service.prefix, num),
        status: i === 1 && !get().entries.some(e => e.service_id === serviceId && e.status === "serving") ? "serving" : "waiting",
        created_at: Date.now() + i,
      });
    }

    set((state) => ({
      entries: [...state.entries, ...newEntries],
      counters: { ...state.counters, [serviceId]: currentCount + count },
    }));
  },

  serveNext: (serviceId: string) => {
    set((state) => {
      const entries = state.entries.map((e) => {
        if (e.service_id === serviceId && e.status === "serving") {
          return { ...e, status: "done" as const };
        }
        return e;
      });

      // Find next waiting
      const nextWaiting = entries.find(
        (e) => e.service_id === serviceId && e.status === "waiting"
      );
      if (nextWaiting) {
        nextWaiting.status = "serving";
      }

      // Update user ticket status
      let userTicket = state.userTicket;
      if (userTicket) {
        const updated = entries.find((e) => e.id === userTicket!.id);
        if (updated) userTicket = updated;
      }

      return { entries, userTicket };
    });
  },

  resetQueue: (serviceId: string) => {
    set((state) => ({
      entries: state.entries.filter((e) => e.service_id !== serviceId),
      counters: { ...state.counters, [serviceId]: 0 },
      userTicket:
        state.userTicket?.service_id === serviceId ? null : state.userTicket,
    }));
  },

  toggleAutoSimulation: () => {
    set((state) => ({ autoSimulation: !state.autoSimulation }));
  },

  getServiceQueue: (serviceId: string) => {
    return get().entries.filter((e) => e.service_id === serviceId);
  },

  getNowServing: (serviceId: string) => {
    return (
      get().entries.find(
        (e) => e.service_id === serviceId && e.status === "serving"
      ) || null
    );
  },

  getWaitingCount: (serviceId: string) => {
    return get().entries.filter(
      (e) => e.service_id === serviceId && e.status === "waiting"
    ).length;
  },
}));
