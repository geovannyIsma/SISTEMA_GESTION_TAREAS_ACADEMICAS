/*
  Warnings:

  - A unique constraint covering the columns `[codigo]` on the table `Curso` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `codigo` to the `Curso` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Curso` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Curso` ADD COLUMN `activo` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `codigo` VARCHAR(191) NOT NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `descripcion` TEXT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- CreateTable
CREATE TABLE `_CursoDocentes` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_CursoDocentes_AB_unique`(`A`, `B`),
    INDEX `_CursoDocentes_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Curso_codigo_key` ON `Curso`(`codigo`);

-- AddForeignKey
ALTER TABLE `_CursoDocentes` ADD CONSTRAINT `_CursoDocentes_A_fkey` FOREIGN KEY (`A`) REFERENCES `Curso`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CursoDocentes` ADD CONSTRAINT `_CursoDocentes_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
