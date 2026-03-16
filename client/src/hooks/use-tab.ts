import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

function getSearchParams() {
  return window.location.search;
}

function subscribeToUrl(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener("pushstate", callback);
  window.addEventListener("replacestate", callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener("pushstate", callback);
    window.removeEventListener("replacestate", callback);
  };
}

const origPush = history.pushState.bind(history);
const origReplace = history.replaceState.bind(history);
history.pushState = function (...args: Parameters<typeof origPush>) {
  origPush(...args);
  window.dispatchEvent(new Event("pushstate"));
};
history.replaceState = function (...args: Parameters<typeof origReplace>) {
  origReplace(...args);
  window.dispatchEvent(new Event("replacestate"));
};

export function useTab(defaultTab: string) {
  const search = useSyncExternalStore(subscribeToUrl, getSearchParams, () => "");

  const tab = new URLSearchParams(search).get("tab") || defaultTab;

  const changeTab = useCallback((newTab: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", newTab);
    history.pushState({}, "", url.toString());
  }, []);

  return [tab, changeTab] as const;
}
