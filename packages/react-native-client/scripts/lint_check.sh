#!/bin/bash
set -e

echo "Running eslint:check for react-native javascript files \n"
eslint . --ext .ts,.tsx  --max-warnings 0

echo "Running prettier:check for react-native javascript files \n"
prettier --check . --ignore-path ./.eslintignore

echo "Running ktlint:check for react-native android files \n"
cd android
ktlint **/*.kt
cd ..

echo "Running swift-format:check for react-native ios files \n"
cd ios
swift-format format -i -r ./ --configuration swift-format-config.json
swift-format lint -s -r ./ --configuration swift-format-config.json

