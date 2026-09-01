import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const processNames = [
  "CNC-Wirecut",
  "EDM",
  "Super Drill",
  "Wirecut",
  "EDM Wire cut-2mm to 4mm",
  "Surface Grinding",
  "Heat treatment",
  "OPG operations",
  "OPG",
  "carbide grinding",
  "Brasing",
  "Welding",
  "Dull chrome plating",
  "Blackning",
  "JIG Grinding job",
  "JIIG Boring only MS material",
  "Tapping Works",
  "Milling 2 machines Monford",
  "Honing",
  "Cylindrical Grinding",
  "CNCWirecut",
  "EDM Spark",
  "Lathe",
  "Milling"
];

async function main() {
  console.log('Seeding manufacturing processes...');
  for (const name of processNames) {
    try {
      const existing = await prisma.manufacturingProcess.findUnique({
        where: { processName: name }
      });
      if (!existing) {
        await prisma.manufacturingProcess.create({
          data: {
            processName: name,
          }
        });
        console.log(`Created process: ${name}`);
      } else {
        console.log(`Process already exists: ${name}`);
      }
    } catch (err) {
      console.error(`Error creating process ${name}:`, err);
    }
  }
  console.log('Seeding processes finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
