
const currentDirectory = import.meta.dir;

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
* @param {string} content 
* @returns 
*/
function clearCSS(content) {
    try {
        return content
        .replace(/(\n|\s\s|\t)/gu, "")
        .replace(/:\s/gu, ":")
        .replace(/\s\{/gu, "{")
        .replace(/,\s/gu, ",")
    } catch (error) {
        console.log(content);
    }
    return content
}

const inputFile = joinPath(currentDirectory, "index.html");
const outputFile = joinPath(currentDirectory, "output.html");

async function placeImports(string) {
    let content = string;
    const dynamicImports = /\{\{([\w+\.\/\-]+)\}\}/gum;
    let match;
    while ((match = dynamicImports.exec(content)) !== null) {
        const newPath = joinPath(currentDirectory, match[1].trim());
        const newContent = (await (Bun.file(newPath)).text()).trim();
        content = content.replace(match[0], await placeImports(newContent));
    }
    return content;
}

/**
 * 
 * @param {string} string 
 * @returns {{content: string, stylesheets: [string]}}
 */
async function retrieveOtherStyles(string) {
    let content = string;
    const regexp = /\n\s+<link.*href="([./\w+\-]*)">$/gum;
    const stylesheets = []
    let result;
    while ((result = regexp.exec(string)) !== null) {
        stylesheets.push(clearCSS(await (Bun.file(joinPath(result[1]))).text()))
        content = content.replace(result[0], "")
    }
    return { content, stylesheets }
}

async function stripStyles(string) {
    let styles = [];
    
    let { content: stripped, stylesheets } = await retrieveOtherStyles(string)
    
    styles = styles.concat(stylesheets);
    
    const styleStartTag = /^<style>/gum;
    const styleEndTag = /<\/style>$/gum;
    const styleStartTagString = "<style>";
    const styleEndTagString = "</style>";
    
    let result;
    while ((result = styleStartTag.exec(stripped)) !== null) {
        const subcontent = stripped.substring(result.index, styleEndTag.exec(stripped).index + styleEndTagString.length);
        stripped = stripped.replace(subcontent, "");
        styles.push(
            clearCSS(subcontent
                .replace(styleStartTag, "")
                .replace(styleEndTag, ""))
        );
    }
    let endTitleTagString = "</title>"
    let index = stripped.indexOf(endTitleTagString);
    if (index !== -1) {
        let start = stripped.substring(0, index + endTitleTagString.length)
        let end = stripped.substring(index + endTitleTagString.length)
        stripped = `${start}\n    <style>${styles.join("")}</style>${end}`
    }

    return stripped
}

async function replaceSymbols(string) {
    const regex = /@(((\w+|\d{1,3})\.?)+)+;/g;
    let symbols = await (Bun.file(joinPath(currentDirectory, "./symbols/sfsymbols.json"))).text();
    symbols = JSON.parse(symbols);
    symbols = new Map(symbols);
    return string.replace(regex, (match, symbolName) => {
        const symbol = symbols.get(symbolName);
        return symbol ? symbol : match;
    });
}

(async () => {
    /** @type {string} */
    let content = (await (Bun.file(inputFile)).text()).trim();
    content = await placeImports(content);
    content = await stripStyles(content);
    content = await replaceSymbols(content);
    console.log(content);
})(); 
