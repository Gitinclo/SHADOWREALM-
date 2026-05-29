#!/bin/bash

# 🎮 ShadowRealm 3D - Setup Script
# Automatically installs dependencies and prepares the build environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Detect OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        OS="windows"
    else
        OS="unknown"
    fi
    echo "$OS"
}

# Install dependencies based on OS
install_dependencies() {
    local os=$1
    
    print_header "Installing Dependencies for ${os^^}"
    
    case $os in
        linux)
            print_info "Detected Linux. Installing with apt-get..."
            if ! command -v sudo &> /dev/null; then
                print_error "sudo not found. Please install dependencies manually:"
                echo "  sudo apt-get update"
                echo "  sudo apt-get install -y build-essential cmake libglfw3-dev libglm-dev libgl1-mesa-dev libx11-dev"
                return 1
            fi
            
            sudo apt-get update
            print_info "Installing build tools..."
            sudo apt-get install -y build-essential cmake
            
            print_info "Installing OpenGL dependencies..."
            sudo apt-get install -y libglfw3-dev libglm-dev libgl1-mesa-dev libx11-dev
            
            print_success "Linux dependencies installed"
            ;;
            
        macos)
            print_info "Detected macOS. Installing with Homebrew..."
            if ! command -v brew &> /dev/null; then
                print_error "Homebrew not found. Please install from: https://brew.sh"
                return 1
            fi
            
            print_info "Installing dependencies..."
            brew install cmake glfw glm
            
            print_success "macOS dependencies installed"
            ;;
            
        windows)
            print_warning "Windows detected. Manual setup required."
            echo ""
            echo "Please install:"
            echo "  1. Visual Studio 2022 Community: https://visualstudio.microsoft.com/downloads/"
            echo "  2. CMake: https://cmake.org/download/"
            echo "  3. GLFW: https://www.glfw.org/download.html"
            echo "  4. GLM: https://github.com/g-truc/glm/releases"
            echo ""
            echo "Then run: cmake -S . -B build -G 'Visual Studio 17 2022'"
            return 1
            ;;
            
        *)
            print_error "Unknown OS: $os"
            return 1
            ;;
    esac
}

