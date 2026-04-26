import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { SERVICES } from "@/lib/data";

const STORAGE_KEY = "woreda-auto-simulation"; // legacy global flag (kept for migration)
const PER_SERVICE_STORAGE_KEY = "woreda-auto-simulation-services";

// Demo cadence: 1 simulated minute = 1 real second. Change to 60_000 for true minutes.
const MS_PER_SIMULATED_MINUTE = 1000;

interface SimulationContextValue {
  /** True if at least one service has auto simulation on. */
  autoSimulation: boolean;
  /** Turn auto simulation on/off for ALL services at once. */
  setAutoSimulation: (on: boolean) => void;
  /** Per-service map of serviceId -> enabled. */
  serviceFlags: Record<string, boolean>;
  /** Toggle a single service. */
  setServiceAuto: (serviceId: string, on: boolean) => void;
  isServiceAuto: (serviceId: string) => boolean;
}

const SimulationContext = createContext<SimulationContextValue | undefined>(undefined);

interface ServingRow {
  id: string;
  service_id: string;
  created_at: string;
}

function loadInitialFlags(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(PER_SERVICE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, boolean>;
      // Ensure every known service has an entry.
      const next: Record<string, boolean> = {};
      SERVICES.forEach((s) => {
        next[s.id] = !!parsed[s.id];
      });
      return next;
    }
    // Migrate from legacy global flag.
    const legacy = localStorage.getItem(STORAGE_KEY) === "true";
    const next: Record<string, boolean> = {};
    SERVICES.forEach((s) => {
      next[s.id] = legacy;
    });
    return next;
  } catch {
    const next: Record<string, boolean> = {};
    SERVICES.forEach((s) => {
      next[s.id] = false;
    });
    return next;
  }
}

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [serviceFlags, setServiceFlags] = useState<Record<string, boolean>>(loadInitialFlags);

  const timeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Keep latest flags accessible inside async callbacks/subscriptions.
  const flagsRef = useRef(serviceFlags);
  useEffect(() => {
    flagsRef.current = serviceFlags;
    try {
      localStorage.setItem(PER_SERVICE_STORAGE_KEY, JSON.stringify(serviceFlags));
    } catch {
      // ignore
    }
  }, [serviceFlags]);

  const autoSimulation = useMemo(
    () => Object.values(serviceFlags).some(Boolean),
    [serviceFlags]
  );

  const setServiceAuto = useCallback((serviceId: string, on: boolean) => {
    setServiceFlags((prev) => ({ ...prev, [serviceId]: on }));
  }, []);

  const isServiceAuto = useCallback(
    (serviceId: string) => !!flagsRef.current[serviceId],
    []
  );

  const setAutoSimulation = useCallback((on: boolean) => {
    setServiceFlags(() => {
      const next: Record<string, boolean> = {};
      SERVICES.forEach((s) => {
        next[s.id] = on;
      });
      return next;
    });
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

  // Re-plan all per-service timeouts based on current DB state and per-service flags.
  const reschedule = useCallback(async () => {
    // Clear any pending timeouts
    Object.values(timeoutsRef.current).forEach(clearTimeout);
    timeoutsRef.current = {};

    const flags = flagsRef.current;
    const enabledServiceIds = SERVICES.filter((s) => flags[s.id]).map((s) => s.id);
    if (enabledServiceIds.length === 0) return;

    const { data } = await supabase
      .from("queues")
      .select("id, service_id, created_at")
      .eq("status", "serving")
      .in("service_id", enabledServiceIds);

    const servingByService: Record<string, ServingRow> = {};
    (data as ServingRow[] | null)?.forEach((row) => {
      servingByService[row.service_id] = row;
    });

    const now = Date.now();

    SERVICES.forEach((service) => {
      if (!flags[service.id]) return;
      const serving = servingByService[service.id];
      const serviceMs = service.average_service_time_minutes * MS_PER_SIMULATED_MINUTE;

      if (serving) {
        const startedAt = new Date(serving.created_at).getTime();
        const elapsed = now - startedAt;
        const remaining = Math.max(0, serviceMs - elapsed);
        timeoutsRef.current[service.id] = setTimeout(() => {
          advanceService(service.id);
          // Realtime subscription will trigger reschedule() again.
        }, remaining);
      }
    });
  }, [advanceService]);

  // Subscribe to queue changes and re-plan whenever flags or DB state shift.
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
  }, [autoSimulation, reschedule, serviceFlags]);

  return (
    <SimulationContext.Provider
      value={{ autoSimulation, setAutoSimulation, serviceFlags, setServiceAuto, isServiceAuto }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error("useSimulation must be used within SimulationProvider");
  return ctx;
}
