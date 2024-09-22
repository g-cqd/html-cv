import { joinPath } from "./utils.js";


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
        .replace(/;\}/gu, "}")
    } catch (error) {
        console.log(content);
    }
    return content
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

async function stripStyles(originalContent) {
    let styles = [];
    let { content, stylesheets } = await retrieveOtherStyles(originalContent)
    
    styles = styles.concat(stylesheets);
    
    const styleStartTag = /^<style>/gum;
    const styleEndTag = /<\/style>$/gum;
    const styleStartTagString = "<style>";
    const styleEndTagString = "</style>";
    const endTitleTagString = "</title>"
    
    let result = null;
    
    while ((result = styleStartTag.exec(content)) !== null) {
        const subcontent = content.substring(result.index, styleEndTag.exec(content).index + styleEndTagString.length);
        content = content.replace(subcontent, "");
        styles.push(
            clearCSS(subcontent
                .replace(styleStartTag, "")
                .replace(styleEndTag, ""))
            );
        }
        let index = content.indexOf(endTitleTagString);
        if (index !== -1) {
            let start = content.substring(0, index + endTitleTagString.length)
            let end = content.substring(index + endTitleTagString.length)
            content = `${start}<style>${styles.join("")}</style>${end}`
        }
        
        return content
    }
    
    export { clearCSS, retrieveOtherStyles, stripStyles };
    
    