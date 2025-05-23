"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const typeUtils_1 = require("@notionhq/shared-utils/typeUtils");
exports.default = (0, typeUtils_1.safeCast)((0, test_1.defineConfig)({
    testDir: "./e2e",
    fullyParallel: false,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: "html",
}));
