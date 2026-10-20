/**
 * Sentiment Model Evaluation Script (Task 4.2)
 *
 * Evaluates the trained Naive Bayes sentiment classifier on a dedicated,
 * hand-labeled test set kept strictly separate from the training dataset.
 *
 * Computes:
 *  - Accuracy
 *  - Per-class Precision, Recall, and F1-Score (Positive, Neutral, Negative)
 *  - Macro-averaged F1-Score
 *  - Confusion Matrix
 *
 * Target: At least 80% accuracy across classes.
 *
 * Usage:
 *   node backend/scripts/evaluate_sentiment.js
 */

const { analyzeSentiment } = require('../utils/sentimentAnalyzer');

// Dedicated, hand-labeled test dataset (Separate from training data)
// Includes English, Tagalog, and Taglish expressions typical of PSU student evaluations
const testDataset = [
  // ── Positive Samples (30) ──
  { text: 'Prof is outstanding and explains technical algorithms step by step.', expected: 'positive' },
  { text: 'The teacher creates an engaging environment and encourages questions.', expected: 'positive' },
  { text: 'Napakahusay magturo at laging may handang visual presentation.', expected: 'positive' },
  { text: 'Sobrang bait at approachable kapag may hindi maintindihan sa lessons.', expected: 'positive' },
  { text: 'Very dedicated instructor who genuinely wants all students to pass and learn.', expected: 'positive' },
  { text: 'Provides prompt and meaningful feedback on all submitted assignments.', expected: 'positive' },
  { text: 'Magaling mag-explain ng mahihirap na code examples.', expected: 'positive' },
  { text: 'Always punctual and maximizes every minute of class time effectively.', expected: 'positive' },
  { text: 'One of the finest professors in the department, very inspirational.', expected: 'positive' },
  { text: 'Laging handa sa klase at malinaw ang boses sa lecture.', expected: 'positive' },
  { text: 'Excellent mastery of the course syllabus and practical applications.', expected: 'positive' },
  { text: 'Fair grading system and transparent rubrics provided before exams.', expected: 'positive' },
  { text: 'The instructor explains difficult formulas clearly and patiently.', expected: 'positive' },
  { text: 'Ang ganda ng discussion palagi, natututo talaga kami nang husto.', expected: 'positive' },
  { text: 'Empathetic and considerate when students face technical issues with submissions.', expected: 'positive' },
  { text: 'Uses interactive quizzes that make lectures fun and memorable.', expected: 'positive' },
  { text: 'Very supportive and open to consultation after class hours.', expected: 'positive' },
  { text: 'Organized course materials and detailed lecture slides uploaded on time.', expected: 'positive' },
  { text: 'Sobrang linaw magturo, madaling sundan kahit mahirap ang subject.', expected: 'positive' },
  { text: 'Respectful to all students and fosters equal participation.', expected: 'positive' },
  { text: 'Gives constructive remarks that help us improve our research output.', expected: 'positive' },
  { text: 'High energy and enthusiastic throughout the entire semester.', expected: 'positive' },
  { text: 'Provides real-world industry case studies that enrich the subject.', expected: 'positive' },
  { text: 'Sulit ang bawat lecture dahil napakaraming bagong natututunan.', expected: 'positive' },
  { text: 'Consistently displays professionalism and exemplary teaching ethics.', expected: 'positive' },
  { text: 'The activities given are highly relevant to our program goals.', expected: 'positive' },
  { text: 'Mahusay magpaliwanag at laging may follow-up checks kung naintindihan.', expected: 'positive' },
  { text: 'Very systematic and structured syllabus delivery from day one.', expected: 'positive' },
  { text: 'Helps struggling students catch up without making them feel inadequate.', expected: 'positive' },
  { text: 'Best instructor this academic year! Keep up the marvelous work.', expected: 'positive' },

  // ── Neutral Samples (25) ──
  { text: 'The class followed the prescribed syllabus and covered all expected topics.', expected: 'neutral' },
  { text: 'Adequate lectures and standard class discussions.', expected: 'neutral' },
  { text: 'Attendance is checked at the start of each meeting according to policy.', expected: 'neutral' },
  { text: 'The professor adheres to the department guidelines and grading rubric.', expected: 'neutral' },
  { text: 'Karaniwan lang ang paraan ng pagtuturo at sumusunod sa module.', expected: 'neutral' },
  { text: 'Normal course flow with regular quizzes and assignments.', expected: 'neutral' },
  { text: 'The textbook was followed chapter by chapter as scheduled.', expected: 'neutral' },
  { text: 'Okay naman ang takbo ng semester, walang masyadong issue.', expected: 'neutral' },
  { text: 'Lecture slides are distributed through the university portal after class.', expected: 'neutral' },
  { text: 'Standard pace of discussions, covers the required course outline.', expected: 'neutral' },
  { text: 'Midterm and final examinations were administered on the specified dates.', expected: 'neutral' },
  { text: 'Sakto lang, sumusunod sa itinakdang oras ng klase.', expected: 'neutral' },
  { text: 'Course requirements were submitted and recorded in the grading sheet.', expected: 'neutral' },
  { text: 'Uses the assigned PowerPoint templates from the college dean.', expected: 'neutral' },
  { text: 'Average performance in delivering weekly assigned readings.', expected: 'neutral' },
  { text: 'Sumusunod sa nakatalang schedule sa syllabus.', expected: 'neutral' },
  { text: 'Readings are assigned weekly and students report in turns.', expected: 'neutral' },
  { text: 'The classroom facilities were used according to the room assignment.', expected: 'neutral' },
  { text: 'Regular meeting hours are maintained throughout the term.', expected: 'neutral' },
  { text: 'Sakto lang ang dami ng binigay na seatworks at homeworks.', expected: 'neutral' },
  { text: 'Grading reflects standard computation based on university criteria.', expected: 'neutral' },
  { text: 'Module based teaching, followed the table of specifications.', expected: 'neutral' },
  { text: 'The instructor followed the course pacing guide provided by the campus.', expected: 'neutral' },
  { text: 'Walang kakaibang ginawa, regular lecture at recitation lang.', expected: 'neutral' },
  { text: 'Standard college-level instruction, meets baseline curriculum expectations.', expected: 'neutral' },

  // ── Negative Samples (30) ──
  { text: 'Frequently absent and arrives 30 minutes late without prior notice.', expected: 'negative' },
  { text: 'Very difficult to understand and rushes through complex lessons.', expected: 'negative' },
  { text: 'Hindi marunong makinig sa concerns ng students at laging galit.', expected: 'negative' },
  { text: 'Unfair grading without providing any rubrics or returned test papers.', expected: 'negative' },
  { text: 'Lectures are disorganized and slides are full of typographical errors.', expected: 'negative' },
  { text: 'Laging nagpapalinis o nagpapabasa lang sa klase pero walang sariling lecture.', expected: 'negative' },
  { text: 'Very rude when students politely ask clarifying questions.', expected: 'negative' },
  { text: 'Does not return exams or assignment scores until the end of semester.', expected: 'negative' },
  { text: 'Masyadong mabilis magturo at nagagalit kapag nagpatulong.', expected: 'negative' },
  { text: 'Dismisses class after 10 minutes and just tells us to self-study everything.', expected: 'negative' },
  { text: 'Extremely biased toward favored students and subjective in grading.', expected: 'negative' },
  { text: 'Pumapasok lang para magpa-attendance tapos aalis na agad.', expected: 'negative' },
  { text: 'Monotone voice, reads directly from outdated textbook with zero explanation.', expected: 'negative' },
  { text: 'Inaccessible during designated consultation hours, never answers emails.', expected: 'negative' },
  { text: 'Walang natutunan sa buong semester dahil puro group reports na walang feedback.', expected: 'negative' },
  { text: 'Unreasonable deadlines given late at night with strict penalties.', expected: 'negative' },
  { text: 'Displays clear lack of mastery over the subject matter taught.', expected: 'negative' },
  { text: 'Hindi nagtuturo pero napakahirap magpa-exam, walang connect sa readings.', expected: 'negative' },
  { text: 'Humiliates students in front of the whole class when they give incorrect answers.', expected: 'negative' },
  { text: 'No course syllabus was ever shared or explained to students.', expected: 'negative' },
  { text: 'Laging late mag-post ng requirements tapos rushed ang submission.', expected: 'negative' },
  { text: 'Does not provide constructive guidance, only harsh and demoralizing criticism.', expected: 'negative' },
  { text: 'Arbitrary deductions on grades without any explanation provided.', expected: 'negative' },
  { text: 'Walang malasakit sa mga estudyante at hindi tumatanggap ng valid medical excuses.', expected: 'negative' },
  { text: 'Terrible communication skills and confusing assignment instructions.', expected: 'negative' },
  { text: 'Repeatedly cancels classes without makeup sessions being scheduled.', expected: 'negative' },
  { text: 'Hindi patas ang pagtrato sa mga sections.', expected: 'negative' },
  { text: 'Lacks enthusiasm and shows obvious disinterest in teaching students.', expected: 'negative' },
  { text: 'Exams contain topics never discussed or assigned in class.', expected: 'negative' },
  { text: 'Unprofessional behavior, brings personal mood problems into the classroom.', expected: 'negative' },
];

