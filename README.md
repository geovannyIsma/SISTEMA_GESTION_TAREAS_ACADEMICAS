# Sistema de Gestión de Tareas Académicas

Sistema para la gestión de tareas académicas con backend en Express.js, base de datos MySQL y ORM Prisma, con frontend en React.

## Estructura del proyecto

- `/backend`: API REST con Express.js y Prisma ORM
- `/frontend`: Aplicación cliente con React (pendiente)

## Requisitos

- Node.js (v16+)
- MySQL
- npm o yarn

## Configuración del backend

1. Navegar a la carpeta backend: `cd backend`
2. Instalar dependencias: `npm install`
3. Crear archivo `.env` con las variables de entorno:
```
DATABASE_URL="mysql://user:password@localhost:3306/tareas_academicas"
PORT=3000
```
4. Ejecutar migraciones de Prisma: `npx prisma migrate dev --name init`
5. Iniciar servidor: `npm run dev`

## Endpoints de la API

- GET /api/tareas - Obtener todas las tareas
- GET /api/tareas/:id - Obtener una tarea específica
- POST /api/tareas - Crear una nueva tarea
- PUT /api/tareas/:id - Actualizar una tarea
- DELETE /api/tareas/:id - Eliminar una tarea
