import type { Department, Role, User, UserStatus } from '@/types';
import { generateId, now } from '@/lib/utils';

export type AdminPermission =
  | 'users:view'
  | 'users:edit'
  | 'users:create'
  | 'users:suspend'
  | 'users:activate'
  | 'users:lock'
  | 'users:unlock'
  | 'users:archive'
  | 'users:delete'
  | 'users:bulk'
  | 'users:password:view'
  | 'users:password:reset'
  | 'users:role:change'
  | 'users:department:change'
  | 'users:impersonate'
  | 'audit:view'
  | 'admin:manage';

export const ROLE_PERMISSIONS: Record<Role, AdminPermission[]> = {
  SADMIN: [
    'users:view',
    'users:edit',
    'users:create',
    'users:suspend',
    'users:activate',
    'users:lock',
    'users:unlock',
    'users:archive',
    'users:delete',
    'users:bulk',
    'users:password:view',
    'users:password:reset',
    'users:role:change',
    'users:department:change',
    'users:impersonate',
    'audit:view',
    'admin:manage',
  ],
  QC_EXEC: [],
  QC_MGR: [],
  QA_EXEC: [],
  QA_MGR: [],
};

export const USER_STATUSES: UserStatus[] = ['Active', 'Suspended', 'Locked', 'Archived', 'Disabled', 'Pending', 'Inactive'];

const DEFAULT_PASSWORD = 'password123';

export function hasPermission(role: Role, permission: AdminPermission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canManageTargetUser(actorRole: Role, targetRole: Role): boolean {
  if (actorRole !== 'SADMIN') return false;
  return targetRole !== 'SADMIN' || actorRole === 'SADMIN';
}

export function isPrivilegedStatus(status: UserStatus): boolean {
  return status === 'Suspended' || status === 'Locked' || status === 'Archived' || status === 'Disabled';
}

export function generateTemporaryPassword(length = 14): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let index = 0; index < length; index += 1) {
    password += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return password;
}

export function getUserPassword(user: User, actorRole: Role): string | null {
  if (actorRole !== 'SADMIN') return null;
  return user.password;
}

export function resetUserPassword(user: User, password?: string): User {
  const nextPassword = password?.trim() || generateTemporaryPassword();
  return {
    ...user,
    password: nextPassword,
    passwordUpdatedAt: now(),
    forcePasswordChange: false,
    updatedAt: now(),
  };
}

export function normalizeUser(user: User): User {
  const createdAt = user.createdAt || user.lastLogin || now();
  return {
    ...user,
    phone: user.phone || '',
    employeeId: user.employeeId || `EMP-${user.id.slice(-4).toUpperCase()}`,
    createdAt,
    updatedAt: user.updatedAt || createdAt,
    lastActivityAt: user.lastActivityAt ?? user.lastLogin ?? null,
    passwordUpdatedAt: user.passwordUpdatedAt || createdAt,
    failedLoginAttempts: user.failedLoginAttempts ?? 0,
    lockedAt: user.lockedAt ?? null,
    suspendedAt: user.suspendedAt ?? null,
    suspendedReason: user.suspendedReason ?? null,
    archivedAt: user.archivedAt ?? null,
    deletedAt: user.deletedAt ?? null,
    statusReason: user.statusReason ?? null,
    forcePasswordChange: user.forcePasswordChange ?? false,
  };
}

export function buildUserAuditRef(user: User): string {
  return `${user.username} • ${user.name}`;
}

export function resolveDepartmentLabel(department: Department): string {
  switch (department) {
    case 'QC':
      return 'QC';
    case 'QA':
      return 'QA';
    default:
      return 'System';
  }
}

export function generateUserId(): string {
  return generateId();
}

export { DEFAULT_PASSWORD };
