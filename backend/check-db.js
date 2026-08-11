const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.user.count();
    if (count === 0) {
      console.log('No users found. Creating default admin...');
      
      // We might need a department for the user depending on schema, let's try creating without it first.
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      
      const adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } });

      let roleId = null;
      if (adminRole) {
        roleId = adminRole.id;
      } else {
         // Create the role if it doesn't exist
         const newRole = await prisma.role.create({
            data: {
                name: 'ADMIN',
                description: 'Administrator'
            }
         });
         roleId = newRole.id;
      }


      const user = await prisma.user.create({
        data: {
          email: 'admin@imcms.com',
          password: hashedPassword,
          name: 'System Admin',
          roleId: roleId
        }
      });
      console.log('Created admin user:', user.email);
    } else {
      console.log('Users exist in DB. Count:', count);
      const user = await prisma.user.findFirst();
      console.log('Sample user:', user.email);
    }
  } catch (err) {
    console.error('Database Verification Error:', err);
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
