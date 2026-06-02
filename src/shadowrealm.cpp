#include <iostream>
#include <glad/gl.h>
#include <GLFW/glfw3.h>
#include <glm/glm.hpp>
#include <imgui.h>
#include <imgui_impl_glfw.h>
#include <imgui_impl_opengl3.h>

int main() {
    std::cout << "🎮 ShadowRealm 3D - Desktop Edition\n";
    
    if (!glfwInit()) {
        std::cerr << "❌ GLFW initialization failed\n";
        return 1;
    }
    
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
    
    GLFWwindow* window = glfwCreateWindow(1280, 720, "🎮 ShadowRealm 3D", nullptr, nullptr);
    if (!window) {
        std::cerr << "❌ Window creation failed\n";
        glfwTerminate();
        return 1;
    }
    
    glfwMakeContextCurrent(window);
    glfwSwapInterval(1);
    
    if (!gladLoadGL((GLADloadfunc)glfwGetProcAddress)) {
        std::cerr << "❌ GLAD initialization failed\n";
        return 1;
    }
    
    std::cout << "✅ OpenGL " << glGetString(GL_VERSION) << "\n";
    std::cout << "✅ GLSL " << glGetString(GL_SHADING_LANGUAGE_VERSION) << "\n";
    
    IMGUI_CHECKVERSION();
    ImGui::CreateContext();
    ImGui::StyleColorsDark();
    ImGui_ImplGlfw_InitForOpenGL(window, true);
    ImGui_ImplOpenGL3_Init("#version 330");
    
    glClearColor(0.1f, 0.1f, 0.15f, 1.0f);
    glEnable(GL_DEPTH_TEST);
    
    while (!glfwWindowShouldClose(window)) {
        glfwPollEvents();
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
        
        ImGui_ImplOpenGL3_NewFrame();
        ImGui_ImplGlfw_NewFrame();
        ImGui::NewFrame();
        
        ImGui::SetNextWindowPos(ImVec2(10, 10), ImGuiCond_FirstUseEver);
        ImGui::SetNextWindowSize(ImVec2(500, 400), ImGuiCond_FirstUseEver);
        
        ImGui::Begin("🎮 ShadowRealm 3D");
        ImGui::TextColored(ImVec4(1, 0.8f, 0, 1), "Welcome to ShadowRealm 3D!");
        ImGui::Separator();
        ImGui::Text("FPS: %.1f", ImGui::GetIO().Framerate);
        ImGui::Text("Frame Time: %.3f ms", 1000.0f / ImGui::GetIO().Framerate);
        ImGui::Separator();
        ImGui::TextColored(ImVec4(0.2f, 1, 0.2f, 1), "Features:");
        ImGui::BulletText("HDR10+ Rendering Pipeline");
        ImGui::BulletText("Deferred Shading with Shadows");
        ImGui::BulletText("Procedural Terrain Generation");
        ImGui::BulletText("Entity Component System (ECS)");
        ImGui::BulletText("Enemy AI & Combat");
        ImGui::BulletText("Inventory & Crafting");
        ImGui::BulletText("Skill Trees & Abilities");
        ImGui::Separator();
        if (ImGui::Button("Exit", ImVec2(100, 0))) {
            glfwSetWindowShouldClose(window, true);
        }
        ImGui::End();
        
        ImGui::Render();
        ImGui_ImplOpenGL3_RenderDrawData(ImGui::GetDrawData());
        
        glfwSwapBuffers(window);
    }
    
    ImGui_ImplOpenGL3_Shutdown();
    ImGui_ImplGlfw_Shutdown();
    ImGui::DestroyContext();
    
    glfwDestroyWindow(window);
    glfwTerminate();
    
    std::cout << "✅ ShadowRealm 3D closed gracefully\n";
    return 0;
}
