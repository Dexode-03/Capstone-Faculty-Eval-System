/**
 * Evaluation Script for the FEFAS Sentiment Classification Engine (Chapter 4 Capstone Validation)
 *
 * Evaluates both:
 *  1. Standalone Naive Bayes Classifier (baseline)
 *  2. Production Hybrid Ensemble Classifier (Naive Bayes + AFINN Lexicon + Taglish Domain Calibration)
 *
 * Dataset: 1,200 curated Philippine SET (Student Evaluation of Teaching) Taglish samples
 * Split: 80/20 Stratified Split (960 train / 240 held-out test)
 * Random Seed: 42 (Mulberry32 PRNG for deterministic academic reproducibility)
 *
 * Usage:
 *  node backend/scripts/evaluate_classifier.js
 */

const fs = require('fs');
const path = require('path');
const natural = require('natural');
const { analyzeSentiment } = require('../utils/sentimentAnalyzer');

// Seeded PRNG for reproducible stratified split (Mulberry32)
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function shuffle(array, randFn) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(randFn() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 1. Load dataset
const dataset = require('../utils/trainingData');
console.log(`\n===============================================================`);
console.log(`     PHILIPPINE SET SENTIMENT CLASSIFICATION EVALUATION        `);
console.log(`===============================================================\n`);
console.log(`Total Dataset Size: ${dataset.length} samples`);

const posSamples = dataset.filter(([_, l]) => l === 'positive');
const neuSamples = dataset.filter(([_, l]) => l === 'neutral');
const negSamples = dataset.filter(([_, l]) => l === 'negative');

console.log(`Class Counts: Positive=${posSamples.length}, Neutral=${neuSamples.length}, Negative=${negSamples.length}`);

// 2. Perform 80/20 Stratified Split
const rand = mulberry32(42);
const shuffledPos = shuffle(posSamples, rand);
const shuffledNeu = shuffle(neuSamples, rand);
const shuffledNeg = shuffle(negSamples, rand);

const trainPos = shuffledPos.slice(0, 320);
const testPos  = shuffledPos.slice(320);

const trainNeu = shuffledNeu.slice(0, 320);
const testNeu  = shuffledNeu.slice(320);

const trainNeg = shuffledNeg.slice(0, 320);
const testNeg  = shuffledNeg.slice(320);

const trainSet = [...trainPos, ...trainNeu, ...trainNeg];
const testSet  = [...testPos, ...testNeu, ...testNeg];

console.log(`\nStratified 80/20 Split:`);
console.log(`- Training Set: ${trainSet.length} samples (320 Positive, 320 Neutral, 320 Negative)`);
console.log(`- Test Set:     ${testSet.length} samples ( 80 Positive,  80 Neutral,  80 Negative)`);

// 3. Train Standalone Classifier on 80% Training Set
const classifier = new natural.BayesClassifier();
const tokenizer = new natural.WordTokenizer();

classifier.stemmer = {
  tokenizeAndStem: (text) => {
    const tokens = tokenizer.tokenize(text.toLowerCase()) || [];
    const stemmed = tokens.map(t => natural.PorterStemmer.stem(t));
    const bigrams = [];
    for (let i = 0; i < stemmed.length - 1; i++) {
      bigrams.push(`${stemmed[i]}_${stemmed[i + 1]}`);
    }
    return [...stemmed, ...bigrams];
  },
};

console.log(`\nTraining Standalone Naive Bayes classifier on ${trainSet.length} samples...`);
const t0 = Date.now();
trainSet.forEach(([text, label]) => classifier.addDocument(text, label));
classifier.train();
const trainTime = Date.now() - t0;
console.log(`Training completed in ${trainTime}ms.`);

// Helper function to evaluate model predictions
function evaluateModel(predictFn, modelName) {
  const classes = ['positive', 'neutral', 'negative'];
  const matrix = {
    positive: { positive: 0, neutral: 0, negative: 0 },
    neutral:  { positive: 0, neutral: 0, negative: 0 },
    negative: { positive: 0, neutral: 0, negative: 0 },
  };

  let correct = 0;
  const misclassified = [];

  testSet.forEach(([text, actual]) => {
    const predicted = predictFn(text);
    matrix[actual][predicted]++;
    if (predicted === actual) {
      correct++;
    } else {
      misclassified.push({ text, actual, predicted });
    }
  });

  const accuracy = correct / testSet.length;
  const metrics = {};

  classes.forEach(cls => {
    const tp = matrix[cls][cls];
    let fp = 0, fn = 0;
    classes.forEach(other => {
      if (other !== cls) {
        fp += matrix[other][cls];
        fn += matrix[cls][other];
      }
    });

    const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
    const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;
    const f1 = (precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

    metrics[cls] = { tp, fp, fn, precision, recall, f1, support: 80 };
  });

  const macroPrecision = (metrics.positive.precision + metrics.neutral.precision + metrics.negative.precision) / 3;
  const macroRecall    = (metrics.positive.recall + metrics.neutral.recall + metrics.negative.recall) / 3;
  const macroF1        = (metrics.positive.f1 + metrics.neutral.f1 + metrics.negative.f1) / 3;

  console.log(`\n===============================================================`);
  console.log(`   EVALUATION RESULTS: ${modelName.toUpperCase()}   `);
  console.log(`===============================================================`);
  console.log(`Confusion Matrix (Actual \\ Predicted):`);
  console.log(`                 Predicted Pos   Predicted Neu   Predicted Neg   Total`);
  console.log(`Actual Pos:           ${String(matrix.positive.positive).padStart(3)}             ${String(matrix.positive.neutral).padStart(3)}             ${String(matrix.positive.negative).padStart(3)}          80`);
  console.log(`Actual Neu:           ${String(matrix.neutral.positive).padStart(3)}             ${String(matrix.neutral.neutral).padStart(3)}             ${String(matrix.neutral.negative).padStart(3)}          80`);
  console.log(`Actual Neg:           ${String(matrix.negative.positive).padStart(3)}             ${String(matrix.negative.neutral).padStart(3)}             ${String(matrix.negative.negative).padStart(3)}          80`);
  console.log(`---------------------------------------------------------------`);
  console.log(`Class        Precision    Recall       F1-Score     Support`);
  console.log(`---------------------------------------------------------------`);
  classes.forEach(cls => {
    const m = metrics[cls];
    const name = cls.charAt(0).toUpperCase() + cls.slice(1);
    console.log(`${name.padEnd(12)} ${(m.precision * 100).toFixed(2).padStart(6)}%     ${(m.recall * 100).toFixed(2).padStart(6)}%     ${(m.f1 * 100).toFixed(2).padStart(6)}%     ${String(m.support).padStart(7)}`);
  });
  console.log(`---------------------------------------------------------------`);
  console.log(`Overall Accuracy:  ${(accuracy * 100).toFixed(2)}% (${correct}/${testSet.length})`);
  console.log(`Macro Precision:   ${(macroPrecision * 100).toFixed(2)}%`);
  console.log(`Macro Recall:      ${(macroRecall * 100).toFixed(2)}%`);
  console.log(`Macro F1-Score:    ${(macroF1 * 100).toFixed(2)}%`);
  console.log(`---------------------------------------------------------------`);

  return { matrix, metrics, accuracy, macroPrecision, macroRecall, macroF1, correct, total: testSet.length, misclassified };
}

// 4. Run Evaluations
const baselineResults = evaluateModel((text) => classifier.classify(text), 'Baseline Standalone Naive Bayes');
const ensembleResults = evaluateModel((text) => analyzeSentiment(text).label, 'Production Hybrid Ensemble (NB + AFINN + Lexicon)');

// 5. Print Comparative Ablation Summary
console.log(`\n===============================================================`);
console.log(`         COMPARATIVE PERFORMANCE ABLATION SUMMARY              `);
console.log(`===============================================================`);
console.log(`Metric                   Baseline Standalone NB   Production Ensemble   Delta`);
console.log(`-----------------------------------------------------------------------------`);
console.log(`Overall Accuracy:               ${(baselineResults.accuracy * 100).toFixed(2)}%                 ${(ensembleResults.accuracy * 100).toFixed(2)}%        +${((ensembleResults.accuracy - baselineResults.accuracy) * 100).toFixed(2)}%`);
console.log(`Positive F1-Score:              ${(baselineResults.metrics.positive.f1 * 100).toFixed(2)}%                 ${(ensembleResults.metrics.positive.f1 * 100).toFixed(2)}%        +${((ensembleResults.metrics.positive.f1 - baselineResults.metrics.positive.f1) * 100).toFixed(2)}%`);
console.log(`Neutral F1-Score:               ${(baselineResults.metrics.neutral.f1 * 100).toFixed(2)}%                 ${(ensembleResults.metrics.neutral.f1 * 100).toFixed(2)}%        +${((ensembleResults.metrics.neutral.f1 - baselineResults.metrics.neutral.f1) * 100).toFixed(2)}%`);
console.log(`Negative F1-Score:              ${(baselineResults.metrics.negative.f1 * 100).toFixed(2)}%                 ${(ensembleResults.metrics.negative.f1 * 100).toFixed(2)}%        +${((ensembleResults.metrics.negative.f1 - baselineResults.metrics.negative.f1) * 100).toFixed(2)}%`);
console.log(`Macro-Averaged F1:              ${(baselineResults.macroF1 * 100).toFixed(2)}%                 ${(ensembleResults.macroF1 * 100).toFixed(2)}%        +${((ensembleResults.macroF1 - baselineResults.macroF1) * 100).toFixed(2)}%`);
console.log(`-----------------------------------------------------------------------------\n`);

// Save to JSON for exhibits and manuscript documentation
const exportPayload = {
  date: new Date().toISOString(),
  datasetSize: dataset.length,
  split: { train: trainSet.length, test: testSet.length, ratio: '80/20 stratified' },
  baseline: {
    accuracy: parseFloat((baselineResults.accuracy * 100).toFixed(2)),
    macroPrecision: parseFloat((baselineResults.macroPrecision * 100).toFixed(2)),
    macroRecall: parseFloat((baselineResults.macroRecall * 100).toFixed(2)),
    macroF1: parseFloat((baselineResults.macroF1 * 100).toFixed(2)),
    matrix: baselineResults.matrix,
    metrics: baselineResults.metrics,
  },
  ensemble: {
    accuracy: parseFloat((ensembleResults.accuracy * 100).toFixed(2)),
    macroPrecision: parseFloat((ensembleResults.macroPrecision * 100).toFixed(2)),
    macroRecall: parseFloat((ensembleResults.macroRecall * 100).toFixed(2)),
    macroF1: parseFloat((ensembleResults.macroF1 * 100).toFixed(2)),
    matrix: ensembleResults.matrix,
    metrics: ensembleResults.metrics,
  },
};

fs.writeFileSync(
  path.resolve(__dirname, '../../dataset/evaluation_results.json'),
  JSON.stringify(exportPayload, null, 2),
  'utf8'
);
console.log(`Complete evaluation results saved to: dataset/evaluation_results.json\n`);
