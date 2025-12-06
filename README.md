# File Versioning & Management API

Este proyecto es una API RESTful construida con Node.js que permite administrar archivos, versionarlos y gestionar su ciclo de vida de manera eficiente. Está diseñada siguiendo principios de **Código Limpio** y **Arquitectura Limpia (Clean Architecture)** para asegurar mantenibilidad, escalabilidad y facilidad de pruebas.

## Características principales

- Subida, descarga y eliminación de archivos
- Versionado automático de archivos
- Recuperación de versiones anteriores
- Listado y búsqueda de archivos
- API documentada y segura

## Tecnologías

- Node.js
- Express.js
- Arquitectura limpia (Clean Architecture)
- Almacenamiento local o en la nube (extensible)
- Base de datos para metadatos y versiones (ej: MongoDB, PostgreSQL)

## Estructura del proyecto

- `/src` — Código fuente principal
  - `/application` — Casos de uso y lógica de negocio
  - `/domain` — Entidades y modelos de dominio
  - `/infrastructure` — Implementaciones técnicas (DB, almacenamiento, etc.)
  - `/interfaces` — Controladores, rutas y validaciones
- `/tests` — Pruebas unitarias y de integración

## Instalación rápida

```bash
# Clonar el repositorio
git clone <repo-url>
cd <nombre-del-proyecto>

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar el servidor
dev: npm run dev
prod: npm start
```

## Endpoints principales

- `POST /files` — Subir archivo
- `GET /files` — Listar archivos
- `GET /files/:id` — Descargar archivo
- `GET /files/:id/versions` — Listar versiones
- `GET /files/:id/versions/:versionId` — Descargar versión específica
- `DELETE /files/:id` — Eliminar archivo

## Principios aplicados

- Separación de responsabilidades
- Inversión de dependencias
- Código desacoplado y testeable
- Validaciones y manejo de errores centralizado

## Próximos pasos

- Implementar autenticación y autorización
- Integrar almacenamiento en la nube (opcional)
- Mejorar documentación con Swagger/OpenAPI

---

> Proyecto inicializado por GitHub Copilot — 2025
