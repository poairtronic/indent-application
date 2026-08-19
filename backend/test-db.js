const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log('Successfully connected to the database.');
    
    const users = await prisma.user.findMany({
      select: {
        email: true,
        status: true,
        isDeleted: true,
        role: {
          select: { roleName: true }
        }
      }
    });
    
    console.log(`Found ${users.length} users.`);
    console.dir(users, { depth: null });
  } catch (err) {
    console.error('Database connection or query failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('Disconnected cleanly.');
  }
}

main();
