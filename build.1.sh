#!/bin/bash

# Check and install missing commands
if ! command -v cargo &> /dev/null
then
    brew install rust
fi

if ! command -v bun &> /dev/null
then
    brew install "oven-sh/bun/bun"
fi

if ! command -v minhtml &> /dev/null
then
    cargo install --all-features minhtml
fi

# Get the current directory
current_dir=$(pwd)

# Remove and recreate the 'docs' directory
/bin/rm -rf "$current_dir/docs"
mkdir -p ./docs

# Copy resources and other necessary files
cp -f -r resources ./docs
cp favicon.* ./docs
cp apple-*.png ./docs

# Run Bun script and generate index.html
bun ./parse.js

# Minify all HTML files
find ./docs -name "*.html" | while read -r htmlFile
do
    minhtml --keep-closing-tags --ensure-spec-compliant-unquoted-attribute-values \
            --remove-bangs --remove-processing-instructions \
            --keep-html-and-head-opening-tags --minify-js \
            --do-not-minify-doctype --minify-css "$htmlFile" -o "$htmlFile"
done
