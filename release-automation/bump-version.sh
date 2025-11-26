#!/bin/bash
set -e

# NOTE:
# This script prepares a release by creating a `release-<version>` branch
# and updating package versions (root `package.json` and the
# `@fishjam-cloud/react-native-client` workspace). It does NOT commit or
# push the changes to the remote repository. Committing and pushing (and any
# additional CI/workflow steps) are expected to be handled by the caller or
# the surrounding release automation workflow that invokes this script.
# This will be called by the release workflow in @fishjam-cloud/release-automation.
#
# Usage: ./bump-version.sh <version>

VERSION="$1"

if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version>"
    exit 1
fi

# Validate semantic version format (X.Y.Z)
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Error: Version must be in format X.Y.Z"
    exit 1
fi

# Create release branch
BRANCH_NAME="release-$VERSION"
git checkout -b "$BRANCH_NAME"

# Update root package.json
if [ -f package.json ]; then
    echo "Enabling corepack..."
    corepack enable
    corepack yarn install
    corepack yarn version "$VERSION"
    echo "Updated root package.json to $VERSION"
else
    echo "Root package.json not found!"
    exit 1
fi

# Update react-native-client package
corepack yarn workspace @fishjam-cloud/react-native-client version "$VERSION"
echo "Updated react-native-client to $VERSION"

echo "✅ Version bump complete for $VERSION"
echo "BRANCH_NAME:$BRANCH_NAME"
