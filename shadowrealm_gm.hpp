#pragma once
// ============================================================================
//  SHADOWREALM — Unified GM / Admin Module  (shadowrealm_gm.hpp)
//  ---------------------------------------------------------------------------
//  Single-header, drop-in GM console + auth.
//  Compile ONLY in your private build:   -DSHADOWREALM_ADMIN_BUILD
//
//  Security note (read me): This is a CLIENT-SIDE module. The real protection
//  is that this code only exists in YOUR binary. The password just stops
//  someone who somehow obtains that binary. True tamper-proofing requires a
//  server. See the README block at the bottom.
// ============================================================================
#ifdef SHADOWREALM_ADMIN_BUILD

#include <array>
#include <vector>
#include <string>
#include <cstdint>
#include <cstring>
#include <chrono>
#include <random>
#include <functional>

// Forward declarations — adjust to match your engine.
struct Entity;
class  Game;

// ============================================================================
//  SECTION 1 — Privileges & Session
// ============================================================================
enum class GMPriv : uint32_t {
    None        = 0,
    Godmode     = 1u << 0,
    SpawnEnemy  = 1u << 1,
    SetHP       = 1u << 2,
    GiveLoot    = 1u << 3,
    Teleport    = 1u << 4,
    SetLevel    = 1u << 5,
    TimeControl = 1u << 6,
    ToggleHUD   = 1u << 7,
    All         = 0xFFFFFFFFu
};
inline GMPriv operator|(GMPriv a, GMPriv b){ return (GMPriv)((uint32_t)a|(uint32_t)b); }
inline bool   hasBit(uint32_t m, GMPriv p){ return (m & (uint32_t)p) != 0; }

struct GMSession {
    bool     active      = false;
    uint32_t privMask    = 0;
    uint64_t token       = 0;
    uint64_t expiresAtMs = 0;
    bool     godmode     = false;
    bool     timeFrozen  = false;
    float    timeScale   = 1.0f;
    // Anti-tamper canary: token XOR a secret. Checked on every privileged call.
    uint64_t canary      = 0;
};

// ============================================================================
//  SECTION 2 — Time helper
// ============================================================================
namespace gm_detail {
    inline uint64_t nowMs() {
        using namespace std::chrono;
        return (uint64_t)duration_cast<milliseconds>(
            steady_clock::now().time_since_epoch()).count();
    }
}

// ============================================================================
//  SECTION 3 — SHA-256 (dependency-free)
// ============================================================================
namespace gm_detail {
    inline uint32_t rotr32(uint32_t x, int n){ return (x>>n)|(x<<(32-n)); }

    inline std::array<uint8_t,32> sha256(const uint8_t* msg, size_t len) {
        static const uint32_t K[64] = {
            0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,
            0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,
            0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,
            0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
            0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,
            0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,
            0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,
            0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
            0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,
            0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,
            0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
        };
        uint32_t h[8] = {0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,
                         0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19};
        std::vector<uint8_t> data(msg, msg+len);
        uint64_t bitLen = (uint64_t)len * 8;
        data.push_back(0x80);
        while ((data.size() % 64) != 56) data.push_back(0x00);
        for (int i=7;i>=0;i--) data.push_back((uint8_t)((bitLen>>(i*8))&0xFF));

        for (size_t i=0;i<data.size();i+=64) {
            uint32_t w[64];
            for (int j=0;j<16;j++)
                w[j]=(data[i+j*4]<<24)|(data[i+j*4+1]<<16)|(data[i+j*4+2]<<8)|data[i+j*4+3];
            for (int j=16;j<64;j++){
                uint32_t s0=rotr32(w[j-15],7)^rotr32(w[j-15],18)^(w[j-15]>>3);
                uint32_t s1=rotr32(w[j-2],17)^rotr32(w[j-2],19)^(w[j-2]>>10);
                w[j]=w[j-16]+s0+w[j-7]+s1;
            }
            uint32_t a=h[0],b=h[1],c=h[2],d=h[3],e=h[4],f=h[5],g=h[6],hh=h[7];
            for (int j=0;j<64;j++){
                uint32_t S1=rotr32(e,6)^rotr32(e,11)^rotr32(e,25);
                uint32_t ch=(e&f)^(~e&g);
                uint32_t t1=hh+S1+ch+K[j]+w[j];
                uint32_t S0=rotr32(a,2)^rotr32(a,13)^rotr32(a,22);
                uint32_t maj=(a&b)^(a&c)^(b&c);
                uint32_t t2=S0+maj;
                hh=g;g=f;f=e;e=d+t1;d=c;c=b;b=a;a=t1+t2;
            }
            h[0]+=a;h[1]+=b;h[2]+=c;h[3]+=d;h[4]+=e;h[5]+=f;h[6]+=g;h[7]+=hh;
        }
        std::array<uint8_t,32> out{};
        for (int i=0;i<8;i++) for (int j=0;j<4;j++)
            out[i*4+j]=(uint8_t)((h[i]>>((3-j)*8))&0xFF);
        return out;
    }
    inline std::array<uint8_t,32> sha256(const std::string& s){
        return sha256((const uint8_t*)s.data(), s.size());
    }
}

// ============================================================================
//  SECTION 4 — Auth (PBKDF2-style: salt + 200k SHA-256 iterations)
// ============================================================================
namespace AdminAuth {

