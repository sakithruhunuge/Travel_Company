export type Permission = 
  | 'manage_packages' 
  | 'manage_bookings' 
  | 'process_refunds'
  | 'view_payments' 
  | 'manage_customers' 
  | 'view_analytics' 
  | 'manage_settings' 
  | 'view_audit_logs';

export type UserRole = 'super_admin' | 'admin' | 'staff' | 'customer';

export const RolePermissions: Record<UserRole, Permission[]> = {
  super_admin: [
    'manage_packages', 
    'manage_bookings', 
    'process_refunds', 
    'view_payments', 
    'manage_customers', 
    'view_analytics', 
    'manage_settings', 
    'view_audit_logs'
  ],
  admin: [
    'manage_packages', 
    'manage_bookings', 
    'view_payments', 
    'manage_customers', 
    'view_analytics'
  ],
  staff: [
    'manage_bookings', 
    'manage_customers'
  ],
  customer: []
};

/**
  * Check if a given role has a specific permission
  */
export function hasPermission(role: string | undefined, permission: Permission): boolean {
  if (!role) return false;
  const permissions = RolePermissions[role as UserRole];
  if (!permissions) return false;
  return permissions.includes(permission);
}

/**
  * Check if a role is a management/admin role
  */
export function isAdminRole(role: string | undefined): boolean {
  return role === 'super_admin' || role === 'admin' || role === 'staff';
}
