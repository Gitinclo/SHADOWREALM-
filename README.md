# 🎮 ShadowRealm 3D

A cross-platform 3D graphics engine built with C++ using modern OpenGL, GLFW, and ImGui. Designed for creating immersive 3D experiences with a focus on performance and visual quality.

## ✨ Features

- 🎨 **Modern OpenGL 3.3 Core Profile** - High-performance graphics rendering
- 🖥️ **Cross-Platform Support** - Windows, macOS, and Linux
- 📱 **Android Support** - Mobile game development ready
- 🎛️ **ImGui Integration** - Powerful debug UI and editor tools
- 🎯 **GLM Mathematics** - Professional 3D math library
- ⚡ **Optimized Performance** - Release builds with -O3 optimization
- 🏗️ **CMake Build System** - Easy configuration and compilation
- 🔄 **CI/CD Pipeline** - Automated builds on GitHub Actions

## 🛠️ Tech Stack

| Component | Version | Purpose |
|-----------|---------|---------|
| **OpenGL** | 3.3+ | Graphics API |
| **GLFW** | 3.3+ | Window & Input Management |
| **GLM** | 0.9.9.8 | Mathematics & Vectors |
| **ImGui** | Latest | Debug UI & Editor |
| **CMake** | 3.18+ | Build System |
| **C++** | C++17 | Language Standard |

## 📋 Requirements

### Linux (Ubuntu/Debian)
```bash
sudo apt-get install -y \
    build-essential \
    cmake \
    libglfw3-dev \
    libglm-dev \
    libgl1-mesa-dev \
    libx11-dev \
    pkg-config
```

### macOS
```bash
brew install cmake glfw glm
```

### Windows
- Visual Studio 2022 (Community or Professional)
- CMake 3.18+
- GLFW3 (auto-downloaded during build)
- GLM (auto-downloaded during build)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/Gitinclo/SHADOWREALM-.git
cd SHADOWREALM-
```

### 2. Using Setup Script (Interactive)
```bash
chmod +x setup.sh
./setup.sh
```

### 3. Manual Build

**Linux/macOS:**
```bash
mkdir -p build
cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
make -j4
./shadowrealm
```

**Windows (with Visual Studio):**
```bash
mkdir build
cd build
cmake .. -DCMAKE_BUILD_TYPE=Release -G "Visual Studio 17 2022"
cmake --build . --config Release
.\Release\shadowrealm.exe
```

## 📂 Project Structure

```
SHADOWREALM-/
├── src/                    # Source code
│   ├── main.cpp            # Main entry point
│   └── Causality.h         # Game logic system
├── include/                # Header files
│   └── glad/               # OpenGL loader
├── imgui/                  # ImGui UI framework
│   └── backends/           # GLFW & OpenGL backends
├── glm/                    # GLM math library (auto-downloaded)
├── build/                  # Build output (generated)
├── .github/workflows/      # CI/CD configuration
│   └── build.yml           # GitHub Actions workflow
├── CMakeLists.txt          # CMake configuration
├── setup.sh                # Setup script
├── LICENSE                 # MIT License
└── README.md               # This file
```

## 🔨 Build Options

### Debug Build
```bash
mkdir -p build
cd build
cmake .. -DCMAKE_BUILD_TYPE=Debug
make -j4
```

### Release Build (Optimized)
```bash
mkdir -p build
cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
make -j4
```

### Windows Build with MSVC
```bash
mkdir build
cd build
cmake .. -DCMAKE_BUILD_TYPE=Release -G "Visual Studio 17 2022"
cmake --build . --config Release
```

## 🔄 CI/CD Pipeline

The project uses **GitHub Actions** for continuous integration:

- **Linux Build:** Ubuntu latest with GCC
- **macOS Build:** macOS latest with Clang
- **Windows Build:** Windows latest with MSVC

Build artifacts are automatically uploaded for each platform after successful builds.

**View workflows:** [GitHub Actions](https://github.com/Gitinclo/SHADOWREALM-/actions)

## 🎯 Usage Example

```cpp
#include <GLFW/glfw3.h>
#include <glm/glm.hpp>
#include <imgui/imgui.h>

