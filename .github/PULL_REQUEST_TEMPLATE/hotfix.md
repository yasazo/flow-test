---
name: Hotfix
about: Pull Request para corregir un problema en producción
title: '[HOTFIX] '
labels: hotfix, high-priority
assignees: ''
---

## 🚨 Descripción del Problema

<!-- Describe claramente el problema encontrado en producción que requiere esta corrección -->

### Impacto en Producción
<!-- Describe el impacto actual del problema en usuarios/sistema -->

- Severidad: <!-- Alta/Media/Baja -->
- Usuarios afectados: <!-- Todos/Algunos/Pocos -->
- Desde cuándo existe el problema: <!-- fecha aproximada -->

## 🛠️ Solución Implementada

<!-- Describe brevemente cómo has solucionado el problema -->

### Origen del Hotfix
<!-- Verifica que el hotfix se creó correctamente desde el último tag de producción -->

- [ ] Este hotfix fue creado desde el último tag de producción usando `npm run create-hotfix`
- [ ] Este hotfix fue creado manualmente desde el tag: <!-- indicar versión -->

## ✅ Verificación

<!-- Marca las casillas que apliquen -->

- [ ] Se ha implementado la corrección mínima necesaria
- [ ] Se han añadido tests que cubren el fix
- [ ] Se ha verificado que la solución funciona localmente
- [ ] No introduce cambios adicionales no relacionados con la corrección

## 🧪 Pruebas Realizadas

<!-- Describe las pruebas que has realizado para verificar la corrección -->

## 📋 Pasos para Verificar

<!-- Lista los pasos necesarios para verificar que el hotfix soluciona el problema -->

1. 
2. 
3. 

## 📝 Notas Adicionales

<!-- Cualquier información adicional relevante -->

## ⚠️ Consideraciones para Despliegue

<!-- Incluye cualquier consideración especial para el despliegue de este hotfix -->

- [ ] No requiere cambios en la base de datos
- [ ] No requiere configuración adicional
- [ ] No tiene dependencias con otros sistemas

<!-- 
IMPORTANTE:
Este PR será revisado con máxima prioridad. Por favor, asegúrate de proporcionar
toda la información necesaria para facilitar una revisión rápida y efectiva.
--> 