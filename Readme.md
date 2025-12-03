# 🗺️ Mapa Oculto

> **Plataforma geoespacial colaborativa para compartir historias anónimas, secretos y sucesos geolocalizados en tiempo real.**

![Status](https://img.shields.io/badge/Status-Active-success)
![Stack](https://img.shields.io/badge/Stack-PERN-blue)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

## 🔗 Demo en Vivo

- **Frontend:** [mapa-oculto.vercel.app](https://mapa-oculto.vercel.app/)
- **Backend:** Alojado en Render.

> 💡 **Nota:** Para la mejor experiencia, permite el acceso a tu ubicación cuando el navegador lo solicite.

---

## 📱 Interfaz

<p align="center">
  <img src="./screenshot.png" alt="Interfaz de Mapa Oculto" width="100%" style="border-radius: 10px;">
</p>

---

## 🚀 Características Principales

**Mapa Oculto** permite a los usuarios conectar con su entorno a través de historias anónimas.

- **📍 Geolocalización Automática:** Detecta tu posición para mostrar historias relevantes a tu alrededor.
- **📡 Tiempo Real (WebSockets):** Las nuevas historias aparecen instantáneamente en el mapa de todos los usuarios conectados sin recargar.
- **⚡ Clustering Inteligente:** Agrupación dinámica de marcadores para evitar la saturación visual en zonas densas.
- **🎨 Categorías Visuales:** Pines codificados por colores según la emoción (Miedo, Amor, Crimen, Curiosidad).
- **❤️ Interacción Atómica:** Sistema de "Likes" concurrente y seguro.
- **🛡️ Seguridad:** Rate Limiting para prevenir spam y abuso de la API.

---

## 🛠️ Stack Tecnológico

El proyecto utiliza una arquitectura moderna **Monorepo** separando cliente y servidor.

| Área | Tecnologías |
| :--- | :--- |
| **Frontend** | React, Vite, TypeScript, TailwindCSS, Zustand |
| **Mapas** | Mapbox GL JS, React Map GL |
| **Backend** | Node.js, Express, TypeScript, Socket.io |
| **Base de Datos** | PostgreSQL con extensión **PostGIS** |
| **ORM** | Prisma |
| **Despliegue** | Vercel (Client) + Render (Server) |

---

## ⚙️ Configuración Local

Sigue estos pasos para correr el proyecto en tu máquina.

### 0. Requisitos previos

- Node.js 18+ y npm
- PostgreSQL con extensión PostGIS habilitada
- Token de Mapbox válido (cuenta gratuita)

### 1. Clonar el repositorio

```powershell
git clone https://github.com/CaCortez384/mapa-oculto.git
cd mapa-oculto
```

2) Backend (`server/`)

```powershell
cd server
npm install

# Crea un archivo .env con variables mínimas
# DATABASE_URL="postgresql://usuario:password@host:puerto/db?schema=public"
# PORT=3000

# Genera Prisma Client
npx prisma generate

# Crea/actualiza el esquema en la base de datos (requiere PostGIS instalado)
npx prisma migrate dev --name init

# Inicia en desarrollo (por defecto en http://localhost:3000)
npm run dev

# Producción (opcional)
# npm run build; npm run start
```

3) Frontend (`client/`)

```powershell
cd ../client
npm install

# Crea .env.local con:
# VITE_MAPBOX_TOKEN=tu_token
# VITE_API_URL=http://localhost:3000

# Inicia el servidor de Vite (por defecto en http://localhost:5173)
npm run dev

# Build y preview (opcional)
# npm run build; npm run preview
```

### 4) Puertos y URLs

- Backend: `http://localhost:3000` (configurable con `PORT`)
- Frontend (Vite): `http://localhost:5173`
- Variable `VITE_API_URL` debe apuntar al backend correcto (local o producción).

### 5) Orden recomendado de arranque

1. Levanta primero el backend (server) para evitar errores de conexión.
2. Luego levanta el frontend (client).

## 📁 Estructura del Proyecto

```
mapa-oculto/
├── client/          # SPA construida con React + Vite
│   ├── src/
│   └── public/
├── server/          # API RESTful + WebSockets con Node
│   ├── prisma/      # Esquemas y migraciones de DB
│   └── src/
└── Readme.md        # Documentación
```

---

## 🧪 Scripts útiles

- Frontend
	- `npm run dev` (client): inicia Vite en desarrollo.
	- `npm run build` (client): compila TypeScript y construye producción.
	- `npm run preview` (client): sirve el build localmente.
- Backend
	- `npm run dev` (server): inicia el API en desarrollo.
	- `npx prisma generate` (server): genera Prisma Client.
	- `npx prisma migrate dev` (server): aplica migraciones en desarrollo.
	- `npm run build` (server): compila TypeScript a `dist/`.
	- `npm run start` (server): arranca Node desde `dist/index.js`.


---

## ☁️ Despliegue

- Frontend en Vercel: configura variables de entorno necesarias (por ejemplo, `VITE_API_URL` apuntando al backend desplegado y `VITE_MAPBOX_TOKEN`).
- Backend en Render: define `DATABASE_URL` (PostgreSQL con PostGIS) y `PORT` (Render suele gestionar el puerto vía `PORT`). Asegúrate de habilitar CORS para el dominio del frontend.

## 🧩 Problemas comunes

- Error de conexión a DB: verifica `DATABASE_URL` y que PostGIS esté instalado/activado.
- Mapa no carga: revisa `VITE_MAPBOX_TOKEN` y que el dominio esté autorizado.
- Likes o tiempo real no funcionan: confirma `VITE_API_URL` correcto y que el backend esté arriba; valida conexión de Socket.io.

## 👤 Autor

Desarrollado con ❤️ por Carlos Cortez.
---

## 📝 Licencia

Este proyecto está bajo la licencia MIT.

Si utilizas este código, por favor añade o consulta el archivo `LICENSE` con el texto de la licencia MIT.