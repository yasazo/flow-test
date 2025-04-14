# Flujo de Trabajo DevOps

## 1. Desarrollo de Características Nuevas

### Flujo estándar:
1. **Inicio**:
   - Desarrollador crea una rama desde `main` (ej. `feature/nueva-funcionalidad`)

2. **Desarrollo**:
   - Implementa y prueba la característica localmente (pueden apuntar a qa desde local)

3. **Push de la feature**:
   - El `push` desencadena la ejecucion de `ci validation` que ejecuta `dependencias, lint, test y build`

4. **Pull Request**:
   - Crea PR a `main` con la nueva característica

5. **Revisión**:
   - El PR pasa por Code Review y pruebas automatizadas (ejecuta `ci validation`)

6. **Merge a main**:
   - Una vez aprobado y validado, se fusiona a `main`

7. **CI/CD Automático**:
   - El workflow `ci.yml` detecta cambio en `main`
   - Ejecuta dependencias, pruebas, linting, y build
   - Construye y publica imagen Docker
   - Etiqueta la imagen para QA y Sandbox
   - **Crea automáticamente un Release Candidate (RC)**
   - El RC tiene formato `rc-YYYY.MM.DD.HHMM` (ej. `rc-2023.03.25.1430`)

8. **Despliegue Automático**:
   - El RC se despliega automáticamente a entornos QA y Sandbox
   - Kubernetes gestiona el despliegue con health checks
   - si se introduce un error debemos solucionarlo ASAP `MTTR de 2 horas`

## 2. Corrección de Errores en un RC

### Flujo de corrección:
1. **Detección**:
   - Se identifica un error durante pruebas en un RC existente (ej. `rc-2023.03.25.1430`)

2. **Corrección directa**:
   - El desarrollador trabaja directamente en la rama del RC
   - Implementa la corrección y prueba localmente

3. **Pruebas automatizadas**:
   - La corrección se despliega automáticamente a QA y Sandbox para validación
   - Se realizan pruebas en estos entornos

4. **Integración a main**:
   - Se crea un PR desde la rama RC hacia `main`
   - El PR pasa por revisión y pruebas
   - Se aprueba y fusiona a `main`

5. **Detección inteligente**:
   - El workflow `ci.yml` detecta que el commit proviene de un RC
   - **NO genera un nuevo RC redundante**
   - Emite una notificación especial sobre la integración del fix

6. **Resultado**:
   - El RC original contiene la corrección y sigue en proceso de validación
   - `Main` incorpora la corrección para todo desarrollo futuro

## 3. Promoción de RC a Producción

### Flujo de promoción:
1. **Validación completa**:
   - El RC pasa todas las pruebas en QA y Sandbox

2. **Iniciar promoción**:
   - Un administrador inicia manualmente el workflow `promotion.yml`
   - Especifica el tag del RC aprobado (ej. `rc-2023.03.25.1430`)

3. **Cálculo de versión**:
   - El sistema utiliza semantic-release para calcular la versión adecuada
   - Basado en los tipos de commit según `.releaserc.json`
   - Genera una versión semántica (ej. `v1.2.0`)

4. **Promoción a producción**:
   - Etiqueta la imagen Docker con la versión y como `latest`
   - Crea un tag en git con la versión
   - Genera un release en GitHub

5. **Documentación**:
   - Se genera automáticamente un changelog basado en los commits

## 4. Hotfix para Producción

### Flujo único estandarizado:
1. **Problema crítico**:
   - Se detecta un problema en producción que requiere corrección inmediata

2. **Crear rama hotfix con origen estándar**:
   - Se crea una rama con formato `hotfix/descripcion-breve` usando el comando:
     ```bash
     npm run create-hotfix "descripción-breve"
     ```
   - **IMPORTANTE**: El script asegura que la rama se crea desde el último tag de versión en producción
   - Se implementa la corrección mínima necesaria

3. **Pull Request a main**:
   - Se crea PR hacia `main` utilizando la plantilla específica para hotfixes
   - Se incluye toda la información requerida sobre el problema
   - Se revisa y prueba según protocolos de emergencia
   - PR recibe la etiqueta `hotfix` automáticamente

4. **Merge a main**:
   - Una vez aprobado, se fusiona a `main`
   - El sistema reconoce automáticamente el origen del hotfix

