"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// AUTO-GENERATED FROM recipe.py
// Chat-only, data-grounded recipe engine in TypeScript
// No Python backend required
var fs = require("fs");
var readline = require("readline");
var openai_1 = require("openai");
// ======================================================
// LOAD ENV
// ======================================================
if (!process.env.OPENAI_API_KEY) {
    throw new Error("❌ Missing OPENAI_API_KEY");
}
var client = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY
});
// ======================================================
// LOAD INGREDIENT UNIVERSE
// ======================================================
var raw = fs.readFileSync("amazon_fresh_mock.json", "utf-8");
var MOCK_PRODUCTS = JSON.parse(raw);
var AVAILABLE_INGREDIENTS = Array.from(new Set(MOCK_PRODUCTS.map(function (p) { return p.name.toLowerCase(); }))).sort();
// ======================================================
// SYSTEM PROMPTS
// ======================================================
var INGREDIENT_SELECTION_PROMPT = "\nYou are a culinary assistant.\n\nYou may ONLY select ingredients from the allowed ingredient list.\nDo NOT invent ingredients.\n\nTask:\nGiven a user's food preferences and health goals,\nselect 6\u201310 relevant ingredients from the allowed list.\n\nRules:\n- Use ONLY ingredients from the allowed list\n- Do NOT suggest recipes yet\n- Do NOT add new ingredients\n- Output valid JSON only\n\nJSON format:\n{\n  \"ingredients\": [\"ingredient 1\", \"ingredient 2\"]\n}\n";
var RECIPE_GENERATION_PROMPT = "\nYou are a professional chef.\n\nUsing ONLY the provided ingredients, generate 10 simple recipes.\n\nRules:\n- Do NOT introduce new ingredients\n- Each recipe must include:\n  - title\n  - ingredients_used\n  - step_by_step_instructions\n- Keep recipes simple and realistic\n- Output valid JSON only\n\nJSON format:\n{\n  \"recipes\": [\n    {\n      \"title\": \"Recipe Name\",\n      \"ingredients_used\": [\"ingredient 1\", \"ingredient 2\"],\n      \"instructions\": [\"step 1\", \"step 2\"]\n    }\n  ]\n}\n";
// ======================================================
// STEP 1: USER PREFERENCES → INGREDIENTS
// ======================================================
function selectIngredients(userPrompt) {
    return __awaiter(this, void 0, void 0, function () {
        var response, text;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client.chat.completions.create({
                        model: "gpt-4.1-mini",
                        temperature: 0.3,
                        messages: [
                            { role: "system", content: INGREDIENT_SELECTION_PROMPT },
                            {
                                role: "user",
                                content: "User preferences:\n".concat(userPrompt, "\n\nAllowed ingredients:\n").concat(AVAILABLE_INGREDIENTS.join(", "))
                            }
                        ]
                    })];
                case 1:
                    response = _a.sent();
                    text = response.choices[0].message.content || "{}";
                    return [2 /*return*/, JSON.parse(text).ingredients];
            }
        });
    });
}
// ======================================================
// STEP 2: INGREDIENTS → RECIPES
// ======================================================
function generateRecipes(ingredients) {
    return __awaiter(this, void 0, void 0, function () {
        var response, text;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client.chat.completions.create({
                        model: "gpt-4.1-mini",
                        temperature: 0.5,
                        messages: [
                            { role: "system", content: RECIPE_GENERATION_PROMPT },
                            {
                                role: "user",
                                content: "Ingredients:\n".concat(ingredients.join(", "))
                            }
                        ]
                    })];
                case 1:
                    response = _a.sent();
                    text = response.choices[0].message.content || "{}";
                    return [2 /*return*/, JSON.parse(text).recipes];
            }
        });
    });
}
// ======================================================
// USER SELECTION
// ======================================================
function parseSelection(choice, recipes) {
    if (choice === "all")
        return recipes;
    return choice
        .split(",")
        .map(function (n) { return recipes[parseInt(n.trim()) - 1]; })
        .filter(Boolean);
}
// ======================================================
// MAIN (CLI)
// ======================================================
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var rl;
        var _this = this;
        return __generator(this, function (_a) {
            console.log("\n=== CHAT-ONLY RECIPE BOT (TYPECRIPT) ===\n");
            rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            rl.question("Describe the food you like and your health goals:\n> ", function (userPrompt) { return __awaiter(_this, void 0, void 0, function () {
                var ingredients, recipes, choice, selected;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, selectIngredients(userPrompt)];
                        case 1:
                            ingredients = _a.sent();
                            console.log("\n🧺 Selected ingredients:");
                            ingredients.forEach(function (i) { return console.log(" - " + i); });
                            return [4 /*yield*/, generateRecipes(ingredients)];
                        case 2:
                            recipes = _a.sent();
                            console.log("\n📖 Available recipes:");
                            recipes.forEach(function (r, i) { return console.log("".concat(i + 1, ". ").concat(r.title)); });
                            choice = "";
                            _a.label = 3;
                        case 3:
                            if (!(choice !== "none")) return [3 /*break*/, 5];
                            return [4 /*yield*/, new Promise(function (resolve) {
                                    return rl.question("\nWhich recipe(s) do you want to see? (1,3 | all | none)\n> ", resolve);
                                })];
                        case 4:
                            choice = _a.sent();
                            if (choice === "none")
                                return [3 /*break*/, 5];
                            selected = parseSelection(choice, recipes);
                            selected.forEach(function (r) {
                                console.log("\n\uD83C\uDF7D\uFE0F ".concat(r.title));
                                console.log("Ingredients:");
                                r.ingredients_used.forEach(function (i) { return console.log(" - " + i); });
                                console.log("Instructions:");
                                r.instructions.forEach(function (s, i) { return console.log("".concat(i + 1, ". ").concat(s)); });
                            });
                            return [3 /*break*/, 3];
                        case 5:
                            rl.close();
                            return [2 /*return*/];
                    }
                });
            }); });
            return [2 /*return*/];
        });
    });
}
main();
