import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are SHADOWCORE — a senior C++ game-engine engineer with full knowledge of the ShadowRealm 3D codebase (github.com/Gitinclo/SHADOWREALM-). You have read every line of the source code. Speak like a senior engineer reviewing a colleague's work: direct, technical, specific.

═══════════════════════════════════════════════════════
CODEBASE INTERNALS YOU KNOW COLD
═══════════════════════════════════════════════════════

── ENTRY POINT ──
main.cpp (654 lines) — android_main() entry via android_native_app_glue.
Game class owns EGLDisplay/EGLSurface/EGLContext + Renderer* + entity list.
Game loop: chrono dt capped at 50ms, calls handleInput() → update(dt) → eglSwapBuffers().
EGL config: ES3 bit, RGBA8, depth24, stencil8.

── RENDER PIPELINE (Renderer class) ──
Full deferred HDR pipeline:
  Pass 1 — Shadow: ortho lightspace 120×120, 2048×2048 GL_DEPTH_COMPONENT24 FBO.
            Missing: GL_TEXTURE_COMPARE_FUNC = GL_LEQUAL is NOT set (bug).
  Pass 2 — Geometry (G-Buffer): 4× RGBA16F render targets.
            gAlbedo (attachment 0), gNormal (1), gMaterial (2: roughness+metallic), gPosition (3).
            Depth: GL_RENDERBUFFER, DEPTH_COMPONENT24.
  Pass 3 — Lighting: full-screen quad, Blinn-Phong (NOT PBR despite material storing roughness/metallic).
            Shadow factor: simple 1-tap depth compare, bias 0.005 hardcoded. No PCF yet.
  Pass 4 — Tonemap: ACES curve + gamma 2.2, exposure uniform.
Shaders are GLSL ES 3.20 inline strings. progDeferred, progLighting, progTonemap.
glGetUniformLocation() called EVERY FRAME — not cached (perf bug).

── MESH SYSTEM ──
struct Mesh { GLuint vao, vbo, ebo; int indexCount; }
Vertex layout: stride 8 floats = [pos.xyz | normal.xyz | uv.xy]
Helpers: makeCube(), makeSphere(r, slices, stacks), makePlane(w, d)
CRITICAL BUG: in initGame(), player and enemy Renderables do:
  pr->mesh = &makeCube();   // dangling pointer — temporary destroyed immediately
  r->mesh = &makeSphere(0.5f,8,6);  // same bug

── ECS ──
Entity: unordered_map<ComponentType, unique_ptr<Component>>
get<T>() constructs a temporary T() to call .type() — works but wasteful.
Components: Transform (pos/rot/scale vec3), Renderable (Mesh*, color, roughness, metallic),
            Health (hp, maxHp), AI (attackRange, attackCd, speed, level),
            Inventory (items[36]), PlayerTag, NPCTag.
No system classes — logic is inline in Game::update().

── TERRAIN ──
PerlinNoise: custom impl, p[512] permutation table, octave() with persistence.
heightAt(x, z): octave(x*0.005, 0, z*0.005, 6, 0.55) * 30 + 8.
Terrain rendered as a single makePlane(800, 800) — not chunked yet.

── PLAYER & PHYSICS ──
playerPos vec3, camYaw/camPitch/camDist floats (orbit camera).
Gravity: GRAVITY = -22.0, JUMP_VEL = 10.0, capped yVelocity each frame.
Ground check: playerPos.y <= heightAt(...) + 1.2
Skill cooldowns: skillCdAttack, skillCdPower, skillCdHeal (float, countdown).

── ENEMY AI ──
12 enemies spawned in initGame() at random polar positions (r: 20–50).
AI::update (inline in Game::update): if dist < 20 → normalize dir, pos += dir * speed * dt.
Attack: dist < attackRange && attackCd <= 0 → player hp -= 15 + level*3. attackCd reset to 1.2.
No pathfinding, no navmesh, no obstacle avoidance.

── INPUT ──
handleInput() is COMPLETELY EMPTY. Touch controls are stubbed with comments.
No keyboard, no joystick, no gesture. The game loop runs but nothing moves from input.

