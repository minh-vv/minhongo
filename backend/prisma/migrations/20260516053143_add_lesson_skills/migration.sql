-- CreateEnum
CREATE TYPE "SkillType" AS ENUM ('VOCABULARY', 'KANJI', 'GRAMMAR', 'READING', 'LISTENING');

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "skills" "SkillType"[];
