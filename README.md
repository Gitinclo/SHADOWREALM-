# 🎮 ShadowRealm 3D

**Cross-platform MMORPG** with OpenGL 3.3, NFT system, Causality engine, and more!

[![Build Status](https://github.com/Gitinclo/SHADOWREALM-/workflows/Build%20ShadowRealm%203D/badge.svg)](https://github.com/Gitinclo/SHADOWREALM-/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start

### Desktop (Linux/macOS)
```bash
git clone https://github.com/Gitinclo/SHADOWREALM-.git
cd SHADOWREALM-
chmod +x setup.sh
./setup.sh
./build/shadowrealm
```

### Android
```bash
export ANDROID_NDK_ROOT=~/Android/Sdk/ndk/25.1.8937393
chmod +x build_android.sh
./build_android.sh
```

### Docker
```bash
docker build -t shadowrealm .
docker run shadowrealm
```

## ✨ Features

- ✅ **3D Graphics** - OpenGL 3.3 (Desktop) / ES 3.0 (Android)
- ✅ **Shadow Mapping** - PCF shadows with 2K depth maps
- ✅ **NFT System** - Rarity-based loot drops (Common → Mythic)
- ✅ **TeratonBomb** - Nuclear weapon with physics-based explosions
- ✅ **Infinite Devouring Domain** - Level 999 boss mechanic
- ✅ **Causality Engine** - Cause/effect game logic system
- ✅ **Minimap** - Real-time 2D overlay
- ✅ **Enemy HP Bars** - 3D world + 2D projected
- ✅ **Leaderboard** - Persistent player rankings
- ✅ **Cross-Platform** - Windows, macOS, Linux, Android

## 🎮 Controls

| Key | Action |
|-----|--------|
| **W/A/S/D** | Move |
| **RMB Drag** | Camera |
| **Z** | Attack |
| **X** | Power Attack |
| **C** | Heal |
| **Ctrl** | Dash |
| **N** | Nuke |
| **G** | Domain |
| **F** | Fly Mode |
| **F1** | Menu |

## 📋 System Requirements

### Linux
```bash
sudo apt-get install build-essential cmake libglfw3-dev libglm-dev libgl1-mesa-dev
```

### macOS
```bash
brew install glfw glm cmake
```

### Windows
- Visual Studio 2022 Community
- CMake 3.18+

### Android
- Android NDK 25.1+
- Android SDK API 21+

## 📁 Project Structure

```
SHADOWREALM-/
├── CMakeLists.txt              Main build config
├── setup.sh                    Auto-setup script
├── build_android.sh            Android build script
├── Dockerfile                  Container build
├── .github/workflows/
│   └── build.yml               CI/CD pipeline
├── src/
│   ├── shadowrealm.cpp         Desktop version
│   └── shadowrealm_mobile.cpp  Android version
├── imgui/                      UI framework (auto-downloaded)
├── glm/                        Math library (auto-downloaded)
├── include/glad/               OpenGL loader (auto-downloaded)
└── build/                      Build output
```

## 🔧 Build Options

### Debug Build
```bash
cd build
cmake .. -DCMAKE_BUILD_TYPE=Debug
make -j4
```

### Release Build (Optimized)
```bash
cd build
cmake .. -DCMAKE_BUILD_TYPE=Release -DCMAKE_CXX_FLAGS="-O3 -march=native"
make -j4
```

## 📊 Performance

- **Desktop**: 60+ FPS @ 1280x720
- **Android**: 30+ FPS @ 1080p
- **Shadow Map**: 2048x2048 PCF
- **Draw Calls**: 50-100 per frame

## 🎯 Game Features

### Combat System
- Attack, Power Attack, Heal, Dash abilities
- Enemy AI with aggro radius
- Knockback physics
- Damage numbers

### NFT Inventory
- 6 rarity tiers (Common → Mythic)
- Weapon & Armor slots
- Stat bonuses (STR, DEF)
- Crypto rewards (CC)

### Domain System
- Level 1-999 progression
- 5 unlockable skills
- Soul Devour, Domain Suppression, Void Erasure, Breaker, Chaos
- Dynamic range scaling

### Causality Engine
- 8 rule-based triggers
- Automatic event firing
- Level-up unlocks
- Boss alerts
- NFT airdrops

## 🐛 Troubleshooting

### Build Fails
```bash
# Clean and rebuild
rm -rf build
mkdir build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
make -j4
```

### Missing Dependencies
```bash
# Re-run setup
./setup.sh
```

### Android Build Issues
```bash
# Verify NDK path
echo $ANDROID_NDK_ROOT

# Set if not found
export ANDROID_NDK_ROOT=~/Android/Sdk/ndk/25.1.8937393
```

## 📈 CI/CD

GitHub Actions automatically builds on every push:
- ✅ Linux (Ubuntu 22.04)
- ✅ macOS (Latest)
- ✅ Android (arm64-v8a)

View builds: [Actions Tab](https://github.com/Gitinclo/SHADOWREALM-/actions)

## 📜 License

MIT License - See [LICENSE](LICENSE) file

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📧 Contact

- GitHub: [@Gitinclo](https://github.com/Gitinclo)
- Issues: [GitHub Issues](https://github.com/Gitinclo/SHADOWREALM-/issues)

---

**Made with ❤️ for the ShadowRealm community**

⭐ If you like this project, please star it!
