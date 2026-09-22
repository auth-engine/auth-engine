import { AuditLogEntry } from "@/lib/types";

type RawAuditLog = AuditLogEntry & { _id?: string };

export function normalizeAuditLog(log: RawAuditLog): AuditLogEntry {
    const id =
        log.id ??
        log._id ??
        `${log.action}-${log.created_at}-${log.actor_id ?? "unknown"}`;

    return { ...log, id };
}

export function normalizeAuditLogs(logs: RawAuditLog[]): AuditLogEntry[] {
    return logs.map(normalizeAuditLog);
}
