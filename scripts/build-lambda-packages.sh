#!/bin/bash
set -e

# Directory paths
WORKSPACE_DIR="$(pwd)"
BUILDS_DIR="${WORKSPACE_DIR}/builds/apps"
NEST_CLI_PATH="${WORKSPACE_DIR}/nest-cli.json"
TEMP_DIR="${WORKSPACE_DIR}/builds/temp"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed. Please install jq to parse JSON."
    exit 1
fi

echo "Building all NestJS applications..."
pnpm build

# Create builds directory if it doesn't exist
mkdir -p "${BUILDS_DIR}"
mkdir -p "${TEMP_DIR}"

# Get all apps from nest-cli.json
APPS=$(jq -r '.projects | keys[]' "${NEST_CLI_PATH}")

echo "Preparing Lambda packages for apps: ${APPS}"

# Install dependencies once in temp directory
echo "Installing production dependencies once..."
cp "${WORKSPACE_DIR}/package.json" "${TEMP_DIR}/"
cp "${WORKSPACE_DIR}/pnpm-lock.yaml" "${TEMP_DIR}/"
cd "${TEMP_DIR}"
pnpm install --prod --no-lockfile
cd "${WORKSPACE_DIR}"

for APP in ${APPS}; do
    echo "Processing ${APP}..."
    
    # Get app details
    APP_ROOT=$(jq -r ".projects.\"${APP}\".root" "${NEST_CLI_PATH}")
    APP_ENTRY=$(jq -r ".projects.\"${APP}\".entryFile" "${NEST_CLI_PATH}")
    
    # Create app build directory
    APP_BUILD_DIR="${BUILDS_DIR}/${APP}"
    rm -rf "${APP_BUILD_DIR}"
    mkdir -p "${APP_BUILD_DIR}"
    
    echo "Copying bundle files for ${APP}..."
    
    # Copy the bundle from dist/apps/{app-name}/ to the build directory
    DIST_APP_PATH="${WORKSPACE_DIR}/dist/apps/${APP}"
    if [ -d "${DIST_APP_PATH}" ]; then
        # Copy all files from dist/apps/{app-name}/ to the build directory
        cp -r "${DIST_APP_PATH}"/* "${APP_BUILD_DIR}/" 2>/dev/null || true
    else
        echo "Warning: Distribution directory ${DIST_APP_PATH} not found for ${APP}"
        continue
    fi
    
    # Copy package.json and node_modules
    cp "${WORKSPACE_DIR}/package.json" "${APP_BUILD_DIR}/"
    cp -r "${TEMP_DIR}/node_modules" "${APP_BUILD_DIR}/"
    
    echo "Lambda package for ${APP} is ready at ${APP_BUILD_DIR}"
done

# Remove temp directory
echo "Cleaning up temporary directory..."
rm -rf "${TEMP_DIR}"

echo "All Lambda packages have been built successfully!"