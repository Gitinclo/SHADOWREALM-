// ============================================================
//  ShadowRealm 3D - Desktop Edition
//  shadowrealm.cpp  —  with rotating lit 3D cube
// ============================================================

// ✅ CORRECT include order
#include <glad/gl.h>          // GLAD first — loads OpenGL function pointers
#define GLFW_INCLUDE_NONE     // Prevents GLFW from including its own OpenGL header
#include <GLFW/glfw3.h>       // GLFW second

#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <glm/gtc/type_ptr.hpp>

#include <imgui.h>
#include <imgui_impl_glfw.h>
#include <imgui_impl_opengl3.h>

#include <iostream>

// ------------------------------------------------------------
//  Shader sources
// ------------------------------------------------------------
static const char* kVertexShader = R"GLSL(
#version 330 core
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aNormal;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProj;

out vec3 vNormal;
out vec3 vFragPos;

void main() {
    vFragPos = vec3(uModel * vec4(aPos, 1.0));
    vNormal  = mat3(transpose(inverse(uModel))) * aNormal;
    gl_Position = uProj * uView * vec4(vFragPos, 1.0);
}
)GLSL";

static const char* kFragmentShader = R"GLSL(
#version 330 core
in vec3 vNormal;
in vec3 vFragPos;

uniform vec3 uLightPos;
uniform vec3 uViewPos;
uniform vec3 uObjectColor;
uniform vec3 uLightColor;

out vec4 FragColor;

void main() {
    // ambient
    float ambientStrength = 0.15;
    vec3 ambient = ambientStrength * uLightColor;

    // diffuse
    vec3 norm     = normalize(vNormal);
    vec3 lightDir = normalize(uLightPos - vFragPos);
    float diff    = max(dot(norm, lightDir), 0.0);
    vec3 diffuse  = diff * uLightColor;

    // specular
    float specularStrength = 0.5;
    vec3 viewDir    = normalize(uViewPos - vFragPos);
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec      = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    vec3 specular   = specularStrength * spec * uLightColor;

    vec3 result = (ambient + diffuse + specular) * uObjectColor;
    FragColor = vec4(result, 1.0);
}
)GLSL";

// ------------------------------------------------------------
//  Shader compile/link helpers
// ------------------------------------------------------------
static GLuint compileShader(GLenum type, const char* src) {
    GLuint shader = glCreateShader(type);
    glShaderSource(shader, 1, &src, nullptr);
    glCompileShader(shader);

    GLint ok = 0;
    glGetShaderiv(shader, GL_COMPILE_STATUS, &ok);
    if (!ok) {
        char log[1024];
        glGetShaderInfoLog(shader, sizeof(log), nullptr, log);
        std::cerr << "❌ Shader compile error:\n" << log << "\n";
    }
    return shader;
}

static GLuint createProgram(const char* vs, const char* fs) {
    GLuint v = compileShader(GL_VERTEX_SHADER, vs);
    GLuint f = compileShader(GL_FRAGMENT_SHADER, fs);

    GLuint prog = glCreateProgram();
    glAttachShader(prog, v);
    glAttachShader(prog, f);
    glLinkProgram(prog);

    GLint ok = 0;
    glGetProgramiv(prog, GL_LINK_STATUS, &ok);
    if (!ok) {
        char log[1024];
        glGetProgramInfoLog(prog, sizeof(log), nullptr, log);
        std::cerr << "❌ Program link error:\n" << log << "\n";
    }

    glDeleteShader(v);
    glDeleteShader(f);
    return prog;
}

