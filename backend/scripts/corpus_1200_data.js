/**
 * Merged 1,200 sample corpus for Philippine SET Taglish dataset.
 */
const existingTrainingData = require('../utils/trainingData');
const newPositives = require('./new_positives');
const newNeutrals = require('./new_neutrals');
const newNegatives = require('./new_negatives');

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

const seen = new Set();
const corpus = [];

// 1. Add existing unique items
for (const [text, label] of existingTrainingData) {
  const norm = text.trim().toLowerCase();
  if (!seen.has(norm)) {
    seen.add(norm);
    corpus.push({
      text: text.trim(),
      label: label.toLowerCase(),
      category: guessCategory(text)
    });
  }
}

// 2. Add new positives
for (const item of newPositives) {
  const norm = item.text.trim().toLowerCase();
  if (!seen.has(norm)) {
    seen.add(norm);
    corpus.push({
      text: item.text.trim(),
      label: 'positive',
      category: item.category
    });
  }
}

// 3. Add new neutrals
for (const item of newNeutrals) {
  const norm = item.text.trim().toLowerCase();
  if (!seen.has(norm)) {
    seen.add(norm);
    corpus.push({
      text: item.text.trim(),
      label: 'neutral',
      category: item.category
    });
  }
}

// 4. Add new negatives
for (const item of newNegatives) {
  const norm = item.text.trim().toLowerCase();
  if (!seen.has(norm)) {
    seen.add(norm);
    corpus.push({
      text: item.text.trim(),
      label: 'negative',
      category: item.category
    });
  }
}

module.exports = corpus;