5. **Procesamiento CI/CD inteligente**:
   - El workflow `ci.yml` detecta que el commit proviene de una rama hotfix
   - Ejecuta validaciones críticas sin redundancias
   - Genera un RC etiquetado especialmente como hotfix
   - Emite notificaciones prioritarias para el equipo

6. **Despliegue para validación**:
   - La corrección se despliega automáticamente a QA y Sandbox
   - Se realizan pruebas aceleradas pero exhaustivas

7. **Promoción a producción**:
   - Una vez validado, se inicia el workflow `promotion.yml`
   - Se especifica el RC generado por el hotfix
   - El sistema incrementa automáticamente la versión PATCH
   - Se despliega a producción con monitoreo especial

8. **Sincronización automática**:
   - El sistema sincroniza automáticamente los cambios a `develop`
   - Se garantiza que todos los entornos reciben la corrección
   - Se generan notificaciones de confirmación

9. **Documentación especial**:
   - El hotfix se destaca en el changelog automáticamente
   - Se incluye información detallada en las notas de release

## 5. Actualizaciones de Dependencias con Dependabot

### Flujo para dependencias:
1. **Escaneo diario de seguridad**:
   - Dependabot busca vulnerabilidades de seguridad todos los días
   - Actualizaciones de seguridad agrupadas en un solo PR
   - Prioridad alta con etiqueta `high-priority`

2. **Actualizaciones regulares semanales agrupadas**:
   - **Patches**: Todas las actualizaciones patch agrupadas en un PR
   - **Minor**: Todas las actualizaciones minor agrupadas en un PR
   - **Major**: Todas las actualizaciones major agrupadas en un PR
   - Programadas para los lunes para minimizar interrupciones

3. **Automatización inteligente**:
   - **Auto-aprobación y merge**:
     - Actualizaciones de seguridad
     - Actualizaciones patch
   - **Notificación y revisión manual**:
     - Actualizaciones minor
   - **Revisión obligatoria**:
     - Actualizaciones major (etiquetadas como `requires-review`)

4. **Integración con CI**:
   - Todas las actualizaciones pasan por el pipeline completo de CI
   - Solo se fusionan automáticamente si pasan todas las pruebas

5. **Generación de RC**:
   - Al fusionarse a `main`, generan RCs normales para validación
   - Siguen el mismo proceso de cualquier otro cambio

## Puntos Clave del Flujo

### Flujo unificado:
- Todos los cambios (features, fixes, hotfixes, dependencias) siguen un flujo común
- Comportamiento específico basado en el tipo de rama origen
- Simplifica mantenimiento y trazabilidad

### Prevención de redundancia de RCs:
- Detección inteligente del origen de los commits
- Evita generar RCs redundantes para:
  - Correcciones desde ramas RC
  - Correcciones desde ramas hotfix

### Gestión inteligente de dependencias:
- Actualizaciones agrupadas por tipo reducen la sobrecarga
- Políticas de automatización según nivel de riesgo
- Actualizaciones críticas de seguridad priorizadas

### Versionado semántico:
- Basado en convenciones de commit aplicadas por cursor en base a releaserc.json y .cursor/commit-template
- Promociones regulares siguen semantic versioning completo

### Protección en despliegues:
- Kubernetes con replicasets mantiene disponibilidad
- Health probes previenen que versiones defectuosas afecten a usuarios

### Trazabilidad completa:
- Cada imagen Docker tiene referencia clara al commit
- Sistema de etiquetado consistente
- Registro automático de cambios en los releases

## 6. Verificación de Calidad Local con Pre-commit Hooks

### Flujo de verificación local:
1. **Pre-commit hooks con Husky**:
   - Cada commit pasa automáticamente por verificaciones de calidad
   - El proceso ejecuta lint y pruebas en los archivos modificados
   - Previene commits con código que no cumple los estándares

2. **Beneficios**:
   - Detecta problemas antes de que lleguen al repositorio
   - Reduce la carga en el CI al identificar errores localmente
   - Mantiene consistencia en el código base
   - Acelera el ciclo de feedback para el desarrollador

3. **Consideraciones**:
   - Para commits de emergencia, se puede usar `git commit --no-verify`
   - La configuración puede ajustarse en package.json en la sección lint-staged
   - Las pruebas ejecutadas son selectivas para mantener tiempos de respuesta rápidos
