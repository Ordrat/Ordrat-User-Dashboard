export const KNOWN_ROLES = [
  'sellerDashboard-orders',
  'OrderDetails',
  'CreateBranch',
  'sellerDashboard-store',
  'sellerDashboard-products',
  'sellerDashboard-customers',
  'sellerDashboard-reports',
  'sellerDashboard-settings',
  'sellerDashboard-dashboard',
  'sellerDashboard-branches',
  'sellerDashboard-drivers',
  'sellerDashboard-zones',
  'sellerDashboard-coupons',
  'sellerDashboard-promotions',
  'sellerDashboard-notifications',
  'sellerDashboard-reviews',
  'sellerDashboard-integrations',
  'sellerDashboard-subscriptions',
  'sellerDashboard-invoices',
  'sellerDashboard-payouts',
  'sellerDashboard-wallets',
  'sellerDashboard-analytics',
  'sellerDashboard-categories',
  'sellerDashboard-addons',
  'sellerDashboard-attributes',
  'sellerDashboard-inventory',
  'sellerDashboard-deliveries',
  'sellerDashboard-staff',
  'sellerDashboard-roles',
  'sellerDashboard-permissions',
  'UpdateOrder',
  'CancelOrder',
  'AssignDriver',
  'UpdateProduct',
  'CreateProduct',
  'DeleteProduct',
  'UpdateStore',
  'UpdateBranch',
  'DeleteBranch',
  'CreateCustomer',
  'UpdateCustomer',
  'DeleteCustomer',
  'CreateCoupon',
  'UpdateCoupon',
  'DeleteCoupon',
  'CreatePromotion',
  'UpdatePromotion',
  'DeletePromotion',
  'CreateDriver',
  'UpdateDriver',
  'DeleteDriver',
] as const;

export type KnownRole = (typeof KNOWN_ROLES)[number];

export const ROUTE_ROLES: Record<string, string[]> = {
  '/store-admin': ['sellerDashboard-store'],
  '/store-client': ['sellerDashboard-orders'],
  '/user-management': ['sellerDashboard-settings'],
  '/products': ['sellerDashboard-products'],
  '/customers': ['sellerDashboard-customers'],
  '/reports': ['sellerDashboard-reports'],
  '/analytics': ['sellerDashboard-analytics'],
  '/branches': ['sellerDashboard-branches', 'CreateBranch'],
  '/drivers': ['sellerDashboard-drivers'],
  '/zones': ['sellerDashboard-zones'],
  '/coupons': ['sellerDashboard-coupons'],
  '/promotions': ['sellerDashboard-promotions'],
  '/staff': ['sellerDashboard-staff'],
  '/roles': ['sellerDashboard-roles'],
};

export function filterKnownRoles(roles: string[]): string[] {
  const knownSet = new Set<string>(KNOWN_ROLES);
  return roles.filter((r) => knownSet.has(r));
}

export function userHasRouteAccess(
  userRoles: string[],
  pathname: string,
): boolean {
  const requiredRoles = Object.entries(ROUTE_ROLES).find(([route]) =>
    pathname.startsWith(route),
  )?.[1];

  // No role restriction defined for this route — allow all authenticated users
  if (!requiredRoles) return true;

  return requiredRoles.some((r) => userRoles.includes(r));
}
