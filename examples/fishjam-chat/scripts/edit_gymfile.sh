#!/bin/bash

if [[ "$EAS_BUILD_PLATFORM" == "ios" ]]; then
  echo "Run commands for iOS builds here"
  sed -i '' 's/provisioningProfiles: {/provisioningProfiles: {\n    "io.fishjam.example.fishjamchat.FishjamScreenBroadcastExtension" => "e776e08d-3d53-4572-aad2-42dbee0b3f5b",/g' ios/Gymfile
fi
