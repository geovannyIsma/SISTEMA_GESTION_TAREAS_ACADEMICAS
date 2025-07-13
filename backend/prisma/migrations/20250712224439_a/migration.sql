/*
  Warnings:

  - You are about to drop the column `archivoUrl` on the `Entrega` table. All the data in the column will be lost.
  - You are about to alter the column `calificacion` on the `Entrega` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Double`.

*/
-- AlterTable
ALTER TABLE `Entrega` DROP COLUMN `archivoUrl`,
    ADD COLUMN `fueraDePlazo` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `calificacion` DOUBLE NULL;

-- AlterTable
ALTER TABLE `Tarea` ADD COLUMN `editableHastaUltimaEntrega` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notaMaxima` DOUBLE NOT NULL DEFAULT 10.0;

-- CreateTable
CREATE TABLE `ArchivoEntrega` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `entregaId` INTEGER NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `sizeMB` DOUBLE NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Retroalimentacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tareaId` INTEGER NOT NULL,
    `estudianteId` INTEGER NOT NULL,
    `nota` DOUBLE NOT NULL,
    `observacion` TEXT NOT NULL,
    `archivoUrl` VARCHAR(191) NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notificado` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notificacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `mensaje` VARCHAR(191) NOT NULL,
    `leido` BOOLEAN NOT NULL DEFAULT false,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `tipo` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ArchivoEntrega` ADD CONSTRAINT `ArchivoEntrega_entregaId_fkey` FOREIGN KEY (`entregaId`) REFERENCES `Entrega`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Retroalimentacion` ADD CONSTRAINT `Retroalimentacion_tareaId_fkey` FOREIGN KEY (`tareaId`) REFERENCES `Tarea`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Retroalimentacion` ADD CONSTRAINT `Retroalimentacion_estudianteId_fkey` FOREIGN KEY (`estudianteId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notificacion` ADD CONSTRAINT `Notificacion_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