── CMAKE ──
CMakeLists.txt (209 lines). Dual-mode: ANDROID / Desktop.
Desktop: FetchContent glad v2.0.8, find_package glfw3, local glm/ imgui/ include/.
ImGui sources: imgui.cpp, imgui_draw, imgui_tables, imgui_widgets + glfw/opengl3 backends.
Android: find_library GLES3/EGL/log/android, native_app_glue STATIC, shadowrealm SHARED from src/shadowrealm_mobile.cpp.
Release flags: -O3 -march=native -flto (desktop), -O3 -flto (android).
BUG: CMakeLists.txt has raw C++ code fragments embedded as non-comment lines (glad include paths).

── KNOWN BUGS & ISSUES ──
1. DANGLING POINTER: &makeCube() / &makeSphere() — UB, crash on first draw.
2. MISSING GL_TEXTURE_COMPARE_FUNC on shadow map — shadows may be all-lit or all-dark.
3. glGetUniformLocation() every frame — should cache uniform locations at init.
4. handleInput() empty — player cannot move from touch input.
5. CMakeLists.txt has C++ code lines that are not comments — will cause cmake parse error.
6. ECS get<T>() default-constructs T to read type() — minor but wasteful.
7. Lighting is Blinn-Phong, not PBR — roughness/metallic in gMaterial go unused in lighting pass.
8. Single plane terrain (no chunks, no LOD) — won't scale beyond small area.
9. The "REPEATABLE BLOCK" comment at EOF suggests line-count padding was intended.
10. glDrawBuffer(GL_NONE) syntax differs between desktop GL and GLES.

═══════════════════════════════════════════════════════
YOUR JOB
═══════════════════════════════════════════════════════
When the user asks about their code, reference exact variable names, line logic, shader code, and class structure from above. Point out bugs by name. Suggest fixes with actual code using the project's naming conventions (playerPos, camYaw, Renderer::, Entity::get<T>(), etc.). Be a senior engineer reviewing real code, not a generic assistant. Always use C++17 idioms.`;

const SUGGESTIONS = [
  "Fix the dangling &makeCube() pointer bug in initGame()",
  "Implement PCF shadow mapping (the current 1-tap is too harsh)",
  "Why is my shadow map broken? (compare func issue)",
  "Cache glGetUniformLocation — fix the per-frame perf bug",
  "Implement touch joystick input for handleInput()",
  "Convert Blinn-Phong lighting to proper PBR using roughness/metallic",
  "Add chunk-based terrain instead of the single 800×800 plane",
  "Fix the CMakeLists.txt C++ code fragment bug",
  "Upgrade ECS get<T>() to avoid default-constructing components",
  "Add pathfinding / obstacle avoidance to enemy AI",
  "Implement the NFT loot drop system with rarity weights",
  "Add SSAO pass after the G-buffer geometry pass",
];

