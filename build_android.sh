#!/bin/bash
set -e

ANDROID_NDK="${ANDROID_NDK_ROOT:-$HOME/Android/Sdk/ndk/25.1.8937393}"
ANDROID_ABI="arm64-v8a"
ANDROID_API=21

if [ ! -d "$ANDROID_NDK" ]; then
    echo "❌ Android NDK not found at: $ANDROID_NDK"
    echo "Set: export ANDROID_NDK_ROOT=~/Android/Sdk/ndk/25.1.8937393"
    exit 1
fi

echo "🤖 Building for Android..."
echo "   NDK: $ANDROID_NDK"
echo "   ABI: $ANDROID_ABI"
echo "   API: $ANDROID_API"

mkdir -p build_android
cd build_android

cmake .. \
    -DCMAKE_TOOLCHAIN_FILE="$ANDROID_NDK/build/cmake/android.toolchain.cmake" \
    -DANDROID_ABI="$ANDROID_ABI" \
    -DANDROID_PLATFORM="android-$ANDROID_API" \
    -DANDROID_STL=c++_shared \
    -DCMAKE_BUILD_TYPE=Release

make -j$(nproc)

cd ..
echo "✅ Android library built: build_android/libshadowrealm.so"
