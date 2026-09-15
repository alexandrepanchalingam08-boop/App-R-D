-- AlterTable
ALTER TABLE "Version" ADD COLUMN     "procede" TEXT;

-- RenameIndex
ALTER INDEX "User_email_key" RENAME TO "User_username_key";
