#!/bin/bash
set -e

# Usage: ./bump-version.sh <version>
VERSION="$1"

if [ -z "$VERSION" ]; then
    echo "Usage: $0 <version>"
    exit 1
fi

# Create release branch
BRANCH_NAME="release-$VERSION"
git checkout -b "$BRANCH_NAME"

echo "Enabling corepack and installing dependencies..."
corepack enable
yarn install

# Update root package.json
if [ -f package.json ]; then
    echo "Enabling corepack..."
    corepack enable
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
