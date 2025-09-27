import { dirname, resolve } from "path";
import { access, mkdir } from "fs/promises";
import { fileURLToPath } from "url";

const currentFilePath = fileURLToPath(import.meta.url);
const scriptsDir = dirname(currentFilePath);
const projectRoot = resolve(scriptsDir, "..");
const projectRootUrl = new URL("../", import.meta.url);

function sanitizeRelativeInput(input) {
  return input.trim().replace(/^\.\/?/, "");
}

function resolveFromRoot(target = "") {
  if (!target) {
    return projectRoot;
  }

  if (target.startsWith("file://")) {
    return fileURLToPath(target);
  }

  const sanitized = sanitizeRelativeInput(target);
  return fileURLToPath(new URL(sanitized, projectRootUrl));
}

async function fileExists(pathname) {
  try {
    await access(pathname);
    return true;
  } catch {
    return false;
  }
}

async function ensureDirectory(pathname) {
  await mkdir(pathname, { recursive: true });
}

async function templateImport(content, depth = 0) {
  const maxDepth = 256;
  if (depth > maxDepth) {
    throw new Error(`Template import exceeded maximum depth (${maxDepth}).`);
  }

  const match = content.match(/\{\{([^}]+)\}\}/m);
  if (!match) {
    return content;
  }

  const includeTarget = match[1].trim();
  const partialPath = resolveFromRoot(includeTarget);
  if (!(await fileExists(partialPath))) {
    throw new Error(`Template not found: ${includeTarget} (${partialPath})`);
  }

  const partialContent = (await Bun.file(partialPath).text()).trim();

  let processedContent = partialContent;
  if (includeTarget.endsWith(".js")) {
    processedContent = `<script>${partialContent}</script>`;
  } else if (includeTarget.endsWith(".css")) {
    processedContent = `<style>${partialContent}</style>`;
  }

  const updated = content.replace(match[0], processedContent);
  return templateImport(updated, depth + 1);
}

const symbolPattern = /@(?!\?)([\w\d.\-]+);/g;
const scriptPattern = /@@script:(\w+)\(([^)]*)\);/g;
let symbolMapPromise;
let buildScripts;

async function loadSymbolMap() {
  if (!symbolMapPromise) {
    symbolMapPromise = (async () => {
      const symbolPath = resolveFromRoot("symbols/output/sfsymbols.json");
      if (!(await fileExists(symbolPath))) {
        return new Map();
      }
      const json = await Bun.file(symbolPath).text();
      const entries = JSON.parse(json);
      return new Map(entries);
    })();
  }

  return symbolMapPromise;
}

async function loadBuildScripts() {
  if (!buildScripts) {
    buildScripts = (async () => {
      const scriptsPath = resolveFromRoot("scripts/build-scripts.js");
      if (!(await fileExists(scriptsPath))) {
        return {};
      }
      const module = await import(scriptsPath);
      return module.default || module;
    })();
  }
  return buildScripts;
}

function parseArguments(argsString) {
  if (!argsString.trim()) {
    return [];
  }

  try {
    return JSON.parse(`[${argsString}]`);
  } catch {
    return argsString.split(',').map(arg => arg.trim().replace(/^["']|["']$/g, ''));
  }
}

async function executeScript(content) {
  const scripts = await loadBuildScripts();

  return content.replace(scriptPattern, (match, methodName, argsString) => {
    try {
      const method = scripts[methodName];
      if (typeof method !== 'function') {
        console.warn(`Build script method '${methodName}' not found or not a function`);
        return match;
      }

      const args = parseArguments(argsString);
      const result = method(...args);

      return typeof result === 'string' ? result : String(result);
    } catch (error) {
      console.error(`Error executing build script '${methodName}':`, error.message);
      return match;
    }
  });
}

async function replaceSymbols(content) {
  const symbols = await loadSymbolMap();
  if (symbols.size === 0) {
    return content;
  }

  return content.replace(symbolPattern, (match, symbolName) => {
    const replacement = symbols.get(symbolName);
    return typeof replacement === "string" ? replacement : match;
  });
}

export {
  ensureDirectory,
  fileExists,
  projectRoot,
  resolveFromRoot,
  templateImport,
  replaceSymbols,
  executeScript,
};
