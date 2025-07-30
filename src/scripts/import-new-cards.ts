
import prisma from "../lib/prisma";
import cards from "../data/cards.json";

async function main() {
  let added = 0;
  let alreadyPresent: string[] = [];
  let justAdded: string[] = [];
  for (const card of cards) {
    const exists = await prisma.card.findUnique({ where: { name: card.name } });
    if (!exists) {
      await prisma.card.create({
        data: {
          name: card.name,
          imageUrl: card.imageUrl,
        },
      });
      added++;
      justAdded.push(card.name);
    } else {
      // Aggiorna solo imageUrl
      await prisma.card.update({
        where: { name: card.name },
        data: {
          imageUrl: card.imageUrl,
        },
      });
      alreadyPresent.push(card.name);
    }
  }
  console.log(`Carte aggiunte: ${added}`);
  if (justAdded.length > 0) {
    console.log("Aggiunte:", justAdded.join(", "));
  }
  if (alreadyPresent.length > 0) {
    console.log("Aggiornate:", alreadyPresent.join(", "));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
