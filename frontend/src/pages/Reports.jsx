import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineChartBar,
  HiOutlineLightBulb,
  HiOutlineExclamation,
  HiOutlineCheckCircle,
  HiOutlineUserGroup,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiArrowRight,
  HiEmojiHappy,
  HiEmojiSad,
  HiMinusCircle,
} from 'react-icons/hi';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ShadingType,
  PageBreak, PageOrientation,
} from 'docx';
import { saveAs } from 'file-saver';
import evaluationService from '../services/evaluationService';

const heatBg = (sentiment, rate) => {
  const alpha = Math.max(0.08, Math.min(0.85, rate / 100));
  if (sentiment === 'positive') return `rgba(30, 64, 175, ${alpha})`;
  if (sentiment === 'neutral') return `rgba(234, 179, 8, ${alpha})`;
  return `rgba(239, 68, 68, ${alpha})`;
};

// ── Health badge ──────────────────────────────────────────────────
const HealthBadge = ({ status }) => {
  const map = {
    excellent:         'bg-green-50 text-green-700 border-green-200',
    good:              'bg-psu-primary/10 text-psu-primary border-psu-primary/20',
    fair:              'bg-amber-50 text-amber-700 border-amber-200',
    needs_improvement: 'bg-red-50 text-red-600 border-red-200',
    insufficient_data: 'bg-gray-100 text-psu-muted border-psu-border',
  };
  const labels = {
    excellent:         'Excellent',
    good:              'Good',
    fair:              'Fair',
    needs_improvement: 'Needs Improvement',
    insufficient_data: 'Insufficient Data',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${map[status] || map.insufficient_data}`}>
      {labels[status] || status}
    </span>
  );
};

const Reports = () => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedFaculty, setSelectedFaculty] = useState('all');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await evaluationService.getSystemAnalysis();
        setAnalysis(res.data);
      } catch {
        setError('Failed to load system analysis.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-psu-border border-t-psu-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-[13px] text-red-500">{error}</p>
      </div>
    );
  }

  if (!analysis || analysis.totalEvaluations === 0) {
    return (
      <div>
        <div className="mb-10">
          <p className="text-[12px] font-medium text-psu-muted uppercase tracking-wider mb-1">Analytics</p>
          <h1 className="text-3xl font-semibold text-psu-text tracking-tight">System Reports</h1>
          <p className="text-[13px] text-psu-muted mt-1">Prescriptive analysis across all faculty and departments.</p>
        </div>
        <div className="border border-psu-border bg-white rounded-lg px-6 py-16 text-center">
          <p className="text-[14px] font-semibold text-psu-text">No evaluations yet</p>
          <p className="text-[13px] text-psu-muted mt-1">
            Reports will appear here once students start submitting evaluations.
          </p>
        </div>
      </div>
    );
  }

  const sentimentCounts = analysis.sentimentCounts || { positive: 0, neutral: 0, negative: 0 };
  const total = sentimentCounts.positive + sentimentCounts.neutral + sentimentCounts.negative;
  const pct   = v => total === 0 ? 0 : Math.round((v / total) * 100);
  const departments = analysis.departmentInsights?.map(d => d.department) || [];

  const filteredHeatmap = (analysis.sentimentHeatmap || []).filter(row =>
    selectedDepartment === 'all' ? true : row.department === selectedDepartment
  );
  const filteredDeptInsights = (analysis.departmentInsights || []).filter(row =>
    selectedDepartment === 'all' ? true : row.department === selectedDepartment
  );
  const filteredFaculty = (analysis.facultySummary || []).filter(row => {
    const departmentMatch = selectedDepartment === 'all' || row.department === selectedDepartment;
    const facultyMatch = selectedFaculty === 'all' || String(row.id) === String(selectedFaculty);
    return departmentMatch && facultyMatch;
  });

  const facultyOptions = (analysis.facultySummary || [])
    .filter(row => selectedDepartment === 'all' ? true : row.department === selectedDepartment)
    .map(row => ({ id: row.id, name: row.name }));

  const generateSummaryReport = async () => {
    try {
      const now = new Date();
      const filterDeptLabel = selectedDepartment === 'all' ? 'All Departments' : selectedDepartment;

      // 1. Fetch comprehensive per-faculty and per-subject data dynamically from MySQL
      let activePeriodInfo = null;

      const facultyDataList = await Promise.all(
        filteredFaculty.map(async (facultyRow) => {
          try {
            const facRes = await evaluationService.getFacultyEvaluations(facultyRow.id);
            const facultyObj = facRes.data.faculty || facultyRow;
            const assignments = facRes.data.subjectAssignments || [];

            // Fetch subject-section reports for each assignment
            const subjectDetails = await Promise.all(
              assignments.map(async (sa) => {
                try {
                  const subRes = await evaluationService.getSubjectSectionReport(
                    facultyRow.id,
                    sa.subject_id,
                    sa.section
                  );
                  if (!activePeriodInfo && subRes.data?.activePeriod) {
                    activePeriodInfo = subRes.data.activePeriod;
                  }
                  return {
                    subject_code: sa.section ? `${sa.subject_code} (${sa.section})` : sa.subject_code,
                    enrolledCount: subRes.data?.enrolledCount || 0,
                    respondentCount: subRes.data?.respondentCount || 0,
                    ratings: subRes.data?.ratings || [],
                  };
                } catch {
                  return {
                    subject_code: sa.section ? `${sa.subject_code} (${sa.section})` : sa.subject_code,
                    enrolledCount: 0,
                    respondentCount: 0,
                    ratings: [],
                  };
                }
              })
            );

            return {
              faculty: facultyObj,
              subjects: subjectDetails,
            };
          } catch {
            return {
              faculty: facultyRow,
              subjects: [],
            };
          }
        })
      );

      // Current Semester & SY from active period or fallback
      const semesterStr = activePeriodInfo?.semester
        ? (activePeriodInfo.semester.toLowerCase().includes('semester')
            ? activePeriodInfo.semester
            : `${activePeriodInfo.semester} Semester`)
        : '1st Semester';
      const schoolYearStr = activePeriodInfo?.academic_year || '2023-2024';

      // ── Word doc borders & helpers ─────────────────────────────────
      const borderThin = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
      const borders = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };

      const createCell = (text, width, opts = {}) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: String(text !== undefined && text !== null ? text : ''),
                  bold: opts.bold || false,
                  size: opts.size || 18,
                  font: 'Calibri',
                  color: opts.color || '000000',
                }),
              ],
              alignment: opts.align || AlignmentType.CENTER,
              spacing: { before: 60, after: 60 },
            }),
          ],
          width: { size: width, type: WidthType.PERCENTAGE },
          rowSpan: opts.rowSpan,
          columnSpan: opts.columnSpan,
          borders: opts.borders || borders,
          shading: opts.shading ? { type: ShadingType.CLEAR, fill: opts.shading } : undefined,
          verticalAlign: 'center',
        });

      // University descriptive rating mapping based on official scale
      const getRatingDescription = (score) => {
        const num = parseFloat(score);
        if (!num || isNaN(num) || num <= 0) return 'N/A';
        if (num >= 4.50) return 'Outstanding';
        if (num >= 3.50) return 'Very Satisfactory';
        if (num >= 2.50) return 'Satisfactory';
        if (num >= 1.50) return 'Fair';
        return 'Poor';
      };

      // Questionnaire Section check helpers
      const isSec1 = (cat) => cat && (cat.startsWith('A.') || cat.toLowerCase().includes('management'));
      const isSec2 = (cat) => cat && (cat.startsWith('B.') || cat.toLowerCase().includes('content'));
      const isSec3 = (cat) => cat && (cat.startsWith('C.') || cat.toLowerCase().includes('commitment'));

      const calcAvgFromQuestions = (questions) => {
        if (!questions || questions.length === 0) return '0.00';
        const valid = questions.filter((q) => q.response_count > 0);
        if (valid.length === 0) return '0.00';
        const sum = valid.reduce((acc, q) => acc + (q.total_score / q.response_count), 0);
        return (sum / questions.length).toFixed(2);
      };

      // ── Build Document Header (Exact 2. Centered Header order) ───
      const children = [
        new Paragraph({
          children: [
            new TextRun({
              text: 'GENERAL FACULTY EVALUATION RESULTS SUMMARY',
              bold: true,
              size: 24,
              font: 'Calibri',
              color: '000000',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 40 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `${semesterStr} of SY ${schoolYearStr}`,
              size: 20,
              font: 'Calibri',
              color: '000000',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'PSU Asingan Campus',
              size: 20,
              font: 'Calibri',
              color: '000000',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
        }),
        new Paragraph({
          children: [new TextRun({ text: '' })],
          spacing: { after: 80 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Department: ${filterDeptLabel}`,
              bold: true,
              size: 20,
              font: 'Calibri',
              color: '000000',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
        }),
      ];

      // ── Main Table Rows ──────────────────────────────────────────
      const tableRows = [];

      // Header Row 1 (Repeated on page breaks)
      tableRows.push(
        new TableRow({
          tableHeader: true,
          children: [
            createCell('No.', 4, { rowSpan: 2, bold: true, shading: 'E5E7EB' }),
            createCell('Employee No.', 9, { rowSpan: 2, bold: true, shading: 'E5E7EB' }),
            createCell('Faculty', 17, { rowSpan: 2, bold: true, shading: 'E5E7EB' }),
            createCell('Subject Code', 9, { rowSpan: 2, bold: true, shading: 'E5E7EB' }),
            createCell('No. of Enrollees', 7, { rowSpan: 2, bold: true, shading: 'E5E7EB' }),
            createCell('No. of Evaluators', 7, { rowSpan: 2, bold: true, shading: 'E5E7EB' }),
            createCell('TEACHING PERFORMANCE INDICATIONS', 47, { columnSpan: 5, bold: true, shading: 'E5E7EB' }),
          ],
        })
      );

      // Header Row 2 (Sub-columns)
      tableRows.push(
        new TableRow({
          tableHeader: true,
          children: [
            createCell('MANAGEMENT OF TEACHING AND LEARNING', 10, { bold: true, size: 16, shading: 'E5E7EB' }),
            createCell('CONTENT KNOWLEDGE, PEDAGOGY AND TECHNOLOGY', 10, { bold: true, size: 16, shading: 'E5E7EB' }),
            createCell('COMMITMENT AND TRANSPARENCY', 9, { bold: true, size: 16, shading: 'E5E7EB' }),
            createCell('Overall Average', 8, { bold: true, size: 16, shading: 'E5E7EB' }),
            createCell('Description Rating', 10, { bold: true, size: 16, shading: 'E5E7EB' }),
          ],
        })
      );

      // ── Populate Faculty & Subject Rows ───────────────────────────
      facultyDataList.forEach((item, fIdx) => {
        const facultyNo = fIdx + 1;
        const faculty = item.faculty;
        const subjects = item.subjects || [];

        // Track faculty underlying evaluation points & counts
        let facTotalEnrollees = 0;
        let facTotalEvaluators = 0;

        let facSec1Score = 0, facSec1Count = 0;
        let facSec2Score = 0, facSec2Count = 0;
        let facSec3Score = 0, facSec3Count = 0;
        let facOverallScore = 0, facOverallCount = 0;

        if (subjects.length === 0) {
          // Faculty with no subjects handled
          tableRows.push(
            new TableRow({
              children: [
                createCell(facultyNo, 4),
                createCell(faculty.id || '', 9),
                createCell(faculty.name, 17, { align: AlignmentType.LEFT }),
                createCell('None', 9),
                createCell('0', 7),
                createCell('0', 7),
                createCell('0.00', 10),
                createCell('0.00', 10),
                createCell('0.00', 9),
                createCell('0.00', 8),
                createCell('N/A', 10),
              ],
            })
          );
        } else {
          // List all subjects handled by this faculty consecutively
          const numSubjects = subjects.length;

          subjects.forEach((subj, sIdx) => {
            facTotalEnrollees += subj.enrolledCount;
            facTotalEvaluators += subj.respondentCount;

            const sec1Qs = subj.ratings.filter(r => isSec1(r.category));
            const sec2Qs = subj.ratings.filter(r => isSec2(r.category));
            const sec3Qs = subj.ratings.filter(r => isSec3(r.category));
            const allRatingQs = subj.ratings.filter(r => isSec1(r.category) || isSec2(r.category) || isSec3(r.category));

            // Accumulate underlying unrounded evaluation data for faculty totals
            sec1Qs.forEach(q => { facSec1Score += q.total_score; facSec1Count += q.response_count; });
            sec2Qs.forEach(q => { facSec2Score += q.total_score; facSec2Count += q.response_count; });
            sec3Qs.forEach(q => { facSec3Score += q.total_score; facSec3Count += q.response_count; });
            allRatingQs.forEach(q => { facOverallScore += q.total_score; facOverallCount += q.response_count; });

            const s1Avg = calcAvgFromQuestions(sec1Qs);
            const s2Avg = calcAvgFromQuestions(sec2Qs);
            const s3Avg = calcAvgFromQuestions(sec3Qs);
            const ovAvg = calcAvgFromQuestions(allRatingQs);
            const desc = getRatingDescription(ovAvg);

            const rowCells = [];
            if (sIdx === 0) {
              rowCells.push(
                createCell(facultyNo, 4, { rowSpan: numSubjects > 1 ? numSubjects : undefined }),
                createCell(faculty.id || '', 9, { rowSpan: numSubjects > 1 ? numSubjects : undefined }),
                createCell(faculty.name, 17, { rowSpan: numSubjects > 1 ? numSubjects : undefined, align: AlignmentType.LEFT })
              );
            }

            rowCells.push(
              createCell(subj.subject_code, 9),
              createCell(subj.enrolledCount, 7),
              createCell(subj.respondentCount, 7),
              createCell(s1Avg, 10),
              createCell(s2Avg, 10),
              createCell(s3Avg, 9),
              createCell(ovAvg, 8),
              createCell(desc, 10)
            );

            tableRows.push(new TableRow({ children: rowCells }));
          });
        }

        // Faculty Total Row immediately following each faculty's subject rows
        const facSec1Avg = facSec1Count > 0 ? (facSec1Score / facSec1Count).toFixed(2) : '0.00';
        const facSec2Avg = facSec2Count > 0 ? (facSec2Score / facSec2Count).toFixed(2) : '0.00';
        const facSec3Avg = facSec3Count > 0 ? (facSec3Score / facSec3Count).toFixed(2) : '0.00';
        const facOverallAvg = facOverallCount > 0 ? (facOverallScore / facOverallCount).toFixed(2) : '0.00';
        const facDesc = getRatingDescription(facOverallAvg);

        tableRows.push(
          new TableRow({
            children: [
              createCell('TOTAL', 39, { columnSpan: 4, bold: true, align: AlignmentType.RIGHT, shading: 'F3F4F6' }),
              createCell(facTotalEnrollees, 7, { bold: true, shading: 'F3F4F6' }),
              createCell(facTotalEvaluators, 7, { bold: true, shading: 'F3F4F6' }),
              createCell(facSec1Avg, 10, { bold: true, shading: 'F3F4F6' }),
              createCell(facSec2Avg, 10, { bold: true, shading: 'F3F4F6' }),
              createCell(facSec3Avg, 9, { bold: true, shading: 'F3F4F6' }),
              createCell(facOverallAvg, 8, { bold: true, shading: 'F3F4F6' }),
              createCell(facDesc, 10, { bold: true, shading: 'F3F4F6' }),
            ],
          })
        );
      });

      children.push(
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );

      // Document in Landscape orientation with proper margins
      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                size: { orientation: PageOrientation.LANDSCAPE },
                margin: { top: 720, right: 720, bottom: 720, left: 720 },
              },
            },
            children,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(
        blob,
        `General-Faculty-Evaluation-Summary-${filterDeptLabel.replace(/\s+/g, '_')}-${now.toISOString().slice(0, 10)}.docx`
      );
    } catch (err) {
      console.error('Failed to generate general faculty evaluation summary report:', err);
      alert('Failed to generate summary report. Please try again.');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <p className="text-[12px] font-medium text-psu-muted uppercase tracking-wider mb-1">Analytics</p>
        <h1 className="text-3xl font-semibold text-psu-text tracking-tight">System Reports</h1>
        <p className="text-[13px] text-psu-muted mt-1">
          Prescriptive analysis across all faculty and departments.
        </p>
      </div>

      {/* Drill-down controls */}
      <div className="border border-psu-border bg-white rounded-lg p-4 mb-8">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="w-full md:w-64">
            <label className="block text-[11px] font-medium text-psu-muted uppercase tracking-wider mb-2">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setSelectedFaculty('all');
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[13px] text-psu-text bg-white focus:outline-none focus:ring-2 focus:ring-psu-primary/20 focus:border-psu-primary"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-72">
            <label className="block text-[11px] font-medium text-psu-muted uppercase tracking-wider mb-2">Faculty</label>
            <select
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[13px] text-psu-text bg-white focus:outline-none focus:ring-2 focus:ring-psu-primary/20 focus:border-psu-primary"
            >
              <option value="all">All Faculty</option>
              {facultyOptions.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={generateSummaryReport}
            className="bg-psu-primary text-white rounded-lg px-5 py-2.5 text-[13px] font-semibold hover:bg-psu-secondary transition-colors"
          >
            Generate Summary Report
          </button>
        </div>
      </div>

      {/* Overview row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="border border-psu-border bg-white rounded-lg p-5">
          <p className="text-[11px] font-medium text-psu-muted uppercase tracking-wider mb-2">System Health</p>
          <HealthBadge status={analysis.overallHealth} />
        </div>
        <div className="border border-psu-border bg-white rounded-lg p-5">
          <p className="text-[11px] font-medium text-psu-muted uppercase tracking-wider mb-2">Avg. Rating</p>
          <p className="text-3xl font-bold text-psu-text tabular-nums">{analysis.avgRating}</p>
          <p className="text-[11px] text-psu-muted mt-0.5">out of 5</p>
        </div>
        <div className="border border-psu-border bg-white rounded-lg p-5">
          <p className="text-[11px] font-medium text-psu-muted uppercase tracking-wider mb-2">Positive Rate</p>
          <p className="text-3xl font-bold text-psu-primary tabular-nums">{analysis.positiveRate}%</p>
          <p className="text-[11px] text-psu-muted mt-0.5">{sentimentCounts.positive} evaluations</p>
        </div>
        <div className="border border-psu-border bg-white rounded-lg p-5">
          <p className="text-[11px] font-medium text-psu-muted uppercase tracking-wider mb-2">Total Evaluations</p>
          <p className="text-3xl font-bold text-psu-text tabular-nums">{analysis.totalEvaluations}</p>
          <p className="text-[11px] text-psu-muted mt-0.5">this semester</p>
        </div>
      </div>

      {/* System recommendations */}
      <div className="border border-psu-border bg-white rounded-lg overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-psu-border flex items-center gap-2">
          <HiOutlineLightBulb className="h-4 w-4 text-psu-muted" />
          <h2 className="text-[13px] font-semibold text-psu-text">System-wide Recommendations</h2>
        </div>
        <div className="divide-y divide-psu-border">
          {analysis.systemRecommendations.map((rec, i) => (
            <div key={i} className="px-6 py-4 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-psu-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-psu-primary">{i + 1}</span>
              </div>
              <p className="text-[14px] text-psu-text leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Trends */}
      {analysis.trends.length > 0 && (
        <div className="border border-psu-border bg-white rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-psu-border flex items-center gap-2">
            <HiOutlineChartBar className="h-4 w-4 text-psu-muted" />
            <h2 className="text-[13px] font-semibold text-psu-text">Keyword Trends</h2>
          </div>
          <div className="divide-y divide-psu-border">
            {analysis.trends.map((trend, i) => (
              <div key={i} className="px-6 py-4 flex items-start gap-3">
                {trend.type === 'positive' ? (
                  <HiOutlineCheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <HiOutlineExclamation className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                )}
                <p className="text-[14px] text-psu-text leading-relaxed">{trend.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sentiment — merged stacked bar + detailed breakdown */}
      <div className="border border-psu-border bg-white rounded-lg overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-psu-border">
          <h2 className="text-[13px] font-semibold text-psu-text">Sentiment Breakdown</h2>
        </div>
        <div className="p-6">
          {/* Stacked proportion bar */}
          <div className="flex h-3 rounded-full overflow-hidden mb-6">
            <div className="bg-psu-primary transition-all" style={{ width: `${pct(sentimentCounts.positive)}%` }} />
            <div className="bg-yellow-400 transition-all"  style={{ width: `${pct(sentimentCounts.neutral)}%`  }} />
            <div className="bg-red-400 transition-all"     style={{ width: `${pct(sentimentCounts.negative)}%` }} />
          </div>
          {/* Detailed bars with count + percentage */}
          <div className="space-y-4">
            {[
              { label: 'Positive', val: sentimentCounts.positive, pctVal: pct(sentimentCounts.positive), color: 'bg-psu-primary', badge: 'bg-psu-primary/10 text-psu-primary', icon: HiEmojiHappy },
              { label: 'Neutral',  val: sentimentCounts.neutral,  pctVal: pct(sentimentCounts.neutral),  color: 'bg-yellow-400', badge: 'bg-yellow-50 text-yellow-700',       icon: HiMinusCircle },
              { label: 'Negative', val: sentimentCounts.negative, pctVal: pct(sentimentCounts.negative), color: 'bg-red-400',     badge: 'bg-red-50 text-red-600',             icon: HiEmojiSad },
            ].map(item => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${item.badge}`}>
                    <item.icon className="h-3.5 w-3.5 mr-1" />
                    {item.label}
                  </span>
                  <span className="text-[13px] font-semibold text-psu-text tabular-nums">
                    {item.val} <span className="font-normal text-psu-muted">({item.pctVal}%)</span>
                  </span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full">
                  <div className={`${item.color} h-full rounded-full transition-all duration-700`} style={{ width: `${item.pctVal}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sentiment heat map */}
      {filteredHeatmap.length > 0 && (
        <div className="border border-psu-border bg-white rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-psu-border">
            <h2 className="text-[13px] font-semibold text-psu-text">Sentiment Heat Map (By Department)</h2>
            <p className="text-[12px] text-psu-muted mt-1">
              Darker cells indicate higher share of that sentiment within the department.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50 border-b border-psu-border">
                <tr>
                  <th className="px-6 py-3 text-[11px] font-semibold text-psu-muted uppercase tracking-wider">Department</th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-psu-muted uppercase tracking-wider">
                    <span className="inline-flex items-center gap-1"><HiEmojiHappy className="h-3.5 w-3.5 text-psu-primary" />Positive</span>
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-psu-muted uppercase tracking-wider">
                    <span className="inline-flex items-center gap-1"><HiMinusCircle className="h-3.5 w-3.5 text-yellow-600" />Neutral</span>
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-psu-muted uppercase tracking-wider">
                    <span className="inline-flex items-center gap-1"><HiEmojiSad className="h-3.5 w-3.5 text-red-500" />Negative</span>
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold text-psu-muted uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-psu-border">
                {filteredHeatmap.map((row) => (
                  <tr key={row.department}>
                    <td className="px-6 py-4 text-[13px] font-medium text-psu-text">{row.department}</td>
                    {['positive', 'neutral', 'negative'].map((key) => (
                      <td key={key} className="px-4 py-3">
                        <div
                          className="rounded-md px-3 py-2 text-[12px] font-semibold text-white text-center tabular-nums"
                          style={{ backgroundColor: heatBg(key, row.cells[key].rate) }}
                          title={`${row.cells[key].count} / ${row.totalEvaluations} (${row.cells[key].rate}%)`}
                        >
                          {row.cells[key].rate}%
                        </div>
                      </td>
                    ))}
                    <td className="px-4 py-3 text-[12px] text-psu-text tabular-nums">{row.totalEvaluations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Faculty drill-down */}
      <div className="border border-psu-border bg-white rounded-lg overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-psu-border">
          <h2 className="text-[13px] font-semibold text-psu-text">Faculty Drill-Down</h2>
          <p className="text-[12px] text-psu-muted mt-1">Filtered by selected department/faculty.</p>
        </div>
        {filteredFaculty.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-[13px] text-psu-muted">No faculty match the selected filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-psu-border">
            {filteredFaculty.map((f) => (
              <div key={f.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-[14px] font-medium text-psu-text">{f.name}</p>
                  <p className="text-[12px] text-psu-muted">{f.department}</p>
                  <p className="text-[12px] text-psu-muted mt-1">
                    Avg {f.averageRating}/5 · {f.totalEvaluations} evals
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-psu-primary inline-flex items-center gap-1"><HiEmojiHappy className="h-3.5 w-3.5" />{f.positiveRate}%</span>
                  <span className="text-[11px] text-yellow-700 inline-flex items-center gap-1"><HiMinusCircle className="h-3.5 w-3.5" />{f.neutralRate}%</span>
                  <span className="text-[11px] text-red-500 inline-flex items-center gap-1"><HiEmojiSad className="h-3.5 w-3.5" />{f.negativeRate}%</span>
                  <Link
                    to={`/reports/${f.id}`}
                    className="text-[12px] font-medium text-psu-muted hover:text-psu-primary transition-colors border border-psu-border hover:border-psu-primary rounded-lg px-3 py-1.5"
                  >
                    Open
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Department breakdown */}
      <div className="border border-psu-border bg-white rounded-lg overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-psu-border flex items-center gap-2">
          <HiOutlineUserGroup className="h-4 w-4 text-psu-muted" />
          <h2 className="text-[13px] font-semibold text-psu-text">Department Breakdown</h2>
        </div>
        <div className="divide-y divide-psu-border">
          {filteredDeptInsights.map(dept => (
            <div key={dept.department} className="px-6 py-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <p className="text-[14px] font-medium text-psu-text">{dept.department}</p>
                  <HealthBadge status={dept.status} />
                </div>
                <div className="flex items-center gap-4 text-[12px] text-psu-muted flex-shrink-0">
                  <span className="flex items-center gap-1">
                    <HiOutlineArrowUp className="h-3 w-3 text-green-500" />
                    {dept.positiveRate}% positive
                  </span>
                  <span className="flex items-center gap-1">
                    <HiOutlineArrowDown className="h-3 w-3 text-red-400" />
                    {dept.negativeRate}% negative
                  </span>
                  <span className="tabular-nums font-semibold text-psu-text">
                    {dept.averageRating} / 5
                  </span>
                </div>
              </div>
              {dept.insights.map((insight, i) => (
                <p key={i} className="text-[13px] text-psu-muted leading-relaxed">{insight}</p>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Faculty flags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Needs attention */}
        <div className="border border-psu-border bg-white rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-psu-border flex items-center gap-2">
            <HiOutlineExclamation className="h-4 w-4 text-amber-500" />
            <h2 className="text-[13px] font-semibold text-psu-text">Needs Attention</h2>
          </div>
          {analysis.facultyFlags.needsAttention.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-[13px] text-psu-muted">No faculty flagged for attention.</p>
            </div>
          ) : (
            <div className="divide-y divide-psu-border">
              {analysis.facultyFlags.needsAttention.map(f => (
                <div key={f.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[13px] font-medium text-psu-text">{f.name}</p>
                    <p className="text-[11px] text-psu-muted mt-0.5">{f.department}</p>
                    <p className="text-[11px] text-red-500 mt-1">{f.reason}</p>
                  </div>
                  <Link
                    to={`/reports/${f.id}`}
                    className="flex items-center gap-1 text-[12px] text-psu-muted hover:text-psu-primary transition-colors flex-shrink-0"
                  >
                    View <HiArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* High performers */}
        <div className="border border-psu-border bg-white rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-psu-border flex items-center gap-2">
            <HiOutlineCheckCircle className="h-4 w-4 text-green-500" />
            <h2 className="text-[13px] font-semibold text-psu-text">High Performers</h2>
          </div>
          {analysis.facultyFlags.highPerformers.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-[13px] text-psu-muted">No high performers identified yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-psu-border">
              {analysis.facultyFlags.highPerformers.map(f => (
                <div key={f.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[13px] font-medium text-psu-text">{f.name}</p>
                    <p className="text-[11px] text-psu-muted mt-0.5">{f.department}</p>
                    <p className="text-[11px] text-green-600 mt-1">
                      {f.averageRating}/5 avg · {f.positiveRate}% positive
                    </p>
                  </div>
                  <Link
                    to={`/reports/${f.id}`}
                    className="flex items-center gap-1 text-[12px] text-psu-muted hover:text-psu-primary transition-colors flex-shrink-0"
                  >
                    View <HiArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Reports;
