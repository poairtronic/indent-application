const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Deleting catalog master data...");
  try {
    const results = await prisma.$transaction([
      prisma.materialVendor.deleteMany(),
      prisma.material.deleteMany(),
      prisma.unit.deleteMany(),
      prisma.vendor.deleteMany(),
      prisma.manufacturingProcess.deleteMany()
    ]);
    
    console.log(`Deleted ${results[0].count} MaterialVendors.`);
    console.log(`Deleted ${results[1].count} Materials.`);
    console.log(`Deleted ${results[2].count} Units.`);
    console.log(`Deleted ${results[3].count} Vendors.`);
    console.log(`Deleted ${results[4].count} ManufacturingProcesses.`);
  } catch (err) {
    console.error("Failed to delete catalogs:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
