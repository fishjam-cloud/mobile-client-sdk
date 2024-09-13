#!/bin/bash
brew install swift-format ktlint release-it
yarn
yarn build
chmod +x .githooks/*
cp .githooks/* .git/hooks
