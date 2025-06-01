#!/bin/bash

# Script to generate the AuthLib and move original source files.

# Exit on any error
set -e

LIB_NAME="AuthLib"
LIB_PREFIX="defaultLibraryPrefix"
SOURCE_MODULE_DIR="apps/api/src/infra/auth"

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

# 2. Move original source files into the new library structure for manual integration
echo "Moving original source files from ${SOURCE_MODULE_DIR} to ${TARGET_LIB_SRC_DIR}/${MIGRATED_SOURCE_SUBDIR}/..."
if [ ! -d "${SOURCE_MODULE_DIR}" ]; then
    echo "WARNING: Source directory ${SOURCE_MODULE_DIR} does not exist. Skipping move operation."
else
    if [ -z "$(ls -A ${SOURCE_MODULE_DIR})" ]; then
        echo "WARNING: Source directory ${SOURCE_MODULE_DIR} is empty. Nothing to move."
    else
        mkdir -p "${TARGET_LIB_SRC_DIR}/${MIGRATED_SOURCE_SUBDIR}"
        # Move all contents
        shopt -s dotglob nullglob
        mv ${SOURCE_MODULE_DIR}/* "${TARGET_LIB_SRC_DIR}/${MIGRATED_SOURCE_SUBDIR}/"
        shopt -u dotglob nullglob
        echo "Original files moved from ${SOURCE_MODULE_DIR}."
    fi
fi

echo ""
echo "---------------------------------------------------------------------"
echo "MANUAL STEPS REQUIRED for ${LIB_NAME} (@${LIB_PREFIX}/${LIB_NAME_KEBAB}):"
echo "---------------------------------------------------------------------"
echo "1. Open the new library in your IDE: ${TARGET_LIB_ROOT_DIR}"
echo "2. Review the generated files:"
echo "   - Module:  ${TARGET_LIB_SRC_DIR}/${LIB_NAME_KEBAB}.module.ts"
echo "   - Service: ${TARGET_LIB_SRC_DIR}/${LIB_NAME_KEBAB}.service.ts (likely to be replaced or augmented by original auth services)"
echo "   - Index:   ${TARGET_LIB_SRC_DIR}/index.ts"
echo ""
echo "3. Integrate logic from the original module (now in '${TARGET_LIB_SRC_DIR}/${MIGRATED_SOURCE_SUBDIR}/'):"
echo "   - Examine the original '${MIGRATED_SOURCE_SUBDIR}/auth.module.ts'."
echo "   - Replicate its imports (e.g., JwtModule, PassportModule, potentially UsersLib once available), providers (AuthService, JwtStrategy, etc.), and exports in the new '${LIB_NAME_KEBAB}.module.ts'."
echo "   - Move services (e.g., auth.service.ts), strategies (jwt.strategy.ts), guards (jwt-auth.guard.ts), decorators, and DTOs from '${MIGRATED_SOURCE_SUBDIR}/' into appropriate subdirectories within '${TARGET_LIB_SRC_DIR}/'."
echo "     For example: '${TARGET_LIB_SRC_DIR}/services/', '${TARGET_LIB_SRC_DIR}/strategies/', '${TARGET_LIB_SRC_DIR}/guards/' etc."
echo "   - The generated '${LIB_NAME_KEBAB}.service.ts' can be removed if you are migrating an existing AuthService."
echo "   - Update all internal import paths within the migrated files to reflect their new locations within the library."
echo ""
echo "4. Ensure the main 'index.ts' exports the module and any key components like guards or services that consuming apps might need directly."
echo ""
echo "5. After successful migration and integration, you can clean up by deleting:
   - The '${TARGET_LIB_SRC_DIR}/${MIGRATED_SOURCE_SUBDIR}' directory.
   - The original source directory: '${SOURCE_MODULE_DIR}' (if empty and all content is migrated)."
echo ""
echo "6. IMPORTANT: Update import paths in other parts of the monorepo that previously imported from"
echo "   '${SOURCE_MODULE_DIR}' to now use '@${LIB_PREFIX}/${LIB_NAME_KEBAB}' once the library is ready."
   echo "   (This step is for later, as per instructions to ignore application of the library for now)."
echo "---------------------------------------------------------------------"
echo ""
echo "${LIB_NAME} migration script finished."
echo "Please review the output and perform the manual integration steps."
