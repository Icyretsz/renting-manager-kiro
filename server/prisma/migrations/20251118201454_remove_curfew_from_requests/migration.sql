/*
  Warnings:

  - The values [CURFEW] on the enum `RequestType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `curfew_requests` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RequestType_new" AS ENUM ('REPAIR', 'OTHER');
ALTER TABLE "requests" ALTER COLUMN "request_type" TYPE "RequestType_new" USING ("request_type"::text::"RequestType_new");
ALTER TYPE "RequestType" RENAME TO "RequestType_old";
ALTER TYPE "RequestType_new" RENAME TO "RequestType";
DROP TYPE "RequestType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "curfew_requests" DROP CONSTRAINT "curfew_requests_request_id_fkey";

-- DropTable
DROP TABLE "curfew_requests";
