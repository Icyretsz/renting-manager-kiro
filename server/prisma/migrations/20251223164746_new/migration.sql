-- AlterEnum
ALTER TYPE "RequestType" ADD VALUE 'CURFEW';

-- CreateTable
CREATE TABLE "curfew_requests" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "tenant_ids" TEXT[],
    "reason" TEXT,

    CONSTRAINT "curfew_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "curfew_requests_request_id_key" ON "curfew_requests"("request_id");

-- AddForeignKey
ALTER TABLE "curfew_requests" ADD CONSTRAINT "curfew_requests_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
