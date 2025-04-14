# ===========================================
# MULTI-STAGE BUILD PARA OPTIMIZACIÓN
# ===========================================

# Stage 1: Dependencias de desarrollo y construcción
FROM node:20-alpine AS builder

# Establecer variables de entorno para optimizar Node
ENV NODE_ENV=development
ENV NPM_CONFIG_LOGLEVEL=error
ENV NPM_CONFIG_UPDATE_NOTIFIER=false

# Crear usuario no privilegiado para la construcción
RUN addgroup -S nestapp && \
    adduser -S -G nestapp nestapp && \
    mkdir -p /home/nestapp/app && \
    chown -R nestapp:nestapp /home/nestapp

# Cambiar al directorio de trabajo
WORKDIR /home/nestapp/app

# Copiar solo los archivos de configuración primero (para mejorar el caching)
COPY --chown=nestapp:nestapp package*.json yarn.lock* pnpm-lock.yaml* nest-cli.json tsconfig*.json ./

# Instalar dependencias con un gestor de paquetes determinístico
RUN npm ci --only=development && npm cache clean --force

# Copiar el código fuente de la aplicación
COPY --chown=nestapp:nestapp src/ src/

# Compilar la aplicación
RUN npm run build

# Stage 2: Generar solo las dependencias de producción
FROM node:20-alpine AS production-deps

WORKDIR /app
COPY --chown=node:node package*.json yarn.lock* pnpm-lock.yaml* ./
ENV NODE_ENV=production
RUN npm ci --only=production && npm cache clean --force

# Stage 3: Imagen final y liviana para producción
FROM node:20-alpine AS production

# Variables de entorno para producción
ENV NODE_ENV=production
ENV TZ=UTC
ENV PORT=3000

# Crear usuario no privilegiado y aplicar hardening
RUN addgroup -S nestapp && \
    adduser -S -G nestapp nestapp && \
    mkdir -p /home/nestapp/app && \
    chown -R nestapp:nestapp /home/nestapp && \
    apk add --no-cache dumb-init tzdata && \
    rm -rf /var/cache/apk/*

WORKDIR /home/nestapp/app

# Copiar solamente los artefactos necesarios para producción
COPY --chown=nestapp:nestapp --from=builder /home/nestapp/app/dist ./dist
COPY --chown=nestapp:nestapp --from=builder /home/nestapp/app/package.json ./
COPY --chown=nestapp:nestapp --from=production-deps /app/node_modules ./node_modules

# Configurar health check para verificar que la aplicación esté funcionando
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:$PORT/health || exit 1

# Ejecutar la aplicación como usuario no privilegiado
USER nestapp

# Exponer el puerto para la aplicación
EXPOSE $PORT

# Utilizar dumb-init como init system para manejar señales correctamente
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/main"]