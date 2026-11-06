/**
 * DEBUGGING EXERCISE - BUG 2: WRONG IMPORT PATH
 *
 * Faculty Scenario:
 * The developer attempts to import SQLite or helper utilities using an incorrect
 * relative path or mistaken package name, causing:
 *   "Error: Cannot find module './sqlite'" or
 *   "MODULE_NOT_FOUND: Cannot find module '../db/database'"
 *
 * Broken Code:
 * const { open } = require("./sqlite"); // BUG: attempts local file ./sqlite.js instead of package 'sqlite'
 *
 * Fixed Code:
 * const { open } = require("sqlite");  // FIX: properly loads the installed npm package
 * const sqlite3 = require("sqlite3");
 */

// WRONG:
// const { open } = require("./sqlite");

// CORRECT:
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

console.log("[FIXED] Modules successfully imported from node_modules:");
console.log("- sqlite.open:", typeof open);
console.log("- sqlite3.Database:", typeof sqlite3.Database);

