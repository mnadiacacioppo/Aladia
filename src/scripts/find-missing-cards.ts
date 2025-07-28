import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  // Leggi i nomi dal database
  const dbCards = await prisma.card.findMany({ select: { name: true } });
  const dbNames = new Set(dbCards.map(c => c.name));

  // Leggi i nomi dal JSON
  const jsonPath = path.join(__dirname, '../data/cards.json');
  const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const jsonNames = new Set(json.map((c: any) => c.name));

  // Trova le carte presenti nel JSON ma non nel DB
  const missing = [...jsonNames].filter(name => !dbNames.has(name as string));

  if (missing.length === 0) {
    console.log('Tutte le carte del JSON sono presenti nel database.');
  } else {
    console.log('Carte presenti nel JSON ma non nel database:');
    missing.forEach(name => console.log(name));
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
