const fs = require('fs');
const path = require('path');

// Input files
const symbolsFile = path.join(__dirname, 'symbols.txt');
const namesFile = path.join(__dirname, 'names.txt');

// Output file
const outputFile = path.join(__dirname, 'sfsymbols.json');

// Read both files
const symbols = fs.readFileSync(symbolsFile, 'utf-8').trim().split('\n');
const names = fs.readFileSync(namesFile, 'utf-8').trim().split('\n');

// Check if both files have the same number of lines
if (symbols.length !== names.length) {
    console.error('Error: Files do not have the same number of lines.');
    process.exit(1);
}

// Create the mapping
const mapping = symbols.map((symbol, index) => [names[index].trim(),symbol.trim()]);

// Write the mapping to the JSON file
fs.writeFileSync(outputFile, JSON.stringify(mapping, 0, 0));

console.log(`Mapping saved to ${outputFile}`);
