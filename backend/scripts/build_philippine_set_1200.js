/**
 * Builder for the 1,200-sample Philippine SET (Student Evaluation of Teaching) Taglish Dataset.
 *
 * Balanced distribution:
 *  - 400 Positive
 *  - 400 Neutral
 *  - 400 Negative
 * Total = 1,200 unique samples.
 *
 * Balanced across 3 PSU evaluation dimensions:
 *  - Teaching & Learning (~400 samples)
 *  - Content & Pedagogy (~400 samples)
 *  - Commitment & Transparency (~400 samples)
 *
 * Outputs:
 *  1. dataset/philippine_set_taglish_1200.csv
 *  2. backend/utils/trainingData.js
 */

const fs = require('fs');
const path = require('path');

// Helper to escape CSV fields
function escapeCsv(text) {
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

// Collections for building dataset
const dataset = [];
const seenTexts = new Set();

function addSample(text, label, category) {
  const cleaned = text.trim();
  const lower = cleaned.toLowerCase();
  if (seenTexts.has(lower)) {
    return false; // skip duplicates
  }
  seenTexts.add(lower);
  dataset.push({
    id: dataset.length + 1,
    text: cleaned,
    label: label.toLowerCase(),
    category
  });
  return true;
}

// Require the generator module that holds the corpus
const corpus = require('./corpus_1200_data');

console.log('Loading corpus...');
let posCount = 0, neuCount = 0, negCount = 0;

for (const item of corpus) {
  if (addSample(item.text, item.label, item.category)) {
    if (item.label === 'positive') posCount++;
    else if (item.label === 'neutral') neuCount++;
    else if (item.label === 'negative') negCount++;
  }
}

console.log(`Unique items collected: ${dataset.length}`);
console.log(`Positive: ${posCount}, Neutral: ${neuCount}, Negative: ${negCount}`);

if (posCount !== 400 || neuCount !== 400 || negCount !== 400) {
  console.error(`WARNING: Counts are not exactly 400 each! Pos=${posCount}, Neu=${neuCount}, Neg=${negCount}`);
  process.exit(1);
}

// 1. Write CSV
const csvPath = path.resolve(__dirname, '../../dataset/philippine_set_taglish_1200.csv');
let csvContent = 'id,text,label,category\n';
dataset.forEach(row => {
  csvContent += `${row.id},${escapeCsv(row.text)},${row.label},${escapeCsv(row.category)}\n`;
});
fs.writeFileSync(csvPath, csvContent, 'utf8');
console.log(`Saved CSV dataset to: ${csvPath}`);

// 2. Write trainingData.js
const trainingDataPath = path.resolve(__dirname, '../utils/trainingData.js');
let jsContent = `/**
 * Curated 1,200-sample balanced Philippine SET (Student Evaluation of Teaching) dataset
 * for the Naive Bayes sentiment classifier in a Philippine State University (PSU) context.
 *
 * Distribution:
 *   - Positive: 400 samples
 *   - Neutral:  400 samples
 *   - Negative: 400 samples
 *   Total:    1,200 unique samples
 *
 * Covers:
 *   - Teaching & Learning
 *   - Content & Pedagogy
 *   - Commitment & Transparency
 *
 * Generated automatically from dataset/philippine_set_taglish_1200.csv
 */

const trainingData = [
`;

dataset.forEach(row => {
  const escapedText = row.text.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  jsContent += `  ['${escapedText}', '${row.label}'],\n`;
});

jsContent += `];

module.exports = trainingData;
`;

fs.writeFileSync(trainingDataPath, jsContent, 'utf8');
console.log(`Saved trainingData.js to: ${trainingDataPath}`);

