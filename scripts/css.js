import { fileExists, resolveFromRoot } from "./utils.js";

function clearCSS(content) {
    try {
        return content
            .replace(/(\n|\s\s|\t)/gu, "")
            .replace(/:\s/gu, ":")
            .replace(/\s\{/gu, "{")
            .replace(/,\s/gu, ",")
            .replace(/;\}/gu, "}");
    } catch (error) {
        console.error("Unable to minify inline CSS", error);
    }

    return content;
}

async function readStylesheet(href) {
    const filePath = resolveFromRoot(href);
    if (!(await fileExists(filePath))) {
        throw new Error(`Stylesheet not found: ${href}`);
    }

    return clearCSS(await Bun.file(filePath).text());
}

async function retrieveOtherStyles(html) {
    const linkPattern = /<link\s+[^>]*href=["']([^"']+)["'][^>]*>/gi;
    let content = html;
    const stylesheets = [];

    for (const match of html.matchAll(linkPattern)) {
        const href = match[1];
        if (/^https?:/i.test(href)) {
            continue;
        }

        const rawTag = match[0];
        const rel = /rel=["']([^"']+)["']/i.exec(rawTag)?.[1].toLowerCase() ?? "";
        const type = /type=["']([^"']+)["']/i.exec(rawTag)?.[1].toLowerCase() ?? "";
        const isStylesheet = rel.includes("stylesheet") || type === "text/css" || href.toLowerCase().endsWith(".css");

        if (!isStylesheet) {
            continue;
        }

        try {
            const stylesheet = await readStylesheet(href);
            stylesheets.push(stylesheet);
            content = content.replace(rawTag, "");
        } catch (error) {
            console.warn(`[stripStyles] Skipped inlining stylesheet \"${href}\": ${error.message}`);
        }
    }

    return { content, stylesheets };
}

async function stripStyles(originalContent) {
    const { content: contentWithoutLinks, stylesheets } = await retrieveOtherStyles(originalContent);

    const stylePattern = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    const inlineStyles = [];

    const content = contentWithoutLinks.replace(stylePattern, (_, cssBlock) => {
        inlineStyles.push(clearCSS(cssBlock));
        return "";
    });

    const aggregatedStyles = [...stylesheets, ...inlineStyles];
    if (aggregatedStyles.length === 0) {
        return content;
    }

    const styleTag = `<style>${aggregatedStyles.join("")}</style>`;
    const headClosePattern = /<\/head>/i;

    if (headClosePattern.test(content)) {
        return content.replace(headClosePattern, `${styleTag}</head>`);
    }

    return `${styleTag}${content}`;
}

export { clearCSS, retrieveOtherStyles, stripStyles };
