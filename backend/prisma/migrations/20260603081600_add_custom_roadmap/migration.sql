-- CreateTable
CREATE TABLE "CustomRoadmap" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "goal" TEXT,
    "targetDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomRoadmap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomRoadmapPhase" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "CustomRoadmapPhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomRoadmapItem" (
    "id" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "lessonId" TEXT,
    "customTitle" TEXT,
    "customDesc" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CustomRoadmapItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomRoadmap_userId_idx" ON "CustomRoadmap"("userId");

-- CreateIndex
CREATE INDEX "CustomRoadmapPhase_roadmapId_idx" ON "CustomRoadmapPhase"("roadmapId");

-- CreateIndex
CREATE INDEX "CustomRoadmapItem_phaseId_idx" ON "CustomRoadmapItem"("phaseId");

-- AddForeignKey
ALTER TABLE "CustomRoadmap" ADD CONSTRAINT "CustomRoadmap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomRoadmapPhase" ADD CONSTRAINT "CustomRoadmapPhase_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "CustomRoadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomRoadmapItem" ADD CONSTRAINT "CustomRoadmapItem_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "CustomRoadmapPhase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomRoadmapItem" ADD CONSTRAINT "CustomRoadmapItem_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
