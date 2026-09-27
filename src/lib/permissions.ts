// RightWay Foods — RBAC permission utilities
// Roles are stored as plain strings in the database (SQLite-compatible)

export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "SALESPERSON"
  | "CASHIER"
  | "CUSTOMER_SERVICE"
  | "INVENTORY_OFFICER"
  | "ACCOUNTANT"
  | "BRANCH_MANAGER"
  | "DELIVERY_RIDER"
  | "AUDITOR";

export const ADMIN_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN"];
export const STAFF_ROLES: UserRole[] = [
  "SUPER_ADMIN", "ADMIN", "SALESPERSON", "CASHIER",
  "INVENTORY_OFFICER", "ACCOUNTANT", "BRANCH_MANAGER",
  "CUSTOMER_SERVICE", "DELIVERY_RIDER", "AUDITOR",
];

export function isAdmin(role: string): boolean {
  return ADMIN_ROLES.includes(role as UserRole);
}

export function isStaff(role: string): boolean {
  return STAFF_ROLES.includes(role as UserRole);
}

export const Permissions = {
  canViewCostPrice: (r: string) => ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "BRANCH_MANAGER"].includes(r),
  canManageProducts: (r: string) => isAdmin(r),
  canChangePrices: (r: string) => isAdmin(r),

  canRecordSale: (r: string) => ["SUPER_ADMIN", "ADMIN", "SALESPERSON", "BRANCH_MANAGER"].includes(r),
  canViewAllSales: (r: string) => ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "BRANCH_MANAGER", "AUDITOR"].includes(r),
  canVoidSale: (r: string) => isAdmin(r),
  canCorrectSale: (r: string) => isAdmin(r),

  canRecordPayment: (r: string) => ["SUPER_ADMIN", "ADMIN", "CASHIER", "BRANCH_MANAGER"].includes(r),
  canViewAllPayments: (r: string) => ["SUPER_ADMIN", "ADMIN", "CASHIER", "ACCOUNTANT", "BRANCH_MANAGER", "AUDITOR"].includes(r),

  canRecordExpense: (r: string) => ["SUPER_ADMIN", "ADMIN", "CASHIER", "BRANCH_MANAGER"].includes(r),
  canApproveExpense: (r: string) => isAdmin(r),
  canViewAllExpenses: (r: string) => ["SUPER_ADMIN", "ADMIN", "CASHIER", "ACCOUNTANT", "BRANCH_MANAGER", "AUDITOR"].includes(r),

  canManageInventory: (r: string) => ["SUPER_ADMIN", "ADMIN", "INVENTORY_OFFICER", "BRANCH_MANAGER"].includes(r),
  canViewInventory: (r: string) => ["SUPER_ADMIN", "ADMIN", "SALESPERSON", "INVENTORY_OFFICER", "BRANCH_MANAGER"].includes(r),

  canManageCashSession: (r: string) => ["SUPER_ADMIN", "ADMIN", "CASHIER", "BRANCH_MANAGER"].includes(r),

  canViewProfitReports: (r: string) => ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT", "BRANCH_MANAGER"].includes(r),
  canViewSalesReports: (r: string) => ["SUPER_ADMIN", "ADMIN", "SALESPERSON", "ACCOUNTANT", "BRANCH_MANAGER", "AUDITOR"].includes(r),

  canManageUsers: (r: string) => isAdmin(r),
  canViewAuditLogs: (r: string) => ["SUPER_ADMIN", "ADMIN", "AUDITOR"].includes(r),
  canAccessAdmin: (r: string) => isAdmin(r),

  canViewAllCustomers: (r: string) => ["SUPER_ADMIN", "ADMIN", "SALESPERSON", "CUSTOMER_SERVICE", "BRANCH_MANAGER"].includes(r),
  canManageCustomers: (r: string) => ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"].includes(r),

  canUseAdminAskGod: (r: string) => isAdmin(r),
};

export function getDashboardRoute(role: string): string {
  switch (role) {
    case "SUPER_ADMIN":
    case "ADMIN":
    case "BRANCH_MANAGER": return "/admin";
    case "SALESPERSON": return "/sales";
    case "CASHIER": return "/cashier";
    case "INVENTORY_OFFICER": return "/inventory";
    case "ACCOUNTANT": return "/reports";
    case "DELIVERY_RIDER": return "/delivery";
    case "AUDITOR": return "/audit";
    default: return "/sales";
  }
}
