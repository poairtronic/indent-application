import { PrismaClient, PermissionAction } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ==========================================
  // DEPARTMENTS
  // ==========================================
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { departmentCode: 'ADMIN' },
      update: {},
      create: { departmentCode: 'ADMIN', departmentName: 'Administration', description: 'System Administration' },
    }),
    prisma.department.upsert({
      where: { departmentCode: 'DSGN' },
      update: {},
      create: { departmentCode: 'DSGN', departmentName: 'Design', description: 'Design Engineering' },
    }),
    prisma.department.upsert({
      where: { departmentCode: 'STOR' },
      update: {},
      create: { departmentCode: 'STOR', departmentName: 'Stores', description: 'Stores & Inventory' },
    }),
    prisma.department.upsert({
      where: { departmentCode: 'ACCT' },
      update: {},
      create: { departmentCode: 'ACCT', departmentName: 'Accounts', description: 'Accounts & Finance' },
    }),
    prisma.department.upsert({
      where: { departmentCode: 'PROD' },
      update: {},
      create: { departmentCode: 'PROD', departmentName: 'Production', description: 'Production' },
    }),
    prisma.department.upsert({
      where: { departmentCode: 'SMGR' },
      update: {},
      create: { departmentCode: 'SMGR', departmentName: 'Senior Manager', description: 'Senior Management' },
    }),
    prisma.department.upsert({
      where: { departmentCode: 'GMGR' },
      update: {},
      create: { departmentCode: 'GMGR', departmentName: 'General Manager', description: 'General Management' },
    }),
  ]);
  console.log(`Created ${departments.length} departments`);

  const deptMap = Object.fromEntries(departments.map((d) => [d.departmentCode, d.id]));

  // ==========================================
  // PERMISSIONS
  // ==========================================
  const permissionDefs = [
    // Master Modules
    { module: 'users', action: PermissionAction.CREATE, code: 'users.create', description: 'Create users' },
    { module: 'users', action: PermissionAction.READ, code: 'users.view', description: 'View users' },
    { module: 'users', action: PermissionAction.UPDATE, code: 'users.update', description: 'Update users' },
    { module: 'users', action: PermissionAction.DELETE, code: 'users.delete', description: 'Delete users' },

    { module: 'roles', action: PermissionAction.CREATE, code: 'roles.create', description: 'Create roles' },
    { module: 'roles', action: PermissionAction.READ, code: 'roles.view', description: 'View roles' },
    { module: 'roles', action: PermissionAction.UPDATE, code: 'roles.update', description: 'Update roles' },
    { module: 'roles', action: PermissionAction.DELETE, code: 'roles.delete', description: 'Delete roles' },

    { module: 'permissions', action: PermissionAction.CREATE, code: 'permissions.create', description: 'Create permissions' },
    { module: 'permissions', action: PermissionAction.READ, code: 'permissions.view', description: 'View permissions' },
    { module: 'permissions', action: PermissionAction.UPDATE, code: 'permissions.update', description: 'Update permissions' },
    { module: 'permissions', action: PermissionAction.DELETE, code: 'permissions.delete', description: 'Delete permissions' },

    { module: 'departments', action: PermissionAction.CREATE, code: 'departments.create', description: 'Create departments' },
    { module: 'departments', action: PermissionAction.READ, code: 'departments.view', description: 'View departments' },
    { module: 'departments', action: PermissionAction.UPDATE, code: 'departments.update', description: 'Update departments' },
    { module: 'departments', action: PermissionAction.DELETE, code: 'departments.delete', description: 'Delete departments' },

    { module: 'products', action: PermissionAction.CREATE, code: 'products.create', description: 'Create products' },
    { module: 'products', action: PermissionAction.READ, code: 'products.view', description: 'View products' },
    { module: 'products', action: PermissionAction.UPDATE, code: 'products.update', description: 'Update products' },

    { module: 'materials', action: PermissionAction.CREATE, code: 'materials.create', description: 'Create materials' },
    { module: 'materials', action: PermissionAction.READ, code: 'materials.view', description: 'View materials' },
    { module: 'materials', action: PermissionAction.UPDATE, code: 'materials.update', description: 'Update materials' },
    { module: 'materials', action: PermissionAction.DELETE, code: 'materials.delete', description: 'Delete materials' },

    { module: 'vendors', action: PermissionAction.CREATE, code: 'vendors.create', description: 'Create vendors' },
    { module: 'vendors', action: PermissionAction.READ, code: 'vendors.view', description: 'View vendors' },
    { module: 'vendors', action: PermissionAction.UPDATE, code: 'vendors.update', description: 'Update vendors' },

    { module: 'manufacturing-processes', action: PermissionAction.READ, code: 'manufacturing-processes.view', description: 'View manufacturing processes' },
    { module: 'manufacturing-processes', action: PermissionAction.UPDATE, code: 'manufacturing-processes.update', description: 'Update manufacturing processes' },

    { module: 'units', action: PermissionAction.READ, code: 'units.view', description: 'View units' },

    // Business Modules
    { module: 'indent', action: PermissionAction.CREATE, code: 'indent.create', description: 'Create indent' },
    { module: 'indent', action: PermissionAction.READ, code: 'indent.view', description: 'View indent' },
    { module: 'indent', action: PermissionAction.UPDATE, code: 'indent.edit', description: 'Edit indent' },
    { module: 'indent', action: PermissionAction.APPROVE, code: 'indent.submit', description: 'Submit indent' },
    { module: 'indent', action: PermissionAction.DELETE, code: 'indent.delete', description: 'Delete indent' },

    { module: 'costsheet', action: PermissionAction.CREATE, code: 'costsheet.create', description: 'Create cost sheet' },
    { module: 'costsheet', action: PermissionAction.READ, code: 'costsheet.view', description: 'View cost sheet' },
    { module: 'costsheet', action: PermissionAction.UPDATE, code: 'costsheet.update', description: 'Update cost sheet' },

    { module: 'workflow', action: PermissionAction.READ, code: 'workflow.view', description: 'View workflow' },
    { module: 'workflow', action: PermissionAction.APPROVE, code: 'workflow.approve', description: 'Approve workflow' },
    { module: 'workflow', action: PermissionAction.REJECT, code: 'workflow.reject', description: 'Reject workflow' },

    { module: 'production', action: PermissionAction.READ, code: 'production.view', description: 'View production' },
    { module: 'production', action: PermissionAction.UPDATE, code: 'production.receive', description: 'Receive in production' },

    { module: 'inventory', action: PermissionAction.READ, code: 'inventory.view', description: 'View inventory' },
    { module: 'inventory', action: PermissionAction.UPDATE, code: 'inventory.issue', description: 'Issue inventory' },

    { module: 'reports', action: PermissionAction.READ, code: 'reports.view', description: 'View reports' },
    { module: 'reports', action: PermissionAction.UPDATE, code: 'reports.export', description: 'Export reports' },

    { module: 'analytics', action: PermissionAction.READ, code: 'analytics.view', description: 'View analytics' },

    { module: 'notifications', action: PermissionAction.READ, code: 'notifications.view', description: 'View notifications' },

    { module: 'audit', action: PermissionAction.READ, code: 'audit.view', description: 'View audit logs' },

    { module: 'settings', action: PermissionAction.ALL, code: 'settings.manage', description: 'Manage settings' },
  ];

  const createdPermissions = await Promise.all(
    permissionDefs.map((p) =>
      prisma.permission.upsert({
        where: { code: p.code },
        update: {},
        create: p,
      }),
    ),
  );
  console.log(`Created ${createdPermissions.length} permissions`);

  const permMap = Object.fromEntries(createdPermissions.map((p) => [p.code, p.id]));

  // ==========================================
  // ROLES
  // ==========================================
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { roleName: 'Admin' },
      update: {},
      create: { roleName: 'Admin', description: 'System Administrator with full access', isSystem: true },
    }),
    prisma.role.upsert({
      where: { roleName: 'Design Engineer' },
      update: {},
      create: { roleName: 'Design Engineer', description: 'Design Engineering - creates indents and cost sheets' },
    }),
    prisma.role.upsert({
      where: { roleName: 'Stores Executive' },
      update: {},
      create: { roleName: 'Stores Executive', description: 'Stores - manages inventory and material verification' },
    }),
    prisma.role.upsert({
      where: { roleName: 'Accounts Executive' },
      update: {},
      create: { roleName: 'Accounts Executive', description: 'Accounts - manages cost verification and actual costs' },
    }),
    prisma.role.upsert({
      where: { roleName: 'Production Executive' },
      update: {},
      create: { roleName: 'Production Executive', description: 'Production - manages production queue and material receipt' },
    }),
    prisma.role.upsert({
      where: { roleName: 'Senior Manager' },
      update: {},
      create: { roleName: 'Senior Manager', description: 'Senior Management - reviews and approves' },
    }),
    prisma.role.upsert({
      where: { roleName: 'General Manager' },
      update: {},
      create: { roleName: 'General Manager', description: 'General Management - final approvals and reports' },
    }),
  ]);
  console.log(`Created ${roles.length} roles`);

  const roleMap = Object.fromEntries(roles.map((r) => [r.roleName, r.id]));

  // ==========================================
  // ROLE-PERMISSION MAPPINGS
  // ==========================================
  const rolePermissionsMap: Record<string, string[]> = {
    Admin: Object.values(permMap),

    'Design Engineer': [
      permMap['indent.create'],
      permMap['indent.view'],
      permMap['indent.edit'],
      permMap['indent.submit'],
      permMap['indent.delete'],
      permMap['costsheet.create'],
      permMap['costsheet.view'],
      permMap['costsheet.update'],
      permMap['products.view'],
      permMap['materials.view'],
      permMap['vendors.view'],
      permMap['manufacturing-processes.view'],
      permMap['units.view'],
      permMap['notifications.view'],
    ],

    'Stores Executive': [
      permMap['indent.view'],
      permMap['inventory.view'],
      permMap['inventory.issue'],
      permMap['materials.view'],
      permMap['materials.update'],
      permMap['production.receive'],
      permMap['notifications.view'],
    ],

    'Accounts Executive': [
      permMap['costsheet.view'],
      permMap['costsheet.create'],
      permMap['costsheet.update'],
      permMap['indent.view'],
      permMap['vendors.view'],
      permMap['reports.view'],
      permMap['reports.export'],
      permMap['notifications.view'],
    ],

    'Production Executive': [
      permMap['production.view'],
      permMap['production.receive'],
      permMap['indent.view'],
      permMap['inventory.view'],
      permMap['materials.view'],
      permMap['notifications.view'],
    ],

    'Senior Manager': [
      permMap['workflow.view'],
      permMap['workflow.approve'],
      permMap['workflow.reject'],
      permMap['indent.view'],
      permMap['reports.view'],
      permMap['reports.export'],
      permMap['analytics.view'],
      permMap['costsheet.view'],
      permMap['notifications.view'],
    ],

    'General Manager': [
      permMap['workflow.view'],
      permMap['workflow.approve'],
      permMap['workflow.reject'],
      permMap['indent.view'],
      permMap['reports.view'],
      permMap['reports.export'],
      permMap['analytics.view'],
      permMap['costsheet.view'],
      permMap['notifications.view'],
    ],
  };

  for (const [roleName, permissionIds] of Object.entries(rolePermissionsMap)) {
    const roleId = roleMap[roleName];
    for (const permissionId of permissionIds) {
      await prisma.rolePermission
        .upsert({
          where: { roleId_permissionId: { roleId, permissionId } },
          update: {},
          create: { roleId, permissionId },
        })
        .catch(() => {});
    }
  }
  console.log('Role-permission mappings created');

  // ==========================================
  // TEST USERS
  // ==========================================
  const password = await bcrypt.hash('Password123!', 12);

  const users = [
    { employeeCode: 'ADM001', firstName: 'System', lastName: 'Admin', email: 'admin@indent.com', departmentCode: 'ADMIN', roleName: 'Admin' },
    { employeeCode: 'DSG001', firstName: 'Design', lastName: 'Engineer', email: 'design@indent.com', departmentCode: 'DSGN', roleName: 'Design Engineer' },
    { employeeCode: 'STR001', firstName: 'Stores', lastName: 'Executive', email: 'stores@indent.com', departmentCode: 'STOR', roleName: 'Stores Executive' },
    { employeeCode: 'ACC001', firstName: 'Accounts', lastName: 'Executive', email: 'accounts@indent.com', departmentCode: 'ACCT', roleName: 'Accounts Executive' },
    { employeeCode: 'PRD001', firstName: 'Production', lastName: 'Executive', email: 'production@indent.com', departmentCode: 'PROD', roleName: 'Production Executive' },
    { employeeCode: 'SMG001', firstName: 'Senior', lastName: 'Manager', email: 'senior.manager@indent.com', departmentCode: 'SMGR', roleName: 'Senior Manager' },
    { employeeCode: 'GMG001', firstName: 'General', lastName: 'Manager', email: 'general.manager@indent.com', departmentCode: 'GMGR', roleName: 'General Manager' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        employeeCode: u.employeeCode,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        password,
        departmentId: deptMap[u.departmentCode],
        roleId: roleMap[u.roleName],
        status: 'ACTIVE',
      },
    });
  }
  console.log(`Created ${users.length} users`);
  console.log('Default password for all users: Password123!');

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
