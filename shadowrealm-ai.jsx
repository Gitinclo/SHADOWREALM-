import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are SHADOWCORE — a senior C++ and game-engine engineer embedded in the ShadowRealm 3D project. You specialize in:

- C++17/20 (memory management, templates, RAII, move semantics)
- OpenGL 3.3 core profile / OpenGL ES 3.0 (shaders, VAOs, FBOs, shadow mapping, PCF)
- GLM math (vectors, matrices, quaternions, transforms)
- Dear ImGui (UI panels, overlays, debug tools)
- CMake build system (targets, install rules, find_package, cross-compilation)
- Android NDK / JNI (cross-platform builds, arm64-v8a, API 21+)
- MMORPG/game architecture (ECS, event systems, causality engines, boss mechanics, NFT loot systems)
- Game performance optimization (draw calls, batching, instancing, frustum culling)
- CI/CD with GitHub Actions

The user's project is SHADOWREALM-, a cross-platform C++ MMORPG using OpenGL 3.3 (desktop) / ES 3.0 (Android).
Key features include: shadow mapping, NFT loot (Common→Mythic), TeratonBomb physics, Infinite Devouring Domain (level 999 boss), Causality Engine (rule-based triggers), leaderboard, enemy HP bars.
Build system: CMake + setup.sh + build_android.sh + Docker.

