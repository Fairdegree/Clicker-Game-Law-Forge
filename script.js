// -----------------------------
// VARIABLES
// -----------------------------
let clicks = 0;
let multiplier = 1;
let auto = 0;
let prestige = 0;
let achievements = {};

// per‑run rules
let rules = {
    heat: false,
    entropy: false,
    chaos: false,
    timewarp: false
};

let heat = 0;
let entropyDrift = 0.2;
let chaosTimer = 0;

// permanent laws (old forge system)
let permanentLaws = [];

// LP (Law Points) – for Law Tree
let lp = 0; // 1 LP per 100,000,000 clicks, awarded on prestige

// -----------------------------
// DOM ELEMENTS
// -----------------------------
const clicksEl = document.getElementById("clicks");
const multEl = document.getElementById("multiplier");
const autoEl = document.getElementById("auto");
const prestigeEl = document.getElementById("prestige");
const progressFill = document.getElementById("progressFill");

const shopPanel = document.getElementById("shopPanel");
const prestigePanel = document.getElementById("prestigePanel");
const achievementsPanel = document.getElementById("achievementsPanel");
const rulesPanel = document.getElementById("rulesPanel");
const lawPanel = document.getElementById("lawPanel");          // old forge
const lawChoices = document.getElementById("lawChoices");

const lawTreePanel = document.getElementById("lawTreePanel");  // new tree
const lawTreeContainer = document.getElementById("lawTreeContainer");

const prestigeGainEl = document.getElementById("prestigeGain");
const achievementList = document.getElementById("achievementList");
const achievementPopup = document.getElementById("achievementPopup");

// Dev panel
const devPanel = document.getElementById("devPanel");
const devBtn = document.getElementById("devBtn");
const devClicks = document.getElementById("devClicks");
const devMult = document.getElementById("devMult");
const devAuto = document.getElementById("devAuto");
const devPrestige = document.getElementById("devPrestige");

// Debug overlay
const debugOverlay = document.getElementById("debugOverlay");
const debugContent = document.getElementById("debugContent");

// Law Tree open button in dev panel
const openLawTreeBtn = document.getElementById("openLawTree");

// LP display
const lpDisplay = document.getElementById("lpDisplay");

// -----------------------------
// SAVE + LOAD
// -----------------------------
function saveGame() {
    localStorage.setItem("clickerSave", JSON.stringify({
        clicks,
        multiplier,
        auto,
        prestige,
        achievements,
        permanentLaws,
        lp,
        rules,
        heat,
        entropyDrift,
        chaosTimer
    }));
}

function loadGame() {
    const data = JSON.parse(localStorage.getItem("clickerSave"));
    if (data) {
        clicks = data.clicks ?? 0;
        multiplier = data.multiplier ?? 1;
        auto = data.auto ?? 0;
        prestige = data.prestige ?? 0;
        achievements = data.achievements ?? {};
        permanentLaws = data.permanentLaws ?? [];
        lp = data.lp ?? 0;
        rules = data.rules ?? rules;
        heat = data.heat ?? 0;
        entropyDrift = data.entropyDrift ?? 0.2;
        chaosTimer = data.chaosTimer ?? 0;
    }
}

loadGame();

// -----------------------------
// COST FUNCTIONS
// -----------------------------
function multCost() { return multiplier * 50; }
function autoCost() { return (auto + 1) * 100; }

// -----------------------------
// ACHIEVEMENTS
// -----------------------------
const achievementDefs = [
    { id: "firstClick", name: "First Click!", condition: () => clicks >= 1 },
    { id: "hundredClicks", name: "100 Clicks!", condition: () => clicks >= 100 },
    { id: "bigMultiplier", name: "Multiplier 10!", condition: () => multiplier >= 10 },
    { id: "autoMaster", name: "10 Auto‑Clickers!", condition: () => auto >= 10 },
    { id: "prestige1", name: "First Prestige!", condition: () => prestige >= 1 }
];

function checkAchievements() {
    achievementDefs.forEach(a => {
        if (!achievements[a.id] && a.condition()) {
            achievements[a.id] = true;
            showAchievement(a.name);
        }
    });
    renderAchievements();
}

