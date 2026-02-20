-- AlterTable
ALTER TABLE "Moment" ADD COLUMN     "year" INTEGER,
ADD COLUMN     "yearApproximate" BOOLEAN NOT NULL DEFAULT false;
