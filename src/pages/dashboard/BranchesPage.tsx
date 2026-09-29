import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GitBranch, Plus, ArrowRight, MapPin, Phone, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { useAuth } from "@/hooks/useAuth";
import { slugify } from "@/lib/createClinic";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

type Branch = { id: string; name: string; slug: string; phone: string | null; address: string | null; email: string | null; created_at: string };

export default function BranchesPage() {
  const { currentOrg, isBranch, basePath } = useOrg();
  const { refetchUserData } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", email: "" });

  const orgId = currentOrg?.org_id;
  const canManage = currentOrg?.role === "owner" || currentOrg?.role === "admin";

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ["org-branches", orgId],
    enabled: !!orgId && !isBranch && canManage,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("list_org_branches", { p_org_id: orgId });
      if (error) throw error;
      return (data || []) as Branch[];
    },
  });

  if (currentOrg && (isBranch || !canManage)) return <Navigate to={`${basePath}/dashboard`} replace />;

  const createBranch = async () => {
    if (!orgId || !form.name.trim()) return;
    setSaving(true);
    try {
      const slug = `${slugify(form.name) || "branch"}-${Math.random().toString(36).slice(2, 6)}`;
      const { error } = await (supabase as any).rpc("create_branch", {
        p_parent_org_id: orgId,
        p_name: form.name.trim(),
        p_slug: slug,
        p_phone: form.phone || null,
        p_address: form.address || null,
        p_email: form.email || null,
      });
      if (error) throw error;
      await refetchUserData();
      qc.invalidateQueries({ queryKey: ["org-branches", orgId] });
      toast.success("Branch created");
      setForm({ name: "", phone: "", address: "", email: "" });
      setOpen(false);
    } catch (e: any) {
      toast.error(e?.message || "Could not create branch");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Branches" description="Create and manage your clinic branches. Each branch has its own dashboard and records.">
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />New branch</Button>
      </PageHeader>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : branches.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <GitBranch className="h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No branches yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">Add a branch to run another location with its own patients, staff, billing and inventory.</p>
          <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Create first branch</Button>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((b) => (
            <Card key={b.id}><CardContent className="space-y-3 p-5">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-primary" />
                <h3 className="truncate font-semibold">{b.name}</h3>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                {b.address && <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{b.address}</p>}
                {b.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{b.phone}</p>}
                {b.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{b.email}</p>}
              </div>
              <Button variant="outline" className="w-full" onClick={() => navigate(`/clinic/${b.slug}/dashboard`)}>
                Open dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent></Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New branch</DialogTitle>
            <DialogDescription>The branch gets its own dashboard. Its records are kept separate from other branches.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Branch name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Lekki Branch" /></div>
            <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={createBranch} disabled={saving || !form.name.trim()}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create branch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
