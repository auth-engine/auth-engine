"use client";

import { AuditLogEntry } from "@/lib/types";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

function getResourceLabel(log: AuditLogEntry) {
    return log.resource ?? log.resource_type;
}

function getMetadata(log: AuditLogEntry) {
    const data = log.metadata ?? log.details;
    if (!data || Object.keys(data).length === 0) return null;
    return data;
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
    if (!value) return null;

    return (
        <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="text-sm break-all">{value}</p>
        </div>
    );
}

interface AuditLogDetailsDialogProps {
    log: AuditLogEntry | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    getActionColor: (action: string) => string;
}

export function AuditLogDetailsDialog({
    log,
    open,
    onOpenChange,
    getActionColor,
}: AuditLogDetailsDialogProps) {
    if (!log) return null;

    const metadata = getMetadata(log);
    const resource = getResourceLabel(log);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
                    <DialogTitle>Audit Log Details</DialogTitle>
                    <DialogDescription>
                        Full event record for this audit entry.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 px-6 pb-6 overflow-y-auto flex-1 min-h-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={getActionColor(log.action)}>
                            {log.action.replace(/_/g, " ")}
                        </Badge>
                        {log.status && <Badge variant="secondary">{log.status}</Badge>}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <DetailRow label="Log ID" value={log.id} />
                        <DetailRow
                            label="Timestamp"
                            value={new Date(log.created_at).toLocaleString()}
                        />
                        <DetailRow label="Actor ID" value={log.actor_id} />
                        <DetailRow label="Target User ID" value={log.target_user_id} />
                        <DetailRow label="Tenant ID" value={log.tenant_id} />
                        <DetailRow label="Resource" value={resource} />
                        <DetailRow label="Resource ID" value={log.resource_id} />
                        <DetailRow label="IP Address" value={log.ip_address} />
                    </div>

                    {log.user_agent && <DetailRow label="User Agent" value={log.user_agent} />}

                    {metadata && (
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Metadata</p>
                            <pre className="text-xs bg-muted/50 rounded-lg p-3 overflow-x-auto font-mono">
                                {JSON.stringify(metadata, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
