-- CreateTable
CREATE TABLE "Reaction" (
    "id" SERIAL NOT NULL,
    "storyId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "storyId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reaction_storyId_idx" ON "Reaction"("storyId");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_storyId_type_sessionId_key" ON "Reaction"("storyId", "type", "sessionId");

-- CreateIndex
CREATE INDEX "Report_storyId_idx" ON "Report"("storyId");

-- CreateIndex
CREATE INDEX "Story_category_idx" ON "Story"("category");

-- CreateIndex
CREATE INDEX "Story_createdAt_idx" ON "Story"("createdAt");

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
