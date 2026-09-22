"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { AuditLogEntry } from "@/lib/types";
import { useAuthStore } from "@/stores/auth-store";
import {
    Search,
    Clock,
    Activity,
    ArrowRight,
    Loader2
} from "lucide-react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState } from "react";
import { normalizeAuditLogs } from "@/lib/audit";
import { AuditLogDetailsDialog } from "@/components/audit/audit-log-details-dialog";

export default function TenantAuditPage() {
    const { activeTenantId } = useAuthStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Fetch Tenant Audit Logs
    const { data: logs, isLoading } = useQuery<AuditLogEntry[]>({
        queryKey: ["tenantAudit", activeTenantId],
        queryFn: async () => {
            const { data } = await apiClient.get<AuditLogEntry[]>(`/tenants/${activeTenantId}/audit-logs`);
            return normalizeAuditLogs(data);
        },
        enabled: !!activeTenantId,
    });

    const getActionColor = (action: string) => {
        if (action.includes("create") || action.includes("enroll")) return "text-emerald-500 border-emerald-500/20 bg-emerald-500/5";
        if (action.includes("delete") || action.includes("remove") || action.includes("fail")) return "text-destructive border-destructive/20 bg-destructive/5";
        if (action.includes("update") || action.includes("change")) return "text-blue-500 border-blue-500/20 bg-blue-500/5";
        return "text-muted-foreground border-muted bg-muted/5";
    };

    const filteredLogs = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return logs ?? [];

        return (logs ?? []).filter((log) =>
            log.action?.toLowerCase().includes(term) ||
            log.actor_id?.toLowerCase().includes(term) ||
            log.ip_address?.toLowerCase().includes(term) ||
            log.resource?.toLowerCase().includes(term) ||
            log.resource_type?.toLowerCase().includes(term) ||
            log.resource_id?.toLowerCase().includes(term) ||
            log.user_agent?.toLowerCase().includes(term)
        );
    }, [logs, searchTerm]);

    if (!activeTenantId) return <div className="p-8 text-center">Select an organization.</div>;

    const openDetails = (log: AuditLogEntry) => {
        setSelectedLog(log);
        setIsDetailsOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
                    <p className="text-muted-foreground mt-1">
                        History of events within this organization.
                    </p>
                </div>
                <Button variant="outline" className="rounded-xl">
                    <Activity className="mr-2 h-4 w-4" /> Live Stream
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search logs by action, user, or IP..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card className="shadow-sm border-muted overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>Event</TableHead>
                                <TableHead>Actor / Subject</TableHead>
                                <TableHead>Network</TableHead>
                                <TableHead>Timestamp</TableHead>
                                <TableHead className="text-right">Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLogs?.map((log) => (
                                <TableRow key={log.id} className="group transition-colors">
                                    <TableCell>
                                        <div className="space-y-1">
                                            <Badge variant="outline" className={getActionColor(log.action)}>
                                                {log.action.replace(/_/g, ' ')}
                                            </Badge>
                                            {(log.resource ?? log.resource_type) && (
                                                <p className="text-[10px] text-muted-foreground lowercase ml-1">
                                                    on {log.resource ?? log.resource_type}
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold truncate max-w-[150px]">{log.actor_id}</p>
                                            <p className="text-[10px] text-muted-foreground font-mono">Organization Scope</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1 text-muted-foreground">
                                            <p className="text-xs font-mono">{log.ip_address || "local"}</p>
                                            <p className="text-[9px] truncate max-w-[120px]">{log.user_agent || "n/a"}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                                            <Clock className="h-3 w-3" />
                                            {new Date(log.created_at).toLocaleString()}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 opacity-70 group-hover:opacity-100 transition-opacity"
                                            title="View details"
                                            onClick={() => openDetails(log)}
                                        >
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredLogs.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        {searchTerm.trim()
                                            ? "No audit logs match your search."
                                            : "No audit logs found for this organization."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </Card>

            <AuditLogDetailsDialog
                log={selectedLog}
                open={isDetailsOpen}
                onOpenChange={(open) => {
                    setIsDetailsOpen(open);
                    if (!open) setSelectedLog(null);
                }}
                getActionColor={getActionColor}
            />
        </div>
    );
}
