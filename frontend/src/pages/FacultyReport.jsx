import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  HiArrowLeft,
  HiOutlineChat,
  HiOutlineChartBar,
  HiOutlineLightBulb,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
  HiEmojiHappy,
  HiEmojiSad,
  HiMinusCircle,
  HiOutlineLockClosed,
  HiOutlinePrinter,
  HiOutlineDocumentText,
  HiOutlineTable,
} from 'react-icons/hi';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ShadingType, PageBreak
} from 'docx';
import { saveAs } from 'file-saver';
import evaluationService from '../services/evaluationService';
import facultyService from '../services/facultyService';
import { getVerbalRating } from '../config/ratingScale';
import { getComparisonBadgeClass } from '../utils/comparisons';
import { exportFacultyExcel, exportSubjectSectionExcel, exportPrintPDF } from '../utils/exportUtils';

const heatBg = (sentiment, rate) => {
  const alpha = Math.max(0.08, Math.min(0.85, rate / 100));
  if (sentiment === 'positive') return `rgba(30, 64, 175, ${alpha})`;
  if (sentiment === 'neutral') return `rgba(234, 179, 8, ${alpha})`;
  return `rgba(239, 68, 68, ${alpha})`;
};

// ── Sentiment badge ───────────────────────────────────────────────
const SentimentBadge = ({ label }) => {
  const styles = {
    positive: 'bg-psu-primary/10 text-psu-primary',
    neutral:  'bg-gray-100 text-psu-muted',
    negative: 'bg-red-50 text-red-600',
  };
  const Icon = label === 'positive' ? HiEmojiHappy : label === 'negative' ? HiEmojiSad : HiMinusCircle;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${styles[label] || styles.neutral}`}>
      <Icon className="h-3.5 w-3.5 mr-1" />
      {label}
    </span>
  );
};

/**
 * FacultyReport supports two modes:
 * 1. Admin mode  — URL has :id param → fetches data for that faculty member
 * 2. Self mode   — No :id param (faculty viewing their own report via /reports)
 *                  → fetches from /api/evaluation/my-report
 */
const FacultyReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isSelfMode = !id;

  const [faculty,  setFaculty]  = useState(null);
  const [report,   setReport]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [locked,   setLocked]   = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('');

  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatingExcel, setGeneratingExcel] = useState(false);

  const handleExportExcel = () => {
    if (!report || !faculty) return;
    exportFacultyExcel({ faculty, report });
  };

  const handlePrintPDF = () => {
    if (!faculty) return;
    const cleanName = (faculty.name || 'Faculty').replace(/\s+/g, '-');
    exportPrintPDF(`PSU-Faculty-Evaluation-Report-${cleanName}`);
  };

  const handleGenerateSubjectReportExcel = async () => {
    if (!selectedAssignment) return;
    setGeneratingExcel(true);
    try {
      const { subject_id, section } = JSON.parse(selectedAssignment);
      const res = await evaluationService.getSubjectSectionReport(faculty.id, subject_id, section);
      const data = res.data;
      exportSubjectSectionExcel({
        faculty,
        subject: data.subject || {},
        section,
        data,
      });
    } catch (err) {
      console.error(err);
      alert('Failed to generate individual subject-section Excel report.');
    } finally {
      setGeneratingExcel(false);
    }
  };

  const handleGenerateSubjectReport = async () => {
    if (!selectedAssignment) return;
    setGenerating(true);
    try {
      const { subject_id, section } = JSON.parse(selectedAssignment);
      const res = await evaluationService.getSubjectSectionReport(faculty.id, subject_id, section);
      const data = res.data;

      const activePeriod = data.activePeriod;
      const enrolledCount = data.enrolledCount;
      const respondentCount = data.respondentCount;
      const ratings = data.ratings;
      const comments = data.comments;
      const subject = data.subject;

      const semesterStr = activePeriod
        ? `${activePeriod.semester} of SY ${activePeriod.academic_year}`
        : 'Active Semester';

      // ── Category prefix map (stored category → Roman-numeral display) ─
      const CATEGORY_PREFIX = {
        'A. Management of Teaching and Learning': 'IV.A.',
        'B. Content Knowledge, Pedagogy and Technology': 'IV.B.',
        'C. Commitment and Transparency': 'IV.C.',
      };

      // ── Word doc borders ──────────────────────────────────────────────
      const borderNone   = { style: BorderStyle.NONE,   size: 0,  color: 'auto'   };
      const borderThin   = { style: BorderStyle.SINGLE, size: 4,  color: '999999' };
      const borderMedium = { style: BorderStyle.SINGLE, size: 8,  color: '333333' };
      const borderThick  = { style: BorderStyle.SINGLE, size: 12, color: '000000' };

      const noBorders = { top: borderNone, bottom: borderNone, left: borderNone, right: borderNone };

      const thinAllBorders = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };

      const headerCellBorders = { top: borderMedium, bottom: borderMedium, left: borderThin, right: borderThin };

      const totalCellBorders = { top: borderMedium, bottom: borderThick, left: borderThin, right: borderThin };

      // ── Cell Helper ───────────────────────────────────────────────
      const createCell = (text, width, options = {}) => {
        const verticalAlign = options.verticalAlign || 'center';
        return new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: String(text),
                  font: 'Calibri',
                  size: options.size || 20,
                  bold: options.bold || false,
                  italic: options.italic || false,
                  color: options.color || '000000',
                }),
              ],
              alignment: options.align || AlignmentType.LEFT,
              spacing: { before: 60, after: 60 },
            }),
          ],
          width: { size: width, type: WidthType.PERCENTAGE },
          borders: options.borders || noBorders,
          columnSpan: options.columnSpan || undefined,
          verticalAlign: verticalAlign,
          shading: options.shading ? { type: ShadingType.CLEAR, fill: options.shading } : undefined,
        });
      };

      // ── Header builder ───────────────────────────────────────────
      const buildPSUHeader = () => [
        new Paragraph({
          children: [
            new TextRun({
              text: 'PANGASINAN STATE UNIVERSITY',
              bold: true,
              size: 28,
              font: 'Calibri',
              color: '000000',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 40 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'STUDENT EVALUATION ON TEACHING',
              bold: true,
              size: 24,
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
              text: semesterStr,
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

      // ── Metadata block builder ────────────────────────────────────
      const buildMetadataBlock = () => {
        const psuFacultyId = faculty.id || '';
        return new Table({
          rows: [
            new TableRow({
              children: [
                createCell('Faculty ID:', 18, { bold: true }),
                createCell(psuFacultyId, 32),
                createCell('Subject Code:', 18, { bold: true }),
                createCell(subject.code, 32),
              ],
            }),
            new TableRow({
              children: [
                createCell('Faculty Name:', 18, { bold: true }),
                createCell(faculty.name.toUpperCase(), 32, { bold: true }),
                createCell('Description:', 18, { bold: true }),
                createCell(subject.name, 32),
              ],
            }),
            new TableRow({
              children: [
                createCell('Section:', 18, { bold: true }),
                createCell(section.toUpperCase(), 32),
                createCell('No. of Respondents:', 18, { bold: true }),
                createCell(`${respondentCount} / ${enrolledCount} enrolled (${enrolledCount > 0 ? ((respondentCount / enrolledCount) * 100).toFixed(1) + '%' : 'n/a'})`, 32),
              ],
            }),
          ],
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: noBorders,
        });
      };

      // ── Group ratings by category ─────────────────────────────────
      const categoryGroups = [];
      let currentGroup = null;
      ratings.forEach((row) => {
        if (!currentGroup || currentGroup.category !== row.category) {
          currentGroup = { category: row.category, description: row.category_description, questions: [] };
          categoryGroups.push(currentGroup);
        }
        currentGroup.questions.push(row);
      });

      // ── Build document children ───────────────────────────────────
      const children = [];

      // Header + Metadata
      children.push(...buildPSUHeader());
      children.push(buildMetadataBlock());
      children.push(new Paragraph({ spacing: { before: 300, after: 100 } }));

      // ── Single Unified Questionnaire Table ────────────────────────
      const tableRows = [];

      // Table header row (5 columns)
      tableRows.push(
        new TableRow({
          children: [
            createCell('No.', 6, { bold: true, align: AlignmentType.CENTER, borders: headerCellBorders, shading: 'E8E8E8' }),
            createCell('Question', 52, { bold: true, borders: headerCellBorders, shading: 'E8E8E8' }),
            createCell('No. of Evaluators', 14, { bold: true, align: AlignmentType.CENTER, borders: headerCellBorders, shading: 'E8E8E8' }),
            createCell('Sum of Ratings', 14, { bold: true, align: AlignmentType.CENTER, borders: headerCellBorders, shading: 'E8E8E8' }),
            createCell('Average', 14, { bold: true, align: AlignmentType.CENTER, borders: headerCellBorders, shading: 'E8E8E8' }),
          ],
        })
      );

      let totalAvgSum = 0;
      let totalQuestions = 0;

      categoryGroups.forEach((group, groupIdx) => {
        const prefix = CATEGORY_PREFIX[group.category] || `IV.${String.fromCharCode(65 + groupIdx)}.`;
        const categoryLabel = group.category.replace(/^[A-Z]\.\s*/, '');
        const headingText = `${prefix} ${categoryLabel.toUpperCase()}`;

        // Subtle section header divider row inside the single unified table
        tableRows.push(
          new TableRow({
            children: [
              createCell(headingText, 100, {
                bold: true,
                size: 20,
                columnSpan: 5,
                borders: headerCellBorders,
                shading: 'EAEAEA',
              }),
            ],
          })
        );

        // Question rows
        group.questions.forEach((row) => {
          const evaluators = row.response_count;
          const sumOfRatings = row.total_score;
          const avg = evaluators > 0 ? (sumOfRatings / evaluators).toFixed(2) : '0.00';

          totalAvgSum += evaluators > 0 ? (sumOfRatings / evaluators) : 0;
          totalQuestions += 1;

          const qNum = row.sort_order || totalQuestions;
          const isOddRow = totalQuestions % 2 === 1;
          const rowBorders = thinAllBorders;
          const rowShading = isOddRow ? 'F9FAFB' : undefined;

          tableRows.push(
            new TableRow({
              children: [
                createCell(qNum, 6, { align: AlignmentType.CENTER, borders: rowBorders, shading: rowShading }),
                createCell(row.question, 52, { borders: rowBorders, shading: rowShading }),
                createCell(evaluators, 14, { align: AlignmentType.CENTER, borders: rowBorders, shading: rowShading }),
                createCell(sumOfRatings, 14, { align: AlignmentType.CENTER, borders: rowBorders, shading: rowShading }),
                createCell(avg, 14, { align: AlignmentType.CENTER, borders: rowBorders, shading: rowShading }),
              ],
            })
          );
        });
      });

      // Overall Total Average row at the very bottom (only the average is displayed)
      const overallAvg = totalQuestions > 0
        ? (totalAvgSum / totalQuestions).toFixed(2)
        : '0.00';

      tableRows.push(
        new TableRow({
          children: [
            createCell('OVERALL TOTAL AVERAGE', 86, {
              bold: true,
              size: 22,
              columnSpan: 4,
              align: AlignmentType.LEFT,
              borders: totalCellBorders,
              shading: 'E8E8E8',
            }),
            createCell(overallAvg, 14, {
              bold: true,
              size: 22,
              align: AlignmentType.CENTER,
              borders: totalCellBorders,
              shading: 'E8E8E8',
            }),
          ],
        })
      );

      // Verbal rating row
      const verbalLabel = getVerbalRating(overallAvg);
      tableRows.push(
        new TableRow({
          children: [
            createCell('DESCRIPTIVE RATING', 86, {
              bold: true,
              size: 22,
              columnSpan: 4,
              align: AlignmentType.LEFT,
              borders: totalCellBorders,
              shading: 'DBEAFE',
            }),
            createCell(verbalLabel, 14, {
              bold: true,
              size: 22,
              align: AlignmentType.CENTER,
              borders: totalCellBorders,
              shading: 'DBEAFE',
            }),
          ],
        })
      );

      // Add the single unified table
      children.push(
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        })
      );

      // ── Page Break for Comments ───────────────────────────────────
      children.push(new Paragraph({ children: [new PageBreak()] }));

      // Page 2 Headers & Metadata
      children.push(...buildPSUHeader());
      children.push(buildMetadataBlock());

      // Spacing
      children.push(new Paragraph({ spacing: { before: 200, after: 100 } }));

      // Comments Section title
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'COMMENTS / SUGGESTIONS',
              bold: true,
              size: 24,
              font: 'Calibri',
              color: '000000',
            }),
          ],
          spacing: { before: 100, after: 200 },
        })
      );

      // Strengths Heading
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'STRENGTHS:',
              bold: true,
              size: 20,
              font: 'Calibri',
              color: '000000',
            }),
          ],
          spacing: { before: 100, after: 100 },
        })
      );

      const strengthComments = comments.filter(c => c.strengths && c.strengths.trim());
      if (data.thresholdReached === false) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `• Qualitative comments are withheld to protect student anonymity (threshold of ${data.minThreshold || 5} respondents not yet reached; ${respondentCount} submitted).`,
                italic: true,
                size: 20,
                font: 'Calibri',
                color: '6B7280',
              }),
            ],
            spacing: { after: 100 },
          })
        );
      } else if (strengthComments.length === 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '• No comments submitted for strengths.',
                italic: true,
                size: 20,
                font: 'Calibri',
                color: '6B7280',
              }),
            ],
            spacing: { after: 100 },
          })
        );
      } else {
        strengthComments.forEach((c, idx) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${idx + 1}. ${c.strengths.trim()}`,
                  size: 20,
                  font: 'Calibri',
                }),
              ],
              spacing: { after: 80 },
            })
          );
        });
      }

      // Spacing between strengths & weaknesses
      children.push(new Paragraph({ spacing: { before: 150, after: 150 } }));

      // Weaknesses Heading
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'WEAKNESSES:',
              bold: true,
              size: 20,
              font: 'Calibri',
              color: '000000',
            }),
          ],
          spacing: { before: 100, after: 100 },
        })
      );

      const weaknessComments = comments.filter(c => c.weaknesses && c.weaknesses.trim());
      if (data.thresholdReached === false) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `• Qualitative comments are withheld to protect student anonymity (threshold of ${data.minThreshold || 5} respondents not yet reached; ${respondentCount} submitted).`,
                italic: true,
                size: 20,
                font: 'Calibri',
                color: '6B7280',
              }),
            ],
            spacing: { after: 100 },
          })
        );
      } else if (weaknessComments.length === 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '• No comments submitted for weaknesses.',
                italic: true,
                size: 20,
                font: 'Calibri',
                color: '6B7280',
              }),
            ],
            spacing: { after: 100 },
          })
        );
      } else {
        weaknessComments.forEach((c, idx) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${idx + 1}. ${c.weaknesses.trim()}`,
                  size: 20,
                  font: 'Calibri',
                }),
              ],
              spacing: { after: 80 },
            })
          );
        });
      }

      // ── Generate & Download ───────────────────────────────────────
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: { top: 720, right: 720, bottom: 720, left: 720 },
            },
          },
          children,
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(
        blob,
        `SET-Report-${faculty.name.replace(/\s+/g, '_')}-${subject.code}-${section}.docx`
      );
    } catch (err) {
      console.error(err);
      alert('Failed to generate individual subject-section report.');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const params = {};
        if (selectedPeriod) {
          params.period = selectedPeriod;
        }

        if (isSelfMode) {
          // Faculty viewing their own report
          const res = await evaluationService.getMyFacultyReport(params);
          setFaculty(res.data.faculty);
          setReport(res.data);
        } else {
          // Admin viewing a specific faculty member's report
          const [facultyRes, reportRes] = await Promise.all([
            facultyService.getById(id),
            evaluationService.getFacultyEvaluations(id, params),
          ]);
          setFaculty(facultyRes.data.faculty);
          setReport(reportRes.data);
        }
      } catch (err) {
        if (err.response?.status === 403 && isSelfMode) {
          setLocked(true);
        } else {
          setError('Failed to load evaluation report.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id, isSelfMode, selectedPeriod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-psu-border border-t-psu-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (locked) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <HiOutlineLockClosed className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-psu-text mb-2">Report Not Available Yet</h2>
        <p className="text-[13px] text-psu-muted mb-6">
          Your evaluation report will be available once the admin closes the evaluation period. Please check back later.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-[13px] font-medium text-psu-primary hover:underline"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-[13px] text-red-500">{error}</p>
        {!isSelfMode && (
          <Link to="/reports" className="text-psu-primary text-[13px] mt-3 inline-block hover:underline">
            Back to reports
          </Link>
        )}
      </div>
    );
  }

  if (!report || report.totalEvaluations === 0) {
    return (
      <div>
        {!isSelfMode && (
          <Link
            to="/reports"
            className="inline-flex items-center gap-1.5 text-[13px] text-psu-muted hover:text-psu-text transition-colors mb-8"
          >
            <HiArrowLeft className="h-4 w-4" />
            Back to Reports
          </Link>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-psu-primary/10 border border-psu-border flex items-center justify-center flex-shrink-0">
              <span className="text-[16px] font-semibold text-psu-primary">
                {faculty?.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
              </span>
            </div>
            <div>
              <p className="text-[12px] font-medium text-psu-muted uppercase tracking-wider mb-0.5">
                {isSelfMode ? 'My Evaluation Report' : 'Faculty Report'}
              </p>
              <h1 className="text-2xl font-semibold text-psu-text tracking-tight">{faculty?.name}</h1>
              <p className="text-[13px] text-psu-muted mt-0.5">{faculty?.department}</p>
            </div>
          </div>
        </div>
        <div className="border border-psu-border bg-white rounded-lg px-6 py-16 text-center">
          <p className="text-[14px] font-semibold text-psu-text">No evaluations yet</p>
          <p className="text-[13px] text-psu-muted mt-1">
            {isSelfMode
              ? 'Your evaluation report will appear here once students start submitting evaluations.'
              : 'Reports will appear here once students start submitting evaluations.'}
          </p>
        </div>
      </div>
    );
  }

  const total = report.sentimentOverview.positive + report.sentimentOverview.neutral + report.sentimentOverview.negative;
  const pct   = v => total === 0 ? 0 : Math.round((v / total) * 100);
  const subjectAssignments = report?.subjectAssignments || [];

  return (
    <div>
      {/* Official Print Header for PDF Generation */}
      <div className="print-only mb-6 border-b-2 border-gray-900 pb-4 text-center">
        <h2 className="text-base font-bold uppercase tracking-wider text-gray-900">Pangasinan State University</h2>
        <p className="text-xs uppercase text-gray-700 font-medium">Asingan Campus · Asingan, Pangasinan</p>
        <h1 className="text-lg font-bold text-gray-900 mt-2 uppercase">Individual Faculty Performance Evaluation Report</h1>
        <p className="text-xs text-gray-700 mt-1 font-semibold">
          Instructor: {faculty?.name} ({faculty?.department})
        </p>
        <p className="text-[10px] text-gray-500 mt-1">Generated on {new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })} · Official Faculty Evaluation Report</p>
      </div>

      {/* Back — admin only */}
      {!isSelfMode && (
        <Link
          to="/reports"
          className="inline-flex items-center gap-1.5 text-[13px] text-psu-muted hover:text-psu-text transition-colors mb-8 no-print"
        >
          <HiArrowLeft className="h-4 w-4" />
          Back to Reports
        </Link>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-psu-primary/10 border border-psu-border flex items-center justify-center flex-shrink-0">
            <span className="text-[16px] font-semibold text-psu-primary">
              {faculty?.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
            </span>
          </div>
          <div>
            <p className="text-[12px] font-medium text-psu-muted uppercase tracking-wider mb-0.5">
              {isSelfMode ? 'My Evaluation Report' : 'Faculty Report'}
            </p>
            <h1 className="text-2xl font-semibold text-psu-text tracking-tight">{faculty?.name}</h1>
            <p className="text-[13px] text-psu-muted mt-0.5">{faculty?.department}</p>
            {report.academicPeriod && (
              <p className="text-[12px] font-medium text-psu-primary mt-1.5 inline-flex items-center gap-1.5 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {report.academicPeriod.academic_year} · {report.academicPeriod.semester} Semester
                {report.academicPeriod.is_active ? ' (Active)' : ''}
              </p>
            )}
            {report.availablePeriods && report.availablePeriods.length > 0 && (
              <div className="mt-2.5 flex items-center gap-2 no-print">
                <label htmlFor="period-selector" className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Semester:
                </label>
                <select
                  id="period-selector"
                  value={selectedPeriod}
                  onChange={e => setSelectedPeriod(e.target.value)}
                  className="text-[12px] border border-slate-300 rounded-md px-2.5 py-1 bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-psu-primary shadow-sm"
                >
                  <option value="">Current Active Semester</option>
                  <option value="all">All Semesters (Historical Combined)</option>
                  {report.availablePeriods.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:items-end gap-3">
          <div className="text-left sm:text-right">
            <p className="text-[12px] font-medium text-psu-muted uppercase tracking-wider">Response Rate</p>
            <div className="flex items-baseline justify-start sm:justify-end gap-2">
              <span className="text-3xl font-bold text-psu-text tabular-nums">
                {report.responseRateFormatted || (report.enrolledStudents > 0 ? `${report.responseRate}%` : 'n/a')}
              </span>
              <span className="text-[12px] text-psu-muted">
                ({report.totalEvaluations}/{report.enrolledStudents !== undefined && report.enrolledStudents !== null ? report.enrolledStudents : 'n/a'})
              </span>
            </div>
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap no-print">
            <button
              onClick={handleExportExcel}
              title="Download Faculty Evaluation Report as Excel (.xlsx)"
              className="inline-flex items-center gap-1.5 bg-emerald-700 text-white rounded-lg px-3.5 py-1.5 text-[12px] font-semibold hover:bg-emerald-800 transition-colors shadow-sm"
            >
              <HiOutlineTable className="h-4 w-4" />
              Export Excel
            </button>
            <button
              onClick={handlePrintPDF}
              title="Print or Save as PDF"
              className="inline-flex items-center gap-1.5 bg-white text-psu-text border border-psu-border rounded-lg px-3.5 py-1.5 text-[12px] font-semibold hover:bg-gray-50 transition-colors shadow-sm"
            >
              <HiOutlinePrinter className="h-4 w-4 text-psu-muted" />
              Print / PDF
            </button>
          </div>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="border border-psu-border bg-white rounded-lg p-5">
          <p className="text-[11px] font-medium text-psu-muted uppercase tracking-wider mb-2">Average Rating</p>
          <p className="text-4xl font-bold text-psu-text tabular-nums mb-2">{report.averageRating}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-psu-primary/10 text-psu-primary text-[13px] font-semibold">
              {report.averageRating} / 5
            </span>
            {report.verbalRating && report.verbalRating !== 'N/A' && (
              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[13px] font-semibold">
                {report.verbalRating}
              </span>
            )}
          </div>
        </div>

        <div className="border border-psu-border bg-white rounded-lg p-5">
          <p className="text-[11px] font-medium text-psu-muted uppercase tracking-wider mb-2">Evaluations Received</p>
          <p className="text-4xl font-bold text-psu-text tabular-nums mb-2">{report.totalEvaluations}</p>
          <p className="text-[13px] text-psu-muted">
            {report.enrolledStudents !== undefined && report.enrolledStudents !== null
              ? `out of ${report.enrolledStudents} enrolled students`
              : 'total submissions'}
          </p>
        </div>

        <div className="border border-psu-border bg-white rounded-lg p-5">
          <p className="text-[11px] font-medium text-psu-muted uppercase tracking-wider mb-2">Response Rate</p>
          <p className="text-4xl font-bold text-psu-text tabular-nums mb-2">
            {report.responseRateFormatted || (report.enrolledStudents > 0 ? `${report.responseRate}%` : 'n/a')}
          </p>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${
              report.enrolledStudents > 0
                ? report.responseRate >= 80
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : report.responseRate >= 50
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-gray-100 text-psu-muted border border-psu-border'
            }`}>
              {report.enrolledStudents > 0 ? `${report.totalEvaluations} of ${report.enrolledStudents} students` : 'Zero enrolled students'}
            </span>
          </div>
        </div>
      </div>

      {/* Anonymity Threshold Notice */}
      {report.thresholdReached === false && (
        <div className="mb-8 rounded-xl border border-blue-200 bg-blue-50/80 p-5 flex items-start gap-3.5">
          <HiOutlineLockClosed className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-[14px] font-semibold text-blue-900">
              Student Anonymity Safeguard Active
            </h3>
            <p className="text-[13px] text-blue-800 mt-1 leading-relaxed">
              To protect student respondent anonymity, individual written comments, sentiment distribution, and recommendations are only visible once at least <strong>{report.minThreshold || 5} evaluations</strong> have been submitted.
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <span className="text-[12px] font-semibold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full">
                {report.totalEvaluations} of {report.minThreshold || 5} responses collected
              </span>
              <span className="text-[12px] text-blue-600">
                ({Math.round((report.totalEvaluations / (report.minThreshold || 5)) * 100)}%)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Comparative Benchmarks (FR-15, FR-19) */}
      {report.comparisons && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Department Benchmark Card */}
          <div className="border border-psu-border bg-white rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-medium text-psu-muted uppercase tracking-wider">
                Department Benchmark ({report.comparisons.departmentComparison?.department || faculty?.department})
              </p>
              {report.comparisons.departmentComparison?.qualifyingFacultyCount > 0 && (
                <span className="text-[11px] text-psu-muted">
                  {report.comparisons.departmentComparison.qualifyingFacultyCount} qualifying faculty
                </span>
              )}
            </div>
            {report.comparisons.departmentComparison?.departmentAverage !== null && report.comparisons.departmentComparison?.departmentAverage !== undefined ? (
              <div>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-3xl font-bold text-psu-text tabular-nums">
                    {report.comparisons.departmentComparison.departmentAverageFormatted}
                  </span>
                  <span className="text-[13px] text-psu-muted">/ 5 Dept Average</span>
                  {report.comparisons.departmentComparison.departmentVerbalRating && report.comparisons.departmentComparison.departmentVerbalRating !== 'N/A' && (
                    <span className="text-[12px] font-medium text-psu-muted">
                      ({report.comparisons.departmentComparison.departmentVerbalRating})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${getComparisonBadgeClass(report.comparisons.departmentComparison.differenceDirection)}`}>
                    {report.comparisons.departmentComparison.message}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-2">
                <p className="text-[13px] text-psu-muted italic">
                  Department benchmark unavailable (minimum response threshold of {report.minThreshold || 5} evaluations not yet reached in department).
                </p>
              </div>
            )}
          </div>

          {/* Previous Period Comparison Card */}
          <div className="border border-psu-border bg-white rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-medium text-psu-muted uppercase tracking-wider">
                Previous Academic Period
              </p>
              {report.comparisons.previousPeriodComparison?.previousPeriod && (
                <span className="text-[11px] text-psu-muted">
                  {report.comparisons.previousPeriodComparison.previousPeriod.name}
                </span>
              )}
            </div>
            {report.comparisons.previousPeriodComparison?.hasEarlierData ? (
              <div>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-3xl font-bold text-psu-text tabular-nums">
                    {report.comparisons.previousPeriodComparison.previousPeriod.averageRating}
                  </span>
                  <span className="text-[13px] text-psu-muted">/ 5 Previous Rating</span>
                  {report.comparisons.previousPeriodComparison.previousPeriod.verbalRating && report.comparisons.previousPeriodComparison.previousPeriod.verbalRating !== 'N/A' && (
                    <span className="text-[12px] font-medium text-psu-muted">
                      ({report.comparisons.previousPeriodComparison.previousPeriod.verbalRating})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${getComparisonBadgeClass(report.comparisons.previousPeriodComparison.ratingChangeDirection)}`}>
                    {report.comparisons.previousPeriodComparison.message}
                  </span>
                  <span className="text-[12px] text-psu-muted">
                    ({report.comparisons.previousPeriodComparison.previousPeriod.totalEvaluations} evaluations in previous period)
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-gray-100 text-psu-muted border border-psu-border">
                  no earlier data
                </span>
                <p className="text-[12px] text-psu-muted mt-2">
                  No evaluations found for this instructor in an earlier academic period.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Period History Breakdown (FR-19) */}
      {report.comparisons?.periodHistory?.length > 1 && (
        <div className="border border-psu-border bg-white rounded-lg p-5 mb-8">
          <h2 className="text-[13px] font-semibold text-psu-text mb-1">Academic Period History</h2>
          <p className="text-[12px] text-psu-muted mb-4">Performance and evaluation trends across academic periods.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-psu-border">
                  <th className="py-2.5 text-[11px] font-semibold text-psu-muted uppercase tracking-wider">Academic Period</th>
                  <th className="py-2.5 text-[11px] font-semibold text-psu-muted uppercase tracking-wider">Evaluations</th>
                  <th className="py-2.5 text-[11px] font-semibold text-psu-muted uppercase tracking-wider">Average Rating</th>
                  <th className="py-2.5 text-[11px] font-semibold text-psu-muted uppercase tracking-wider">Verbal Rating</th>
                  <th className="py-2.5 text-[11px] font-semibold text-psu-muted uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-psu-border">
                {report.comparisons.periodHistory.map(ph => (
                  <tr key={ph.academic_period_id || ph.name} className="hover:bg-gray-50/50">
                    <td className="py-3 text-[13px] font-medium text-psu-text">
                      {ph.name}
                      {ph.isActive && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800">
                          ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-[13px] text-psu-text tabular-nums">{ph.totalEvaluations}</td>
                    <td className="py-3 text-[13px] font-semibold text-psu-text tabular-nums">{ph.averageRating} / 5</td>
                    <td className="py-3 text-[12px] font-medium text-psu-muted">{ph.verbalRating}</td>
                    <td className="py-3 text-[12px]">
                      {ph.thresholdReached ? (
                        <span className="text-green-700 font-medium">Published</span>
                      ) : (
                        <span className="text-amber-700 font-medium">Threshold pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Export Subject Report Summary card */}
      {subjectAssignments.length > 0 && (
        <div className="border border-psu-border bg-white rounded-lg p-5 mb-8 no-print">
          <h2 className="text-[13px] font-semibold text-psu-text mb-1">Export Subject Report Summary</h2>
          <p className="text-[12px] text-psu-muted mb-4">
            Generate a customized, professional evaluation report (DOCX or Excel) for a specific subject and section.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="w-full sm:w-80">
              <label className="block text-[11px] font-medium text-psu-muted uppercase tracking-wider mb-2">
                Select Subject & Section
              </label>
              <select
                value={selectedAssignment}
                onChange={(e) => setSelectedAssignment(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[13px] text-psu-text bg-white focus:outline-none focus:ring-2 focus:ring-psu-primary/20 focus:border-psu-primary"
              >
                <option value="">-- Choose Subject & Section --</option>
                {subjectAssignments.map((sa, idx) => (
                  <option key={idx} value={JSON.stringify({ subject_id: sa.subject_id, section: sa.section })}>
                    {sa.subject_code} - {sa.subject_name} ({sa.section})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                disabled={!selectedAssignment || generating}
                onClick={handleGenerateSubjectReport}
                className="bg-psu-primary text-white rounded-lg px-4 py-2.5 text-[13px] font-semibold hover:bg-psu-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <HiOutlineDocumentText className="h-4 w-4" />
                    Download DOCX
                  </>
                )}
              </button>
              <button
                disabled={!selectedAssignment || generatingExcel}
                onClick={handleGenerateSubjectReportExcel}
                className="bg-emerald-700 text-white rounded-lg px-4 py-2.5 text-[13px] font-semibold hover:bg-emerald-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {generatingExcel ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <HiOutlineTable className="h-4 w-4" />
                    Download Excel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category averages */}
      <div className="border border-psu-border bg-white rounded-lg overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-psu-border flex items-center gap-2">
          <HiOutlineChartBar className="h-4 w-4 text-psu-muted" />
          <h2 className="text-[13px] font-semibold text-psu-text">Category Averages</h2>
        </div>
        <div className="divide-y divide-psu-border">
          {Object.entries(report.categoryAverages).map(([category, avg]) => (
            <div key={category} className="px-6 py-4 flex items-center justify-between gap-4">
              <p className="text-[13px] font-medium text-psu-text">{category}</p>
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="w-32 h-1.5 bg-gray-100 rounded-full hidden sm:block">
                  <div
                    className="bg-psu-primary h-full rounded-full transition-all duration-700"
                    style={{ width: `${(avg / 5) * 100}%` }}
                  />
                </div>
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-psu-primary/10 text-psu-primary text-[13px] font-bold tabular-nums">
                  {avg}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sentiment heat map */}
      <div className="border border-psu-border bg-white rounded-lg overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-psu-border">
          <h2 className="text-[13px] font-semibold text-psu-text">Sentiment Heat Map</h2>
          <p className="text-[12px] text-psu-muted mt-1">
            Darker cells indicate higher share of that sentiment in this faculty report.
          </p>
        </div>
        <div className="p-6">
          {report.thresholdReached === false ? (
            <div className="py-8 text-center bg-slate-50/70 rounded-lg border border-dashed border-psu-border">
              <HiOutlineLockClosed className="h-7 w-7 text-slate-400 mx-auto mb-2" />
              <p className="text-[13px] font-medium text-psu-text">Sentiment Distribution Protected</p>
              <p className="text-[12px] text-psu-muted mt-1 max-w-sm mx-auto">
                Sentiment breakdown requires at least {report.minThreshold || 5} submitted evaluations to preserve student anonymity ({report.totalEvaluations} collected).
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { key: 'positive', label: 'Positive', count: report.sentimentOverview.positive, icon: HiEmojiHappy },
                { key: 'neutral', label: 'Neutral', count: report.sentimentOverview.neutral, icon: HiMinusCircle },
                { key: 'negative', label: 'Negative', count: report.sentimentOverview.negative, icon: HiEmojiSad },
              ].map((item) => {
                const rate = pct(item.count);
                return (
                  <div
                    key={item.key}
                    className="rounded-lg px-4 py-4 text-white"
                    style={{ backgroundColor: heatBg(item.key, rate) }}
                    title={`${item.count} / ${total} (${rate}%)`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wider opacity-95 inline-flex items-center gap-1">
                      <item.icon className="h-3.5 w-3.5" />
                      {item.label}
                    </p>
                    <p className="text-2xl font-bold tabular-nums mt-1">{rate}%</p>
                    <p className="text-[11px] opacity-95 mt-1">{item.count} of {total}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Prescriptive recommendations */}
      <div className="border border-psu-border bg-white rounded-lg overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-psu-border flex items-center gap-2">
          <HiOutlineLightBulb className="h-4 w-4 text-psu-muted" />
          <h2 className="text-[13px] font-semibold text-psu-text">Prescriptive Recommendations</h2>
        </div>
        {report.thresholdReached === false ? (
          <div className="p-8 text-center bg-slate-50/70 border-dashed">
            <HiOutlineLockClosed className="h-7 w-7 text-slate-400 mx-auto mb-2" />
            <p className="text-[13px] font-medium text-psu-text">Recommendations Protected</p>
            <p className="text-[12px] text-psu-muted mt-1 max-w-sm mx-auto">
              Actionable recommendations unlock once at least {report.minThreshold || 5} evaluations are submitted ({report.totalEvaluations} collected).
            </p>
          </div>
        ) : report.recommendations.length === 0 ? (
          <div className="px-6 py-8 text-center text-psu-muted text-[13px]">
            No prescriptive recommendations generated.
          </div>
        ) : (
          <div className="divide-y divide-psu-border">
            {report.recommendations.map((rec, i) => {
              const text = typeof rec === 'object' && rec !== null ? (rec.text || '') : String(rec);
              const severity = typeof rec === 'object' && rec !== null ? (rec.severity || 'medium') : 'medium';
              const isPositive = severity === 'positive' ||
                                 text.toLowerCase().includes('excellent') ||
                                 text.toLowerCase().includes('strong') ||
                                 text.toLowerCase().includes('appreciate') ||
                                 text.toLowerCase().includes('maintain') ||
                                 text.toLowerCase().includes('nominating') ||
                                 text.toLowerCase().includes('recognition');

              const severityBadge = {
                high: 'bg-red-50 text-red-700 border-red-200',
                medium: 'bg-amber-50 text-amber-700 border-amber-200',
                low: 'bg-blue-50 text-blue-700 border-blue-200',
                positive: 'bg-green-50 text-green-700 border-green-200',
              }[severity] || 'bg-gray-100 text-psu-muted border-psu-border';

              const severityLabel = {
                high: 'High Priority',
                medium: 'Medium Priority',
                low: 'Low Priority',
                positive: 'Commendation',
              }[severity] || severity;

              return (
                <div key={i} className="px-6 py-4 flex items-start gap-3">
                  {severity === 'high' ? (
                    <HiOutlineExclamation className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  ) : isPositive ? (
                    <HiOutlineCheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <HiOutlineExclamation className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${severityBadge}`}>
                        {severityLabel}
                      </span>
                    </div>
                    <p className="text-[14px] text-psu-text leading-relaxed">{text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent feedback */}
      <div className="border border-psu-border bg-white rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-psu-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <HiOutlineChat className="h-4 w-4 text-psu-muted" />
            <h2 className="text-[13px] font-semibold text-psu-text">Student Feedback Comments</h2>
          </div>
          {report.totalEvaluations > 0 && (
            <span className="text-[12px] text-psu-muted">
              {report.writtenFeedbackCount !== undefined ? report.writtenFeedbackCount : report.recentFeedback?.length || 0} of {report.totalEvaluations} respondents provided written feedback
            </span>
          )}
        </div>
        {report.thresholdReached === false ? (
          <div className="p-8 text-center bg-slate-50/70">
            <HiOutlineLockClosed className="h-7 w-7 text-slate-400 mx-auto mb-2" />
            <p className="text-[13px] font-medium text-psu-text">Student Feedback Protected</p>
            <p className="text-[12px] text-psu-muted mt-1 max-w-sm mx-auto">
              Written comments and feedback are withheld until at least {report.minThreshold || 5} evaluations are reached ({report.totalEvaluations} collected).
            </p>
          </div>
        ) : report.recentFeedback.length === 0 ? (
          <div className="px-6 py-8 text-center text-psu-muted text-[13px]">
            No qualitative feedback comments submitted.
          </div>
        ) : (
          <div className="divide-y divide-psu-border">
            {report.recentFeedback.map(item => (
              <div key={item.id} className="px-6 py-5">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-psu-primary/10 text-psu-primary text-[13px] font-bold tabular-nums flex-shrink-0">
                    {item.rating}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <SentimentBadge label={item.sentiment} />
                    <span className="text-[11px] text-psu-muted tabular-nums">
                      {new Date(item.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-[11px] font-semibold text-psu-muted uppercase tracking-wider mb-1">Strengths</p>
                    <p className="text-[14px] text-psu-text leading-relaxed">
                      {item.strengths?.trim() ? item.strengths : 'No strengths provided.'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-psu-muted uppercase tracking-wider mb-1">Weaknesses</p>
                    <p className="text-[14px] text-psu-text leading-relaxed">
                      {item.weaknesses?.trim() ? item.weaknesses : 'No weaknesses provided.'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyReport;