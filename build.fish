#!/opt/homebrew/bin/fish

if ! command -q rsync
    brew install rsync
end

if ! command -q rg
    brew install ripgrep
end

if ! command -q sd
    brew install sd
end

if ! command -q cargo
    brew install rust
end

if ! command -q node
    brew install node
    npm install -g npm@latest
end

if ! command -q bun
    brew install "oven-sh/bun/bun"
end

if ! command -q minhtml
    cargo install --all-features minhtml
end

set -xl current_dir (pwd);

/bin/rm -rf "$current_dir/docs";
mkdir docs
cp -r resources ./docs
bun ./parse.js > ./docs/index.html

for htmlFile in (find ./docs -name "**.html")
    minhtml --keep-closing-tags --ensure-spec-compliant-unquoted-attribute-values --remove-bangs --remove-processing-instructions --keep-html-and-head-opening-tags --minify-js --do-not-minify-doctype --minify-css "$htmlFile" -o "$htmlFile"
end
