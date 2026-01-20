-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "creatorName" TEXT NOT NULL,
    "creatorUrl" TEXT,
    "title" TEXT,
    "description" TEXT,
    "submitterNote" TEXT,
    "submitterIp" TEXT NOT NULL,
    "honeypot" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "momentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Submission_momentId_key" ON "Submission"("momentId");

-- CreateIndex
CREATE INDEX "Submission_status_idx" ON "Submission"("status");

-- CreateIndex
CREATE INDEX "Submission_createdAt_idx" ON "Submission"("createdAt");

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "Moment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
