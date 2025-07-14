/*
  Warnings:

  - Made the column `team_id` on table `Memo` required. This step will fail if there are existing NULL values in that column.

*/

-- 기존 null 값을 사용자가 속한 첫 번째 팀으로 설정
UPDATE "Memo" 
SET "team_id" = (
  SELECT tm.team_id 
  FROM "TeamMember" tm 
  WHERE tm.user_id = "Memo".user_id 
  LIMIT 1
)
WHERE "team_id" IS NULL;

-- AlterTable
ALTER TABLE "Memo" ALTER COLUMN "team_id" SET NOT NULL;
