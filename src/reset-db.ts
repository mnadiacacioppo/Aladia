import prisma from "./lib/prisma";

async function resetDb() {
  await prisma.userCard.deleteMany();
  await prisma.user.deleteMany();
  await prisma.card.deleteMany();
  await prisma.cardDropCount.deleteMany();
  console.log("Database svuotato!");
  await prisma.$disconnect();
}

resetDb();