#!/usr/bin/env bun

import { $ } from "bun";
import { resolveFromRoot } from "./utils.js";

async function extractUniqueCharacters() {
    console.log("🔍 Extracting unique characters from website content...");

    // Find all HTML files (excluding node_modules only)
    const htmlFiles = await $`find . -name "*.html" -not -path "./node_modules/*"`.text();

    // Find all CSS files (excluding node_modules only)
    const cssFiles = await $`find . -name "*.css" -not -path "./node_modules/*"`.text();

    const allFiles = [...htmlFiles.trim().split('\n'), ...cssFiles.trim().split('\n')].filter(Boolean);

    const uniqueChars = new Set();

    for (const filePath of allFiles) {
        try {
            const content = await Bun.file(filePath).text();

            // Extract symbol attributes before removing tags
            const symbolMatches = content.match(/symbol=([^>\s]+)/g) || [];
            const symbolChars = symbolMatches.map(match => match.replace('symbol=', '')).join('');

            // Extract text content from HTML (remove tags but keep text)
            const textContent = content
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script tags
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')   // Remove style tags
                .replace(/<!--[\s\S]*?-->/g, '')                 // Remove comments
                .replace(/<[^>]*>/g, ' ')                        // Remove HTML tags
                .replace(/&nbsp;/g, ' ')                         // Replace HTML entities
                .replace(/&bull;/g, '•')
                .replace(/&hellip;/g, '…')
                .replace(/&[a-zA-Z0-9#]+;/g, '')                 // Remove other HTML entities
                ;

            // Add each character from text content to the set
            for (const char of textContent) {
                if (char.trim()) { // Only add non-whitespace characters
                    uniqueChars.add(char);
                }
            }

            // Add symbol characters (these are handled properly as Unicode code points)

            for (const char of symbolChars) {
                uniqueChars.add(char);
            }

            // Also add space character
            uniqueChars.add(' ');

        } catch (error) {
            console.warn(`Warning: Could not read ${filePath}:`, error.message);
        }
    }

    // Convert to sorted array for better readability
    const sortedChars = Array.from(uniqueChars).sort();

    console.log(`📊 Found ${sortedChars.length} unique characters`);
    console.log("Characters:", sortedChars.join(''));

    // Write to file for font subsetting
    const charString = sortedChars.join('');
    await Bun.write(resolveFromRoot("character-subset.txt"), charString);

    console.log("✅ Character subset saved to character-subset.txt");

    return charString;
}

if (import.meta.main) {
    await extractUniqueCharacters();
}

export { extractUniqueCharacters };