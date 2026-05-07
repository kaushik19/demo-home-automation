import { useEffect } from "react";
import { api } from "@/services";
import type { RealtimeEvent } from "@/types";

/** Subscribe to the realtime event stream. */
export function useRealtime(handler: (e: RealtimeEvent) => void) {
  useEffect(() => {
    const unsub = api.subscribe(handler);
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
