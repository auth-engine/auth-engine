"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { ContactLead } from "@/lib/types";
import {
    Search,
    Clock,
    Loader2,
    Mail,
    Building2,
    Phone,
} from "lucide-react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState } from "react";

export default function PlatformLeadsPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const { data: leads, isLoading } = useQuery<ContactLead[]>({
        queryKey: ["platformContactLeads"],
        queryFn: async () => {
            const { data } = await apiClient.get<ContactLead[]>("/platform/contact-leads");
            return data;
        },
    });

    const filteredLeads = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return leads ?? [];

        return (leads ?? []).filter((lead) => {
            const fullName = `${lead.first_name} ${lead.last_name}`.toLowerCase();
            return (
                fullName.includes(term) ||
                lead.email?.toLowerCase().includes(term) ||
                lead.company?.toLowerCase().includes(term) ||
                lead.phone?.toLowerCase().includes(term) ||
                lead.job_title?.toLowerCase().includes(term) ||
                lead.interest?.toLowerCase().includes(term) ||
                lead.country?.toLowerCase().includes(term) ||
                lead.message?.toLowerCase().includes(term)
            );
        });
    }, [leads, searchTerm]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Contact Leads</h1>
                    <p className="text-muted-foreground mt-1">
                        Inbound requests from the marketing contact form.
                    </p>
                </div>
                <Badge variant="outline" className="rounded-xl px-3 py-1">
                    {filteredLeads.length} leads
                </Badge>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, email, or company..."
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
                                <TableHead>Contact</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Interest</TableHead>
                                <TableHead>Submitted</TableHead>
                                <TableHead>Message</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLeads.map((lead) => (
                                <TableRow key={lead.id} className="group transition-colors">
                                    <TableCell>
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold">
                                                {lead.first_name} {lead.last_name}
                                            </p>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Mail className="h-3 w-3" />
                                                <a
                                                    href={`mailto:${lead.email}`}
                                                    className="hover:text-foreground transition-colors"
                                                >
                                                    {lead.email}
                                                </a>
                                            </div>
                                            {lead.phone && (
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Phone className="h-3 w-3" />
                                                    {lead.phone}
                                                </div>
                                            )}
                                            {lead.job_title && (
                                                <p className="text-[10px] text-muted-foreground">
                                                    {lead.job_title}
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-sm font-medium">
                                                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                                {lead.company}
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {lead.company_size && (
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {lead.company_size}
                                                    </Badge>
                                                )}
                                                {lead.country && (
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {lead.country}
                                                    </Badge>
                                                )}
                                                {lead.mau && (
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {lead.mau} MAU
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {lead.interest ? (
                                            <Badge
                                                variant="outline"
                                                className="text-primary border-primary/20 bg-primary/5"
                                            >
                                                {lead.interest}
                                            </Badge>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs whitespace-nowrap">
                                            <Clock className="h-3 w-3" />
                                            {new Date(lead.created_at).toLocaleString()}
                                        </div>
                                        {lead.ip_address && (
                                            <p className="text-[10px] text-muted-foreground font-mono mt-1">
                                                {lead.ip_address}
                                            </p>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <p className="text-xs text-muted-foreground max-w-[240px] line-clamp-3">
                                            {lead.message || "—"}
                                        </p>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredLeads.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        {searchTerm.trim()
                                            ? "No leads match your search."
                                            : "No contact leads yet."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </Card>
        </div>
    );
}
