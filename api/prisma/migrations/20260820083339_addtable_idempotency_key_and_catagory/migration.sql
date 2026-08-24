/*
  Warnings:

  - Added the required column `discountBreakdown` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usageLimit` to the `Promotion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usedCount` to the `Promotion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Order` ADD COLUMN `discountBreakdown` JSON NOT NULL,
    ADD COLUMN `promotionId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Product` ADD COLUMN `catagoryId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Promotion` ADD COLUMN `usageLimit` INTEGER NOT NULL,
    ADD COLUMN `usedCount` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `Category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IdempotencyKey` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `orderId` INTEGER NULL,
    `responsePayload` JSON NOT NULL,

    UNIQUE INDEX `IdempotencyKey_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_catagoryId_fkey` FOREIGN KEY (`catagoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_promotionId_fkey` FOREIGN KEY (`promotionId`) REFERENCES `Promotion`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IdempotencyKey` ADD CONSTRAINT `IdempotencyKey_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
