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

cmake_minimum_required(VERSION 3.18)
project(ShadowRealm VERSION 1.0.0 LANGUAGES CXX C)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

message(STATUS "🎮 Building ShadowRealm 3D")
message(STATUS "Platform: ${CMAKE_SYSTEM_NAME}")
message(STATUS "Generator: ${CMAKE_GENERATOR}")

# ─────────────────────────────────────────────────────
# DESKTOP BUILD (Linux/macOS/Windows)
# ─────────────────────────────────────────────────────
if(NOT ANDROID)
    message(STATUS "📱 Desktop build mode")
    
    # Find OpenGL
    find_package(OpenGL REQUIRED)
    message(STATUS "✅ OpenGL found: ${OPENGL_LIBRARIES}")
    
    # Find GLFW
    find_package(glfw3 3.3 QUIET)
    if(NOT glfw3_FOUND)
        message(WARNING "⚠️  GLFW3 not found - will attempt to use system libraries")
        find_library(GLFW_LIB glfw3)
        if(NOT GLFW_LIB)
            message(FATAL_ERROR "❌ GLFW3 not found! Install with: apt-get install libglfw3-dev")
        endif()
    else()
        message(STATUS "✅ GLFW3 found")
    endif()
    
    # Check for required headers
    if(NOT EXISTS "${CMAKE_SOURCE_DIR}/glm/glm/glm.hpp")
        message(FATAL_ERROR "❌ GLM not found at glm/glm/glm.hpp")
    endif()
    message(STATUS "✅ GLM found")
    
    if(NOT EXISTS "${CMAKE_SOURCE_DIR}/include/glad/gl.h")
        message(FATAL_ERROR "❌ GLAD not found at include/glad/gl.h")
    endif()
    message(STATUS "✅ GLAD found")
    
    if(NOT EXISTS "${CMAKE_SOURCE_DIR}/imgui/imgui.h")
        message(FATAL_ERROR "❌ ImGui not found at imgui/imgui.h")
    endif()
    message(STATUS "✅ ImGui found")
    
    # ImGui sources
    set(IMGUI_SOURCES
        imgui/imgui.cpp
        imgui/imgui_draw.cpp
        imgui/imgui_tables.cpp
        imgui/imgui_widgets.cpp
        imgui/backends/imgui_impl_glfw.cpp
        imgui/backends/imgui_impl_opengl3.cpp
    )
    
    # Main executable
    add_executable(shadowrealm
        src/shadowrealm.cpp
        glad.c
        ${IMGUI_SOURCES}
    )
    
    # Include directories
    target_include_directories(shadowrealm PRIVATE
        ${CMAKE_SOURCE_DIR}/include
        ${CMAKE_SOURCE_DIR}/imgui
        ${CMAKE_SOURCE_DIR}/imgui/backends
        ${CMAKE_SOURCE_DIR}/glm
    )
    
    # Link libraries
    target_link_libraries(shadowrealm PRIVATE
        OpenGL::OpenGL
    )
    
    if(glfw3_FOUND)
        target_link_libraries(shadowrealm PRIVATE glfw)
    else()
        target_link_libraries(shadowrealm PRIVATE ${GLFW_LIB})
    endif()
    
    # Platform-specific linking
    if(APPLE)
        target_link_options(shadowrealm PRIVATE -framework Cocoa -framework IOKit -framework CoreVideo)
        message(STATUS "🍎 macOS build configured")
    elseif(UNIX AND NOT APPLE)
        target_link_libraries(shadowrealm PRIVATE X11 dl pthread)
        message(STATUS "🐧 Linux build configured")
    elseif(WIN32)
        message(STATUS "🪟 Windows build configured")
    endif()
    
    # Optimization flags
    if(CMAKE_BUILD_TYPE STREQUAL "Release")
        if(MSVC)
            target_compile_options(shadowrealm PRIVATE /O2 /W4)
        else()
            target_compile_options(shadowrealm PRIVATE -O3 -march=native -flto)
        endif()
        message(STATUS "🚀 Release build with optimizations")
    else()
        if(MSVC)
            target_compile_options(shadowrealm PRIVATE /Zi /W4)
        else()
            target_compile_options(shadowrealm PRIVATE -g -Wall -Wextra)
        endif()
        message(STATUS "🐛 Debug build")
    endif()

# ─────────────────────────────────────────────────────
# ANDROID BUILD
# ─────────────────────────────────────────────────────
else()
    message(STATUS "🤖 Android build mode")
    message(STATUS "   ABI: ${ANDROID_ABI}")
    message(STATUS "   API: ${ANDROID_PLATFORM}")
    
    find_library(GLES3 GLESv3 REQUIRED)
    find_library(EGL EGL REQUIRED)
    find_library(LOG log REQUIRED)
    find_library(ANDROID android REQUIRED)
    
    # Android native app glue
    set(ANDROID_GLUE_DIR "${ANDROID_NDK}/sources/android/native_app_glue")
    if(NOT EXISTS "${ANDROID_GLUE_DIR}/android_native_app_glue.c")
        message(FATAL_ERROR "❌ Android NDK not found at: ${ANDROID_NDK}")
    endif()
    
    add_library(native_app_glue STATIC "${ANDROID_GLUE_DIR}/android_native_app_glue.c")
    target_include_directories(native_app_glue PUBLIC "${ANDROID_GLUE_DIR}")
    
    # Main game library
    add_library(shadowrealm SHARED src/shadowrealm_mobile.cpp)
    
    target_include_directories(shadowrealm PRIVATE
        ${CMAKE_SOURCE_DIR}/glm
        "${ANDROID_GLUE_DIR}"
    )
    
    target_link_libraries(shadowrealm PRIVATE
        native_app_glue
        ${GLES3}
        ${EGL}
        ${LOG}
        ${ANDROID}
    )
    
    target_compile_options(shadowrealm PRIVATE
        -fPIC
        -fvisibility=hidden
        -Wall
        -Wextra
    )
    
    if(CMAKE_BUILD_TYPE STREQUAL "Release")
        target_compile_options(shadowrealm PRIVATE -O3 -flto)
    else()
        target_compile_options(shadowrealm PRIVATE -g)
    endif()
    
    message(STATUS "✅ Android build configured")
endif()

message(STATUS "✅ ShadowRealm 3D configured successfully")
