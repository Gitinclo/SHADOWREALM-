cmake_minimum_required(VERSION 3.22)
project(MMORPG)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_library(mmorpg SHARED main.cpp)

# Android NDK native app glue
add_library(native_app_glue STATIC
    ${ANDROID_NDK}/sources/android/native_app_glue/android_native_app_glue.c)

target_include_directories(mmorpg PRIVATE
    ${ANDROID_NDK}/sources/android/native_app_glue)

target_link_libraries(mmorpg
    native_app_glue
    android
    log
    vulkan)

# Export ANativeActivity_onCreate
set(CMAKE_SHARED_LINKER_FLAGS
    "${CMAKE_SHARED_LINKER_FLAGS} -u ANativeActivity_onCreate")
