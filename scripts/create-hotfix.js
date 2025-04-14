#!/usr/bin/env node

/**
 * Script para crear ramas de hotfix desde el último tag de producción
 * Uso: npm run create-hotfix "descripción-breve"
 */

const { execSync } = require('child_process');
const path = require('path');

// Colores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Funciones auxiliares
function execCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch (error) {
    console.error(`${colors.red}Error ejecutando: ${command}${colors.reset}`);
    console.error(error.message);
    process.exit(1);
  }
}

function checkCleanRepo() {
  const status = execCommand('git status --porcelain');
  if (status) {
    console.error(`${colors.red}Error: El repositorio tiene cambios sin commitear:${colors.reset}`);
    console.error(status);
    console.error(`${colors.yellow}Por favor, haz commit o stash de tus cambios antes de crear un hotfix.${colors.reset}`);
    process.exit(1);
  }
}

function getLatestProductionTag() {
  try {
    // Obtener todos los tags ordenados por versión semántica (asumiendo que son vX.Y.Z)
    // y tomar el más reciente
    const tags = execCommand('git tag -l "v*" --sort=-v:refname');
    const latestTag = tags.split('\n')[0];
    
    if (!latestTag) {
      console.error(`${colors.red}Error: No se encontraron tags de versión en el repositorio.${colors.reset}`);
      console.error(`${colors.yellow}Asegúrate de que exista al menos un tag con formato v*.*.* en el repositorio.${colors.reset}`);
      process.exit(1);
    }
    
    return latestTag;
  } catch (error) {
    console.error(`${colors.red}Error obteniendo el último tag de producción:${colors.reset}`);
    console.error(error.message);
    process.exit(1);
  }
}

function validateBranchName(description) {
  // Validar que la descripción sea adecuada para un nombre de rama
  const sanitized = description
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Reemplazar caracteres no alfanuméricos con guiones
    .replace(/^-+|-+$/g, '');    // Eliminar guiones al inicio y final
  
  if (!sanitized) {
    console.error(`${colors.red}Error: La descripción no genera un nombre de rama válido.${colors.reset}`);
    console.error(`${colors.yellow}Por favor, proporciona una descripción con caracteres alfanuméricos.${colors.reset}`);
    process.exit(1);
  }
  
  return sanitized;
}

function createHotfixBranch(description) {
  const sanitizedName = validateBranchName(description);
  const branchName = `hotfix/${sanitizedName}`;
  const latestTag = getLatestProductionTag();
  
  console.log(`${colors.blue}Última versión de producción: ${colors.cyan}${latestTag}${colors.reset}`);
  console.log(`${colors.blue}Creando rama de hotfix: ${colors.cyan}${branchName}${colors.reset}`);
  
  // Asegurarse de tener el último tag
  execCommand(`git fetch --tags`);
  
  // Crear rama de hotfix desde el tag
  execCommand(`git checkout ${latestTag}`);
  execCommand(`git checkout -b ${branchName}`);
  
  // Configurar el upstream
  execCommand(`git push -u origin ${branchName}`);
  
  console.log(`\n${colors.green}✓ Rama de hotfix creada exitosamente: ${colors.cyan}${branchName}${colors.reset}`);
  console.log(`${colors.green}✓ Rama basada en el tag de producción: ${colors.cyan}${latestTag}${colors.reset}`);
  console.log(`\n${colors.magenta}Importante:${colors.reset}`);
  console.log(`${colors.yellow}1. Implementa la corrección mínima necesaria${colors.reset}`);
  console.log(`${colors.yellow}2. Haz commit de tus cambios${colors.reset}`);
  console.log(`${colors.yellow}3. Crea un PR hacia main usando la plantilla de hotfix${colors.reset}`);
}

// Función principal
function main() {
  const args = process.argv.slice(2);
  
  if (args.length !== 1) {
    console.error(`${colors.red}Error: Debes proporcionar una descripción breve para el hotfix.${colors.reset}`);
    console.error(`${colors.yellow}Uso: npm run create-hotfix "descripción-breve"${colors.reset}`);
    process.exit(1);
  }
  
  const description = args[0];
  
  console.log(`${colors.magenta}=== Creador de Hotfix ====${colors.reset}`);
  
  // Verificar que el repo esté limpio
  checkCleanRepo();
  
  // Crear la rama de hotfix
  createHotfixBranch(description);
}

// Ejecutar
main(); 