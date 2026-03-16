import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  HardDrive,
  CheckCircle,
  Wrench,
  AlertTriangle,
  Download,
  Search,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Asset, AssetAssignment } from "@shared/schema";

interface AssetStats {
  total: number;
  available: number;
  assigned: number;
  maintenance: number;
  faulty: number;
  totalAssignments: number;
  byType: { name: string; value: number }[];
  byStatus: { name: string; value: number }[];
}

export default function ReportsAssetsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: stats, isLoading: statsLoading } = useQuery<AssetStats>({
    queryKey: ["/api/reports/asset-stats"],
  });

  const { data: assets, isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const { data: assignments } = useQuery<AssetAssignment[]>({
    queryKey: ["/api/asset-assignments"],
  });

  const isLoading = statsLoading || assetsLoading;

  const filteredAssets = (assets || []).filter((asset) => {
    const matchesSearch =
      !search ||
      (asset.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (asset.serialNumber || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || (asset.status || "") === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const maxTypeCount = Math.max(
    ...(stats?.byType?.map((t) => t.value) || [1]),
    1
  );

  const totalStatusCount = (stats?.byStatus || []).reduce(
    (s, b) => s + b.value,
    0
  );

  const statusColors: Record<string, string> = {
    available: "bg-green-500 dark:bg-green-400",
    assigned: "bg-blue-500 dark:bg-blue-400",
    maintenance: "bg-amber-500 dark:bg-amber-400",
    faulty: "bg-red-500 dark:bg-red-400",
    damaged: "bg-red-500 dark:bg-red-400",
  };

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case "available":
        return "default" as const;
      case "assigned":
        return "secondary" as const;
      case "maintenance":
        return "outline" as const;
      default:
        return "destructive" as const;
    }
  };

  const handleExportCSV = () => {
    const rows = filteredAssets.map((asset) => ({
      Name: asset.name,
      "Serial Number": asset.serialNumber || "",
      Type: asset.type || "",
      Status: asset.status || "",
      Location: asset.location || "",
    }));
    const headers = Object.keys(rows[0] || {});
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        headers.map((h) => `"${(r as any)[h]}"`).join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "assets-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const kpiCards = [
    {
      title: "Total Assets",
      value: stats?.total ?? 0,
      icon: HardDrive,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Available",
      value: stats?.available ?? 0,
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
    },
    {
      title: "Assigned",
      value: stats?.assigned ?? 0,
      icon: UserCheck,
      color: "text-teal-600 dark:text-teal-400",
    },
    {
      title: "Maintenance",
      value: stats?.maintenance ?? 0,
      icon: Wrench,
      color: "text-amber-600 dark:text-amber-400",
    },
    {
      title: "Faulty",
      value: stats?.faulty ?? 0,
      icon: AlertTriangle,
      color: "text-red-600 dark:text-red-400",
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            data-testid="text-asset-report-title"
          >
            Asset Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Asset allocation, status breakdown, and assignment tracking
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExportCSV}
          data-testid="button-export-csv"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiCards.map((card) => (
          <Card
            key={card.title}
            data-testid={`card-kpi-${card.title.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <span className="text-sm font-medium text-muted-foreground">
                {card.title}
              </span>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div
                  className="text-2xl font-bold"
                  data-testid={`text-kpi-${card.title.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {card.value}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview" data-testid="tabs-asset-reports">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">
            Overview
          </TabsTrigger>
          <TabsTrigger value="assignments" data-testid="tab-assignments">
            Assignments
          </TabsTrigger>
          <TabsTrigger value="all-assets" data-testid="tab-all-assets">
            All Assets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card data-testid="card-status-breakdown">
              <CardHeader className="pb-3">
                <span className="text-base font-semibold">
                  Status Breakdown
                </span>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : (
                  <div data-testid="chart-status-breakdown">
                    <div className="flex h-8 rounded-sm overflow-hidden mb-4">
                      {totalStatusCount > 0 ? (
                        (stats?.byStatus || []).map((s) => (
                          <div
                            key={s.name}
                            className={`${statusColors[s.name] || "bg-gray-400"} transition-all`}
                            style={{
                              width: `${(s.value / totalStatusCount) * 100}%`,
                            }}
                            data-testid={`segment-status-${s.name}`}
                          />
                        ))
                      ) : (
                        <div className="w-full bg-muted" />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-6">
                      {(stats?.byStatus || []).map((s) => (
                        <div
                          key={s.name}
                          className="flex items-center gap-2"
                        >
                          <div
                            className={`w-3 h-3 rounded-sm ${statusColors[s.name] || "bg-gray-400"}`}
                          />
                          <span className="text-sm text-muted-foreground capitalize">
                            {s.name}
                          </span>
                          <span
                            className="text-sm font-semibold"
                            data-testid={`text-status-count-${s.name}`}
                          >
                            {s.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-type-breakdown">
              <CardHeader className="pb-3">
                <span className="text-base font-semibold">
                  Assets by Type
                </span>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : !stats?.byType?.length ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No type data available
                  </p>
                ) : (
                  <div
                    className="space-y-3"
                    data-testid="chart-type-breakdown"
                  >
                    {stats.byType
                      .sort((a, b) => b.value - a.value)
                      .map((type) => {
                        const widthPct =
                          (type.value / maxTypeCount) * 100;
                        return (
                          <div
                            key={type.name}
                            className="flex items-center gap-3"
                          >
                            <span
                              className="text-xs text-muted-foreground w-28 shrink-0 truncate text-right"
                              title={type.name}
                            >
                              {type.name}
                            </span>
                            <div className="flex-1 h-5 rounded-sm bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-sm bg-teal-500 dark:bg-teal-400 transition-all"
                                style={{
                                  width: `${Math.max(widthPct, 2)}%`,
                                }}
                                data-testid={`bar-type-${type.name}`}
                              />
                            </div>
                            <span className="text-xs font-medium w-12 shrink-0">
                              {type.value}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-assignment-summary">
            <CardHeader className="pb-3">
              <span className="text-base font-semibold">
                Assignment Summary
              </span>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-sm bg-muted/50">
                    <div
                      className="text-2xl font-bold"
                      data-testid="text-total-assignments"
                    >
                      {stats?.totalAssignments ?? 0}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Total Assignments
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-sm bg-muted/50">
                    <div
                      className="text-2xl font-bold"
                      data-testid="text-assigned-count"
                    >
                      {stats?.assigned ?? 0}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Currently Assigned
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-sm bg-muted/50">
                    <div
                      className="text-2xl font-bold"
                      data-testid="text-available-count"
                    >
                      {stats?.available ?? 0}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Available for Assignment
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4 mt-4">
          <Card data-testid="card-assignments-table">
            <CardHeader className="pb-3">
              <span className="text-base font-semibold">
                Recent Assignments
              </span>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : !assignments?.length ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No assignments found
                </p>
              ) : (
                <Table data-testid="table-assignments">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Asset Type</TableHead>
                      <TableHead>Install Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow
                        key={assignment.id}
                        data-testid={`row-assignment-${assignment.id}`}
                      >
                        <TableCell className="font-medium">
                          #{assignment.assetId}
                        </TableCell>
                        <TableCell>
                          Customer #{assignment.customerId || "-"}
                        </TableCell>
                        <TableCell className="capitalize">
                          {assignment.assetType || "-"}
                        </TableCell>
                        <TableCell>
                          {assignment.installationDate
                            ? new Date(
                                assignment.installationDate
                              ).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              assignment.status === "active"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {assignment.status || "active"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-assets" className="space-y-4 mt-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                data-testid="input-search-assets"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                className="w-[180px]"
                data-testid="select-status-filter"
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="faulty">Faulty</SelectItem>
                <SelectItem value="damaged">Damaged</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card data-testid="card-all-assets">
            <CardContent className="pt-4">
              {isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : filteredAssets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No assets found
                </p>
              ) : (
                <Table data-testid="table-all-assets">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssets.map((asset) => (
                      <TableRow
                        key={asset.id}
                        data-testid={`row-asset-${asset.id}`}
                      >
                        <TableCell className="font-medium">
                          {asset.name}
                        </TableCell>
                        <TableCell>
                          {asset.serialNumber || "-"}
                        </TableCell>
                        <TableCell>{asset.type || "-"}</TableCell>
                        <TableCell>{asset.location || "-"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={statusBadgeVariant(
                              asset.status || ""
                            )}
                            className="text-xs capitalize"
                          >
                            {asset.status || "unknown"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
