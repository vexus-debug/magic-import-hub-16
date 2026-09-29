import { useNavigate } from "react-router-dom";
import { Building2, Check, ChevronsUpDown, GitBranch } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useOrg } from "@/hooks/useOrg";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Lets users jump between the main clinic and its branches they belong to. */
export function BranchSwitcher({ collapsed }: { collapsed?: boolean }) {
  const { orgMemberships } = useAuth();
  const { currentOrg, mainOrgId } = useOrg();
  const navigate = useNavigate();

  if (!currentOrg || !mainOrgId) return null;

  const family = orgMemberships.filter(
    (m) => m.org_id === mainOrgId || m.parent_org_id === mainOrgId,
  );
  if (family.length < 2) return null;

  const main = family.find((m) => m.org_id === mainOrgId);
  const branches = family.filter((m) => m.parent_org_id === mainOrgId);
  const isMain = currentOrg.org_id === mainOrgId;

  const go = (slug: string) => {
    if (slug !== currentOrg.org_slug) navigate(`/clinic/${slug}/dashboard`);
  };

  return (
    <div className="px-2 pt-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/40 px-2.5 py-2 text-left text-sidebar-foreground hover:bg-sidebar-accent"
            aria-label="Switch branch"
          >
            {isMain ? <Building2 className="h-4 w-4 shrink-0" /> : <GitBranch className="h-4 w-4 shrink-0" />}
            {!collapsed && (
              <>
                <span className="flex min-w-0 flex-col">
                  <span className="text-[10px] uppercase tracking-wide text-sidebar-foreground/50">
                    {isMain ? "Main clinic" : "Branch"}
                  </span>
                  <span className="truncate text-xs font-semibold">{currentOrg.org_name}</span>
                </span>
                <ChevronsUpDown className="ml-auto h-3.5 w-3.5 opacity-60" />
              </>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60">
          {main && (
            <>
              <DropdownMenuLabel className="text-xs">Main clinic</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => go(main.org_slug)}>
                <Building2 className="mr-2 h-4 w-4" />
                <span className="truncate">{main.org_name}</span>
                {main.org_id === currentOrg.org_id && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuLabel className="text-xs">Branches</DropdownMenuLabel>
          {branches.map((b) => (
            <DropdownMenuItem key={b.org_id} onClick={() => go(b.org_slug)}>
              <GitBranch className="mr-2 h-4 w-4" />
              <span className="truncate">{b.org_name}</span>
              {b.org_id === currentOrg.org_id && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
