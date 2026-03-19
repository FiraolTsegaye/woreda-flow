import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { SERVICES } from "@/lib/data";

export interface QueueRow {
  id: string;
  service_id: string;
  queue_number: string;
  status: "waiting" | "serving" | "done";
  created_at: string;
}

// Track which queue IDs belong to this user (no auth, so localStorage)
const USER_TICKETS_KEY = "woreda-user-tickets";

function getUserTicketIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(USER_TICKETS_KEY) || "[]");
  } catch {
    return [];
  }
}

function addUserTicketId(id: string) {
  const ids = getUserTicketIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem(USER_TICKETS_KEY, JSON.stringify(ids));
  }
}

export function useSupabaseQueue() {
  const [entries, setEntries] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const { data } = await supabase
      .from("queues")
      .select("*")
      .order("created_at", { ascending: true });
    if (data) setEntries(data as QueueRow[]);
    setLoading(false);
  }, []);

  // Initial fetch + real-time subscription
  useEffect(() => {
    fetchAll();

    const channel = supabase
      .channel("queue-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "queues" },
        () => {
          fetchAll();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  const joinQueue = useCallback(async (serviceId: string) => {
    const service = SERVICES.find((s) => s.id === serviceId)!;

    // Get last queue number for this service
    const { data: existing } = await supabase
      .from("queues")
      .select("queue_number")
      .eq("service_id", serviceId)
      .order("created_at", { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (existing && existing.length > 0) {
      const last = existing[0].queue_number;
      nextNumber = parseInt(last.slice(1)) + 1;
    }

    const queueNumber = `${service.prefix}${String(nextNumber).padStart(3, "0")}`;

    // Check if anyone is currently being served
    const { data: servingData } = await supabase
      .from("queues")
      .select("id")
      .eq("service_id", serviceId)
      .eq("status", "serving")
      .limit(1);

    const status = servingData && servingData.length > 0 ? "waiting" : "serving";

    const { data: inserted } = await supabase
      .from("queues")
      .insert([{ service_id: serviceId, queue_number: queueNumber, status }])
      .select()
      .single();

    if (inserted) {
      addUserTicketId(inserted.id);
    }

    return queueNumber;
  }, []);

  const serveNext = useCallback(async (serviceId: string) => {
    // Mark current serving as done
    await supabase
      .from("queues")
      .update({ status: "done" })
      .eq("service_id", serviceId)
      .eq("status", "serving");

    // Get next waiting
    const { data } = await supabase
      .from("queues")
      .select("*")
      .eq("service_id", serviceId)
      .eq("status", "waiting")
      .order("created_at", { ascending: true })
      .limit(1);

    if (data && data.length > 0) {
      await supabase
        .from("queues")
        .update({ status: "serving" })
        .eq("id", data[0].id);
    }
  }, []);

  const resetQueue = useCallback(async (serviceId: string) => {
    await supabase.from("queues").delete().eq("service_id", serviceId);
  }, []);

  const seedQueue = useCallback(async (serviceId: string, count: number) => {
    const service = SERVICES.find((s) => s.id === serviceId)!;

    const { data: existing } = await supabase
      .from("queues")
      .select("queue_number")
      .eq("service_id", serviceId)
      .order("created_at", { ascending: false })
      .limit(1);

    let startNumber = 1;
    if (existing && existing.length > 0) {
      startNumber = parseInt(existing[0].queue_number.slice(1)) + 1;
    }

    const rows = [];
    for (let i = 0; i < count; i++) {
      const num = startNumber + i;
      rows.push({
        service_id: serviceId,
        queue_number: `${service.prefix}${String(num).padStart(3, "0")}`,
        status: i === 0 ? "serving" : "waiting",
      });
    }

    await supabase.from("queues").insert(rows);
  }, []);

  // Derived data helpers
  const getServiceEntries = useCallback(
    (serviceId: string) => entries.filter((e) => e.service_id === serviceId),
    [entries]
  );

  const getNowServing = useCallback(
    (serviceId: string) =>
      entries.find((e) => e.service_id === serviceId && e.status === "serving") || null,
    [entries]
  );

  const getWaiting = useCallback(
    (serviceId: string) =>
      entries.filter((e) => e.service_id === serviceId && e.status === "waiting"),
    [entries]
  );

  const getUserTickets = useCallback(() => {
    const ids = getUserTicketIds();
    return entries.filter((e) => ids.includes(e.id));
  }, [entries]);

  return {
    entries,
    loading,
    joinQueue,
    serveNext,
    resetQueue,
    seedQueue,
    getServiceEntries,
    getNowServing,
    getWaiting,
    getUserTickets,
    refetch: fetchAll,
  };
}
