import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixDeletedUsers() {
  const deletedUsers = await prisma.user.findMany({
    where: { isDeleted: true }
  });

  for (const user of deletedUsers) {
    if (!user.email.includes('_deleted_')) {
      const timestamp = Date.now();
      await prisma.user.update({
        where: { id: user.id },
        data: {
          email: `${user.email}_deleted_${timestamp}`,
          employeeCode: `${user.employeeCode}_deleted_${timestamp}`
        }
      });
      console.log(`Freed up email: ${user.email}`);
    }
  }
}

fixDeletedUsers()
  .then(() => {
    console.log('Fixed soft-deleted users.');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
