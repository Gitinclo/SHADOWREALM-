#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════╗"
echo "║     🎮 ShadowRealm 3D - Universal Setup 🎮            ║"
echo "╚════════════════════════════════════════════════════════╝"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# OS Detection
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
    echo -e "${BLUE}🐧 Linux detected${NC}"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
    echo -e "${BLUE}🍎 macOS detected${NC}"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
    OS="windows"
    echo -e "${BLUE}🪟 Windows detected${NC}"
else
    echo -e "${RED}❌ Unknown OS: $OSTYPE${NC}"
    exit 1
fi

# Install System Dependencies
echo -e "\n${YELLOW}📦 Installing system dependencies...${NC}"

if [ "$OS" = "linux" ]; then
    echo -e "${BLUE}Running: sudo apt-get install...${NC}"
    sudo apt-get update -qq
    sudo apt-get install -y -qq \
        build-essential cmake git curl unzip \
        libglfw3-dev libglm-dev libxrandr-dev \
        libxinerama-dev libxi-dev libxcursor-dev \
        libgl1-mesa-dev pkg-config
    echo -e "${GREEN}✅ Linux dependencies installed${NC}"
        
elif [ "$OS" = "macos" ]; then
    if ! command -v brew &> /dev/null; then
        echo -e "${RED}❌ Homebrew required${NC}"
        exit 1
    fi
    echo -e "${BLUE}Running: brew install...${NC}"
    brew install -q glfw glm cmake 2>/dev/null || brew install glfw glm cmake
    echo -e "${GREEN}✅ macOS dependencies installed${NC}"
    
elif [ "$OS" = "windows" ]; then
    echo -e "${YELLOW}⚠️  Windows: Install Visual Studio Build Tools or MinGW${NC}"
fi

# Create Directories
echo -e "\n${YELLOW}📁 Creating directories...${NC}"
mkdir -p include/glad imgui/backends src build
echo -e "${GREEN}✅ Directories created${NC}"

# Download GLAD
echo -e "\n${YELLOW}📥 Downloading GLAD (OpenGL 3.3)...${NC}"
if [ ! -f "include/glad/gl.h" ]; then
    curl -s https://glad.dav1d.de/generated/glad/core/gl_core_33.zip -o /tmp/glad.zip
    if [ -f "/tmp/glad.zip" ]; then
        unzip -q /tmp/glad.zip -d . 2>/dev/null || true
        rm -f /tmp/glad.zip
        echo -e "${GREEN}✅ GLAD downloaded${NC}"
    else
        echo -e "${RED}❌ Failed to download GLAD${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ GLAD already exists${NC}"
fi

# Download GLM
echo -e "\n${YELLOW}📥 Downloading GLM (math library)...${NC}"
if [ ! -d "glm/glm" ]; then
    curl -sL https://github.com/g-truc/glm/releases/download/0.9.9.8/glm-0.9.9.8.zip -o /tmp/glm.zip
    if [ -f "/tmp/glm.zip" ]; then
        unzip -q /tmp/glm.zip -d . 2>/dev/null || true
        rm -f /tmp/glm.zip
        echo -e "${GREEN}✅ GLM downloaded${NC}"
    else
        echo -e "${RED}❌ Failed to download GLM${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ GLM already exists${NC}"
fi

# Download ImGui
echo -e "\n${YELLOW}📥 Downloading Dear ImGui...${NC}"
if [ ! -f "imgui/imgui.h" ]; then
    git clone --depth 1 https://github.com/ocornut/imgui.git /tmp/imgui_src 2>/dev/null || {
        echo -e "${RED}❌ Failed to clone ImGui${NC}"
        exit 1
    }
    
    cp /tmp/imgui_src/imgui.h imgui/
    cp /tmp/imgui_src/imgui.cpp imgui/
    cp /tmp/imgui_src/imgui_internal.h imgui/
    cp /tmp/imgui_src/imgui_draw.cpp imgui/
    cp /tmp/imgui_src/imgui_tables.cpp imgui/
    cp /tmp/imgui_src/imgui_widgets.cpp imgui/
    cp /tmp/imgui_src/imconfig.h imgui/
    cp /tmp/imgui_src/backends/imgui_impl_glfw.h imgui/backends/
    cp /tmp/imgui_src/backends/imgui_impl_glfw.cpp imgui/backends/
    cp /tmp/imgui_src/backends/imgui_impl_opengl3.h imgui/backends/
    cp /tmp/imgui_src/backends/imgui_impl_opengl3.cpp imgui/backends/
    
    rm -rf /tmp/imgui_src
    echo -e "${GREEN}✅ Dear ImGui downloaded${NC}"
else
    echo -e "${GREEN}✓ Dear ImGui already exists${NC}"
fi

# Verify all files
echo -e "\n${YELLOW}🔍 Verifying installation...${NC}"
MISSING=0

for file in "include/glad/gl.h" "glm/glm/glm.hpp" "imgui/imgui.h" "src/shadowrealm.cpp"; do
    if [ ! -f "$file" ] && [ ! -d "$file" ]; then
        echo -e "${RED}❌ Missing: $file${NC}"
        MISSING=1
    else
        echo -e "${GREEN}✓ Found: $file${NC}"
    fi
done

if [ $MISSING -eq 1 ]; then
    echo -e "${RED}❌ Some files are missing!${NC}"
    exit 1
fi

# Build Desktop (if not Windows)
if [ "$OS" != "windows" ]; then
    echo -e "\n${YELLOW}🔨 Building desktop version...${NC}"
    cd build
    cmake .. -DCMAKE_BUILD_TYPE=Release || {
        echo -e "${RED}❌ CMake configuration failed${NC}"
        cd ..
        exit 1
    }
    
    make -j$(nproc) || {
        echo -e "${RED}❌ Build failed${NC}"
        cd ..
        exit 1
    }
    
    cd ..
    
    if [ -f "build/shadowrealm" ]; then
        chmod +x build/shadowrealm
        echo -e "${GREEN}✅ Desktop build successful!${NC}"
    fi
fi

echo -e "\n${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           ✅ Setup Complete!                          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
if [ "$OS" != "windows" ]; then
    echo -e "   Desktop:  ${YELLOW}./build/shadowrealm${NC}"
fi
echo -e "   Android:  ${YELLOW}./build_android.sh${NC}"
echo ""