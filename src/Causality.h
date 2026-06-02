#pragma once
#include <string>
#include <vector>
#include <functional>
#include <memory>
#include <map>

struct Cause {
    std::string name;
    std::function<bool()> condition;
    
    Cause(std::string n, std::function<bool()> c) 
        : name(n), condition(c) {}
    
    bool check() const { return condition(); }
};

struct Effect {
    std::string name;
    std::function<void()> action;
    
    Effect(std::string n, std::function<void()> a) 
        : name(n), action(a) {}
    
    void execute() { action(); }
};

struct Rule {
    std::string id;
    std::vector<std::shared_ptr<Cause>> causes;
    std::shared_ptr<Effect> effect;
    float delay = 0.0f;
    bool repeating = false;
    int maxFires = 1;
    
    float elapsed = 0.0f;
    int fireCount = 0;
    bool lastState = false;
};

class CausalityEngine {
private:
    std::vector<Rule> rules;
    
public:
    void addRule(const std::string& id,
                 const std::vector<std::shared_ptr<Cause>>& causes,
                 std::shared_ptr<Effect> effect,
                 float delay = 0.0f,
                 bool repeating = false,
                 int maxFires = 1) {
        rules.push_back({id, causes, effect, delay, repeating, maxFires, 0.0f, 0, false});
    }
    
    void addOrRule(const std::string& id,
                   const std::vector<std::shared_ptr<Cause>>& causes,
                   std::shared_ptr<Effect> effect,
                   float delay = 0.0f) {
        // OR logic: fire if ANY cause is true
        auto orCause = std::make_shared<Cause>(id + "_or", [causes]() {
            for (auto& c : causes) if (c->check()) return true;
            return false;
        });
        
        std::vector<std::shared_ptr<Cause>> orCauses = {orCause};
        addRule(id, orCauses, effect, delay, false, 1);
    }
    
    void update(float dt) {
        for (auto& rule : rules) {
            if (rule.fireCount >= rule.maxFires) continue;
            
            // Check all causes (AND logic)
            bool allTrue = true;
            for (auto& cause : rule.causes) {
                if (!cause->check()) {
                    allTrue = false;
                    break;
                }
            }
            
            // State change detection
            if (allTrue && !rule.lastState) {
                rule.elapsed = 0.0f;
                rule.lastState = true;
            } else if (!allTrue && rule.lastState) {
                rule.lastState = false;
                if (!rule.repeating) rule.elapsed = 0.0f;
            }
            
            // Fire effect after delay
            if (rule.lastState) {
                rule.elapsed += dt;
                if (rule.elapsed >= rule.delay) {
                    rule.effect->execute();
                    rule.fireCount++;
                    
                    if (rule.repeating) {
                        rule.elapsed = 0.0f;
                    } else {
                        rule.lastState = false;
                    }
                }
            }
        }
    }
};
