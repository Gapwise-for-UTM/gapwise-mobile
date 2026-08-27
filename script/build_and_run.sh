#!/usr/bin/env bash
set -euo pipefail

case "${1:-start}" in
  start)
    exec npx expo start
    ;;
  tunnel)
    exec npx expo start --tunnel
    ;;
  doctor)
    exec npx expo-doctor@latest
    ;;
  ios-bundle)
    exec npx expo export --platform ios --output-dir dist/ios
    ;;
  android-bundle)
    exec npx expo export --platform android --output-dir dist/android
    ;;
  *)
    echo "Usage: $0 [start|tunnel|doctor|ios-bundle|android-bundle]" >&2
    exit 2
    ;;
esac
