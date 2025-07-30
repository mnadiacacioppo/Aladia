/*
  Warnings:

  - You are about to drop the column `anime` on the `Card` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Card" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL
);
INSERT INTO "new_Card" ("id", "imageUrl", "name") SELECT "id", "imageUrl", "name" FROM "Card";
DROP TABLE "Card";
ALTER TABLE "new_Card" RENAME TO "Card";
CREATE UNIQUE INDEX "Card_name_key" ON "Card"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
