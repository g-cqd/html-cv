import { stripStyles } from "./css.js";
import { joinPath, templateImport, replaceSymbols } from "./utils.js";

const currentDirectory = import.meta.dir;

(async () => {
    const inputFile = joinPath(currentDirectory, "index.html");
    const outputFile = joinPath(currentDirectory, "./docs/index.html");
    /** @type {string} */
    let content = (await (Bun.file(inputFile)).text()).trim();
    content = await templateImport(currentDirectory, content);
    content = await stripStyles(content);
    content = await replaceSymbols(currentDirectory, content);
    await Bun.write(outputFile, content);
})();