function renderAchievements() {
    achievementList.innerHTML = "";
    achievementDefs.forEach(a => {
        const li = document.createElement("li");
        li.textContent = (achievements[a.id] ? "🏆 " : "⬜ ") + a.name;
        achievementList.appendChild(li);
    });
}

function showAchievement(name) {
    achievementPopup.textContent = "🏆 " + name;
    achievementPopup.classList.add("show");
    setTimeout(() => achievementPopup.classList.remove("show"), 2500);
}

// -----------------------------
// LP CALCULATION (1 LP per 100,000,000 clicks)
// -----------------------------
function calculateLPFromClicks(c) {
    return Math.floor(c / 100000000);
}

// -----------------------------
// UI UPDATE
// -----------------------------
function updateUI() {
    clicksEl.textContent = clicks.toFixed(1);
    multEl.textContent = multiplier;
    autoEl.textContent = auto;
    prestigeEl.textContent = prestige;

    document.getElementById("buyMult").textContent =
        `⚔️ Buy Multiplier (cost: ${multCost()})`;

    document.getElementById("buyAuto").textContent =
        `🤖 Buy Auto‑Clicker (cost: ${autoCost()})`;

    document.getElementById("buyMult").disabled = clicks < multCost();
    document.getElementById("buyAuto").disabled = clicks < autoCost();

    progressFill.style.width = `${(clicks % 100) / 100 * 100}%`;

    prestigeGainEl.textContent = Math.floor(clicks / 1000);

    // Dev panel live values
    devClicks.textContent = clicks.toFixed(1);
    devMult.textContent = multiplier;
    devAuto.textContent = auto;
    devPrestige.textContent = prestige;

    // LP display
    if (lpDisplay) lpDisplay.textContent = lp;

    checkAchievements();
    updateDebugOverlay();
    saveGame();
}

// -----------------------------
// CLICK BUTTON
// -----------------------------
document.getElementById("clickBtn").onclick = () => {
    let gain = multiplier * (1 + prestige * 0.5);

    // permanent law: clickBoost
    if (permanentLaws.includes("clickBoost")) {
        gain *= 1.05;
    }

    // HEAT RULE
    if (rules.heat) {
        heat += 0.5;
        if (heat > 100) gain *= 0.5;
    }

    // ENTROPY RULE
    if (rules.entropy) {
        const drift = entropyDrift * (permanentLaws.includes("entropySlow") ? 0.5 : 1);
        gain += (Math.random() - 0.5) * drift;
    }

    clicks += gain;
    updateUI();
};

// -----------------------------
// SHOP BUTTONS
// -----------------------------
document.getElementById("buyMult").onclick = () => {
    const cost = multCost();
    if (clicks >= cost) {
        clicks -= cost;
        multiplier++;
        updateUI();
    }
};

document.getElementById("buyAuto").onclick = () => {
    const cost = autoCost();
    if (clicks >= cost) {
        clicks -= cost;
        auto++;
        updateUI();
    }
};

// -----------------------------
// AUTO CLICK LOOP
// -----------------------------
setInterval(() => {
    let autoGain = auto * 0.2 * (1 + prestige * 0.5);

    // permanent law: autoBoost
    if (permanentLaws.includes("autoBoost")) {
        autoGain *= 2;
    }

    // TIMEWARP RULE
    if (rules.timewarp) {
        autoGain *= 1.5;
    }

    // ENTROPY RULE
    if (rules.entropy) {
        const drift = entropyDrift * (permanentLaws.includes("entropySlow") ? 0.5 : 1);
        autoGain += (Math.random() - 0.5) * drift;
    }

    clicks += autoGain;

    // HEAT COOLING
    if (rules.heat) {
        const coolFactor = permanentLaws.includes("heatDissipation") ? 0.4 : 0.2;
        heat = Math.max(0, heat - coolFactor);
    }

    // CHAOS EVENTS
    if (rules.chaos) {
        chaosTimer++;
        if (chaosTimer >= 300) {
            chaosTimer = 0;
            triggerChaosEvent();
        }
    }

    updateUI();
}, 100);

