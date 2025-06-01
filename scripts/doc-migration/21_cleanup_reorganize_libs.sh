#!/bin/bash

# Script to clean up and reorganize generated NestJS libraries.
# It performs the following actions for each library in the libs/ directory:
# 1. Removes the generated .service.ts file from src/.
# 2. Removes the generated .service.spec.ts file from src/.
# 3. Moves the generated .module.ts file from src/ to the library's root directory.
# 4. Removes the old src/index.ts file.
# 5. Creates a new index.ts file at the library's root, exporting only the moved module.
# 6. Attempts to update tsconfig.base.json (or tsconfig.json) paths.

# Exit on any error
set -e

echo "Starting library cleanup and reorganization..."

# Loop through each directory in libs/
# The trailing slash ensures we only match directories
for LIB_ROOT_DIR_LOOP in libs/*/; do
  # Ensure it's a directory
  if [ ! -d "${LIB_ROOT_DIR_LOOP}" ]; then
    continue
  fi

  # Get the library name (kebab-case) from the directory path
  lib_name_kebab=$(basename "${LIB_ROOT_DIR_LOOP%/}") # Remove trailing slash from loop var for clean basename
  echo ""
  echo "-----------------------------------------------------"
  echo "Processing library: ${lib_name_kebab}"
  echo "-----------------------------------------------------"

  # Absolute path to the library's root directory, e.g., /path/to/libs/users-lib
  LIB_ROOT_ABS_PATH=$(cd "${LIB_ROOT_DIR_LOOP}" && pwd -P)
  # Absolute path to the library's src directory, e.g., /path/to/libs/users-lib/src
  LIB_SRC_ABS_PATH="${LIB_ROOT_ABS_PATH}/src"

  # Determine the source module filename within src/
  # Default is the Nest CLI generated name, e.g., users-lib.module.ts. This will be used if no specific case matches or if the specific file isn't found.
  tentative_source_module_filename_in_src="${lib_name_kebab}.module.ts"

  # Check for specific, potentially "original" module names that might have been kept from migrated source.
  # If a specific file (e.g., users.module.ts) is found in src/, that will be used as the source.
  case "${lib_name_kebab}" in
    "users-lib")
      if [ -f "${LIB_SRC_ABS_PATH}/users.module.ts" ]; then tentative_source_module_filename_in_src="users.module.ts"; fi
      ;;
    "user-credits-lib")
      if [ -f "${LIB_SRC_ABS_PATH}/user-credits.module.ts" ]; then tentative_source_module_filename_in_src="user-credits.module.ts"; fi
      ;;
    "documents-lib")
      if [ -f "${LIB_SRC_ABS_PATH}/documents.module.ts" ]; then tentative_source_module_filename_in_src="documents.module.ts"; fi
      ;;
    "templates-lib")
      if [ -f "${LIB_SRC_ABS_PATH}/templates.module.ts" ]; then tentative_source_module_filename_in_src="templates.module.ts"; fi
      ;;
    "webhooks-lib")
      if [ -f "${LIB_SRC_ABS_PATH}/webhooks.module.ts" ]; then tentative_source_module_filename_in_src="webhooks.module.ts"; fi
      ;;
    "encryption-lib")
      if [ -f "${LIB_SRC_ABS_PATH}/encryption.module.ts" ]; then tentative_source_module_filename_in_src="encryption.module.ts"; fi
      ;;
    "auth-lib")
      if [ -f "${LIB_SRC_ABS_PATH}/auth.module.ts" ]; then tentative_source_module_filename_in_src="auth.module.ts"; fi
      ;;
    "database-lib")
      if [ -f "${LIB_SRC_ABS_PATH}/database.module.ts" ]; then tentative_source_module_filename_in_src="database.module.ts"; fi
      ;;
    "logger-lib")
      if [ -f "${LIB_SRC_ABS_PATH}/logger.module.ts" ]; then tentative_source_module_filename_in_src="logger.module.ts"; fi
      ;;
    # For other libraries (uuid, secrets, date, file-storage, queue, http-client, zip, csv, excel, openai-client, claude-client),
    # it's assumed the module in src/ would be the Nest CLI generated <lib-name-kebab>.module.ts, or that you'd create it with that name.
    # If not, the script will try to move <lib-name-kebab>.module.ts from src/.
  esac
  
  # If the specifically checked module (e.g. users.module.ts) was NOT found, but the default <lib-name-kebab>.module.ts DOES exist,
  # ensure we use the default. This handles the case where the 'if' condition in the case statement was false.
  if [ "${tentative_source_module_filename_in_src}" != "${lib_name_kebab}.module.ts" ] && [ ! -f "${LIB_SRC_ABS_PATH}/${tentative_source_module_filename_in_src}" ] && [ -f "${LIB_SRC_ABS_PATH}/${lib_name_kebab}.module.ts" ]; then
    echo "  Specific module '${tentative_source_module_filename_in_src}' not found, but default '${lib_name_kebab}.module.ts' exists. Using default."
    tentative_source_module_filename_in_src="${lib_name_kebab}.module.ts"
  fi

  echo "  Source module to look for in src/: ${tentative_source_module_filename_in_src}"

  # Define full paths for files involved
  SERVICE_TO_REMOVE_PATH="${LIB_SRC_ABS_PATH}/${lib_name_kebab}.service.ts"
  SERVICE_SPEC_TO_REMOVE_PATH="${LIB_SRC_ABS_PATH}/${lib_name_kebab}.service.spec.ts"
  SOURCE_MODULE_TO_MOVE_PATH="${LIB_SRC_ABS_PATH}/${tentative_source_module_filename_in_src}"
  # Destination module path at library root, with standardized name
  DEST_MODULE_PATH_AT_ROOT="${LIB_ROOT_ABS_PATH}/${lib_name_kebab}.module.ts"
  OLD_INDEX_TS_TO_REMOVE_PATH="${LIB_SRC_ABS_PATH}/index.ts"
  NEW_ROOT_INDEX_TS_PATH="${LIB_ROOT_ABS_PATH}/index.ts"

  # 1. Remove generated .service.ts file
  echo "[1/5] Removing generated service file (${lib_name_kebab}.service.ts)..."
  if [ -f "${SERVICE_TO_REMOVE_PATH}" ]; then
    rm -f "${SERVICE_TO_REMOVE_PATH}"
    echo "  Removed: ${SERVICE_TO_REMOVE_PATH}"
  else
    echo "  Service file not found (already removed or never existed?): ${SERVICE_TO_REMOVE_PATH}"
  fi

  # 2. Remove generated .service.spec.ts file
  echo "[2/5] Removing generated service spec file (${lib_name_kebab}.service.spec.ts)..."
  if [ -f "${SERVICE_SPEC_TO_REMOVE_PATH}" ]; then
    rm -f "${SERVICE_SPEC_TO_REMOVE_PATH}"
    echo "  Removed: ${SERVICE_SPEC_TO_REMOVE_PATH}"
  else
    echo "  Service spec file not found (already removed or never existed?): ${SERVICE_SPEC_TO_REMOVE_PATH}"
  fi

  # 3. Move the identified primary module file from src/ to the lib root, renaming it to <lib-name-kebab>.module.ts
  echo "[3/5] Moving module file from src/ to library root..."
  if [ -f "${SOURCE_MODULE_TO_MOVE_PATH}" ]; then
    mv "${SOURCE_MODULE_TO_MOVE_PATH}" "${DEST_MODULE_PATH_AT_ROOT}"
    echo "  Moved: ${SOURCE_MODULE_TO_MOVE_PATH} ==> ${DEST_MODULE_PATH_AT_ROOT}"
  else
    echo "  Source module file not found in src/: ${SOURCE_MODULE_TO_MOVE_PATH}. Check if it was already moved or if the name is unexpected."
  fi

  # 4. Remove the old src/index.ts
  echo "[4/5] Removing old src/index.ts..."
  if [ -f "${OLD_INDEX_TS_TO_REMOVE_PATH}" ]; then
    rm -f "${OLD_INDEX_TS_TO_REMOVE_PATH}"
    echo "  Removed: ${OLD_INDEX_TS_TO_REMOVE_PATH}"
  else
    echo "  Old src/index.ts not found (already removed?): ${OLD_INDEX_TS_TO_REMOVE_PATH}"
  fi

  # 5. Create new index.ts at the lib root, exporting only the standardized module name
  echo "[5/5] Creating new root index.ts for ${lib_name_kebab}.module.ts..."
  echo "export * from './${lib_name_kebab}.module';" > "${NEW_ROOT_INDEX_TS_PATH}"
  echo "  Created: ${NEW_ROOT_INDEX_TS_PATH} with export for ./${lib_name_kebab}.module.ts"

done


echo ""
echo "====================================================="
echo "Library cleanup and reorganization script finished."
echo "====================================================="
echo "Summary of actions:"
echo "- Removed generated *.service.ts and *.service.spec.ts files."
echo "- Moved *.module.ts files from src/ to library root."
echo "- Updated library root index.ts files."

echo ""
echo "Next Steps:"
echo "1. Manually update the paths in your tsconfig.json (or tsconfig.base.json) to point to the new library structure (e.g., 'libs/your-lib/index.ts' instead of 'libs/your-lib/src/index.ts')."
echo "2. Carefully review all changes."
echo "3. Commit the changes to your version control system."
echo "4. Try building your project (e.g., 'npm run build' or 'nest build')."
