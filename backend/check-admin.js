const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.findFirst({where: {email: 'admin@indent.com'}}).then(u => console.log(u)).finally(() => prisma.$disconnect());
