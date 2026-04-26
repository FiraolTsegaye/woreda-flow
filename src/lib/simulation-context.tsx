import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { SERVICES } from "@/lib/data";

const STORAGE_KEY = "woreda-auto-simulation";

// Demo cadence: 1 simulated minute = 1 real second. Change to 60_000 for true minutes.
const MS_PER_SIMULATED_MINUTE = 1000;

interface SimulationContextValue {
  autoSimulation: boolean;
  setAutoSimulation: (on: boolean) => void;
}

const SimulationContext = createContext<SimulationContextValue | undefined>(undefined);

interface ServingRow {
  id: string;
  service_id: string;
  created_at: string;
}

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [autoSimulation, setAutoSimulationState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const timeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const setAutoSimulation = useCallback((on: boolean) => {
    setAutoSimulationState(on);
    try {
      localStorage.setItem(STORAGE_KEY, String(on));
    } catch {
      // ignore
    }
  }, []);

  // Advance one service: mark current serving as done, promote next waiting.
  const advanceService = useCallback(async (serviceId: string) => {
    await supabase
      .from("queues")
      .update({ status: "done", served_at: new Date().toISOString() })
      .eq("service_id", serviceId)
      .eq("status", "serving");

    const { data } = await supabase
      .from("queues")
      .select("id")
      .eq("service_id", serviceId)
      .eq("status", "waiting")
      .order("created_at", { ascending: true })
      .limit(1);

    if (data && data.length > 0) {
      await supabase.from("queues").update({ status: "serving" }).eq("id", data[0].id);
    }
  }, []);

  // Re-plan all per-service timeouts based on current DB state.
  const reschedule = useCallback(async () => {
    // Clear any pending timeouts
    Object.values(timeoutsRef.current).forEach(clearTimeout);
    timeoutsRef.current = {};

    if (!autoSimulation) return;

    const { data } = await supabase
      .from("queues")
      .select("id, service_id, created_at")
      .eq("status", "serving");

    const servingByService: Record<string, ServingRow> = {};
    (data as ServingRow[] | null)?.forEach((row) => {
      servingByService[row.service_id] = row;
    });

    const now = Date.now();

    SERVICES.forEach((service) => {
      const serving = servingByService[service.id];
      const serviceMs = service.average_service_time_minutes * MS_PER_SIMULATED_MINUTE;

      if (serving) {
        // Schedule based on when this ticket started being served.
        const startedAt = new Date(serving.created_at).getTime();
        const elapsed = now - startedAt;
        const remaining = Math.max(0, serviceMs - elapsed);
        timeoutsRef.current[service.id] = setTimeout(() => {
          advanceService(service.id);
          // The realtime subscription will trigger reschedule() again.
        }, remaining);
      }
      // If no one is being served, do nothing — promotion happens when a ticket joins,
      // and the realtime subscription will then schedule its completion.
    });
  }, [autoSimulation, advanceService]);

  // Subscribe to queue changes so we can re-plan whenever DB state shifts.
  useEffect(() => {
    if (!autoSimulation) {
      Object.values(timeoutsRef.current).forEach(clearTimeout);
      timeoutsRef.current = {};
      return;
    }

    reschedule();

    const channel = supabase
      .channel("simulation-queue-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queues" },
        () => {
          reschedule();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      Object.values(timeoutsRef.current).forEach(clearTimeout);
      timeoutsRef.current = {};
    };
  }, [autoSimulation, reschedule]);

  return (
    <SimulationContext.Provider value={{ autoSimulation, setAutoSimulation }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error("useSimulation must be used within SimulationProvider");
  return ctx;
}