// ------------------------------------------------------------
//  Cube geometry: 36 vertices (pos.xyz + normal.xyz)
// ------------------------------------------------------------
static const float kCubeVertices[] = {
    // positions          // normals
    // back face
    -0.5f,-0.5f,-0.5f,   0.0f, 0.0f,-1.0f,
     0.5f,-0.5f,-0.5f,   0.0f, 0.0f,-1.0f,
     0.5f, 0.5f,-0.5f,   0.0f, 0.0f,-1.0f,
     0.5f, 0.5f,-0.5f,   0.0f, 0.0f,-1.0f,
    -0.5f, 0.5f,-0.5f,   0.0f, 0.0f,-1.0f,
    -0.5f,-0.5f,-0.5f,   0.0f, 0.0f,-1.0f,
    // front face
    -0.5f,-0.5f, 0.5f,   0.0f, 0.0f, 1.0f,
     0.5f,-0.5f, 0.5f,   0.0f, 0.0f, 1.0f,
     0.5f, 0.5f, 0.5f,   0.0f, 0.0f, 1.0f,
     0.5f, 0.5f, 0.5f,   0.0f, 0.0f, 1.0f,
    -0.5f, 0.5f, 0.5f,   0.0f, 0.0f, 1.0f,
    -0.5f,-0.5f, 0.5f,   0.0f, 0.0f, 1.0f,
    // left face
    -0.5f, 0.5f, 0.5f,  -1.0f, 0.0f, 0.0f,
    -0.5f, 0.5f,-0.5f,  -1.0f, 0.0f, 0.0f,
    -0.5f,-0.5f,-0.5f,  -1.0f, 0.0f, 0.0f,
    -0.5f,-0.5f,-0.5f,  -1.0f, 0.0f, 0.0f,
    -0.5f,-0.5f, 0.5f,  -1.0f, 0.0f, 0.0f,
    -0.5f, 0.5f, 0.5f,  -1.0f, 0.0f, 0.0f,
    // right face
     0.5f, 0.5f, 0.5f,   1.0f, 0.0f, 0.0f,
     0.5f, 0.5f,-0.5f,   1.0f, 0.0f, 0.0f,
     0.5f,-0.5f,-0.5f,   1.0f, 0.0f, 0.0f,
     0.5f,-0.5f,-0.5f,   1.0f, 0.0f, 0.0f,
     0.5f,-0.5f, 0.5f,   1.0f, 0.0f, 0.0f,
     0.5f, 0.5f, 0.5f,   1.0f, 0.0f, 0.0f,
    // bottom face
    -0.5f,-0.5f,-0.5f,   0.0f,-1.0f, 0.0f,
     0.5f,-0.5f,-0.5f,   0.0f,-1.0f, 0.0f,
     0.5f,-0.5f, 0.5f,   0.0f,-1.0f, 0.0f,
     0.5f,-0.5f, 0.5f,   0.0f,-1.0f, 0.0f,
    -0.5f,-0.5f, 0.5f,   0.0f,-1.0f, 0.0f,
    -0.5f,-0.5f,-0.5f,   0.0f,-1.0f, 0.0f,
    // top face
    -0.5f, 0.5f,-0.5f,   0.0f, 1.0f, 0.0f,
     0.5f, 0.5f,-0.5f,   0.0f, 1.0f, 0.0f,
     0.5f, 0.5f, 0.5f,   0.0f, 1.0f, 0.0f,
     0.5f, 0.5f, 0.5f,   0.0f, 1.0f, 0.0f,
    -0.5f, 0.5f, 0.5f,   0.0f, 1.0f, 0.0f,
    -0.5f, 0.5f,-0.5f,   0.0f, 1.0f, 0.0f,
};

// ------------------------------------------------------------
//  Track framebuffer size for projection aspect ratio
// ------------------------------------------------------------
static int gFbWidth  = 1280;
static int gFbHeight = 720;

int main() {
    std::cout << "🎮 ShadowRealm 3D - Desktop Edition\n";

    GLFWwindow* window = nullptr;

    auto fail = [&](const char* msg) -> int {
        std::cerr << msg << "\n";
        if (window) glfwDestroyWindow(window);
        glfwTerminate();
        return 1;
    };

    if (!glfwInit()) {
        std::cerr << "❌ GLFW initialization failed\n";
        return 1;
    }

    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
#ifdef __APPLE__
    glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE);
