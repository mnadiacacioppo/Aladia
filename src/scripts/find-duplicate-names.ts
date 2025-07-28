import fs from 'fs';
import path from 'path';

// Leggi i nomi dal JSON
const jsonPath = path.join(__dirname, '../data/cards.json');
const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

const nameCount: Record<string, number> = {};
json.forEach((c: any) => {
  nameCount[c.name] = (nameCount[c.name] || 0) + 1;
});

const duplicates = Object.entries(nameCount).filter(([_, count]) => count > 1);

if (duplicates.length === 0) {
  console.log('Nessun nome duplicato nel JSON.');
} else {
  console.log('Nomi duplicati nel JSON:');
  duplicates.forEach(([name, count]) => {
    console.log(`${name}: ${count} volte`);
  });
}
