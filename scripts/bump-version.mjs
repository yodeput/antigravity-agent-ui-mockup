#!/usr/bin/env node
/**
 * Bump project version across:
 * - package.json
 * - package-lock.json
 * - src-tauri/tauri.conf.json
 * - src-tauri/Cargo.toml
 *
 * Defensive rules:
 * - Refuses to run if working tree is dirty before starting.
 * - After edits, verifies only the four files changed.
 * - Aborts (no commit) if any other file changes.
 */

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import readline from "node:readline/promises";
import process from "node:process";

const expectedFiles = [
  "package.json",
  "package-lock.json",
  path.join("src-tauri", "tauri.conf.json"),
  path.join("src-tauri", "Cargo.toml"),
];

function run(cmd, opts = {}) {
  return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts }).trim();
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function ensureRepoRoot() {
  for (const f of expectedFiles) {
    if (!existsSync(f)) {
      fail(`Expected file not found: ${f}. Please run from repo root.`);
    }
  }
}

function ensureCleanTree() {
  const status = run("git status --porcelain");
  if (status) {
    fail(
      `Working tree is not clean. Please commit/stash first.\n\n${status}\n`
    );
  }
}

function normalizePath(p) {
  return p.replace(/\\/g, "/");
}

function validateVersion(v) {
  const semver =
    /^\d+\.\d+\.\d+(?:-(?:0|[1-9A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
  if (!semver.test(v)) {
    fail(`Invalid version "${v}". Expected semver like 1.4.3 or 1.4.3-beta.1`);
  }
}

async function bumpPackageJson(version) {
  const file = "package.json";
  const pkg = JSON.parse(await readFile(file, "utf8"));
  pkg.version = version;
  await writeFile(file, JSON.stringify(pkg, null, 2) + "\n", "utf8");
}

async function bumpPackageLock(version) {
  const file = "package-lock.json";
  const lock = JSON.parse(await readFile(file, "utf8"));
  lock.version = version;
  if (lock.packages && lock.packages[""]) {
    lock.packages[""].version = version;
  }
  await writeFile(file, JSON.stringify(lock, null, 2) + "\n", "utf8");
}

async function bumpTauriConf(version) {
  const file = path.join("src-tauri", "tauri.conf.json");
  const conf = JSON.parse(await readFile(file, "utf8"));
  conf.version = version;
  await writeFile(file, JSON.stringify(conf, null, 2) + "\n", "utf8");
}

async function bumpCargoToml(version) {
  const file = path.join("src-tauri", "Cargo.toml");
  const text = await readFile(file, "utf8");
  const lines = text.split(/\r?\n/);

  let inPackage = false;
  let updated = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^\s*\[package\]\s*$/.test(line)) {
      inPackage = true;
      continue;
    }
    if (inPackage && /^\s*\[/.test(line)) {
      inPackage = false;
    }

    if (inPackage && /^\s*version\s*=/.test(line)) {
      lines[i] = line.replace(
        /version\s*=\s*\"[^\"]+\"/,
        `version = "${version}"`
      );
      updated = true;
      break;
    }
  }

  if (!updated) {
    fail(`Could not find [package] version in ${file}`);
  }

  await writeFile(file, lines.join("\n"), "utf8");
}

function verifyOnlyExpectedChanged() {
  const diffNames = run("git diff --name-only");
  const changed = diffNames ? diffNames.split(/\r?\n/).filter(Boolean) : [];

  const changedNorm = changed.map(normalizePath);
  const expectedNorm = expectedFiles.map((f) => normalizePath(f));

  const unexpected = changedNorm.filter((f) => !expectedNorm.includes(f));
  const missing = expectedNorm.filter((f) => !changedNorm.includes(f));

  if (unexpected.length) {
    fail(
      `Unexpected files changed:\n${unexpected.join(
        "\n"
      )}\n\nAborting without commit.`
    );
  }
  if (missing.length) {
    fail(
      `Expected files were not modified:\n${missing.join(
        "\n"
      )}\n\nAborting without commit.`
    );
  }
}

function commit(version) {
  const args = expectedFiles.map((f) => `"${normalizePath(f)}"`).join(" ");
  execSync(`git add -- ${args}`, { stdio: "inherit" });
  execSync(`git commit -m "chore: bump version to ${version}"`, {
    stdio: "inherit",
  });
}

async function main() {
  ensureRepoRoot();
  ensureCleanTree();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const raw = await rl.question("New version (semver, e.g. 1.4.3): ");
  rl.close();

  const version = raw.trim().replace(/^v/, "");
  validateVersion(version);

  await bumpPackageJson(version);
  await bumpPackageLock(version);
  await bumpTauriConf(version);
  await bumpCargoToml(version);

  verifyOnlyExpectedChanged();
  commit(version);

  console.log(`✅ Version bumped and committed: ${version}`);
}

main().catch((err) => {
  fail(err?.stack || String(err));
});

