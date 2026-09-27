import { useSyncExternalStore } from "react";

const ROUTE_EVENT = "red-contract-route";
export function navigateTo(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new Event(ROUTE_EVENT));
}
function subscribe(listener: () => void) {
  window.addEventListener(ROUTE_EVENT, listener);
  window.addEventListener("popstate", listener);
  return () => {
    window.removeEventListener(ROUTE_EVENT, listener);
    window.removeEventListener("popstate", listener);
  };
}
export const usePathname = () => useSyncExternalStore(subscribe, () => window.location.pathname);
