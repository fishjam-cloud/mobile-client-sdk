#!/bin/bash
set -e

echo "Running swift-format:check for ios files \n"
swift-format format -i -r ./Sources --configuration swift-format-config.json
swift-format lint -s -r ./Sources --configuration swift-format-config.json

