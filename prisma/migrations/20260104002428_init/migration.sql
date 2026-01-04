-- CreateTable
CREATE TABLE "Moment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "creatorName" TEXT,
    "creatorUrl" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "imageUrl" TEXT,
    "description" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ogTitle" TEXT,
    "ogSiteName" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "Moment_slug_key" ON "Moment"("slug");

-- CreateIndex
CREATE INDEX "Moment_category_idx" ON "Moment"("category");

-- CreateIndex
CREATE INDEX "Moment_publishedAt_idx" ON "Moment"("publishedAt");
