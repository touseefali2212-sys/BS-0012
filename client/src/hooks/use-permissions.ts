import { useQuery } from "@tanstack/react-query";
import type { HrmPermission } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

interface PermissionsResponse {
  isAdmin: boolean;
  permissions: HrmPermission[];
  noRole?: boolean;
}

type PermAction = "canView" | "canCreate" | "canEdit" | "canDelete" | "canApprove" | "canExport" | "canPrint";

export function usePermissions() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const { data, isLoading: permsLoading } = useQuery<PermissionsResponse>({
    queryKey: ["/api/auth/permissions"],
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
    retry: false,
    queryFn: async () => {
      const res = await fetch("/api/auth/permissions", { credentials: "include" });
      if (!res.ok) return { isAdmin: false, permissions: [] };
      return res.json();
    },
  });

  const isAdmin = data?.isAdmin ?? false;
  const isLoading = authLoading || permsLoading;

  const permMap = (() => {
    const map: Record<string, HrmPermission[]> = {};
    for (const p of data?.permissions ?? []) {
      if (!map[p.module]) map[p.module] = [];
      map[p.module].push(p);
    }
    return map;
  })();

  function hasPermission(module: string, action: PermAction): boolean {
    if (isAdmin) return true;
    const entries = permMap[module];
    if (!entries || entries.length === 0) return false;
    return entries.some((p) => p[action] === true);
  }

  function canViewSubmenu(module: string, submenu: string): boolean {
    if (isAdmin) return true;
    const entries = permMap[module];
    if (!entries || entries.length === 0) return false;
    const subEntry = entries.find((p) => p.submenu === submenu);
    if (subEntry) return subEntry.canView === true;
    const moduleEntry = entries.find((p) => !p.submenu);
    return moduleEntry?.canView === true;
  }

  return {
    isAdmin,
    isLoading,
    noRole: data?.noRole ?? false,
    permissions: data?.permissions ?? [],
    canView: (module: string) => hasPermission(module, "canView"),
    canCreate: (module: string) => hasPermission(module, "canCreate"),
    canEdit: (module: string) => hasPermission(module, "canEdit"),
    canDelete: (module: string) => hasPermission(module, "canDelete"),
    canApprove: (module: string) => hasPermission(module, "canApprove"),
    canExport: (module: string) => hasPermission(module, "canExport"),
    canViewSubmenu,
  };
}
