import { useCallback, useEffect, useRef, useState } from "react";

// Loads data now, then again on a timer while the tab is visible.
// Only the newest request can update state, so a slow response
// can't overwrite a newer one
export function usePolledData(fetchData, intervalMs) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const latestRequest = useRef(0);

  const reload = useCallback(() => {
    latestRequest.current += 1;
    const request = latestRequest.current;

    return fetchData()
      .then((result) => {
        if (request === latestRequest.current) {
          setData(result);
          setError(null);
        }
      })
      .catch((err) => {
        if (request === latestRequest.current) {
          setError(err);
        }
        console.error(err);
      });
  }, [fetchData]);

  useEffect(() => {
    reload();

    const timer = setInterval(() => {
      if (!document.hidden) {
        reload();
      }
    }, intervalMs);

    return () => {
      clearInterval(timer);
      // Ignore any response that arrives after this
      latestRequest.current += 1;
    };
  }, [reload, intervalMs]);

  return { data, error, reload };
}
