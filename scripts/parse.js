import { dirname } from "path";
import { stripStyles } from "./css.js";
import { ensureDirectory, fileExists, resolveFromRoot, templateImport, replaceSymbols, executeScript } from "./utils.js";

async function build() {
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

    await ensureDirectory(dirname(outputFile));
    await Bun.write(outputFile, content);
}

build().catch((error) => {
    console.error(`[parse] Build failed: ${error.message}`);
    if (error.stack) {
        console.error(error.stack);
    }
    process.exit(1);
});
