#!/bin/bash
brew install swift-format ktlint release-it
yarn
yarn prepare
chmod +x .githooks/*
cp .githooks/* .git/hooks
