#!/bin/bash

# Script to generate the LoggerLib.

# Exit on any error
set -e

LIB_NAME="LoggerLib"
LIB_PREFIX="defaultLibraryPrefix"
BASE_IMPORTS_PATH="apps/api/base-module-imports.ts"

# Convert LIB_NAME to kebab-case for directory and file naming conventions
LIB_NAME_KEBAB=$(echo "${LIB_NAME}" | sed -e 's/\([A-Z]\)/-\1/g' -e 's/^-//' | tr '[:upper:]' '[:lower:]')

TARGET_LIB_ROOT_DIR="libs/${LIB_NAME_KEBAB}"
TARGET_LIB_SRC_DIR="${TARGET_LIB_ROOT_DIR}/src"

echo "Starting generation for ${LIB_NAME} (directory: ${TARGET_LIB_ROOT_DIR})..."

# 1. Generate the new library using Nest CLI
echo "Generating ${LIB_NAME} library with prefix @${LIB_PREFIX} (directory ${TARGET_LIB_ROOT_DIR})..."
if echo "${LIB_PREFIX}" | nest generate library ${LIB_NAME}; then
    echo "Library ${LIB_NAME} generated successfully."
else
    echo "ERROR: Failed to generate library ${LIB_NAME}. Please check Nest CLI output."
    exit 1
fi

echo ""
echo "---------------------------------------------------------------------"
echo "MANUAL STEPS REQUIRED for ${LIB_NAME} (@${LIB_PREFIX}/${LIB_NAME_KEBAB}):"
echo "---------------------------------------------------------------------"
echo "1. Open the new library in your IDE: ${TARGET_LIB_ROOT_DIR}"
echo "2. Review the generated files:"
echo "   - Module:  ${TARGET_LIB_SRC_DIR}/${LIB_NAME_KEBAB}.module.ts"
echo "   - Service: ${TARGET_LIB_SRC_DIR}/${LIB_NAME_KEBAB}.service.ts (likely not needed)"
echo "   - Index:   ${TARGET_LIB_SRC_DIR}/index.ts"
echo ""
echo "3. Integrate LoggerModule configuration:"
echo "   - Open '${BASE_IMPORTS_PATH}' (the original base-module-imports.ts)."
echo "   - Find the 'LoggerModule.forRootAsync({...})' configuration object."
echo "   - In the new '${LIB_NAME_KEBAB}.module.ts', replace its 'imports' array (if any) with this LoggerModule configuration."
echo "     You will need to import 'LoggerModule' from 'nestjs-pino', 'ConfigService' from '@nestjs/config', etc."
echo "     The module should look something like:"
echo "       import { Module } from '@nestjs/common';"
echo "       import { ConfigModule, ConfigService } from '@nestjs/config';"
echo "       import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';"

echo "       @Module({"
echo "         imports: ["
echo "           PinoLoggerModule.forRootAsync({"
echo "             imports: [ConfigModule], // Ensure ConfigModule is available or passed in"
echo "             inject: [ConfigService],"
echo "             useFactory: (configService: ConfigService) => ({ /* ... your pino options ... */ }),"
echo "           }),"
echo "         ],"
echo "         exports: [PinoLoggerModule], // Export the configured LoggerModule"
echo "       })"
echo "       export class ${LIB_NAME_KEBAB^}Module {}"
echo "   - Ensure 'ConfigModule.forRoot({ isGlobal: true })' is set up in any application that consumes this LoggerLib,"
echo "     or configure this library to accept ConfigService/ConfigModule from the consuming application."
echo ""
echo "4. The generated '${LIB_NAME_KEBAB}.service.ts' is likely not needed. Consider removing it."
echo "   The main export of this library will be its configured module."
echo ""
echo "5. After successful migration and integration, you can remove the LoggerModule setup from '${BASE_IMPORTS_PATH}'"
echo "   (once all apps use this lib)."
echo ""
echo "6. IMPORTANT: Update import paths in other parts of the monorepo that previously relied on baseImports for LoggerModule"
echo "   to now import and use '@${LIB_PREFIX}/${LIB_NAME_KEBAB}' once the library is ready."
   echo "   (This step is for later, as per instructions to ignore application of the library for now)."
echo "---------------------------------------------------------------------"
echo ""
echo "${LIB_NAME} generation script finished."
echo "Please review the output and perform the manual integration steps."
