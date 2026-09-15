-- Rename User.email to User.username (login now by chosen username, not email).
-- A real rename, not drop+add, so existing account data is preserved.
ALTER TABLE "User" RENAME COLUMN "email" TO "username";

-- Existing rows hold email-shaped values (e.g. "amelie.rouvier@quick.fr");
-- strip the domain so they match the new plain-username format going
-- forward instead of leaving them stuck in the old shape.
UPDATE "User" SET "username" = split_part("username", '@', 1);
