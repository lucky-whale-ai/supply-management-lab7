import { useEffect, useState } from "react";
import { errorMessage, loadOptions } from "../api.js";

export function useLookups(resources) {
  const [lookups, setLookups] = useState({});
  const [lookupError, setLookupError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(resources.length > 0);
  useEffect(() => {
    let active = true;
    setLookupLoading(resources.length > 0);
    setLookupError("");
    Promise.all(resources.map(async (resource) => [resource, await loadOptions(resource)]))
      .then((values) => { if (active) setLookups(Object.fromEntries(values)); })
      .catch((error) => { if (active) setLookupError(errorMessage(error)); })
      .finally(() => { if (active) setLookupLoading(false); });
    return () => { active = false; };
  }, [resources]);
  return { lookups, lookupError, lookupLoading };
}
