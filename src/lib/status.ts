export const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  active: 'Active',
  found: 'Found',
  closed: 'Closed',
  reopened: 'Reopened',
  new: 'New',
  reviewed: 'Reviewed',
  confirmed: 'Confirmed',
  dismissed: 'Dismissed',
  rejected: 'Rejected',
  false_positive: 'False Positive',
  under_review: 'Under Review',
  escalated: 'Escalated',
};

export const STATUS_COLOR: Record<string, string> = {
  pending: '#F59E0B',
  active: '#EF4444',
  found: '#10B981',
  closed: '#6B7280',
  reopened: '#F59E0B',
  new: '#3B82F6',
  reviewed: '#F59E0B',
  confirmed: '#10B981',
  dismissed: '#6B7280',
  rejected: '#EF4444',
  false_positive: '#6B7280',
  under_review: '#F59E0B',
  escalated: '#EF4444',
};

export const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  pdrm_officer: 'PDRM Officer',
  patrol_unit: 'Patrol Unit',
  public_user: 'Public User',
};

export function statusLabel(status: string | null | undefined): string {
  return status ? STATUS_LABEL[status] ?? status : '—';
}

export function statusColor(status: string | null | undefined): string {
  return status ? STATUS_COLOR[status] ?? '#6B7280' : '#6B7280';
}
