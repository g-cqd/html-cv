/**
* 
* @param {string} base 
* @param  {...string} paths
* @returns {string}
*/
function joinPath(base, ...paths) {
    let returnPath = base.replace(/\/$/, "");
    for (const path of paths) {
        returnPath = [returnPath, path.replace(/^(\/|\.\/)/, "").replace(/\/$/, "")].join("/");
    }
    return returnPath;
}

/**
* 
* @param {string} root Root Path
* @param {string} originalContent String that contains the imports
* @returns 
*/
async function templateImport(root, originalContent) {
    const regex = /\{\{([\w+\.\/\-]+)\}\}/gum;
    let content = originalContent;
    while (content.match(regex)?.length > 0) {
        const match = regex.exec(content);
        const newPath = joinPath(root, match[1].trim());
        const newContent = (await (Bun.file(newPath)).text()).trim();
        content = content.replace(match[0], newContent);
    }
    return content;
}

/**
 * @param {string} root 
 * @param {string} originalContent 
 * @returns 
 */
async function replaceSymbols(root, originalContent) {
    let content = originalContent;
    const regex = /@(?!\?)(((\w+|\d{1,3})\.?)+)+;/g;
    let symbols = await (Bun.file(joinPath(root, "./symbols/sfsymbols.json"))).text();
    symbols = JSON.parse(symbols);
    symbols = new Map(symbols);
    return content.replace(regex, (match, symbolName) => {
        const symbol = symbols.get(symbolName);
        return symbol ? symbol : match;
    });
}

export { joinPath, templateImport, replaceSymbols };

