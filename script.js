async function traverseAndReplace(element) {
    // Check each child node for text content that contains {{ ... }}
    element.childNodes.forEach(async (node) => {

        globalThis.traveralState = globalThis.traveralState != undefined ? globalThis.traveralState + 1 : 0;
        
        if (node.nodeType === Node.TEXT_NODE) {
            let textContent = node.textContent;
            
            // Regular expression to match multiple {{ file_path }} placeholders
            const regex = /\{\{(.*?)\}\}/g;  // 'g' flag for global matching of multiple instances
            let match;
            
            // Collect all matches
            let fragments = [];
            let lastIndex = 0;
            
            // Iterate over all matches
            while ((match = regex.exec(textContent)) !== null) {
                const filePath = match[1].trim();
                try {
                    // Fetch the content from the file path
                    let response = await fetch(filePath);
                    if (!response.ok) { response = await fetch(`${filePath}.html`) }
                    if (response.ok) {
                        const fileContent = await response.text();
                        
                        // Create a temporary container to parse the fetched HTML
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = fileContent;
                        
                        // Push the text before the match
                        fragments.push(document.createTextNode(textContent.substring(lastIndex, match.index)));
                        
                        await traverseAndReplace(tempDiv);
                        
                        // Push the fetched HTML content
                        fragments.push(...tempDiv.childNodes);
                        
                        // Update lastIndex to continue after the current match
                        lastIndex = match.index + match[0].length;
                    } else {
                        console.error(`Failed to load file: ${filePath}`);
                    }
                } catch (error) {
                    console.error(`Error fetching file content: ${error}`);
                }
            }
            
            // Add any remaining text after the last match
            if (lastIndex < textContent.length) {
                fragments.push(document.createTextNode(textContent.substring(lastIndex)));
            }
            
            // If we found any matches, replace the original text node with new content
            if (fragments.length > 0) {
                const parentNode = node.parentNode;
                
                // Insert all fragments (text + HTML)
                fragments.forEach(fragment => {
                    parentNode.insertBefore(fragment, node);
                });
                
                // Remove the original node
                parentNode.removeChild(node);
            }
        } 
        // If the node is an element, continue traversal recursively
        else if (node.nodeType === Node.ELEMENT_NODE) {
            await traverseAndReplace(node);
        }

        globalThis.traveralState -= 1;

        if (globalThis.traveralState == 0) {
            document.dispatchEvent(new Event("FullyParsed"));
        }
    });
}

async function traverseAndReplaceSymbols(element) {
    // Regular expression to match @symbolName;
    const regex = /@(((\w+|\d{1,3})\.?)+)+;/g;
    
    // Check for text nodes in childNodes
    element.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            let textContent = node.textContent;
            let updatedText = textContent.replace(regex, (match, symbolName) => {
                const symbol = globalThis.SFSymbols.get(symbolName);
                return symbol ? symbol : match;
            });
            if (updatedText !== textContent) {
                node.textContent = updatedText;
            }
        }
    });
    
    // Check for attributes in the current element
    Array.from(element.attributes).forEach((attr) => {
        let attrValue = attr.value;
        let updatedValue = attrValue.replace(regex, (match, symbolName) => {
            const symbol = globalThis.SFSymbols.get(symbolName);
            return symbol ? symbol : match;
        });
        if (updatedValue !== attrValue) {
            element.setAttribute(attr.name, updatedValue);
        }
    });
    
    // Continue recursively for child elements
    element.childNodes.forEach(async (node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            await traverseAndReplaceSymbols(node);
        }
    });
}

async function cleanLanguages(lang) {

    const langs = ["en","fr"]

    document.body.querySelectorAll(`[lang]:not([lang="${lang}"])`).forEach((node) => {
        node.remove();
    });

    for (const language of langs) {
        if (language != lang) {
            [...document.body.getElementsByTagName(language)].forEach((node) => {
                node.remove();
            })
        }
    }
}

// Call the function when the DOM content is fully loaded
document.addEventListener("DOMContentLoaded", async () => {

    const lang = document.getElementsByTagName("html")[0].getAttribute("lang");
    document.head.innerHTML += `<link rel="stylesheet" href="./${lang}.css">`

    globalThis.traveralState = 0;
    await traverseAndReplace(document.body);

    const SFSymbolsJSON = await fetch("/resources/fonts/sfsymbols.json");
    
    if (SFSymbolsJSON.ok) {
        const parsedJSON = await SFSymbolsJSON.json();
        Object.defineProperty(globalThis, "SFSymbols", {
            value: new Map(parsedJSON),
            writable: false
        });

        document.addEventListener("FullyParsed", async () => {
            await Promise.all([
                traverseAndReplaceSymbols(document.body),
                cleanLanguages(lang)
            ])
        });
    } else {
        await cleanLanguages(lang)
    }
});