Respond as a senior engineer giving clear, actionable answers. When showing code, use idiomatic C++ with good practices. Be concise but technically precise. Use code blocks for all code snippets.`;

const SUGGESTIONS = [
  "How do I implement PCF shadow mapping in OpenGL 3.3?",
  "Optimize my draw call count with instancing",
  "Fix Android NDK cross-compilation issues",
  "Design a causality/event trigger system in C++",
  "Implement an NFT loot drop system with rarity weights",
  "Write a CMakeLists.txt for cross-platform builds",
  "Debug GLSL shader compilation errors",
  "Implement enemy HP bars with 3D world projection",
];

function TypingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center", padding: "2px 0" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "#00ff9d",
          animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          display: "inline-block",
        }} />
      ))}
    </span>
  );
}

function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div style={{ position: "relative", margin: "10px 0", borderRadius: 6, overflow: "hidden", border: "1px solid #1e3a2e" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0d1f17", padding: "4px 12px", borderBottom: "1px solid #1e3a2e" }}>
        <span style={{ fontSize: 11, color: "#4a9e6e", fontFamily: "monospace", letterSpacing: 1 }}>{lang || "cpp"}</span>
        <button onClick={copy} style={{ background: "none", border: "1px solid #1e3a2e", color: copied ? "#00ff9d" : "#4a9e6e", cursor: "pointer", fontSize: 11, padding: "2px 8px", borderRadius: 4, fontFamily: "monospace" }}>
          {copied ? "✓ copied" : "copy"}
        </button>
      </div>
      <pre style={{ margin: 0, padding: "14px 16px", background: "#060e0a", color: "#c8ffd4", fontFamily: "'Fira Code', 'JetBrains Mono', 'Cascadia Code', monospace", fontSize: 13, lineHeight: 1.6, overflowX: "auto", whiteSpace: "pre" }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function MessageContent({ text }) {
  const parts = [];
  const regex = /```(\w*)\n?([\s\S]*?)```/g;
  let last = 0, match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push({ type: "text", content: text.slice(last, match.index) });
    parts.push({ type: "code", lang: match[1], content: match[2] });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ type: "text", content: text.slice(last) });

  return (
    <div>
      {parts.map((p, i) =>
        p.type === "code" ? (
          <CodeBlock key={i} code={p.content.trimEnd()} lang={p.lang} />
        ) : (
          <span key={i} style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{p.content}</span>
        )
      )}
    </div>
  );
}

export default function ShadowCoreAI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const autoResize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  };

  const send = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const newMessages = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: newMessages,
        }),
      });
      const data = await res.json();
      const reply = data.content?.map(b => b.text || "").join("") || "No response.";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages([...newMessages, { role: "assistant", content: "⚠ Connection error. Check your API access." }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const isEmpty = messages.length === 0;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#030a06",
      color: "#c8ffd4",
      fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
      display: "flex",
      flexDirection: "column",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600&family=Orbitron:wght@400;700;900&display=swap');
        @keyframes pulse { 0%,100%{opacity:.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes flicker { 0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:0.92} 94%{opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow { 0%,100%{text-shadow:0 0 8px #00ff9d44} 50%{text-shadow:0 0 20px #00ff9d88,0 0 40px #00ff9d33} }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#030a06} ::-webkit-scrollbar-thumb{background:#1e3a2e;border-radius:2px}
        textarea{resize:none;outline:none}
        textarea::placeholder{color:#2a5a3a}
        .msg-anim{animation:fadeUp 0.25s ease}
        .suggest-btn:hover{background:#0d2018 !important;border-color:#00ff9d !important;color:#00ff9d !important;transform:translateY(-1px)}
        .send-btn:hover{background:#00cc7a !important}
        .send-btn:active{transform:scale(0.97)}
      `}</style>

      {/* scanline effect */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden", opacity: 0.03 }}>
        <div style={{ position: "absolute", width: "100%", height: 2, background: "linear-gradient(transparent,#00ff9d,transparent)", animation: "scanline 8s linear infinite" }} />
      </div>

      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#030a06", borderBottom: "1px solid #0d2018", padding: "14px 20px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ position: "relative" }}>
          <div style={{ width: 38, height: 38, borderRadius: 6, background: "linear-gradient(135deg,#0d2018,#1e3a2e)", border: "1px solid #00ff9d44", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚔</div>
          <div style={{ position: "absolute", bottom: 2, right: 2, width: 8, height: 8, borderRadius: "50%", background: "#00ff9d", boxShadow: "0 0 8px #00ff9d" }} />
        </div>
        <div>
          <div style={{ fontFamily: "Orbitron", fontWeight: 900, fontSize: 15, color: "#00ff9d", animation: "glow 3s ease-in-out infinite", letterSpacing: 2 }}>SHADOWCORE</div>
          <div style={{ fontSize: 10, color: "#2a5a3a", letterSpacing: 1, marginTop: 1 }}>C++ · OpenGL · MMORPG · CMake · Android NDK</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {["C++17", "GL3.3", "CMake"].map(t => (
            <span key={t} style={{ fontSize: 9, padding: "2px 7px", borderRadius: 3, border: "1px solid #1e3a2e", color: "#2a7a4a", letterSpacing: 1 }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 0", maxWidth: 860, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {isEmpty && (
          <div style={{ padding: "40px 24px 0" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ fontFamily: "Orbitron", fontSize: 28, fontWeight: 900, color: "#00ff9d", animation: "glow 3s ease-in-out infinite", marginBottom: 8 }}>SHADOWREALM ENGINE</div>
              <div style={{ color: "#2a7a4a", fontSize: 13, letterSpacing: 1 }}>Your AI game-engine engineer. Ask anything about your C++ MMORPG.</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 10 }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="suggest-btn" onClick={() => send(s)} style={{
                  background: "#060e0a", border: "1px solid #1e3a2e", color: "#4a9e6e",
                  padding: "12px 14px", borderRadius: 8, cursor: "pointer", textAlign: "left",
                  fontSize: 12, lineHeight: 1.5, transition: "all 0.15s", fontFamily: "inherit",
                }}>
                  <span style={{ color: "#00ff9d44", marginRight: 8 }}>▸</span>{s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ padding: "0 24px" }}>
          {messages.map((m, i) => (
            <div key={i} className="msg-anim" style={{ marginBottom: 24, display: "flex", gap: 14, flexDirection: m.role === "user" ? "row-reverse" : "row", alignItems: "flex-start" }}>
              <div style={{
                width: 32, height: 32, borderRadius: 6, flexShrink: 0,
                background: m.role === "user" ? "linear-gradient(135deg,#0a1e10,#1a3a20)" : "linear-gradient(135deg,#0d2018,#1e3a2e)",
                border: `1px solid ${m.role === "user" ? "#1e3a2e" : "#00ff9d44"}`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
              }}>
                {m.role === "user" ? "⚡" : "⚔"}
              </div>
              <div style={{
                maxWidth: "82%",
                background: m.role === "user" ? "#060e0a" : "#030a06",
                border: `1px solid ${m.role === "user" ? "#1e3a2e" : "#0d2018"}`,
                borderRadius: m.role === "user" ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                padding: "12px 16px",
                fontSize: 13.5, lineHeight: 1.7,
                color: m.role === "user" ? "#8ecfa0" : "#c8ffd4",
              }}>
                <MessageContent text={m.content} />
              </div>
            </div>
          ))}

          {loading && (
            <div className="msg-anim" style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 24 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: "linear-gradient(135deg,#0d2018,#1e3a2e)", border: "1px solid #00ff9d44", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚔</div>
              <div style={{ background: "#030a06", border: "1px solid #0d2018", borderRadius: "4px 12px 12px 12px", padding: "14px 18px" }}>
                <TypingDots />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{ position: "sticky", bottom: 0, background: "#030a06", borderTop: "1px solid #0d2018", padding: "14px 24px", maxWidth: 860, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", background: "#060e0a", border: "1px solid #1e3a2e", borderRadius: 10, padding: "10px 14px", transition: "border-color 0.2s" }}
          onFocusCapture={e => e.currentTarget.style.borderColor = "#00ff9d55"}
          onBlurCapture={e => e.currentTarget.style.borderColor = "#1e3a2e"}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => { setInput(e.target.value); autoResize(); }}
            onKeyDown={handleKey}
            placeholder="Ask about OpenGL, C++, CMake, shaders, Android NDK..."
            rows={1}
            style={{
              flex: 1, background: "none", border: "none", color: "#c8ffd4",
              fontFamily: "inherit", fontSize: 13.5, lineHeight: 1.6,
              overflowY: "auto", maxHeight: 160,
            }}
          />
          <button
            className="send-btn"
            onClick={() => send()}
            disabled={!input.trim() || loading}
            style={{
              background: input.trim() && !loading ? "#00ff9d" : "#0d2018",
              border: "none", borderRadius: 7, width: 36, height: 36,
              cursor: input.trim() && !loading ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, transition: "all 0.15s", flexShrink: 0,
              color: input.trim() && !loading ? "#030a06" : "#1e3a2e",
            }}
          >▶</button>
        </div>
        <div style={{ marginTop: 8, textAlign: "center", fontSize: 10, color: "#1e3a2e", letterSpacing: 1 }}>
          SHADOWCORE · Powered by Claude · Press Enter to send · Shift+Enter for newline
        </div>
      </div>
    </div>
  );
}