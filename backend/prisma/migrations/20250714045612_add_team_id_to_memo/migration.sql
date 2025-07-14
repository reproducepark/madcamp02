/*
  Warnings:

  - Added the required column `team_id` to the `Memo` table without a default value. This is not possible if the table is not empty.

*/

-- 먼저 team_id 컬럼을 nullable로 추가
ALTER TABLE "Memo" ADD COLUMN "team_id" INTEGER;

-- 기존 메모 데이터에 대해 사용자가 속한 첫 번째 팀의 ID를 설정
UPDATE "Memo" 
SET "team_id" = (
  SELECT tm.team_id 
  FROM "TeamMember" tm 
  WHERE tm.user_id = "Memo".user_id 
  LIMIT 1
);

-- team_id를 NOT NULL로 변경
ALTER TABLE "Memo" ALTER COLUMN "team_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Memo" ADD CONSTRAINT "Memo_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
