import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing all moments from database...");

  const count = await prisma.moment.count();
  console.log(`Found ${count} moments to delete.`);

  if (count === 0) {
    console.log("Database already empty.");
    return;
  }

  const result = await prisma.moment.deleteMany({});
  console.log(`Deleted ${result.count} moments.`);
  console.log("Database cleared successfully.");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