# Download external libraries
download_libraries() {
    print_header "Downloading External Libraries"
    
    # Create directories
    mkdir -p glm include/glad imgui
    
    # Download GLM
    if [ ! -d "glm/glm" ]; then
        print_info "Downloading GLM..."
        git clone --depth 1 https://github.com/g-truc/glm.git glm_temp
        mv glm_temp/glm glm/glm
        rm -rf glm_temp
        print_success "GLM downloaded"
    else
        print_info "GLM already exists"
    fi
    
    # Download ImGui
    if [ ! -f "imgui/imgui.h" ]; then
        print_info "Downloading ImGui..."
        git clone --depth 1 https://github.com/ocornut/imgui.git imgui_temp
        mv imgui_temp/* imgui/
        rm -rf imgui_temp
        print_success "ImGui downloaded"
    else
        print_info "ImGui already exists"
    fi
    
    # Download GLAD (OpenGL loader generator)
    if [ ! -f "include/glad/gl.h" ]; then
        print_info "Downloading GLAD..."
        mkdir -p include/glad
        # Using prebuilt GLAD for OpenGL 3.3
        curl -s https://glad.dav1d.de/generated/tmp/loader/gl/gl_3_3_core_loader.h > include/glad/gl.h 2>/dev/null || {
            print_warning "Could not download GLAD from CDN, using local template"
            # Fallback: create minimal GLAD header
            cat > include/glad/gl.h << 'EOF'
#ifndef __GLAD_GL_H_
#define __GLAD_GL_H_

#ifdef __cplusplus
extern "C" {
#endif

#include <stddef.h>
#include <stdint.h>

// OpenGL 3.3 Core Profile declarations
// This is a simplified loader - for full GLAD, visit https://glad.dav1d.de/

#ifdef _WIN32
  #define APIENTRY __stdcall
#else
  #define APIENTRY
#endif

#ifndef GLAPI
  #define GLAPI extern
#endif

// Basic GL types
typedef unsigned int GLenum;
typedef int GLint;
typedef unsigned int GLuint;
typedef int GLsizei;
typedef float GLfloat;
typedef double GLdouble;
typedef unsigned char GLboolean;
typedef unsigned char GLubyte;
typedef char GLchar;
typedef void GLvoid;

// Core constants
#define GL_VENDOR                 0x1F00
#define GL_VERSION                0x1F02
#define GL_EXTENSIONS             0x1F03
#define GL_TRUE                   1
#define GL_FALSE                  0

// This is a minimal header. For production, use full GLAD

#ifdef __cplusplus
}
#endif

#endif // __GLAD_GL_H_
EOF
            print_success "Created minimal GLAD header (full version recommended)"
        }
    else
        print_info "GLAD already exists"
    fi
}

# Create build directory and configure CMake
configure_cmake() {
    print_header "Configuring CMake"
    
    if [ -d "build" ]; then
        print_warning "Build directory already exists. Cleaning..."
        rm -rf build
    fi
    
    mkdir -p build
    cd build
    
    # Configure with Release build by default
    print_info "Running CMake configuration..."
    cmake .. -DCMAKE_BUILD_TYPE=Release
    
    if [ $? -eq 0 ]; then
        print_success "CMake configuration completed"
        cd ..
    else
        print_error "CMake configuration failed"
        cd ..
        return 1
    fi
}

# Build the project
build_project() {
    print_header "Building ShadowRealm"
    
    if [ ! -d "build" ]; then
        print_error "Build directory not found. Run CMake configuration first."
        return 1
    fi
    
    cd build
    
    # Get number of CPU cores for parallel build
    if [[ "$OSTYPE" == "darwin"* ]]; then
        CORES=$(sysctl -n hw.ncpu)
    else
        CORES=$(nproc)
    fi
    
    print_info "Building with $CORES cores..."
    make -j$CORES
    
    if [ $? -eq 0 ]; then
        print_success "Build completed successfully"
        cd ..
        return 0
    else
        print_error "Build failed"
        cd ..
        return 1
    fi
}

# Main setup flow
main() {
    clear
    print_header "🎮 ShadowRealm 3D - Setup Script"
    
    echo ""
    echo "This script will:"
    echo "  1. Detect your operating system"
    echo "  2. Install required dependencies"
    echo "  3. Download external libraries (GLM, ImGui, GLAD)"
    echo "  4. Configure CMake build system"
    echo "  5. Compile the project"
    echo ""
    
    read -p "Continue? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Setup cancelled"
        exit 1
    fi
    
    # Detect OS
    OS=$(detect_os)
    print_info "Detected OS: ${OS^^}"
    
    # Check for required tools
    print_header "Checking Required Tools"
    
    if ! command -v git &> /dev/null; then
        print_error "git is not installed"
        exit 1
    fi
    print_success "git found"
    
    if ! command -v cmake &> /dev/null; then
        print_warning "cmake not found, will attempt to install"
    else
        print_success "cmake found"
    fi
    
    if ! command -v make &> /dev/null; then
        print_warning "make not found, will attempt to install"
    else
        print_success "make found"
    fi
    
    echo ""
    
    # Install dependencies
    if ! install_dependencies "$OS"; then
        print_error "Dependency installation failed"
        exit 1
    fi
    
    echo ""
    
    # Download libraries
    if ! download_libraries; then
        print_error "Failed to download libraries"
        exit 1
    fi
    
    echo ""
    
    # Configure CMake
    if ! configure_cmake; then
        print_error "CMake configuration failed"
        exit 1
    fi
    
    echo ""
    
    # Build project
    if build_project; then
        echo ""
        print_header "✅ Setup Complete!"
        echo ""
        echo "🎮 ShadowRealm is ready to run!"
        echo ""
        echo "To start the game, run:"
        echo "  ${BLUE}./build/shadowrealm${NC}"
        echo ""
        echo "For more options, see README.md"
        echo ""
    else
        print_error "Build failed. Check the error messages above."
        exit 1
    fi
}

# Run main function
main "$@"
