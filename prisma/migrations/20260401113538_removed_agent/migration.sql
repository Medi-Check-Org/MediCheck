-- AlterEnum
ALTER TYPE "UnitStatus" ADD VALUE 'FLAGGED';

-- AlterTable
ALTER TABLE "medication_units" ADD COLUMN     "orgId" TEXT;

-- AddForeignKey
ALTER TABLE "medication_units" ADD CONSTRAINT "medication_units_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
