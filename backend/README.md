# Sistema de Gestión de Tareas Académicas - Backend

## Configuración con Docker y Prisma

### Requisitos previos
- Docker y Docker Compose
- Node.js y npm

### Pasos para configurar

1. Iniciar el contenedor de MySQL:
```bash
cd /home/ismael/Documentos/SISTEMA_GESTION_TAREAS_ACADEMICAS
docker-compose up -d
```

2. Instalar dependencias:
```bash
cd backend
npm install
```

3. Generar el cliente de Prisma:
```bash
npx prisma generate
```

4. Aplicar las migraciones de Prisma:
```bash
npx prisma migrate dev --name init
```

5. Iniciar el servidor:
```bash
npm run dev
```

### Gestión de la base de datos

- Explorar la base de datos con Prisma Studio:
```bash
npx prisma studio
```

- Resetear la base de datos:
```bash
npx prisma migrate reset
```

- Ver el estado de las migraciones:
```bash
npx prisma migrate status
```

### Comandos Docker útiles

- Ver logs del contenedor MySQL:
```bash
docker logs tareas_academicas_mysql
```

- Detener los contenedores:
```bash
docker-compose down
```

- Detener y eliminar volúmenes (borra todos los datos):
```bash
docker-compose down -v
```

## Módulo de Usuarios

### Endpoints de autenticación

- **POST /api/auth/register**: Registrar un nuevo usuario (solo administradores)
  - Body: `{ firstName, lastName, email, password, role }`
  
- **POST /api/auth/login**: Iniciar sesión
  - Body: `{ email, password }`
  
- **GET /api/auth/me**: Obtener datos del usuario actual (autenticado)
  - Requiere token JWT

### Endpoints de gestión de usuarios (solo administradores)

- **GET /api/users**: Obtener todos los usuarios
- **GET /api/users/:id**: Obtener usuario por ID
- **POST /api/users**: Crear nuevo usuario
  - Body: `{ firstName, lastName, email, password, role }`
- **PUT /api/users/:id**: Actualizar usuario
  - Body: `{ firstName?, lastName?, email?, password?, role? }`
- **DELETE /api/users/:id**: Eliminar usuario

### Roles del sistema

- **ADMINISTRADOR**: Gestión completa del sistema
- **DOCENTE**: Creación y calificación de tareas, generación de reportes
- **ESTUDIANTE**: Ver tareas asignadas y enviar entregas
- **OBSERVADOR**: Solo acceso a reportes sin capacidad de modificación

### Autenticación

Para rutas protegidas, incluye en los headers:
```
Authorization: Bearer tu_token_jwt
```

## Estructura del Proyecto Optimizada

```
backend/
├── controllers/       # Controladores de la aplicación
├── middleware/        # Middleware personalizado
├── prisma/            # Modelos y migraciones de Prisma
├── routes/            # Definición de rutas
├── scripts/           # Scripts de utilidad
├── utils/             # Funciones de utilidad
│   ├── errorHandler.js   # Manejo centralizado de errores
│   ├── prismaClient.js   # Cliente Prisma singleton
│   └── validation.js     # Validaciones
└── server.js          # Punto de entrada de la aplicación
```