// -----------------------------
// CHAOS EVENTS
// -----------------------------
function triggerChaosEvent() {
    let events;

    if (permanentLaws.includes("goodChaos")) {
        events = [
            () => { multiplier += 1; },
            () => { auto += 1; },
            () => { clicks += 1000; },
            () => { heat = 0; }
        ];
    } else {
        events = [
            () => { clicks *= 0.5; },
            () => { multiplier += 1; },
            () => { auto += 1; },
            () => { clicks += 500; },
            () => { heat = 0; },
            () => { entropyDrift += 0.2; }
        ];
    }

    const event = events[Math.floor(Math.random() * events.length)];
    event();
}

// -----------------------------
// PANELS
// -----------------------------
document.getElementById("openShop").onclick = () => openPanel(shopPanel);
document.getElementById("openPrestige").onclick = () => openPanel(prestigePanel);
document.getElementById("openAchievements").onclick = () => openPanel(achievementsPanel);
document.getElementById("openRules").onclick = () => openPanel(rulesPanel);

function openPanel(panel) {
    closePanels();
    panel.classList.add("open");
}

function closePanels() {
    shopPanel.classList.remove("open");
    prestigePanel.classList.remove("open");
    achievementsPanel.classList.remove("open");
    devPanel.classList.remove("open");
    rulesPanel.classList.remove("open");
    lawPanel.classList.remove("open");
    if (lawTreePanel) lawTreePanel.classList.remove("open");
}

window.closePanels = closePanels;

// -----------------------------
// PRESTIGE + LAW FORGE (OLD SYSTEM)
// -----------------------------
document.getElementById("doPrestige").onclick = () => {
    const gain = Math.floor(clicks / 1000);
    if (gain > 0) {
        // prestige gain
        prestige += gain;

        // LP gain from clicks
        const lpGain = calculateLPFromClicks(clicks);
        lp += lpGain;

        // reset run stats
        clicks = 0;
        multiplier = 1;
        auto = 0;
        heat = 0;
        entropyDrift = 0.2;
        chaosTimer = 0;

        // open old law selection (forge)
        openLawSelection();
        updateUI();
    }
};

function openLawSelection() {
    closePanels();
    lawPanel.classList.add("open");

    const choices = [
        { id: "clickBoost", name: "+5% click power" },
        { id: "autoBoost", name: "Auto-clickers 2× stronger" },
        { id: "heatDissipation", name: "Heat cools twice as fast" },
        { id: "entropySlow", name: "Entropy drift reduced" },
        { id: "goodChaos", name: "Chaos events become beneficial" }
    ];

    lawChoices.innerHTML = "";

    choices.forEach(law => {
        const btn = document.createElement("button");
        btn.className = "law-btn";
        btn.textContent = law.name;
        btn.onclick = () => {
            permanentLaws.push(law.id);
            lawPanel.classList.remove("open");
            updateUI();
        };
        lawChoices.appendChild(btn);
    });
}

// -----------------------------
// RULE BUTTON LOGIC
// -----------------------------
document.querySelectorAll(".rule-btn").forEach(btn => {
    btn.onclick = () => {
        const rule = btn.dataset.rule;
        rules[rule] = !rules[rule];
        btn.style.background = rules[rule] ? "#4caf50" : "#3d3d55";
    };
});

// -----------------------------
// DEBUG OVERLAY TOGGLE
// -----------------------------
document.getElementById("toggleDebug").onclick = () => {
    debugOverlay.classList.toggle("open");
};

// -----------------------------
// DEBUG OVERLAY UPDATE
// -----------------------------
function updateDebugOverlay() {
    const activeRules = Object.keys(rules)
        .filter(r => rules[r])
        .map(r => r.charAt(0).toUpperCase() + r.slice(1))
        .join(", ") || "None";

    const activeLaws = permanentLaws.join(", ") || "None";

    debugContent.textContent =
        `Heat: ${heat.toFixed(1)}\n` +
        `Entropy: ${entropyDrift.toFixed(2)}\n` +
        `Chaos: ${chaosTimer} / 300\n` +
        `Time Warp: ${rules.timewarp ? "ON" : "OFF"}\n\n` +
        `Rules: ${activeRules}\n` +
        `Laws: ${activeLaws}\n` +
        `LP: ${lp}`;
}