int main() {
    // Initialize GLFW
    if (!glfwInit()) return -1;
    
    // Create window
    GLFWwindow* window = glfwCreateWindow(800, 600, "ShadowRealm", NULL, NULL);
    if (!window) {
        glfwTerminate();
        return -1;
    }
    
    glfwMakeContextCurrent(window);
    glfwSwapInterval(1); // Enable vsync
    
    // Main loop
    while (!glfwWindowShouldClose(window)) {
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
        glClearColor(0.1f, 0.1f, 0.1f, 1.0f);
        
        // Your rendering code here
        
        glfwSwapBuffers(window);
        glfwPollEvents();
    }
    
    glfwDestroyWindow(window);
    glfwTerminate();
    return 0;
}
```

## 📦 Dependency Management

All external libraries are automatically handled during the build process:

- **GLM** - Downloaded from GitHub releases during CMake configure
- **ImGui** - Cloned from official repository during build
- **GLAD** - Downloaded from glad.dav1d.de during build
- **GLFW** - Installed via system package manager

The build system will automatically skip downloads if libraries already exist locally.

## 🐛 Troubleshooting

### Issue: GLFW not found
**Solution:**
```bash
# Linux
sudo apt-get install libglfw3-dev

# macOS
brew install glfw

# Windows - Auto-downloaded during CMake configure
```

### Issue: GLM not found
**Solution:** The project automatically downloads GLM if not present. Ensure you have internet connectivity during the first build.

### Issue: OpenGL errors
**Solution:** Make sure your graphics drivers are up to date:
- **NVIDIA:** Latest driver from [nvidia.com](https://www.nvidia.com/Download/driverDetails.aspx)
- **AMD:** Latest driver from [amd.com](https://www.amd.com/en/support)
- **Intel:** Latest driver from [intel.com](https://www.intel.com/content/www/us/en/support/products/80939/graphics/graphics-for-6th-generation-intel-processors.html)

### Issue: CMake configuration fails
**Solution:**
```bash
# Clean build directory and reconfigure
rm -rf build
mkdir build
cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
```

## 📚 Learning Resources

- [OpenGL Tutorial](https://learnopengl.com) - Comprehensive OpenGL guide
- [GLM Documentation](https://github.com/g-truc/glm/wiki) - Math library reference
- [GLFW Documentation](https://www.glfw.org/docs/latest/) - Window & input handling
- [ImGui Guide](https://github.com/ocornut/imgui) - UI framework examples
- [CMake Tutorial](https://cmake.org/cmake/help/latest/guide/tutorial/index.html) - Build system guide

## 📊 Build Status

[![Build ShadowRealm 3D](https://github.com/Gitinclo/SHADOWREALM-/actions/workflows/build.yml/badge.svg)](https://github.com/Gitinclo/SHADOWREALM-/actions)

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

MIT License - You are free to use this project for personal and commercial purposes!

## 🤝 Contributing

Contributions are welcome! Here's how to contribute:

1. **Fork** the repository
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

Please ensure your code follows the project's style and includes appropriate comments.

## 📞 Contact & Support

- **Author:** [Gitinclo](https://github.com/Gitinclo)
- **Repository:** https://github.com/Gitinclo/SHADOWREALM-
- **Report Issues:** [GitHub Issues](https://github.com/Gitinclo/SHADOWREALM-/issues)
- **View Workflows:** [GitHub Actions](https://github.com/Gitinclo/SHADOWREALM-/actions)

## 🎓 Project Status

| Feature | Status |
|---------|--------|
| Desktop Builds (Linux/macOS/Windows) | ✅ Working |
| CI/CD Pipeline | ✅ Configured |
| ImGui Integration | ✅ Complete |
| Android Support | 🔄 In Progress |
| Documentation | ✅ Complete |
| Example Projects | 📋 Planned |

## 🚀 Upcoming Features

- [ ] Example project templates
- [ ] 3D Model loading (OBJ, FBX)
- [ ] Advanced shader effects
- [ ] Physics engine integration
- [ ] Audio system
- [ ] Mobile controls optimization

## 💡 Tips for Beginners

1. **Start with the quick start guide** above
2. **Check the OpenGL tutorial** if you're new to graphics programming
3. **Use ImGui debug UI** to visualize your scene
4. **Experiment with shader effects** for visual improvements
5. **Profile your code** for performance optimization

## 🎨 Custom Build with Different Generators

```bash
# Ninja generator (faster builds)
cmake .. -G Ninja -DCMAKE_BUILD_TYPE=Release

# Unix Makefiles
cmake .. -G "Unix Makefiles" -DCMAKE_BUILD_TYPE=Release

# Xcode (macOS)
cmake .. -G Xcode -DCMAKE_BUILD_TYPE=Release

# Visual Studio (Windows)
cmake .. -G "Visual Studio 17 2022" -DCMAKE_BUILD_TYPE=Release
```

---

**Made with ❤️ by Gitinclo**

⭐ If you find this project useful, please consider giving it a star on GitHub!

**Last Updated:** June 2026  
**Version:** 1.0.0
