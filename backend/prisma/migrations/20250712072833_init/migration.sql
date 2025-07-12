/*
  Warnings:

  - Added the required column `class_section` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "class_section",
ADD COLUMN     "class_section" INTEGER NOT NULL;
