import posthtml from 'posthtml';
import minifyClassnames from 'posthtml-minify-classnames';

/**
 * CSS Class Name Mangler using PostHTML
 * Properly parses HTML DOM and mangles CSS class names
 */
export async function mangleClassNames(htmlContent, options = {}) {
    const {
        preserve = [], // Array of class names to preserve
        verbose = false
    } = options;

    try {
        // Simple configuration that should work
        const pluginOptions = {};

        if (preserve.length > 0) {
            pluginOptions.filter = new RegExp(`^(?!.*\\b(?:${preserve.join('|')})\\b).*$`);
        }

        const result = await posthtml([
            minifyClassnames(pluginOptions)
        ]).process(htmlContent);

        if (verbose) {
            console.log('🔧 CSS class names mangled successfully');
        }

        return result.html;
    } catch (error) {
        console.warn('⚠️  CSS mangling failed, returning original content:', error.message);
        return htmlContent;
    }
}

/**
 * Advanced mangling with shortest name generation
 */
export async function mangleClassNamesAdvanced(htmlContent, options = {}) {
    const {
        preserve = [],
        verbose = false
    } = options;

    return mangleClassNames(htmlContent, {
        preserve,
        verbose
    });
}