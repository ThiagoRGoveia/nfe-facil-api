#!/bin/bash

# Script to generate the DatabaseLib and move original source files/directories.

# Exit on any error
set -e

LIB_NAME="DatabaseLib"
LIB_PREFIX="defaultLibraryPrefix"

# Source directories and files for DatabaseLib
SOURCE_ENTITIES_DIR="apps/api/src/infra/persistence/mikro-orm/entities"
SOURCE_SQL_ENTITY_MANAGER_PROVIDER="apps/api/src/infra/persistence/mikro-orm/sql-entity-manager.provider.ts"
BASE_IMPORTS_PATH="apps/api/base-module-imports.ts"

# Convert LIB_NAME to kebab-case for directory and file naming conventions
LIB_NAME_KEBAB=$(echo "${LIB_NAME}" | sed -e 's/\([A-Z]\)/-\1/g' -e 's/^-//' | tr '[:upper:]' '[:lower:]')

TARGET_LIB_ROOT_DIR="libs/${LIB_NAME_KEBAB}"
TARGET_LIB_SRC_DIR="${TARGET_LIB_ROOT_DIR}/src"
MIGRATED_SOURCE_SUBDIR="core"

echo "Starting migration for ${LIB_NAME} (directory: ${TARGET_LIB_ROOT_DIR})..."

# 1. Generate the new library using Nest CLI
echo "Generating ${LIB_NAME} library with prefix @${LIB_PREFIX} (directory ${TARGET_LIB_ROOT_DIR})..."
if echo "${LIB_PREFIX}" | nest generate library ${LIB_NAME}; then
    echo "Library ${LIB_NAME} generated successfully."
else
    echo "ERROR: Failed to generate library ${LIB_NAME}. Please check Nest CLI output."
    exit 1
fi

# 2. Move original entities directory and SQL EntityManager provider
echo "Moving original source files/directories to ${TARGET_LIB_SRC_DIR}/${MIGRATED_SOURCE_SUBDIR}/..."
mkdir -p "${TARGET_LIB_SRC_DIR}/${MIGRATED_SOURCE_SUBDIR}/apps/api/src/infra/persistence/mikro-orm/"

if [ -d "${SOURCE_ENTITIES_DIR}" ]; then
    mv "${SOURCE_ENTITIES_DIR}" "${TARGET_LIB_SRC_DIR}/${MIGRATED_SOURCE_SUBDIR}/apps/api/src/infra/persistence/mikro-orm/entities"
    echo "Moved ${SOURCE_ENTITIES_DIR} to ${TARGET_LIB_SRC_DIR}/${MIGRATED_SOURCE_SUBDIR}/apps/api/src/infra/persistence/mikro-orm/entities"
else
    echo "WARNING: Source directory ${SOURCE_ENTITIES_DIR} does not exist. Skipping move operation."
fi

if [ -f "${SOURCE_SQL_ENTITY_MANAGER_PROVIDER}" ]; then
    mv "${SOURCE_SQL_ENTITY_MANAGER_PROVIDER}" "${TARGET_LIB_SRC_DIR}/${MIGRATED_SOURCE_SUBDIR}/apps/api/src/infra/persistence/mikro-orm/"
    echo "Moved ${SOURCE_SQL_ENTITY_MANAGER_PROVIDER} to ${TARGET_LIB_SRC_DIR}/${MIGRATED_SOURCE_SUBDIR}/apps/api/src/infra/persistence/mikro-orm/"
else
    echo "WARNING: Source file ${SOURCE_SQL_ENTITY_MANAGER_PROVIDER} does not exist. Skipping move operation."
fi

echo ""
echo "---------------------------------------------------------------------"
echo "MANUAL STEPS REQUIRED for ${LIB_NAME} (@${LIB_PREFIX}/${LIB_NAME_KEBAB}):"
echo "---------------------------------------------------------------------"
echo "1. Open the new library in your IDE: ${TARGET_LIB_ROOT_DIR}"
echo "2. Review the generated files:"
echo "   - Module:  ${TARGET_LIB_SRC_DIR}/${LIB_NAME_KEBAB}.module.ts"
echo "   - Service: ${TARGET_LIB_SRC_DIR}/${LIB_NAME_KEBAB}.service.ts (likely not needed or will be minimal)"
echo "   - Index:   ${TARGET_LIB_SRC_DIR}/index.ts"
echo ""
echo "3. Integrate MikroORM setup and entities:"
echo "   - Copy the entity files from '${TARGET_LIB_SRC_DIR}/${MIGRATED_SOURCE_SUBDIR}/apps/api/src/infra/persistence/mikro-orm/entities/'"
echo "     into a new directory like '${TARGET_LIB_SRC_DIR}/entities/'. Update their internal imports if necessary."
echo "   - Copy 'sql-entity-manager.provider.ts' from '${TARGET_LIB_SRC_DIR}/${MIGRATED_SOURCE_SUBDIR}/apps/api/src/infra/persistence/mikro-orm/'"
echo "     into '${TARGET_LIB_SRC_DIR}/sql-entity-manager.provider.ts'."
echo "   - Open '${BASE_IMPORTS_PATH}' (the original base-module-imports.ts)."
echo "   - Copy the entire 'MikroOrmModule.forRootAsync({...})' configuration object from it."
echo "   - In the new '${LIB_NAME_KEBAB}.module.ts', replace its 'imports' array (if any) with this MikroOrmModule configuration."
echo "     You will need to import 'MikroOrmModule' from '@mikro-orm/nestjs', 'ConfigService' from '@nestjs/config',"
echo "     'defineConfig' from '@mikro-orm/postgresql', 'Migrator' from '@mikro-orm/migrations', etc."
echo "   - CRITICAL: Update the 'entities' and 'entitiesTs' paths in the copied MikroORM config to point to the new location"
echo "     within this library (e.g., '${TARGET_LIB_SRC_DIR}/entities'). You might need to create an 'index.ts' in your new entities folder"
echo "     that exports all entities, and then reference that index file."
echo "   - Add 'SqlEntityManagerProvider' to the 'providers' and 'exports' array of '${LIB_NAME_KEBAB}.module.ts'."
echo "   - Ensure 'ConfigModule.forRoot({ isGlobal: true })' is set up in any application that consumes this DatabaseLib,"
echo "     as the MikroORM config relies on 'ConfigService'."
echo ""
echo "4. The generated '${LIB_NAME_KEBAB}.service.ts' is likely not needed. Consider removing it."
echo "   The main export of this library will be its module."
echo ""
echo "5. After successful migration and integration, you can clean up by deleting:
   - The '${TARGET_LIB_SRC_DIR}/${MIGRATED_SOURCE_SUBDIR}' directory.
   - The original source files/directories: '${SOURCE_ENTITIES_DIR}', '${SOURCE_SQL_ENTITY_MANAGER_PROVIDER}'"
echo "   - The MikroORM setup from '${BASE_IMPORTS_PATH}' (once all apps use this lib)."
echo ""
echo "6. IMPORTANT: Update import paths in other parts of the monorepo that previously relied on the old entity paths or baseImports for DB"
echo "   to now use '@${LIB_PREFIX}/${LIB_NAME_KEBAB}' once the library is ready."
   echo "   (This step is for later, as per instructions to ignore application of the library for now)."
echo "---------------------------------------------------------------------"
echo ""
echo "${LIB_NAME} migration script finished."
echo "Please review the output and perform the manual integration steps."
