import { dirname } from "path";
import { minify } from "minify";
import { $ } from "bun";
import { stripStyles } from "./css.js";
import { ensureDirectory, fileExists, resolveFromRoot, templateImport, replaceSymbols, executeScript } from "./utils.js";
import { mangleClassNamesAdvanced } from "./css-mangler.js";
import { subsetFonts } from "./subset-fonts.js";

const SCRIPT_DIR = import.meta.dir;
const DOCS_DIR = resolveFromRoot("docs");
const RESOURCES_DIR = resolveFromRoot("resources");

async function copyAssets() {
    // Clean and create docs directory
    await $`rm -rf ${DOCS_DIR}`.quiet();
    await ensureDirectory(DOCS_DIR);

    // Copy resources if they exist
    if (await fileExists(RESOURCES_DIR)) {
        await $`cp -R ${RESOURCES_DIR} ${DOCS_DIR}/`.quiet();
    }

    // Copy favicon and apple touch icons
    const assetGlobs = ["favicon.*", "apple-*.png"];
    for (const glob of assetGlobs) {
        try {
            await $`cp ${resolveFromRoot(glob)} ${DOCS_DIR}/`.quiet();
        } catch {
            // Ignore if files don't exist
        }
    }
}

async function minifyAllAssets() {
    // Find and minify all files
    const allFiles = await $`find ${DOCS_DIR} -type f \( -name "*.html" -o -name "*.css" -o -name "*.js" \)`.text();

    for (const filePath of allFiles.trim().split('\n').filter(Boolean)) {
        try {
            const minified = await minify(
              filePath,
              {
                html: {
                  removeComments: true
                },
              }
            );
            await Bun.write(filePath, minified);
        } catch (error) {
            console.warn(`Warning: Could not minify ${filePath}:`, error.message);
        }
    }
}

async function build() {
    console.log("🏗️  Starting build...");

    // Subset fonts first
    await subsetFonts();

    // Copy all assets first
    await copyAssets();

    // Build main HTML
    const entryFile = resolveFromRoot("index.html");
    const outputFile = resolveFromRoot("docs/index.html");

    if (!(await fileExists(entryFile))) {
        throw new Error(`Entry file not found at ${entryFile}`);
    }

    let content = (await Bun.file(entryFile).text()).trim();
    content = await templateImport(content);
    content = await stripStyles(content);
    content = await executeScript(content);
    content = await replaceSymbols(content);
    content = await mangleClassNamesAdvanced(content, { verbose: true });

    await ensureDirectory(dirname(outputFile));
    await Bun.write(outputFile, content);

    // Minify all assets
    await minifyAllAssets();

    console.log("✅ Build completed successfully!");
}

build().catch((error) => {
    console.error(`❌ Build failed: ${error.message}`);
    if (error.stack) {
        console.error(error.stack);
    }
    process.exit(1);
});
