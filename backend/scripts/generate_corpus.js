/**
 * Generates the full 1,200 sample corpus for Philippine SET Taglish dataset.
 */
const fs = require('fs');
const path = require('path');
const existingTrainingData = require('../utils/trainingData');

// Clean and categorize existing data
const existingCleaned = [];
const seen = new Set();

// Categorize helper based on keywords
function guessCategory(text) {
  const t = text.toLowerCase();
  if (t.includes('grade') || t.includes('grading') || t.includes('rubric') || 
      t.includes('fair') || t.includes('bias') || t.includes('favorit') ||
      t.includes('consult') || t.includes('approach') || t.includes('rude') ||
      t.includes('respect') || t.includes('transparent') || t.includes('return') ||
      t.includes('feedback') || t.includes('deduct') || t.includes('late submission') ||
      t.includes('syllabus') || t.includes('policy') || t.includes('patient') ||
      t.includes('humiliat') || t.includes('sarcast') || t.includes('absent') ||
      t.includes('punctual') || t.includes('huli') || t.includes('tard') || t.includes('oras')) {
    return 'Commitment & Transparency';
  } else if (t.includes('concept') || t.includes('topic') || t.includes('subject') ||
             t.includes('code') || t.includes('slide') || t.includes('powerpoint') ||
             t.includes('ppt') || t.includes('example') || t.includes('mastery') ||
             t.includes('theory') || t.includes('practice') || t.includes('technical') ||
             t.includes('formula') || t.includes('material') || t.includes('textbook') ||
             t.includes('module') || t.includes('method') || t.includes('pedagogy') ||
             t.includes('lesson') || t.includes('paliwanag') || t.includes('explain') ||
             t.includes('intindi') || t.includes('understand') || t.includes('malinaw') ||
             t.includes('clear') || t.includes('confus') || t.includes('magturo') ||
             t.includes('turo') || t.includes('teach')) {
    return 'Content & Pedagogy';
  } else {
    return 'Teaching & Learning';
  }
}

for (const [text, label] of existingTrainingData) {
  const norm = text.trim().toLowerCase();
  if (!seen.has(norm)) {
    seen.add(norm);
    existingCleaned.push({
      text: text.trim(),
      label: label.toLowerCase(),
      category: guessCategory(text)
    });
  }
}

const existingPos = existingCleaned.filter(x => x.label === 'positive');
const existingNeu = existingCleaned.filter(x => x.label === 'neutral');
const existingNeg = existingCleaned.filter(x => x.label === 'negative');

console.log(`Existing unique: Pos=${existingPos.length}, Neu=${existingNeu.length}, Neg=${existingNeg.length}`);

// We need 400 - existingPos.length new positives
// 400 - existingNeu.length new neutrals
// 400 - existingNeg.length new negatives
console.log(`Need to add: Pos=${400 - existingPos.length}, Neu=${400 - existingNeu.length}, Neg=${400 - existingNeg.length}`);

