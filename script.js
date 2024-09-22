function getBrowserLanguage() {
    const userLang = navigator.language || navigator.userLanguage;
    return userLang.startsWith('fr') ? "fr" : "en";
}
function getQuery(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

async function injectParameters(element) {
    // Regular expression to match @symbolName;
    const regex = /@\?(((\w+|\d{1,3})\.?)+)+;/g;
    
    // Check for text nodes in childNodes
    element.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            node.textContent = node.textContent.replace(regex, (match, query) => getQuery(query) ?? "");
        }
    });
    
    // Check for attributes in the current element
    Array.from(element.attributes).forEach((attr) => {
        element.setAttribute(attr.name, attr.value.replace(regex, (match, query) => getQuery(query) ?? ""));
    });
    
    // Continue recursively for child elements
    element.childNodes.forEach(async (node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            await injectParameters(node);
        }
    });
}

async function setLanguage() {
    const langs = ["en","fr"]
    const lang = getQuery('lang') ?? getBrowserLanguage();
    if (langs.includes(lang)){
        document.documentElement.lang = lang;
    } else {
        document.documentElement.lang = 'en';
    }
    if (!("queryLocalFonts" in window) && ("webkitSpeechRecognition" in window)) {
        document.documentElement.classList.add("safari");
    }
    document.head.innerHTML += `<style>body [lang]:not([lang="${lang}"]){display:none!important}</style>`
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
    await injectParameters(document.documentElement);
}
document.addEventListener("DOMContentLoaded", setLanguage);
