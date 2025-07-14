/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `num` on the `User` table. All the data in the column will be lost.
  - The `id` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/

-- 먼저 username 컬럼을 추가하고 기존 id 값을 복사
ALTER TABLE "User" ADD COLUMN "username" TEXT;
UPDATE "User" SET "username" = "id";

-- DropForeignKey
ALTER TABLE "Memo" DROP CONSTRAINT "Memo_user_id_fkey";
ALTER TABLE "SubGoal" DROP CONSTRAINT "SubGoal_user_id_fkey";
ALTER TABLE "TeamMember" DROP CONSTRAINT "TeamMember_user_id_fkey";

-- DropIndex
DROP INDEX "User_id_key";

-- 기존 num 값을 새로운 id로 복사하고 기존 id 컬럼 삭제
ALTER TABLE "User" ADD COLUMN "new_id" SERIAL;
UPDATE "User" SET "new_id" = "num";

-- 기존 컬럼들 삭제
ALTER TABLE "User" DROP COLUMN "num";
ALTER TABLE "User" DROP COLUMN "id";

-- 새 컬럼 이름 변경
ALTER TABLE "User" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;

-- Primary Key 설정
ALTER TABLE "User" ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SubGoal" ADD CONSTRAINT "SubGoal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Memo" ADD CONSTRAINT "Memo_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
