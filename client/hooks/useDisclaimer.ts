import { useCallback, useEffect, useState } from "react";

import { acceptDisclaimer, hasAcceptedDisclaimer } from "@/lib/storage";

export function useDisclaimer() {
  const [accepted, setAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    hasAcceptedDisclaimer()
      .then((value) => {
        if (!cancelled) setAccepted(value);
      })
      .catch((error) => {
        console.error("Error reading disclaimer acknowledgement:", error);
        if (!cancelled) setAccepted(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const accept = useCallback(async () => {
    await acceptDisclaimer();
    setAccepted(true);
  }, []);

  return { accepted, accept };
}
