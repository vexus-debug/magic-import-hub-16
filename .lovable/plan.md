# Multi-branch clinics (dental)

## What you'll get
- A new **Branches** page in the main clinic's dashboard (owners/admins only) to create, rename and view branches.
- Each branch is its own clinic with its own full dental dashboard: patients, appointments, billing, inventory, staff, reports, etc. Same features, separate data.
- A **branch switcher** at the top of the sidebar to jump between the main clinic and any branch.
- Branches cannot create further branches — only the main clinic can.
- The public clinic website (and the Website settings page) exists only for the main clinic. It is hidden in branch dashboards, and a branch's website address shows "not found".
- Staff added to a branch only see that branch; main-clinic admins see all branches in the switcher.

## How data stays separate
Every record in the app is already tied to one clinic, with access rules that check clinic membership. A branch is simply a new clinic linked to its parent, so all existing isolation applies automatically — nothing spills between branches.

## Technical details
- **Database migration**
  - `organizations.parent_org_id uuid null` referencing `organizations(id)` (on delete cascade) + index.
  - Validation trigger: parent must itself have no parent (only one level); clinic_type inherited from parent.
  - `create_branch(p_parent_org_id, p_name, p_slug, p_phone, p_address, p_email)` SECURITY DEFINER: checks `get_org_role(auth.uid(), parent) in ('owner','admin')` and parent is a main clinic; inserts org, adds caller as `owner` in `org_members`; also adds the parent's owners as `owner`. Grant execute to authenticated only.
  - `list_org_branches(p_org_id)` for the Branches page / switcher (members of the parent only).
  - Public website lookups (public site / shop RPCs or policies) additionally require `parent_org_id is null`.
- **Frontend**
  - `useAuth` membership fetch includes `parent_org_id`; `useOrg` exposes `isBranch`, `mainOrgId`.
  - New `BranchesPage` at `/clinic/:slug/branches`, sidebar link shown only when `!isBranch` and role is owner/admin.
  - `BranchSwitcher` in `DashboardLayout` sidebar header: lists main + branches, navigates to `/clinic/<slug>/dashboard`; React Query cache keyed by org so no stale data shows after switch.
  - Hide Website settings / Shop management nav and guard those routes when `isBranch`; `PublicClinicSite`/shop pages render not-found for branches.
