const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Deleting all Products and ProductMaterials...");
  try {
    const results = await prisma.$transaction([
      prisma.productMaterial.deleteMany(),
      prisma.product.deleteMany()
    ]);
    
    console.log(`Deleted ${results[0].count} ProductMaterials.`);
    console.log(`Deleted ${results[1].count} Products.`);
  } catch (err) {
    console.error("Failed to delete products:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
