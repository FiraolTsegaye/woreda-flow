import { create } from "zustand";
import { persist } from "zustand/middleware";
import { QueueEntry, SERVICES } from "./data";

interface QueueState {
  entries: QueueEntry[];
  counters: Record<string, number>;
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

export const useQueueStore = create<QueueState>()(
  persist(
    (set, get) => ({
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

      // Update user tickets status
      const userTickets = state.userTickets.map((t) => {
        const updated = entries.find((e) => e.id === t.id);
        return updated || t;
      });

      return { entries, userTickets };
    });
  },

  resetQueue: (serviceId: string) => {
    set((state) => ({
      entries: state.entries.filter((e) => e.service_id !== serviceId),
      counters: { ...state.counters, [serviceId]: 0 },
      userTickets: state.userTickets.filter((t) => t.service_id !== serviceId),
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
}),
    {
      name: "woreda-queue-storage",
      partialize: (state) => ({
        entries: state.entries,
        counters: state.counters,
        userTickets: state.userTickets,
      }),
    }
  )
);