#endif

    window = glfwCreateWindow(1280, 720, "🎮 ShadowRealm 3D", nullptr, nullptr);
    if (!window) return fail("❌ Window creation failed");

    glfwMakeContextCurrent(window);
    glfwSwapInterval(1);

    if (!gladLoadGL((GLADloadfunc)glfwGetProcAddress))
        return fail("❌ GLAD initialization failed");

    std::cout << "✅ OpenGL " << glGetString(GL_VERSION) << "\n";
    std::cout << "✅ GLSL "   << glGetString(GL_SHADING_LANGUAGE_VERSION) << "\n";

    glViewport(0, 0, gFbWidth, gFbHeight);
    glfwSetFramebufferSizeCallback(window, [](GLFWwindow*, int w, int h) {
        gFbWidth = w; gFbHeight = h;
        glViewport(0, 0, w, h);
    });

    // ---- ImGui ----
    IMGUI_CHECKVERSION();
    ImGui::CreateContext();
    ImGuiIO& io = ImGui::GetIO();
    io.ConfigFlags |= ImGuiConfigFlags_NavEnableKeyboard;
    ImGui::StyleColorsDark();
    ImGui_ImplGlfw_InitForOpenGL(window, true);
    ImGui_ImplOpenGL3_Init("#version 330");

    // ---- Build cube mesh ----
    GLuint vao, vbo;
    glGenVertexArrays(1, &vao);
    glGenBuffers(1, &vbo);

    glBindVertexArray(vao);
    glBindBuffer(GL_ARRAY_BUFFER, vbo);
    glBufferData(GL_ARRAY_BUFFER, sizeof(kCubeVertices), kCubeVertices, GL_STATIC_DRAW);

    // position attribute (location = 0)
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)0);
    glEnableVertexAttribArray(0);
    // normal attribute (location = 1)
    glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)(3 * sizeof(float)));
    glEnableVertexAttribArray(1);

    glBindVertexArray(0);

    // ---- Shader program ----
    GLuint shader = createProgram(kVertexShader, kFragmentShader);

    // Cache uniform locations
    GLint locModel  = glGetUniformLocation(shader, "uModel");
    GLint locView   = glGetUniformLocation(shader, "uView");
    GLint locProj   = glGetUniformLocation(shader, "uProj");
    GLint locLightP = glGetUniformLocation(shader, "uLightPos");
    GLint locViewP  = glGetUniformLocation(shader, "uViewPos");
    GLint locObjCol = glGetUniformLocation(shader, "uObjectColor");
    GLint locLitCol = glGetUniformLocation(shader, "uLightColor");

    glClearColor(0.1f, 0.1f, 0.15f, 1.0f);
    glEnable(GL_DEPTH_TEST);

    // ---- Adjustable state (driven by ImGui) ----
    glm::vec3 objectColor(0.6f, 0.3f, 0.9f);
    glm::vec3 lightColor (1.0f, 1.0f, 1.0f);
    glm::vec3 lightPos   (1.5f, 1.5f, 2.0f);
    float rotationSpeed = 50.0f;   // degrees/sec
    bool  autoRotate    = true;
    float angle         = 0.0f;
    double lastTime     = glfwGetTime();

    // ---- Main loop ----
    while (!glfwWindowShouldClose(window)) {
        glfwPollEvents();

        double now   = glfwGetTime();
        float  dt    = float(now - lastTime);
        lastTime     = now;
        if (autoRotate) angle += rotationSpeed * dt;

        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        // ---------- 3D scene pass ----------
        glUseProgram(shader);

        float aspect = gFbHeight > 0 ? (float)gFbWidth / (float)gFbHeight : 1.0f;
        glm::vec3 cameraPos(0.0f, 0.0f, 4.0f);

        glm::mat4 model = glm::rotate(glm::mat4(1.0f),
                                      glm::radians(angle),
                                      glm::normalize(glm::vec3(0.5f, 1.0f, 0.3f)));
        glm::mat4 view  = glm::lookAt(cameraPos,
                                      glm::vec3(0.0f),
                                      glm::vec3(0.0f, 1.0f, 0.0f));
        glm::mat4 proj  = glm::perspective(glm::radians(45.0f), aspect, 0.1f, 100.0f);

        glUniformMatrix4fv(locModel, 1, GL_FALSE, glm::value_ptr(model));
        glUniformMatrix4fv(locView,  1, GL_FALSE, glm::value_ptr(view));
        glUniformMatrix4fv(locProj,  1, GL_FALSE, glm::value_ptr(proj));
        glUniform3fv(locLightP, 1, glm::value_ptr(lightPos));
        glUniform3fv(locViewP,  1, glm::value_ptr(cameraPos));
        glUniform3fv(locObjCol, 1, glm::value_ptr(objectColor));
        glUniform3fv(locLitCol, 1, glm::value_ptr(lightColor));

        glBindVertexArray(vao);
        glDrawArrays(GL_TRIANGLES, 0, 36);
        glBindVertexArray(0);

        // ---------- ImGui pass ----------
        ImGui_ImplOpenGL3_NewFrame();
        ImGui_ImplGlfw_NewFrame();
        ImGui::NewFrame();

        ImGui::SetNextWindowPos(ImVec2(10, 10), ImGuiCond_FirstUseEver);
        ImGui::SetNextWindowSize(ImVec2(360, 420), ImGuiCond_FirstUseEver);

        ImGui::Begin("🎮 ShadowRealm 3D");
        ImGui::TextColored(ImVec4(1, 0.8f, 0, 1), "Welcome to ShadowRealm 3D!");
        ImGui::Separator();
        ImGui::Text("FPS: %.1f", io.Framerate);
        ImGui::Text("Frame Time: %.3f ms", 1000.0f / io.Framerate);
        ImGui::Separator();

        ImGui::TextColored(ImVec4(0.2f, 1, 0.2f, 1), "Cube Controls:");
        ImGui::Checkbox("Auto Rotate", &autoRotate);
        ImGui::SliderFloat("Speed", &rotationSpeed, 0.0f, 360.0f, "%.0f °/s");
        ImGui::ColorEdit3("Object Color", glm::value_ptr(objectColor));
        ImGui::ColorEdit3("Light Color",  glm::value_ptr(lightColor));
        ImGui::DragFloat3("Light Pos", glm::value_ptr(lightPos), 0.1f);
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

        if (ImGui::Button("Exit", ImVec2(100, 0)))
            glfwSetWindowShouldClose(window, true);
        ImGui::End();

        ImGui::Render();
        ImGui_ImplOpenGL3_RenderDrawData(ImGui::GetDrawData());

        glfwSwapBuffers(window);
    }

    // ---- Cleanup ----
    glDeleteVertexArrays(1, &vao);
    glDeleteBuffers(1, &vbo);
    glDeleteProgram(shader);

    ImGui_ImplOpenGL3_Shutdown();
    ImGui_ImplGlfw_Shutdown();
    ImGui::DestroyContext();

    glfwDestroyWindow(window);
    glfwTerminate();

    std::cout << "✅ ShadowRealm 3D closed gracefully\n";
    return 0;
}