import { watch } from "fs";
import { spawn } from "child_process";
import path from "path";

const projectRoot = process.cwd();
const buildScript = "bun";
const buildArgs = ["run", "scripts/build.js"];

const excludedPrefixes = [
    path.join(projectRoot, "docs"),
    path.join(projectRoot, ".git"),
    path.join(projectRoot, "node_modules"),
];

let debounceTimer;
let isBuilding = false;
let rebuildQueued = false;

async function runBuild() {
    if (isBuilding) {
        rebuildQueued = true;
        return;
    }

    isBuilding = true;

    try {
        const child = spawn(buildScript, buildArgs, {
            cwd: projectRoot,
            stdio: 'inherit'
        });

        await new Promise((resolve, reject) => {
            child.on('close', (code) => {
                if (code === 0) {
                    console.log(`[watch] Build completed at ${new Date().toISOString()}`);
                    resolve();
                } else {
                    reject(new Error(`Build failed with code ${code}`));
                }
            });
        });
    } catch (error) {
        console.error("[watch] Build error:", error.message);
    } finally {
        isBuilding = false;

        if (rebuildQueued) {
            rebuildQueued = false;
            setTimeout(() => runBuild(), 0);
        }
    }
}

function shouldIgnore(filePath) {
    const fullPath = path.resolve(filePath);
    return excludedPrefixes.some(prefix => fullPath.startsWith(prefix));
}

console.log(`[watch] Watching for changes in ${projectRoot}`);

// Start live server
const liveServer = spawn("npx", ["live-server", "--cors", "docs"], {
    cwd: projectRoot,
    stdio: 'inherit'
});

// Watch for file changes
watch(projectRoot, { recursive: true }, (eventType, filename) => {
    if (!filename || shouldIgnore(filename)) {
        return;
    }

    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
        console.log(`[watch] Detected ${eventType}: ${filename}`);
        runBuild();
    }, 150);
});

// Cleanup on exit
process.on('SIGINT', () => {
    console.log('\n[watch] Shutting down...');
    liveServer.kill();
    process.exit(0);
});

process.on('SIGTERM', () => {
    liveServer.kill();
    process.exit(0);
});