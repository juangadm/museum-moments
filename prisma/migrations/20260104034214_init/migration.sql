-- CreateTable
CREATE TABLE "Moment" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "creatorName" TEXT,
    "creatorUrl" TEXT,
    "sourceUrl" TEXT NOT NULL,
    "imageUrl" TEXT,
    "description" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ogTitle" TEXT,
    "ogSiteName" TEXT,
    "dominantColor" TEXT,

    CONSTRAINT "Moment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Moment_slug_key" ON "Moment"("slug");

-- CreateIndex
CREATE INDEX "Moment_category_idx" ON "Moment"("category");

-- CreateIndex
CREATE INDEX "Moment_publishedAt_idx" ON "Moment"("publishedAt");