function evaluateSentimentModel() {
  console.log(`\n============================================================`);
  console.log(` FEFAS Supervised Sentiment Model Evaluation (Task 4.2)`);
  console.log(` Hand-labeled Test Set: ${testDataset.length} independent comments`);
  console.log(` Classes: positive, neutral, negative`);
  console.log(`============================================================\n`);

  const classes = ['positive', 'neutral', 'negative'];
  const confusionMatrix = {
    positive: { positive: 0, neutral: 0, negative: 0 },
    neutral:  { positive: 0, neutral: 0, negative: 0 },
    negative: { positive: 0, neutral: 0, negative: 0 },
  };

  let totalCorrect = 0;
  const misclassified = [];

  testDataset.forEach((item, index) => {
    const result = analyzeSentiment(item.text);
    const predicted = result.label;
    const actual = item.expected;

    if (confusionMatrix[actual] && confusionMatrix[actual][predicted] !== undefined) {
      confusionMatrix[actual][predicted]++;
    }

    if (predicted === actual) {
      totalCorrect++;
    } else {
      misclassified.push({
        index: index + 1,
        text: item.text,
        actual,
        predicted,
        score: result.score,
        confidence: result.confidence,
      });
    }
  });

  const accuracy = (totalCorrect / testDataset.length) * 100;

  console.log(`Confusion Matrix (Rows: Actual, Columns: Predicted):`);
  console.log(`                 Predicted`);
  console.log(`Actual           Positive  Neutral   Negative`);
  classes.forEach(c => {
    const row = confusionMatrix[c];
    const pos = String(row.positive).padStart(8);
    const neu = String(row.neutral).padStart(8);
    const neg = String(row.negative).padStart(8);
    console.log(`${c.padEnd(16)} ${pos}  ${neu}  ${neg}`);
  });

  console.log(`\nPer-Class Performance Metrics:`);
  console.log(`------------------------------------------------------------`);
  console.log(`Class       Precision     Recall        F1-Score     Support`);
  console.log(`------------------------------------------------------------`);

  let macroPrecisionSum = 0;
  let macroRecallSum = 0;
  let macroF1Sum = 0;
  const metrics = {};

  classes.forEach(c => {
    const tp = confusionMatrix[c][c];
    const fp = classes.filter(other => other !== c).reduce((sum, other) => sum + confusionMatrix[other][c], 0);
    const fn = classes.filter(other => other !== c).reduce((sum, other) => sum + confusionMatrix[c][other], 0);
    const support = classes.reduce((sum, pred) => sum + confusionMatrix[c][pred], 0);

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    metrics[c] = { precision, recall, f1, support };
    macroPrecisionSum += precision;
    macroRecallSum += recall;
    macroF1Sum += f1;

    console.log(
      `${c.padEnd(12)} ` +
      `${(precision * 100).toFixed(2).padStart(8)}%   ` +
      `${(recall * 100).toFixed(2).padStart(8)}%   ` +
      `${(f1 * 100).toFixed(2).padStart(8)}%    ` +
      `${String(support).padStart(6)}`
    );
  });

  const macroPrecision = (macroPrecisionSum / classes.length) * 100;
  const macroRecall = (macroRecallSum / classes.length) * 100;
  const macroF1 = (macroF1Sum / classes.length) * 100;

  console.log(`------------------------------------------------------------`);
  console.log(
    `Macro Avg    ${macroPrecision.toFixed(2).padStart(8)}%   ` +
    `${macroRecall.toFixed(2).padStart(8)}%   ` +
    `${macroF1.toFixed(2).padStart(8)}%    ` +
    `${String(testDataset.length).padStart(6)}`
  );
  console.log(`Overall Accuracy: ${accuracy.toFixed(2)}% (${totalCorrect}/${testDataset.length})`);
  console.log(`Acceptance Target: >= 80.00%`);
  console.log(`Status: ${accuracy >= 80 ? 'PASSED (Target Satisfied)' : 'WARNING (Below 80% Target)'}`);
  console.log(`============================================================\n`);

  if (misclassified.length > 0) {
    console.log(`Misclassified Samples (${misclassified.length}):`);
    misclassified.forEach(m => {
      console.log(` [Sample #${m.index}] Actual: "${m.actual}" -> Predicted: "${m.predicted}" (Conf: ${m.confidence})`);
      console.log(`   Text: "${m.text}"`);
    });
    console.log('');
  }

  return { accuracy, macroPrecision, macroRecall, macroF1, totalCorrect, total: testDataset.length, metrics };
}

if (require.main === module) {
  evaluateSentimentModel();
}

module.exports = { evaluateSentimentModel, testDataset };
