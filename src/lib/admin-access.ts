export type AdminPanelRole = 'ADMIN' | 'MANAGER' | 'SELLER';

const ADMIN_ONLY_PREFIXES = [
  '/admin/settings',
  '/admin/staff/payroll',
  '/admin/users/',
];

const SELLER_ALLOWED_PREFIXES = ['/admin/pos', '/admin/orders', '/admin/profile'];

export function isAdminOnlyPath(pathname: string): boolean {
  return ADMIN_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isSellerAllowedPath(pathname: string): boolean {
  if (pathname === '/admin/login') return true;
  return SELLER_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function canAccessAdminPath(pathname: string, role?: string): boolean {
  if (!role || !['ADMIN', 'MANAGER', 'SELLER'].includes(role)) return false;
  if (pathname === '/admin/login') return true;

  if (role === 'SELLER') {
    return isSellerAllowedPath(pathname);
  }

  if (role === 'MANAGER' && isAdminOnlyPath(pathname)) {
    return false;
  }

  if (pathname === '/admin/users' || pathname.startsWith('/admin/users/')) {
    if (pathname === '/admin/users') {
      return role === 'ADMIN' || role === 'MANAGER';
    }
    return role === 'ADMIN';
  }

  if (pathname === '/admin/profile' || pathname.startsWith('/admin/profile/')) {
    return role === 'MANAGER' || role === 'SELLER';
  }

  return true;
}

export function getAdminFallbackPath(role?: string): string {
  if (role === 'SELLER') return '/admin/pos';
  if (role === 'MANAGER') return '/admin';
  return '/admin';
}

export function canCreateStaff(role?: string): boolean {
  return role === 'ADMIN' || role === 'MANAGER';
}

export function canManageOrdersAdmin(role?: string): boolean {
  return role === 'ADMIN' || role === 'MANAGER';
}

export function isAdminOrManager(role?: string): boolean {
  return role === 'ADMIN' || role === 'MANAGER';
}
