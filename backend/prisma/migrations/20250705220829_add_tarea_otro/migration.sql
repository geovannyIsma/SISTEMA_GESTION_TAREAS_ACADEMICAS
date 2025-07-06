-- AlterTable
ALTER TABLE `Tarea` ADD COLUMN `archivoUrl` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Curso` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TareaAsignacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tareaId` INTEGER NOT NULL,
    `cursoId` INTEGER NULL,
    `estudianteId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Entrega` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tareaId` INTEGER NOT NULL,
    `estudianteId` INTEGER NOT NULL,
    `fecha` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `archivoUrl` VARCHAR(191) NULL,
    `calificacion` INTEGER NULL,
    `observaciones` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_CursoEstudiantes` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_CursoEstudiantes_AB_unique`(`A`, `B`),
    INDEX `_CursoEstudiantes_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TareaAsignacion` ADD CONSTRAINT `TareaAsignacion_tareaId_fkey` FOREIGN KEY (`tareaId`) REFERENCES `Tarea`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TareaAsignacion` ADD CONSTRAINT `TareaAsignacion_cursoId_fkey` FOREIGN KEY (`cursoId`) REFERENCES `Curso`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TareaAsignacion` ADD CONSTRAINT `TareaAsignacion_estudianteId_fkey` FOREIGN KEY (`estudianteId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Entrega` ADD CONSTRAINT `Entrega_tareaId_fkey` FOREIGN KEY (`tareaId`) REFERENCES `Tarea`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Entrega` ADD CONSTRAINT `Entrega_estudianteId_fkey` FOREIGN KEY (`estudianteId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CursoEstudiantes` ADD CONSTRAINT `_CursoEstudiantes_A_fkey` FOREIGN KEY (`A`) REFERENCES `Curso`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CursoEstudiantes` ADD CONSTRAINT `_CursoEstudiantes_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
