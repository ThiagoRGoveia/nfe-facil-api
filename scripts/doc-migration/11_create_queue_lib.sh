#!/bin/bash

# Script to generate the QueueLib (SQS) and move original source files.

# Exit on any error
set -e

LIB_NAME="QueueLib"
LIB_PREFIX="defaultLibraryPrefix"

SOURCE_FILES_TO_MIGRATE=(
  "apps/api/src/infra/sqs/sqs.adapter.ts"
  "apps/api/src/infra/sqs/sqs.client.ts"
  "apps/api/src/core/ports/queue.port.ts"
)

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

# 2. Move specified original source files into the new library structure for manual integration
echo "Moving original source files to ${TARGET_LIB_SRC_DIR}/${MIGRATED_SOURCE_SUBDIR}/..."
mkdir -p "${TARGET_LIB_SRC_DIR}/${MIGRATED_SOURCE_SUBDIR}"

for FILE_PATH in "${SOURCE_FILES_TO_MIGRATE[@]}"; do
  if [ -f "${FILE_PATH}" ]; then
    DEST_DIR="${TARGET_LIB_SRC_DIR}/${MIGRATED_SOURCE_SUBDIR}/$(dirname "${FILE_PATH}")"
    mkdir -p "${DEST_DIR}"
    mv "${FILE_PATH}" "${DEST_DIR}/"
    echo "Moved ${FILE_PATH} to ${DEST_DIR}/$(basename "${FILE_PATH}")"
  else
    echo "WARNING: Source file ${FILE_PATH} does not exist. Skipping move operation for this file."
  fi
done

echo ""
echo "---------------------------------------------------------------------"
echo "MANUAL STEPS REQUIRED for ${LIB_NAME} (@${LIB_PREFIX}/${LIB_NAME_KEBAB}):"
echo "---------------------------------------------------------------------"
echo "1. Open the new library in your IDE: ${TARGET_LIB_ROOT_DIR}"
echo "2. Review the generated files:"
echo "   - Module:  ${TARGET_LIB_SRC_DIR}/${LIB_NAME_KEBAB}.module.ts"
echo "   - Service: ${TARGET_LIB_SRC_DIR}/${LIB_NAME_KEBAB}.service.ts (may become the SQSAdapter or wrapper)"
echo "   - Index:   ${TARGET_LIB_SRC_DIR}/index.ts"
echo ""
echo "3. Integrate logic from the original files (now in '${TARGET_LIB_SRC_DIR}/${MIGRATED_SOURCE_SUBDIR}/'):"
echo "   - sqs.adapter.ts is in '${TARGET_LIB_SRC_DIR}/${MIGRATED_SOURCE_SUBDIR}/apps/api/src/infra/sqs/'"
echo "   - sqs.client.ts is in '${TARGET_LIB_SRC_DIR}/${MIGRATED_SOURCE_SUBDIR}/apps/api/src/infra/sqs/'"
echo "   - queue.port.ts is in '${TARGET_LIB_SRC_DIR}/${MIGRATED_SOURCE_SUBDIR}/apps/api/src/core/ports/'"
echo "   - Copy 'queue.port.ts' into '${TARGET_LIB_SRC_DIR}/queue.port.ts'."
echo "   - Copy 'sqs.adapter.ts' into '${TARGET_LIB_SRC_DIR}/sqs.adapter.ts'. It should implement 'QueuePort'."
echo "   - 'sqs.client.ts' might be used by the adapter or can be a separate utility within the lib. Place it accordingly, e.g., '${TARGET_LIB_SRC_DIR}/sqs.client.ts'."
echo "   - The generated '${LIB_NAME_KEBAB}.service.ts' could be repurposed as the SQSAdapter if desired."
echo "   - Update '${LIB_NAME_KEBAB}.module.ts' to provide and export the QueuePort using SQSAdapter:"
echo "     providers: [SQSClient, { provide: QueuePort, useClass: SQSAdapter }], // Assuming SQSClient is a provider needed by SQSAdapter"
echo "     exports: [QueuePort],"
echo "   - Ensure SQSClient, SQSAdapter, and any AWS SDK dependencies are correctly handled."
echo ""
echo "4. Ensure the main 'index.ts' exports the module, port, and adapter/client."
echo ""
echo "5. After successful migration and integration, you can clean up by deleting:
   - The '${TARGET_LIB_SRC_DIR}/${MIGRATED_SOURCE_SUBDIR}' directory.
   - The original source files: ${SOURCE_FILES_TO_MIGRATE[*]}"
echo ""
echo "6. IMPORTANT: Update import paths in other parts of the monorepo that previously imported these components"
echo "   to now use '@${LIB_PREFIX}/${LIB_NAME_KEBAB}' once the library is ready."
   echo "   (This step is for later, as per instructions to ignore application of the library for now)."
echo "---------------------------------------------------------------------"
echo ""
echo "${LIB_NAME} migration script finished."
echo "Please review the output and perform the manual integration steps."
