-- CreateTable
CREATE TABLE `Tarea` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `fechaEntrega` DATETIME(3) NOT NULL,
    `docenteId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Tarea` ADD CONSTRAINT `Tarea_docenteId_fkey` FOREIGN KEY (`docenteId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
