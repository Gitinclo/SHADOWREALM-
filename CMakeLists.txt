cmake_minimum_required(VERSION 3.18)
project(ShadowRealm VERSION 1.0.0 LANGUAGES CXX C)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

message(STATUS "🎮 Building ShadowRealm 3D")
message(STATUS "Platform: ${CMAKE_SYSTEM_NAME}")

if(ANDROID)
    message(STATUS "🤖 Android Build")
    set(IS_ANDROID TRUE)
else()
    message(STATUS "🖥️  Desktop Build")
    set(IS_ANDROID FALSE)
endif()

# ─────────────────────────────────────────────────────
# DESKTOP BUILD
# ─────────────────────────────────────────────────────
if(NOT IS_ANDROID)
    find_package(OpenGL REQUIRED)
    find_package(glfw3 3.3 REQUIRED)
    
    if(NOT EXISTS "${CMAKE_SOURCE_DIR}/glm/glm/glm.hpp")
        message(FATAL_ERROR "❌ GLM not found! Run: ./setup.sh")
    endif()
    if(NOT EXISTS "${CMAKE_SOURCE_DIR}/include/glad/gl.h")
        message(FATAL_ERROR "❌ GLAD not found! Run: ./setup.sh")
    endif()
    if(NOT EXISTS "${CMAKE_SOURCE_DIR}/imgui/imgui.h")
        message(FATAL_ERROR "❌ ImGui not found! Run: ./setup.sh")
    endif()
    
    set(IMGUI_SOURCES
        imgui/imgui.cpp
        imgui/imgui_draw.cpp
        imgui/imgui_tables.cpp
        imgui/imgui_widgets.cpp
        imgui/backends/imgui_impl_glfw.cpp
        imgui/backends/imgui_impl_opengl3.cpp
    )
    
    add_executable(shadowrealm
        src/shadowrealm.cpp
        glad.c
        ${IMGUI_SOURCES}
    )
    
    target_include_directories(shadowrealm PRIVATE
        include
        imgui
        imgui/backends
        glm
    )
    
    target_link_libraries(shadowrealm PRIVATE
        OpenGL::OpenGL
        glfw
    )
    
    if(APPLE)
        target_link_options(shadowrealm PRIVATE -framework Cocoa -framework IOKit)
    elseif(UNIX AND NOT APPLE)
        target_link_libraries(shadowrealm PRIVATE X11 dl)
    endif()
    
    if(CMAKE_BUILD_TYPE STREQUAL "Release")
        target_compile_options(shadowrealm PRIVATE -O3 -march=native -flto)
    else()
        target_compile_options(shadowrealm PRIVATE -g -Wall -Wextra)
    endif()

else()
    # ANDROID BUILD
    find_library(GLES3 GLESv3)
    find_library(EGL EGL)
    find_library(LOG log)
    find_library(ANDROID android)
    
    set(IMGUI_SOURCES
        imgui/imgui.cpp
        imgui/imgui_draw.cpp
        imgui/imgui_tables.cpp
        imgui/imgui_widgets.cpp
        imgui/backends/imgui_impl_opengl3.cpp
        imgui/backends/imgui_impl_android.cpp
    )
    
    add_library(shadowrealm SHARED
        src/shadowrealm_mobile.cpp
        ${IMGUI_SOURCES}
    )
    
    target_include_directories(shadowrealm PRIVATE
        include
        imgui
        imgui/backends
        glm
        ${ANDROID_NDK}/sources/android/native_app_glue
    )
    
    target_link_libraries(shadowrealm PRIVATE
        ${GLES3} ${EGL} ${LOG} ${ANDROID}
        android_native_app_glue
    )
    
    target_compile_options(shadowrealm PRIVATE -fPIC -fvisibility=hidden)
endif()