setInterval(updateDebugOverlay, 100);

// -----------------------------
// DEV PANEL
// -----------------------------
devBtn.onclick = () => {
    const isOpen = devPanel.classList.contains("open");
    closePanels();
    if (!isOpen) devPanel.classList.add("open");
};

document.getElementById("devAddClicks").onclick = () => {
    clicks += 1_000_000;
    updateUI();
};

// -----------------------------
// RESET OPTIONS
// -----------------------------
document.getElementById("softReset").onclick = () => {
    clicks = 0;
    multiplier = 1;
    auto = 0;
    achievements = {};
    updateUI();
};

document.getElementById("fullReset").onclick = () => {
    clicks = 0;
    multiplier = 1;
    auto = 0;
    prestige = 0;
    achievements = {};
    permanentLaws = [];
    lp = 0;
    localStorage.removeItem("clickerSave");
    updateUI();
};

// -----------------------------
// LAW TREE SYSTEM (NEW)
// -----------------------------
// 5 branches, 4 tiers each
const lawTree = {
    Heat: {
        1: [
            { id: "heat_click_1", name: "+2% click power", cost: 1, purchased: false },
            { id: "heat_click_2", name: "+5% click power", cost: 2, purchased: false }
        ],
        2: [
            { id: "heat_cool_1", name: "Heat cools 25% faster", cost: 4, purchased: false }
        ],
        3: [
            { id: "heat_cool_2", name: "Heat cools 50% faster", cost: 8, purchased: false }
        ],
        4: [
            { id: "heat_mastery", name: "Heat penalty halved", cost: 16, purchased: false }
        ]
    },

    Entropy: {
        1: [
            { id: "entropy_drift_1", name: "Entropy drift -10%", cost: 1, purchased: false },
            { id: "entropy_drift_2", name: "Entropy drift -20%", cost: 2, purchased: false }
        ],
        2: [
            { id: "entropy_drift_3", name: "Entropy drift -40%", cost: 4, purchased: false }
        ],
        3: [
            { id: "entropy_stable", name: "Entropy drift -60%", cost: 8, purchased: false }
        ],
        4: [
            { id: "entropy_mastery", name: "Entropy drift minimal", cost: 16, purchased: false }
        ]
    },

    Chaos: {
        1: [
            { id: "chaos_safe_1", name: "Chaos events 20% safer", cost: 1, purchased: false },
            { id: "chaos_safe_2", name: "Chaos events 40% safer", cost: 2, purchased: false }
        ],
        2: [
            { id: "chaos_good_1", name: "Chaos events mostly good", cost: 4, purchased: false }
        ],
        3: [
            { id: "chaos_good_2", name: "Chaos events usually good", cost: 8, purchased: false }
        ],
        4: [
            { id: "chaos_blessing", name: "Chaos events beneficial", cost: 16, purchased: false }
        ]
    },

    Time: {
        1: [
            { id: "time_auto_1", name: "+10% auto gain", cost: 1, purchased: false },
            { id: "time_auto_2", name: "+25% auto gain", cost: 2, purchased: false }
        ],
        2: [
            { id: "time_auto_3", name: "+50% auto gain", cost: 4, purchased: false }
        ],
        3: [
            { id: "time_warp_1", name: "Timewarp +25% stronger", cost: 8, purchased: false }
        ],
        4: [
            { id: "time_mastery", name: "Auto gain doubled", cost: 16, purchased: false }
        ]
    },

    Automation: {
        1: [
            { id: "auto_cost_1", name: "Auto cost -10%", cost: 1, purchased: false },
            { id: "auto_cost_2", name: "Auto cost -20%", cost: 2, purchased: false }
        ],
        2: [
            { id: "auto_power_1", name: "Auto power +25%", cost: 4, purchased: false }
        ],
        3: [
            { id: "auto_power_2", name: "Auto power +50%", cost: 8, purchased: false }
        ],
        4: [
            { id: "auto_mastery", name: "Auto power doubled", cost: 16, purchased: false }
        ]
    }
};