function TypingDots() {
  return (
    <span style={{ display:"inline-flex", gap:4, alignItems:"center", padding:"2px 0" }}>
      {[0,1,2].map(i => (
        <span key={i} style={{
          width:6, height:6, borderRadius:"50%", background:"#00ff9d",
          animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`, display:"inline-block",
        }}/>
      ))}
    </span>
  );
}

function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(()=>setCopied(false),1500); };
  return (
    <div style={{ position:"relative", margin:"10px 0", borderRadius:6, overflow:"hidden", border:"1px solid #1e3a2e" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"#0d1f17", padding:"4px 12px", borderBottom:"1px solid #1e3a2e" }}>
        <span style={{ fontSize:11, color:"#4a9e6e", fontFamily:"monospace", letterSpacing:1 }}>{lang||"cpp"}</span>
        <button onClick={copy} style={{ background:"none", border:"1px solid #1e3a2e", color:copied?"#00ff9d":"#4a9e6e", cursor:"pointer", fontSize:11, padding:"2px 8px", borderRadius:4, fontFamily:"monospace" }}>
          {copied?"✓ copied":"copy"}
        </button>
      </div>
      <pre style={{ margin:0, padding:"14px 16px", background:"#060e0a", color:"#c8ffd4", fontFamily:"'Fira Code','JetBrains Mono','Cascadia Code',monospace", fontSize:13, lineHeight:1.6, overflowX:"auto", whiteSpace:"pre" }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function MessageContent({ text }) {
  const parts = [];
  const regex = /```(\w*)\n?([\s\S]*?)```/g;
  let last=0, match;
  while((match=regex.exec(text))!==null){
    if(match.index>last) parts.push({type:"text",content:text.slice(last,match.index)});
    parts.push({type:"code",lang:match[1],content:match[2]});
    last=match.index+match[0].length;
  }
  if(last<text.length) parts.push({type:"text",content:text.slice(last)});
  return (
    <div>
      {parts.map((p,i)=>p.type==="code"
        ?<CodeBlock key={i} code={p.content.trimEnd()} lang={p.lang}/>
        :<span key={i} style={{whiteSpace:"pre-wrap",lineHeight:1.7}}>{p.content}</span>
      )}
    </div>
  );
}

const BUGS = [
  { label:"CRASH", text:"Dangling &makeCube() pointer" },
  { label:"BUG", text:"Missing GL_TEXTURE_COMPARE_FUNC" },
  { label:"PERF", text:"glGetUniformLocation every frame" },
  { label:"STUB", text:"handleInput() is empty" },
  { label:"BUG", text:"CMakeLists has raw C++ fragments" },
];
const BUGCOLORS = { CRASH:"#ff4444", BUG:"#ffaa00", PERF:"#ff8800", STUB:"#4488ff" };

export default function ShadowCoreAI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBugs, setShowBugs] = useState(true);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages,loading]);

  const autoResize = () => {
    const ta = textareaRef.current; if(!ta) return;
    ta.style.height="auto"; ta.style.height=Math.min(ta.scrollHeight,160)+"px";
  };

  const send = async (text) => {
    const content=(text||input).trim();
    if(!content||loading) return;
    setInput(""); if(textareaRef.current) textareaRef.current.style.height="auto";
    if(messages.length===0) setShowBugs(false);
    const newMessages=[...messages,{role:"user",content}];
    setMessages(newMessages); setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system:SYSTEM_PROMPT, messages:newMessages }),
      });
      const data = await res.json();
      const reply = data.content?.map(b=>b.text||"").join("")||"No response.";
      setMessages([...newMessages,{role:"assistant",content:reply}]);
    } catch(e) {
      setMessages([...newMessages,{role:"assistant",content:"⚠ Connection error."}]);
    }
    setLoading(false);
  };

  const handleKey = (e) => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} };
  const isEmpty = messages.length===0;

  return (
    <div style={{ minHeight:"100vh", background:"#030a06", color:"#c8ffd4", fontFamily:"'Fira Code','JetBrains Mono',monospace", display:"flex", flexDirection:"column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600&family=Orbitron:wght@400;700;900&display=swap');
        @keyframes pulse{0%,100%{opacity:.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glow{0%,100%{text-shadow:0 0 8px #00ff9d44}50%{text-shadow:0 0 20px #00ff9d88,0 0 40px #00ff9d33}}
        @keyframes scanline{0%{transform:translateY(-100%)}100%{transform:translateY(100vh)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#030a06}::-webkit-scrollbar-thumb{background:#1e3a2e;border-radius:2px}
        textarea{resize:none;outline:none}textarea::placeholder{color:#2a5a3a}
        .msg-anim{animation:fadeUp 0.25s ease}
        .suggest-btn:hover{background:#0d2018!important;border-color:#00ff9d!important;color:#00ff9d!important}
        .send-btn:hover{background:#00cc7a!important}.send-btn:active{transform:scale(0.97)}
        .bug-tag:hover{opacity:0.8;cursor:pointer}
      `}</style>

      {/* Scanline */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden",opacity:0.025}}>
        <div style={{position:"absolute",width:"100%",height:2,background:"linear-gradient(transparent,#00ff9d,transparent)",animation:"scanline 8s linear infinite"}}/>
      </div>

      {/* Header */}
      <div style={{position:"sticky",top:0,zIndex:10,background:"#030a06",borderBottom:"1px solid #0d2018",padding:"12px 20px",display:"flex",alignItems:"center",gap:12}}>
        <div style={{position:"relative"}}>
          <div style={{width:36,height:36,borderRadius:6,background:"linear-gradient(135deg,#0d2018,#1e3a2e)",border:"1px solid #00ff9d44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17}}>⚔</div>
          <div style={{position:"absolute",bottom:2,right:2,width:7,height:7,borderRadius:"50%",background:"#00ff9d",boxShadow:"0 0 8px #00ff9d"}}/>
        </div>
        <div>
          <div style={{fontFamily:"Orbitron",fontWeight:900,fontSize:14,color:"#00ff9d",animation:"glow 3s ease-in-out infinite",letterSpacing:2}}>SHADOWCORE</div>
          <div style={{fontSize:10,color:"#2a5a3a",letterSpacing:1,marginTop:1}}>Has read your entire codebase · main.cpp · CMakeLists.txt · ECS · Renderer</div>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:5,flexWrap:"wrap",justifyContent:"flex-end"}}>
          {["654 loc","GLES 3.2","ECS","Deferred HDR","ACES"].map(t=>(
            <span key={t} style={{fontSize:9,padding:"2px 6px",borderRadius:3,border:"1px solid #1e3a2e",color:"#2a7a4a",letterSpacing:1}}>{t}</span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:"auto",padding:"20px 0",maxWidth:880,width:"100%",margin:"0 auto",boxSizing:"border-box"}}>
        {isEmpty && (
          <div style={{padding:"32px 24px 0"}}>
            {/* Intro */}
            <div style={{textAlign:"center",marginBottom:28}}>
              <div style={{fontFamily:"Orbitron",fontSize:22,fontWeight:900,color:"#00ff9d",animation:"glow 3s ease-in-out infinite",marginBottom:6}}>SHADOWREALM ENGINEER</div>
              <div style={{color:"#2a7a4a",fontSize:12,letterSpacing:1}}>I've read your actual code. I know your bugs. Ask me anything.</div>
            </div>

            {/* Live bug tracker */}
            {showBugs && (
              <div style={{marginBottom:24,border:"1px solid #1e0000",borderRadius:8,background:"#0a0404",overflow:"hidden"}}>
                <div style={{padding:"8px 14px",borderBottom:"1px solid #1e0000",display:"flex",alignItems:"center",gap:8}}>
                  <span style={{color:"#ff4444",animation:"blink 2s ease infinite",fontSize:12}}>●</span>
                  <span style={{fontFamily:"Orbitron",fontSize:10,color:"#ff6644",letterSpacing:2}}>LIVE ISSUES DETECTED IN YOUR REPO</span>
                </div>
                <div style={{padding:"10px 14px",display:"flex",flexWrap:"wrap",gap:8}}>
                  {BUGS.map((b,i)=>(
                    <button key={i} className="bug-tag" onClick={()=>send(`Fix: ${b.text}`)}
                      style={{background:"none",border:`1px solid ${BUGCOLORS[b.label]}33`,borderRadius:5,padding:"6px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:7,transition:"opacity 0.15s"}}>
                      <span style={{fontSize:9,padding:"1px 5px",borderRadius:3,background:BUGCOLORS[b.label]+"22",color:BUGCOLORS[b.label],fontFamily:"Orbitron",letterSpacing:1}}>{b.label}</span>
                      <span style={{fontSize:11,color:"#8ecfa0"}}>{b.text}</span>
                    </button>
                  ))}
                </div>
                <div style={{padding:"6px 14px 10px",fontSize:10,color:"#2a5a3a"}}>↑ Click any issue to get a fix</div>
              </div>
            )}

            {/* Suggestions */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:8}}>
              {SUGGESTIONS.map((s,i)=>(
                <button key={i} className="suggest-btn" onClick={()=>send(s)} style={{
                  background:"#060e0a",border:"1px solid #1e3a2e",color:"#4a9e6e",
                  padding:"11px 13px",borderRadius:7,cursor:"pointer",textAlign:"left",
                  fontSize:12,lineHeight:1.5,transition:"all 0.15s",fontFamily:"inherit",
                }}>
                  <span style={{color:"#00ff9d44",marginRight:7}}>▸</span>{s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{padding:"0 24px"}}>
          {messages.map((m,i)=>(
            <div key={i} className="msg-anim" style={{marginBottom:22,display:"flex",gap:12,flexDirection:m.role==="user"?"row-reverse":"row",alignItems:"flex-start"}}>
              <div style={{
                width:30,height:30,borderRadius:6,flexShrink:0,
                background:m.role==="user"?"linear-gradient(135deg,#0a1e10,#1a3a20)":"linear-gradient(135deg,#0d2018,#1e3a2e)",
                border:`1px solid ${m.role==="user"?"#1e3a2e":"#00ff9d44"}`,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,
              }}>
                {m.role==="user"?"⚡":"⚔"}
              </div>
              <div style={{
                maxWidth:"83%",
                background:m.role==="user"?"#060e0a":"#030a06",
                border:`1px solid ${m.role==="user"?"#1e3a2e":"#0d2018"}`,
                borderRadius:m.role==="user"?"12px 4px 12px 12px":"4px 12px 12px 12px",
                padding:"11px 15px",fontSize:13.5,lineHeight:1.7,
                color:m.role==="user"?"#8ecfa0":"#c8ffd4",
              }}>
                <MessageContent text={m.content}/>
              </div>
            </div>
          ))}
          {loading&&(
            <div className="msg-anim" style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:22}}>
              <div style={{width:30,height:30,borderRadius:6,background:"linear-gradient(135deg,#0d2018,#1e3a2e)",border:"1px solid #00ff9d44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>⚔</div>
              <div style={{background:"#030a06",border:"1px solid #0d2018",borderRadius:"4px 12px 12px 12px",padding:"13px 16px"}}>
                <TypingDots/>
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>
      </div>

      {/* Input */}
      <div style={{position:"sticky",bottom:0,background:"#030a06",borderTop:"1px solid #0d2018",padding:"12px 24px",maxWidth:880,width:"100%",margin:"0 auto",boxSizing:"border-box"}}>
        <div style={{display:"flex",gap:10,alignItems:"flex-end",background:"#060e0a",border:"1px solid #1e3a2e",borderRadius:10,padding:"10px 13px",transition:"border-color 0.2s"}}
          onFocusCapture={e=>e.currentTarget.style.borderColor="#00ff9d55"}
          onBlurCapture={e=>e.currentTarget.style.borderColor="#1e3a2e"}>
          <textarea
            ref={textareaRef} value={input}
            onChange={e=>{setInput(e.target.value);autoResize();}}
            onKeyDown={handleKey}
            placeholder="Ask about your code — I know playerPos, handleInput(), Renderer::geometryPass, makeCube()..."
            rows={1}
            style={{flex:1,background:"none",border:"none",color:"#c8ffd4",fontFamily:"inherit",fontSize:13.5,lineHeight:1.6,overflowY:"auto",maxHeight:160}}
          />
          <button className="send-btn" onClick={()=>send()} disabled={!input.trim()||loading}
            style={{background:input.trim()&&!loading?"#00ff9d":"#0d2018",border:"none",borderRadius:7,width:34,height:34,cursor:input.trim()&&!loading?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,transition:"all 0.15s",flexShrink:0,color:input.trim()&&!loading?"#030a06":"#1e3a2e"}}>▶</button>
        </div>
        <div style={{marginTop:7,textAlign:"center",fontSize:10,color:"#1e3a2e",letterSpacing:1}}>
          SHADOWCORE · Knows your actual code · Enter to send · Shift+Enter for newline
        </div>
      </div>
    </div>
  );
}