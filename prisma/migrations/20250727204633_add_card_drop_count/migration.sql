-- CreateTable
CREATE TABLE "CardDropCount" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "CardDropCount_name_key" ON "CardDropCount"("name");