    // -------------------------------------------------------------------------
    //  CONFIGURE THESE (see README at bottom for how to generate)
    // -------------------------------------------------------------------------
    //  Random 16-byte salt — change to your own random bytes:
    static constexpr std::array<uint8_t,16> GM_SALT = {
        0xA3,0x1F,0x9C,0x42,0x7E,0xB0,0x55,0xD8,
        0x11,0x6A,0x3F,0xC4,0x88,0x2D,0x91,0x07
    };
    //  PBKDF2(password, GM_SALT, 200000) — REPLACE with your derived key:
    static constexpr std::array<uint8_t,32> GM_PASS_KEY = {
        // placeholder for "changeme" — REGENERATE with the tool below!
        0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
        0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
        0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
        0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00
    };
    //  Secret used for the anti-tamper canary (any random 64-bit value):
    static constexpr uint64_t GM_CANARY_SECRET = 0x9E3779B97F4A7C15ull;

    static constexpr uint32_t MAX_FAIL   = 5;
    static constexpr uint64_t SESSION_MS = 30ull*60*1000;
    static constexpr uint64_t LOCKOUT_MS = 10ull*60*1000;
    static constexpr uint32_t PBKDF2_ITERS = 200000;

    // Persistent lockout state (the bug fix: NOT stored on the session object)
    inline uint64_t& lockedUntil(){ static uint64_t t=0; return t; }
    inline uint32_t& failCounter(){ static uint32_t n=0; return n; }

    // Simple iterated KDF: H(H(...H(salt||pw)...)). Slows brute force.
    inline std::array<uint8_t,32> deriveKey(const std::string& password) {
        std::vector<uint8_t> buf(GM_SALT.begin(), GM_SALT.end());
        buf.insert(buf.end(), password.begin(), password.end());
        auto h = gm_detail::sha256(buf.data(), buf.size());
        for (uint32_t i=1;i<PBKDF2_ITERS;i++)
            h = gm_detail::sha256(h.data(), h.size());
        return h;
    }

    inline GMSession login(const std::string& password) {
        GMSession fail;
        if (gm_detail::nowMs() < lockedUntil()) return fail;

        auto key = deriveKey(password);
        uint8_t diff = 0;                       // constant-time compare
        for (int i=0;i<32;i++) diff |= key[i] ^ GM_PASS_KEY[i];

        if (diff != 0) {
            if (++failCounter() >= MAX_FAIL) {
                lockedUntil() = gm_detail::nowMs() + LOCKOUT_MS;
                failCounter() = 0;
            }
            return fail;                        // silent failure
        }

        failCounter() = 0;
        std::mt19937_64 rng(std::random_device{}());
        GMSession s;
        s.active      = true;
        s.privMask    = (uint32_t)GMPriv::All;
        s.token       = rng();
        s.canary      = s.token ^ GM_CANARY_SECRET;   // anti-tamper seal
        s.expiresAtMs = gm_detail::nowMs() + SESSION_MS;
        return s;
    }

    // Validates session integrity (catches naive memory editors flipping
    // `active` or `privMask` without knowing the canary relationship).
    inline bool integrityOk(const GMSession& s) {
        return s.active && (s.canary == (s.token ^ GM_CANARY_SECRET));
    }

    inline bool hasPriv(const GMSession& s, GMPriv p) {
        if (!integrityOk(s))                  return false;
        if (gm_detail::nowMs() > s.expiresAtMs) return false;
        return hasBit(s.privMask, p);
    }

    inline void logout(GMSession& s){ s = GMSession{}; }

    inline void tick(GMSession& s) {
        if (s.active && gm_detail::nowMs() > s.expiresAtMs) logout(s);
        // Tamper trip-wire: if someone forced active=true, canary won't match.
        if (s.active && !integrityOk(s)) logout(s);
    }
} // namespace AdminAuth

// ============================================================================
//  SECTION 5 — Console (Dear ImGui). Implementation lives in ONE .cpp that
//  includes this header AND your game header. See README for the 3-line .cpp.
// ============================================================================
enum class LogLevel { Info, Warn, Error, GM };
struct LogEntry { LogLevel level; std::string msg; uint64_t timestampMs; };

class AdminConsole {
public:
    explicit AdminConsole(Game* game) : m_game(game) {}

    void  render(float dt);
    void  tick(float dt);
    void  toggle(){ m_open = !m_open; }
    bool  isOpen()       const { return m_open; }
    bool  isGodmode()    const { return m_session.godmode; }
    bool  isTimeFrozen() const { return m_session.timeFrozen; }
    float timeScale()    const { return m_session.timeScale; }
    void  log(LogLevel lvl, const std::string& msg);

private:
    Game*     m_game;
    GMSession m_session;
    bool      m_open      = false;
    bool      m_showLogin = true;
    char      m_passBuffer[128] = {};

    bool m_panelPlayer=true, m_panelEnemies=true, m_panelLoot=false,
         m_panelWorld=false, m_panelLog=false;
    std::vector<LogEntry> m_log;

    void renderLoginWindow();
    void renderMainMenuBar();
    void renderPlayerPanel();
    void renderEnemyPanel();
    void renderLootPanel();
    void renderWorldPanel();
    void renderLogPanel();
    void renderSessionBar();

    void actionGodmode(bool enable);
    void actionTeleport(float x,float y,float z);
    void actionSetPlayerHP(float hp);
    void actionSpawnEnemy(float x,float z,int level);
    void actionKillAllEnemies();
    void actionGiveLootItem(int rarity);
    void actionSetTimeScale(float scale);
};

#endif // SHADOWREALM_ADMIN_BUILD
