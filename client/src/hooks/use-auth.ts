import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to check auth");
      return res.json();
    },
  });

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    queryClient.setQueryData(["/api/auth/me"], null);
  }, [queryClient]);

  const refreshAuth = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
  }, [queryClient]);

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    logout,
    refreshAuth,
  };
}
