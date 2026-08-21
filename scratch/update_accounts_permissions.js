import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const role = await prisma.role.findFirst({
    where: { roleName: 'Accounts Executive' },
  });

  if (!role) {
    console.error('Role Accounts Executive not found');
    return;
  }

  const permissionsToGrant = [
    'materials.view',
    'products.view',
    'manufacturing-processes.view',
    'analytics.view',
    'indent.edit',
    'indent.view',
    'costsheet.view',
    'costsheet.create',
    'costsheet.update',
    'vendors.view',
    'reports.view',
    'reports.export',
    'notifications.view',
    'accounts.verify',
    'accounts.close',
    'units.view',
    'system.archive',
    'system.complete',
  ];

  const permissions = await prisma.permission.findMany({
    where: {
      code: { in: permissionsToGrant },
    },
  });

  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: perm.id,
        },
      },
      update: { isDeleted: false },
      create: {
        roleId: role.id,
        permissionId: perm.id,
      },
    });
  }

  console.log(`Granted ${permissions.length} permissions to Accounts Executive`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
