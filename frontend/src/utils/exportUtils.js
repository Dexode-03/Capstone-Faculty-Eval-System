/**
 * Export utilities for PDF and Excel (Task 3B.7 / FR-30)
 *
 * PDF   — Uses browser's built-in print-to-PDF (zero dependency)
 * Excel — Uses SheetJS (xlsx) for client-side .xlsx generation
 *
 * Safeguards (strictly enforced per plan):
 *   • Exports NEVER include student identity (student_id, student names, emails, etc.)
 *   • Comments and recommendations below minimum-response threshold are HIDDEN
 *   • Faculty can export only their own report; admins can export all
 */
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { getVerbalRating } from '../config/ratingScale';

/* ═══════════════════════════════════════════════════════════════════
   1. Excel Export — System Summary (Reports.jsx)
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Export the system-wide faculty evaluation summary to .xlsx
 */
export const exportSystemExcel = ({
  analysis = {},
  filterLabel = 'All Departments',
  filteredFaculty = [],
  filteredDeptInsights = [],
}) => {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Faculty Summary ──────────────────────────────────
  const facultyList = filteredFaculty.length > 0 ? filteredFaculty : (analysis.facultySummary || []);
  const facultyRows = facultyList.map((f, i) => ({
    '#': i + 1,
    'Faculty Name': f.name,
    'Department': f.department || 'N/A',
    'Total Evaluators': f.totalEvaluations,
    'Response Rate': f.responseRateFormatted || (f.responseRate !== undefined ? `${f.responseRate}%` : 'N/A'),
    'Average Rating': f.averageRating !== undefined ? f.averageRating : 'N/A',
    'Verbal Rating': f.verbalRating || getVerbalRating(f.averageRating) || 'N/A',
    'Positive %': f.positiveRate !== undefined ? `${f.positiveRate}%` : 'N/A',
    'Neutral %': f.neutralRate !== undefined ? `${f.neutralRate}%` : 'N/A',
    'Negative %': f.negativeRate !== undefined ? `${f.negativeRate}%` : 'N/A',
    'vs Dept Avg': f.differenceFromDepartment !== null && f.differenceFromDepartment !== undefined
      ? (f.differenceFromDepartment > 0 ? `+${f.differenceFromDepartment.toFixed(2)}` : f.differenceFromDepartment.toFixed(2))
      : 'N/A',
  }));

  const ws1 = XLSX.utils.json_to_sheet(facultyRows);
  ws1['!cols'] = [
    { wch: 4 },   // #
    { wch: 30 },  // Faculty Name
    { wch: 25 },  // Department
    { wch: 16 },  // Total Evaluators
    { wch: 14 },  // Response Rate
    { wch: 14 },  // Average Rating
    { wch: 18 },  // Verbal Rating
    { wch: 12 },  // Positive %
    { wch: 12 },  // Neutral %
    { wch: 12 },  // Negative %
    { wch: 14 },  // vs Dept Avg
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Faculty Summary');

  // ── Sheet 2: Department Breakdown ──────────────────────────────
  const deptList = filteredDeptInsights.length > 0 ? filteredDeptInsights : (analysis.departmentInsights || []);
  const deptRows = deptList.map((d) => ({
    'Department': d.department,
    'Average Rating': d.averageRating !== undefined ? d.averageRating : 'N/A',
    'Verbal Rating': getVerbalRating(d.averageRating) || 'N/A',
    'Total Evaluations': d.totalEvaluations || 0,
    'Positive %': d.positiveRate !== undefined ? `${d.positiveRate}%` : 'N/A',
    'Negative %': d.negativeRate !== undefined ? `${d.negativeRate}%` : 'N/A',
    'Status': (d.status || '').replace(/_/g, ' '),
  }));

  const ws2 = XLSX.utils.json_to_sheet(deptRows);
  ws2['!cols'] = [
    { wch: 26 }, { wch: 14 }, { wch: 18 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Department Breakdown');

  // ── Sheet 3: Period Trends (if available) ──────────────────────
  if (analysis.periodTrends && analysis.periodTrends.length > 0) {
    const trendRows = analysis.periodTrends.map((p) => ({
      'Academic Period': p.label,
      'Total Evaluations': p.totalEvaluations,
      'Average Rating': p.avgRating,
      'Verbal Rating': getVerbalRating(p.avgRating) || 'N/A',
      'Positive %': `${p.positiveRate}%`,
      'Status': p.isActive ? 'Active' : 'Archived',
    }));
    const wsTrends = XLSX.utils.json_to_sheet(trendRows);
    wsTrends['!cols'] = [{ wch: 26 }, { wch: 16 }, { wch: 14 }, { wch: 18 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsTrends, 'Period Trends');
  }

  // ── Sheet 4: System Recommendations ────────────────────────────
  if (analysis.systemRecommendations && analysis.systemRecommendations.length > 0) {
    const recRows = analysis.systemRecommendations.map((r, i) => ({
      '#': i + 1,
      'Recommendation': typeof r === 'object' && r !== null ? (r.text || String(r)) : String(r),
      'Priority': typeof r === 'object' && r !== null ? (r.priority || r.severity || 'Normal') : 'Normal',
      'Category': typeof r === 'object' && r !== null ? (r.category || 'General') : 'General',
    }));
    const wsRec = XLSX.utils.json_to_sheet(recRows);
    wsRec['!cols'] = [{ wch: 4 }, { wch: 75 }, { wch: 14 }, { wch: 24 }];
    XLSX.utils.book_append_sheet(wb, wsRec, 'Recommendations');
  }

  // ── Sheet 5: Overview & Scope ──────────────────────────────────
  const sentimentCounts = analysis.sentimentCounts || { positive: 0, neutral: 0, negative: 0 };
  const overviewRows = [
    { 'Metric': 'Institution', 'Value': 'Pangasinan State University - Asingan Campus' },
    { 'Metric': 'Report Type', 'Value': 'System Evaluation Summary' },
    { 'Metric': 'Filter Applied', 'Value': filterLabel },
    { 'Metric': 'Total Evaluations', 'Value': analysis.totalEvaluations || 0 },
    { 'Metric': 'System Average Rating', 'Value': `${analysis.avgRating || 0} / 5` },
    { 'Metric': 'Verbal Rating', 'Value': getVerbalRating(analysis.avgRating) || 'N/A' },
    { 'Metric': 'Positive Sentiment Count', 'Value': sentimentCounts.positive || 0 },
    { 'Metric': 'Neutral Sentiment Count', 'Value': sentimentCounts.neutral || 0 },
    { 'Metric': 'Negative Sentiment Count', 'Value': sentimentCounts.negative || 0 },
    { 'Metric': 'Export Timestamp', 'Value': new Date().toLocaleString() },
  ];
  const wsOverview = XLSX.utils.json_to_sheet(overviewRows);
  wsOverview['!cols'] = [{ wch: 26 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Overview');

  // Generate and download
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `System-Evaluation-Summary-${filterLabel.replace(/\s+/g, '_')}-${new Date().toISOString().slice(0, 10)}.xlsx`);
};

/* ═══════════════════════════════════════════════════════════════════
   2. Excel Export — Faculty Individual Report (FacultyReport.jsx)
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Export a single faculty member's evaluation data to .xlsx
 * Strictly enforces safeguards:
 *   - NEVER includes student identity
 *   - Hides comments & recommendations if below threshold
 */
export const exportFacultyExcel = ({ faculty = {}, report = {} }) => {
  const wb = XLSX.utils.book_new();

  const minThreshold = report.minThreshold || 5;
  const isThresholdMet = report.thresholdReached !== false && (report.totalEvaluations >= minThreshold);

  // ── Sheet 1: Overview ──────────────────────────────────────────
  const overviewRows = [
    { 'Metric': 'Institution', 'Value': 'Pangasinan State University - Asingan Campus' },
    { 'Metric': 'Faculty Name', 'Value': faculty.name || 'N/A' },
    { 'Metric': 'Department', 'Value': faculty.department || 'N/A' },
    { 'Metric': 'Average Rating', 'Value': `${report.averageRating || 0} / 5` },
    { 'Metric': 'Verbal Rating', 'Value': report.verbalRating || getVerbalRating(report.averageRating) || 'N/A' },
    { 'Metric': 'Total Evaluations', 'Value': report.totalEvaluations || 0 },
    { 'Metric': 'Enrolled Students', 'Value': report.enrolledStudents || 'N/A' },
    { 'Metric': 'Response Rate', 'Value': report.responseRateFormatted || (report.responseRate !== undefined ? `${report.responseRate}%` : 'N/A') },
    { 'Metric': 'Department Benchmark', 'Value': report.comparisons?.departmentComparison?.departmentAverageFormatted || 'N/A' },
    { 'Metric': 'Department Benchmark Verbal', 'Value': report.comparisons?.departmentComparison?.departmentVerbalRating || 'N/A' },
    { 'Metric': 'Previous Period Rating', 'Value': report.comparisons?.previousPeriodComparison?.previousPeriod?.averageRating || 'N/A' },
    { 'Metric': 'Student Anonymity Safeguard', 'Value': isThresholdMet ? 'Threshold Met (Feedback Disclosed)' : `Active (Withheld below ${minThreshold} evaluations)` },
    { 'Metric': 'Export Date', 'Value': new Date().toLocaleString() },
  ];
  const ws1 = XLSX.utils.json_to_sheet(overviewRows);
  ws1['!cols'] = [{ wch: 30 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Overview');

  // ── Sheet 2: Category Averages ─────────────────────────────────
  const catEntries = Object.entries(report.categoryAverages || {});
  if (catEntries.length > 0) {
    const catRows = catEntries.map(([category, avg]) => ({
      'Category': category,
      'Average Rating (out of 5)': avg,
      'Verbal Rating': getVerbalRating(avg) || 'N/A',
    }));
    const ws2 = XLSX.utils.json_to_sheet(catRows);
    ws2['!cols'] = [{ wch: 45 }, { wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Category Averages');
  }

  // ── Sheet 3: Question Breakdown ────────────────────────────────
  if (report.questionAverages && report.questionAverages.length > 0) {
    const qRows = report.questionAverages.map((q, idx) => ({
      '#': idx + 1,
      'Question': q.question,
      'Category': q.category,
      'Weighted Mean': q.averageWeightedMean,
      'Total Responses': q.totalResponses,
      'Verbal Rating': getVerbalRating(q.averageWeightedMean) || 'N/A',
    }));
    const ws3 = XLSX.utils.json_to_sheet(qRows);
    ws3['!cols'] = [{ wch: 4 }, { wch: 60 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'Question Breakdown');
  }

  // ── Sheet 4: Student Feedback (SAFEGUARD ENFORCED) ──────────────
  // NEVER include student identity.
  // If threshold not met, withhold feedback.
  if (!isThresholdMet) {
    const ws4 = XLSX.utils.json_to_sheet([
      {
        'Notice': `Qualitative student comments are withheld to protect student respondent anonymity. The minimum threshold of ${minThreshold} evaluations has not yet been reached (${report.totalEvaluations || 0} collected).`,
      },
    ]);
    ws4['!cols'] = [{ wch: 100 }];
    XLSX.utils.book_append_sheet(wb, ws4, 'Student Feedback (Withheld)');
  } else {
    const feedbackList = report.allFeedback || report.recentFeedback || [];
    const feedbackRows = feedbackList.map((f, i) => ({
      '#': i + 1,
      'Score': f.rating || 'N/A',
      'Sentiment': f.sentiment || 'N/A',
      'Strengths': f.strengths ? f.strengths.trim() : 'N/A',
      'Weaknesses': f.weaknesses ? f.weaknesses.trim() : 'N/A',
      'Date Submitted': f.date ? new Date(f.date).toLocaleDateString() : 'N/A',
    }));
    const ws4 = XLSX.utils.json_to_sheet(
      feedbackRows.length > 0 ? feedbackRows : [{ 'Feedback': 'No qualitative comments submitted.' }]
    );
    ws4['!cols'] = [{ wch: 4 }, { wch: 8 }, { wch: 12 }, { wch: 45 }, { wch: 45 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws4, 'Student Feedback');
  }

  // ── Sheet 5: Recommendations (SAFEGUARD ENFORCED) ──────────────
  if (!isThresholdMet) {
    const ws5 = XLSX.utils.json_to_sheet([
      {
        'Notice': `Actionable recommendations are withheld pending completion of the minimum response threshold (${minThreshold} responses).`,
      },
    ]);
    ws5['!cols'] = [{ wch: 100 }];
    XLSX.utils.book_append_sheet(wb, ws5, 'Recommendations (Withheld)');
  } else if (report.recommendations && report.recommendations.length > 0) {
    const recRows = report.recommendations.map((r, i) => ({
      '#': i + 1,
      'Priority / Severity': r.severity || r.priority || 'Normal',
      'Category': r.category || 'General',
      'Action Item': r.action || r.text || String(r),
      'Rationale': r.rationale || 'Based on student evaluation scores and feedback',
    }));
    const ws5 = XLSX.utils.json_to_sheet(recRows);
    ws5['!cols'] = [{ wch: 4 }, { wch: 18 }, { wch: 25 }, { wch: 60 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, ws5, 'Recommendations');
  }

  // ── Sheet 6: Academic Period History (if available) ────────────
  if (report.comparisons?.periodHistory && report.comparisons.periodHistory.length > 0) {
    const phRows = report.comparisons.periodHistory.map((ph) => ({
      'Academic Period': ph.name,
      'Evaluations': ph.totalEvaluations,
      'Average Rating': ph.averageRating,
      'Verbal Rating': ph.verbalRating,
      'Status': ph.isActive ? 'Active' : 'Archived',
    }));
    const ws6 = XLSX.utils.json_to_sheet(phRows);
    ws6['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws6, 'Period History');
  }

  // Generate & download
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const safeName = (faculty.name || 'Faculty').replace(/\s+/g, '_');
  saveAs(blob, `Faculty-Report-${safeName}-${new Date().toISOString().slice(0, 10)}.xlsx`);
};

/* ═══════════════════════════════════════════════════════════════════
   3. Excel Export — Subject & Section Report
   ═══════════════════════════════════════════════════════════════════ */

export const exportSubjectSectionExcel = ({ faculty = {}, subject = {}, section = '', data = {} }) => {
  const wb = XLSX.utils.book_new();

  const minThreshold = data.minThreshold || 5;
  const isThresholdMet = data.thresholdReached !== false && ((data.respondentCount || 0) >= minThreshold);

  // Overview
  const overviewRows = [
    { 'Metric': 'Institution', 'Value': 'Pangasinan State University - Asingan Campus' },
    { 'Metric': 'Faculty Member', 'Value': faculty.name || 'N/A' },
    { 'Metric': 'Subject Code & Description', 'Value': `${subject.code || ''} - ${subject.name || ''}` },
    { 'Metric': 'Section', 'Value': section || 'N/A' },
    { 'Metric': 'Academic Period', 'Value': data.activePeriod ? `${data.activePeriod.semester} SY ${data.activePeriod.academic_year}` : 'Current' },
    { 'Metric': 'Enrolled Students', 'Value': data.enrolledCount || 0 },
    { 'Metric': 'Respondents', 'Value': data.respondentCount || 0 },
    { 'Metric': 'Response Rate', 'Value': data.responseRateFormatted || `${data.responseRate || 0}%` },
    { 'Metric': 'Student Anonymity Safeguard', 'Value': isThresholdMet ? 'Disclosed (Threshold Met)' : `Withheld (Below ${minThreshold} respondents)` },
    { 'Metric': 'Export Date', 'Value': new Date().toLocaleString() },
  ];
  const wsOverview = XLSX.utils.json_to_sheet(overviewRows);
  wsOverview['!cols'] = [{ wch: 28 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Overview');

  // Question ratings
  if (data.ratings && data.ratings.length > 0) {
    const qRows = data.ratings.map((r, idx) => ({
      '#': idx + 1,
      'Question': r.question,
      'Category': r.category,
      'Rating 5 (Outstanding)': r.rating_5,
      'Rating 4 (Very Satisfactory)': r.rating_4,
      'Rating 3 (Satisfactory)': r.rating_3,
      'Rating 2 (Fair)': r.rating_2,
      'Rating 1 (Poor)': r.rating_1,
      'Total Score': r.total_score,
      'Average Rating': r.avg_rating,
      'Verbal Rating': getVerbalRating(parseFloat(r.avg_rating)) || 'N/A',
    }));
    const wsRatings = XLSX.utils.json_to_sheet(qRows);
    wsRatings['!cols'] = [
      { wch: 4 }, { wch: 55 }, { wch: 28 },
      { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
      { wch: 12 }, { wch: 14 }, { wch: 18 },
    ];
    XLSX.utils.book_append_sheet(wb, wsRatings, 'Question Ratings');
  }

  // Comments (SAFEGUARD ENFORCED)
  if (!isThresholdMet) {
    const wsComments = XLSX.utils.json_to_sheet([
      {
        'Notice': `Qualitative student comments are withheld to protect student anonymity. The minimum threshold of ${minThreshold} evaluations has not yet been reached (${data.respondentCount || 0} respondents).`,
      },
    ]);
    wsComments['!cols'] = [{ wch: 100 }];
    XLSX.utils.book_append_sheet(wb, wsComments, 'Comments (Withheld)');
  } else {
    const comments = data.comments || [];
    const commentRows = comments.map((c, idx) => ({
      '#': idx + 1,
      'Strengths': c.strengths || '',
      'Weaknesses': c.weaknesses || '',
    }));
    const wsComments = XLSX.utils.json_to_sheet(
      commentRows.length > 0 ? commentRows : [{ 'Comments': 'No qualitative comments submitted.' }]
    );
    wsComments['!cols'] = [{ wch: 4 }, { wch: 50 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsComments, 'Qualitative Comments');
  }

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const safeFac = (faculty.name || 'Faculty').replace(/\s+/g, '_');
  const safeSub = (subject.code || 'Subject').replace(/\s+/g, '_');
  saveAs(blob, `SET-Report-${safeFac}-${safeSub}-${section}-${new Date().toISOString().slice(0, 10)}.xlsx`);
};

/* ═══════════════════════════════════════════════════════════════════
   4. Print-to-PDF
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Trigger the browser's print dialog (Save as PDF).
 * @param {string} [documentTitle] — Title displayed and used as default PDF filename
 */
export const exportPrintPDF = (documentTitle) => {
  if (documentTitle) {
    const originalTitle = document.title;
    document.title = documentTitle;
    const restore = () => {
      document.title = originalTitle;
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
  }
  window.print();
};
