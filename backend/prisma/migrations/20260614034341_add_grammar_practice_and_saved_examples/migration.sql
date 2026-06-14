-- CreateTable
CREATE TABLE "GrammarPractice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "userAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "score" INTEGER NOT NULL,
    "feedback" TEXT NOT NULL,
    "suggestion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GrammarPractice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSavedExample" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "japanese" TEXT NOT NULL,
    "romaji" TEXT,
    "vietnamese" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSavedExample_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GrammarPractice_userId_cardId_idx" ON "GrammarPractice"("userId", "cardId");

-- CreateIndex
CREATE INDEX "UserSavedExample_userId_cardId_idx" ON "UserSavedExample"("userId", "cardId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSavedExample_userId_cardId_japanese_key" ON "UserSavedExample"("userId", "cardId", "japanese");

-- AddForeignKey
ALTER TABLE "GrammarPractice" ADD CONSTRAINT "GrammarPractice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GrammarPractice" ADD CONSTRAINT "GrammarPractice_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSavedExample" ADD CONSTRAINT "UserSavedExample_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSavedExample" ADD CONSTRAINT "UserSavedExample_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;
