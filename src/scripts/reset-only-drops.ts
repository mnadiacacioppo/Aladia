import prisma from "../lib/prisma";

async function main() {
  await prisma.userCard.deleteMany({});
  await prisma.cardDropCount.deleteMany({});
  console.log("Inventari utenti e tabella CardDropCount resettati. Le carte e gli utenti sono intatti.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