// -----------------------------
// APPLY LAW TREE EFFECTS
// -----------------------------
function applyLawTreeEffect(id) {
    switch (id) {

        // HEAT BRANCH
        case "heat_click_1": multiplier *= 1.02; break;
        case "heat_click_2": multiplier *= 1.05; break;
        case "heat_cool_1": permanentLaws.push("heatDissipation"); break;
        case "heat_cool_2": permanentLaws.push("heatDissipation"); break;
        case "heat_mastery": permanentLaws.push("heatDissipation"); break;

        // ENTROPY BRANCH
        case "entropy_drift_1": entropyDrift *= 0.9; break;
        case "entropy_drift_2": entropyDrift *= 0.8; break;
        case "entropy_drift_3": entropyDrift *= 0.6; break;
        case "entropy_stable": entropyDrift *= 0.4; break;
        case "entropy_mastery": permanentLaws.push("entropySlow"); break;

        // CHAOS BRANCH
        case "chaos_safe_1": permanentLaws.push("goodChaos20"); break;
        case "chaos_safe_2": permanentLaws.push("goodChaos50"); break;
        case "chaos_good_1": permanentLaws.push("goodChaos"); break;
        case "chaos_good_2": permanentLaws.push("goodChaos"); break;
        case "chaos_blessing": permanentLaws.push("goodChaos"); break;

        // TIME BRANCH
        case "time_auto_1": permanentLaws.push("timeAuto10"); break;
        case "time_auto_2": permanentLaws.push("timeAuto25"); break;
        case "time_auto_3": permanentLaws.push("timeAuto50"); break;
        case "time_warp_1": permanentLaws.push("timewarpBoost"); break;
        case "time_mastery": permanentLaws.push("autoBoost"); break;

        // AUTOMATION BRANCH
        case "auto_cost_1": permanentLaws.push("autoCost10"); break;
        case "auto_cost_2": permanentLaws.push("autoCost20"); break;
        case "auto_power_1": permanentLaws.push("autoBoost"); break;
        case "auto_power_2": permanentLaws.push("autoBoost"); break;
        case "auto_mastery": permanentLaws.push("autoBoost"); break;
    }
}

// -----------------------------
// RENDER LAW TREE PANEL
// -----------------------------
function renderLawTree() {
    lawTreeContainer.innerHTML = "";

    for (const branchName in lawTree) {
        const branch = lawTree[branchName];

        const branchTitle = document.createElement("h3");
        branchTitle.textContent = branchName;
        lawTreeContainer.appendChild(branchTitle);

        for (let tier = 1; tier <= 4; tier++) {
            const tierUpgrades = branch[tier];
            if (!tierUpgrades) continue;

            const tierLabel = document.createElement("p");
            tierLabel.textContent = `Tier ${tier}`;
            tierLabel.style.color = "#ffd86b";
            lawTreeContainer.appendChild(tierLabel);

            tierUpgrades.forEach(upg => {
                const btn = document.createElement("button");
                btn.className = "law-btn";

                if (upg.purchased) {
                    btn.textContent = `✔ ${upg.name}`;
                    btn.style.background = "#ffd86b";
                    btn.style.color = "#000";
                } else {
                    btn.textContent = `${upg.name} (Cost: ${upg.cost} LP)`;
                    if (lp < upg.cost) btn.style.opacity = "0.5";
                }

                btn.onclick = () => {
                    if (!upg.purchased && lp >= upg.cost) {
                        lp -= upg.cost;
                        upg.purchased = true;
                        applyLawTreeEffect(upg.id);
                        updateUI();
                        renderLawTree();
                    }
                };

                lawTreeContainer.appendChild(btn);
            });
        }
    }
}

// -----------------------------
// DEV PANEL BUTTON → OPEN LAW TREE
// -----------------------------
openLawTreeBtn.onclick = () => {
    closePanels();
    lawTreePanel.classList.add("open");
    renderLawTree();
};

// -----------------------------
updateUI();
renderAchievements();
