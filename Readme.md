# 🗺️ Mapa Oculto

> Plataforma geoespacial colaborativa para compartir historias anónimas, secretos y sucesos geolocalizados en tiempo real.

![Status](https://img.shields.io/badge/Status-Active-success)
![Stack](https://img.shields.io/badge/Stack-React%20%2B%20Node%20%2B%20Prisma-blue)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

## 🔗 Demo

- Frontend: https://mapa-oculto.vercel.app/
- Backend: Render (URL variable según despliegue)

> Permite la geolocalización del navegador para una mejor experiencia.

---

## 🚀 Descripción

Mapa Oculto permite publicar y descubrir historias en ubicaciones específicas. Incluye geolocalización automática, filtrado por categorías, reacciones (likes) y visualización de pines con códigos de color.

---

## 📸 Captura

![Captura del proyecto](./screenshot.png)

---

## 🛠️ Tecnologías

- Frontend: React + Vite, TypeScript
- Mapas: Mapbox GL JS
- Backend: Node.js (TypeScript), Express
- ORM: Prisma
- Base de datos: PostgreSQL (PostGIS)

---

## 📦 Requisitos

- Node.js 18+ y npm
- Cuenta/DB PostgreSQL (ideal con PostGIS)
- Token de Mapbox

---

## ⚙️ Configuración local (Windows PowerShell)

1) Clonar y entrar al proyecto

```powershell
git clone https://github.com/CaCortez384/mapa-oculto.git
cd mapa-oculto
```

2) Backend (`server/`)

```powershell
cd server
npm install

# Crea .env con tu cadena de conexión
# DATABASE_URL="postgresql://usuario:password@host:puerto/db?schema=public"

# Genera Prisma Client
npx prisma generate

# Inicia en desarrollo
npm run dev
```

3) Frontend (`client/`)

```powershell
cd ../client
npm install

# Crea .env.local con:
# VITE_MAPBOX_TOKEN=tu_token
# VITE_API_URL=http://localhost:3000

# Inicia el servidor de Vite
npm run dev
```

> Por defecto el backend suele correr en `http://localhost:3000` y el frontend en `http://localhost:5173` (ajústalo si tu configuración difiere).

---

## �️ Prisma y Base de Datos

- Esquema: `server/prisma/schema.prisma`
- Migraciones: usa `prisma migrate dev` tras cambios en el esquema.
- PostGIS: recomienda usar tipo `geography` y crear índices GIST para consultas espaciales.

Ejemplo de índice espacial:

```sql
CREATE INDEX "location_idx" ON "Story" USING GIST ("location");
```

---

## 📁 Estructura del Proyecto

```
client/          # SPA en React + Vite
server/          # API en Node + Express + Prisma
Readme.md        # Este archivo
```

---

## 🧪 Scripts útiles

- Frontend
	- `npm run dev` (client): inicia Vite en desarrollo.
- Backend
	- `npm run dev` (server): inicia el API en desarrollo.
	- `npx prisma generate` (server): genera Prisma Client.


---

## 👤 Autor

Desarrollado por Carlos Cortez.

---

## 📝 Licencia

MIT