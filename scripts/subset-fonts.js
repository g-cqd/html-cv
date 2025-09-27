#!/usr/bin/env bun

import { $ } from "bun";
import { resolveFromRoot, fileExists, ensureDirectory } from "./utils.js";
import { extractUniqueCharacters } from "./extract-characters.js";

async function subsetFonts() {
    console.log("⚡ Starting font subsetting process...");

    // Extract characters first
    const characters = await extractUniqueCharacters();

    // Define font files to process
    const fontFiles = [
        {
            input: "resources/fonts/Cupertino-Pro.woff2",
            output: "resources/fonts/Cupertino-Pro-subset.woff2"
        },
        {
            input: "resources/fonts/Cupertino-Pro-Italic.woff2",
            output: "resources/fonts/Cupertino-Pro-Italic-subset.woff2"
        }
    ];

    for (const { input, output } of fontFiles) {
        const inputPath = resolveFromRoot(input);
        const outputPath = resolveFromRoot(output);

        if (!(await fileExists(inputPath))) {
            console.warn(`⚠️  Font file not found: ${inputPath}`);
            continue;
        }

        console.log(`🔧 Subsetting ${input}...`);

        try {
            // Write characters to temporary file for pyftsubset
            const charFile = resolveFromRoot("character-subset.txt");

            // Use pyftsubset to create subsetted font
            await $`pyftsubset ${inputPath} --text-file=${charFile} --output-file=${outputPath} --flavor=woff2`.quiet();

            // Check file sizes
            const originalSize = (await Bun.file(inputPath).arrayBuffer()).byteLength;
            const subsetSize = (await Bun.file(outputPath).arrayBuffer()).byteLength;
            const reduction = ((originalSize - subsetSize) / originalSize * 100).toFixed(1);

            console.log(`✅ ${output}: ${(originalSize / 1024).toFixed(1)}KB → ${(subsetSize / 1024).toFixed(1)}KB (${reduction}% reduction)`);

        } catch (error) {
            console.error(`❌ Failed to subset ${input}:`, error.message);
        }
    }

    console.log("🎉 Font subsetting completed!");
}

if (import.meta.main) {
    await subsetFonts();
}

export { subsetFonts };