"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * top contributors client file to get Data
 * from Supabase to solve the top contributor
 * question for the front-end
 */
var prisma_1 = __importDefault(require("../prisma"));
var getTopContributors = function (startDate, // Default start date of September 5th, 2022 (0-based indices for month)
endDate, // Default end date of December 20th, 2022 (0-based indices for month)
count) {
    if (startDate === void 0) { startDate = new Date(2022, 8, 5); }
    if (endDate === void 0) { endDate = new Date(2022, 11, 20); }
    if (count === void 0) { count = 5; }
    return __awaiter(void 0, void 0, void 0, function () {
        var top;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log(startDate, endDate);
                    return [4 /*yield*/, prisma_1.default.$queryRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n        SELECT a.slug, \n        COUNT(DISTINCT c.id) + \n        COUNT(DISTINCT p.id) + \n        COUNT(DISTINCT lm.id) as \"totalCount\"\n        FROM \"Author\" a\n        LEFT JOIN \"Comment\" c \n            ON a.slug = c.\"authorSlug\" AND c.\"createdAt\" BETWEEN ", " AND ", "\n        LEFT JOIN \"Post\" p \n            ON a.slug = p.\"authorSlug\" AND p.\"createdAt\" BETWEEN ", " AND ", "\n        LEFT JOIN \"LastMessage\" lm \n            ON a.slug = lm.\"authorSlug\" AND lm.\"createdAt\" BETWEEN ", " AND ", "            \n        GROUP BY a.slug\n        ORDER BY \"totalCount\" DESC\n        LIMIT ", "\n    "], ["\n        SELECT a.slug, \n        COUNT(DISTINCT c.id) + \n        COUNT(DISTINCT p.id) + \n        COUNT(DISTINCT lm.id) as \"totalCount\"\n        FROM \"Author\" a\n        LEFT JOIN \"Comment\" c \n            ON a.slug = c.\"authorSlug\" AND c.\"createdAt\" BETWEEN ", " AND ", "\n        LEFT JOIN \"Post\" p \n            ON a.slug = p.\"authorSlug\" AND p.\"createdAt\" BETWEEN ", " AND ", "\n        LEFT JOIN \"LastMessage\" lm \n            ON a.slug = lm.\"authorSlug\" AND lm.\"createdAt\" BETWEEN ", " AND ", "            \n        GROUP BY a.slug\n        ORDER BY \"totalCount\" DESC\n        LIMIT ", "\n    "])), startDate, endDate, startDate, endDate, startDate, endDate, count)];
                case 1:
                    top = (_a.sent());
                    return [2 /*return*/, Promise.resolve(top)];
            }
        });
    });
};
exports.default = getTopContributors;
var templateObject_1;
