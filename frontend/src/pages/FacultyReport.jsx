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
} from 'react-icons/hi';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ShadingType, PageBreak
} from 'docx';
import { saveAs } from 'file-saver';
import evaluationService from '../services/evaluationService';
import facultyService from '../services/facultyService';

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

  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [generating, setGenerating] = useState(false);

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

      // ── Word doc borders ──────────────────────────────────────────────
      const borderNone = { style: BorderStyle.NONE, size: 0, color: 'auto' };
      const borderSingle = { style: BorderStyle.SINGLE, size: 4, color: 'D1D5DB' }; // 0.5 pt
      const borderDouble = { style: BorderStyle.DOUBLE, size: 12, color: '111827' }; // double line

      const noBorders = {
        top: borderNone,
        bottom: borderNone,
        left: borderNone,
        right: borderNone,
      };

      const cellHeaderBorders = {
        top: borderSingle,
        bottom: borderSingle,
        left: borderNone,
        right: borderNone,
      };

      const cellTotalBorders = {
        top: borderSingle,
        bottom: borderDouble,
        left: borderNone,
        right: borderNone,
      };

      // ── Cell Helper ───────────────────────────────────────────────
      const createCell = (text, width, options = {}) => {
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
              spacing: { before: 80, after: 80 },
            }),
          ],
          width: { size: width, type: WidthType.PERCENTAGE },
          borders: options.borders || noBorders,
          columnSpan: options.columnSpan || undefined,
          shading: options.shading ? { type: ShadingType.CLEAR, fill: options.shading } : undefined,
        });
      };

      // ── Header builder ───────────────────────────────────────────
      const buildPSUHeader = () => [
        new Paragraph({
          children: [
            new TextRun({
              text: 'Pangasinan State University',
              bold: true,
              size: 28,
              font: 'Calibri',
              color: '1E40B0', // PSU blue
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
              size: 22,
              font: 'Calibri',
              color: '111827',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: semesterStr,
              italic: true,
              size: 20,
              font: 'Calibri',
              color: '4B5563',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
      ];

      // ── Metadata Table builder ────────────────────────────────────
      const buildMetadataTable = () => {
        const psuFacultyId = `(ASIN-${String(faculty.id).padStart(6, '0')})`;
        return new Table({
          rows: [
            new TableRow({
              children: [
                createCell('Faculty:', 15, { bold: true }),
                createCell(`${psuFacultyId} - ${faculty.name.toUpperCase()}`, 50, { bold: true }),
                createCell('Section:', 20, { bold: true }),
                createCell(section.toUpperCase(), 15),
              ],
            }),
            new TableRow({
              children: [
                createCell('Subject:', 15, { bold: true }),
                createCell(`${subject.code} - ${subject.name}`, 50),
                createCell('Respondents / Enrolled:', 20, { bold: true }),
                createCell(`${respondentCount} / ${enrolledCount}`, 15),
              ],
            }),
          ],
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: noBorders,
        });
      };

      // ── Children container for the document ───────────────────────
      const children = [];

      // Add Page 1 Headers & Metadata
      children.push(...buildPSUHeader());
      children.push(buildMetadataTable());

      // Spacing before table
      children.push(new Paragraph({ spacing: { before: 200, after: 100 } }));

      // ── Ratings Table ─────────────────────────────────────────────
      const tableHeaderRow = new TableRow({
        children: [
          createCell('No.', 5, { bold: true, align: AlignmentType.CENTER, borders: cellHeaderBorders }),
          createCell('Question', 45, { bold: true, borders: cellHeaderBorders }),
          createCell('5', 6, { bold: true, align: AlignmentType.CENTER, borders: cellHeaderBorders }),
          createCell('4', 6, { bold: true, align: AlignmentType.CENTER, borders: cellHeaderBorders }),
          createCell('3', 6, { bold: true, align: AlignmentType.CENTER, borders: cellHeaderBorders }),
          createCell('2', 6, { bold: true, align: AlignmentType.CENTER, borders: cellHeaderBorders }),
          createCell('1', 6, { bold: true, align: AlignmentType.CENTER, borders: cellHeaderBorders }),
          createCell('Total Score', 10, { bold: true, align: AlignmentType.CENTER, borders: cellHeaderBorders }),
          createCell('Average', 10, { bold: true, align: AlignmentType.CENTER, borders: cellHeaderBorders }),
        ],
      });

      const tableRows = [tableHeaderRow];

      // Group questions by category
      let currentCategory = '';
      let questionIndex = 1;

      ratings.forEach((row) => {
        if (row.category !== currentCategory) {
          currentCategory = row.category;
          // Add category heading row spanning all 9 columns
          const formattedCat = currentCategory.toUpperCase();
          let catHeading = formattedCat;
          if (formattedCat.startsWith('A.')) catHeading = `I. A. ${formattedCat.substring(2).trim()}`;
          else if (formattedCat.startsWith('B.')) catHeading = `I. B. ${formattedCat.substring(2).trim()}`;
          else if (formattedCat.startsWith('C.')) catHeading = `I. C. ${formattedCat.substring(2).trim()}`;
          else if (!formattedCat.startsWith('I.')) catHeading = `I. ${formattedCat}`;

          tableRows.push(
            new TableRow({
              children: [
                createCell(catHeading, 100, {
                  bold: true,
                  size: 22,
                  color: '1E40B0', // PSU blue
                  columnSpan: 9,
                }),
              ],
            })
          );
        }

        // Add question row
        tableRows.push(
          new TableRow({
            children: [
              createCell(questionIndex++, 5, { align: AlignmentType.CENTER }),
              createCell(row.question, 45),
              createCell(row.rating_5, 6, { align: AlignmentType.CENTER }),
              createCell(row.rating_4, 6, { align: AlignmentType.CENTER }),
              createCell(row.rating_3, 6, { align: AlignmentType.CENTER }),
              createCell(row.rating_2, 6, { align: AlignmentType.CENTER }),
              createCell(row.rating_1, 6, { align: AlignmentType.CENTER }),
              createCell(row.total_score, 10, { align: AlignmentType.CENTER }),
              createCell(row.avg_rating, 10, { align: AlignmentType.CENTER }),
            ],
          })
        );
      });

      // Sums for Totals row
      const sum5 = ratings.reduce((sum, r) => sum + r.rating_5, 0);
      const sum4 = ratings.reduce((sum, r) => sum + r.rating_4, 0);
      const sum3 = ratings.reduce((sum, r) => sum + r.rating_3, 0);
      const sum2 = ratings.reduce((sum, r) => sum + r.rating_2, 0);
      const sum1 = ratings.reduce((sum, r) => sum + r.rating_1, 0);
      const grandTotalScore = ratings.reduce((sum, r) => sum + r.total_score, 0);
      const totalRatingsCount = ratings.reduce((sum, r) => sum + r.response_count, 0);
      const overallAvg = totalRatingsCount > 0 ? (grandTotalScore / totalRatingsCount).toFixed(2) : '0.00';

      const totalRow = new TableRow({
        children: [
          createCell('', 5, { borders: cellTotalBorders }),
          createCell('OVERALL AVERAGE / TOTAL', 45, { bold: true, borders: cellTotalBorders }),
          createCell(sum5, 6, { bold: true, align: AlignmentType.CENTER, borders: cellTotalBorders }),
          createCell(sum4, 6, { bold: true, align: AlignmentType.CENTER, borders: cellTotalBorders }),
          createCell(sum3, 6, { bold: true, align: AlignmentType.CENTER, borders: cellTotalBorders }),
          createCell(sum2, 6, { bold: true, align: AlignmentType.CENTER, borders: cellTotalBorders }),
          createCell(sum1, 6, { bold: true, align: AlignmentType.CENTER, borders: cellTotalBorders }),
          createCell(grandTotalScore, 10, { bold: true, align: AlignmentType.CENTER, borders: cellTotalBorders }),
          createCell(overallAvg, 10, { bold: true, align: AlignmentType.CENTER, borders: cellTotalBorders }),
        ],
      });
      tableRows.push(totalRow);

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
      children.push(buildMetadataTable());

      // Spacing
      children.push(new Paragraph({ spacing: { before: 200, after: 100 } }));

      // Comments Section title
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Comments / Suggestions',
              bold: true,
              size: 24,
              font: 'Calibri',
              color: '1E40B0',
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
              color: '1E40B0',
            }),
          ],
          spacing: { before: 100, after: 100 },
        })
      );

      const strengthComments = comments.filter(c => c.strengths && c.strengths.trim());
      if (strengthComments.length === 0) {
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
        strengthComments.forEach(c => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${c.strengths.trim()}`,
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
              color: 'EF4444',
            }),
          ],
          spacing: { before: 100, after: 100 },
        })
      );

      const weaknessComments = comments.filter(c => c.weaknesses && c.weaknesses.trim());
      if (weaknessComments.length === 0) {
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
        weaknessComments.forEach(c => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${c.weaknesses.trim()}`,
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
        sections: [{ children }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(
        blob,
        `Evaluation-Summary-${faculty.name.replace(/\s+/g, '_')}-${subject.code}-${section}.docx`
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
        if (isSelfMode) {
          // Faculty viewing their own report
          const res = await evaluationService.getMyFacultyReport();
          setFaculty(res.data.faculty);
          setReport(res.data);
        } else {
          // Admin viewing a specific faculty member's report
          const [facultyRes, reportRes] = await Promise.all([
            facultyService.getById(id),
            evaluationService.getFacultyEvaluations(id),
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
  }, [id, isSelfMode]);

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
          <Link to="/faculty" className="text-psu-primary text-[13px] mt-3 inline-block hover:underline">
            Back to faculty list
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
            to="/faculty"
            className="inline-flex items-center gap-1.5 text-[13px] text-psu-muted hover:text-psu-text transition-colors mb-8"
          >
            <HiArrowLeft className="h-4 w-4" />
            Back to Faculty
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
      {/* Back — admin only */}
      {!isSelfMode && (
        <Link
          to="/faculty"
          className="inline-flex items-center gap-1.5 text-[13px] text-psu-muted hover:text-psu-text transition-colors mb-8"
        >
          <HiArrowLeft className="h-4 w-4" />
          Back to Faculty
        </Link>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
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
        <div className="text-left sm:text-right">
          <p className="text-[12px] text-psu-muted uppercase tracking-wider">Total evaluations</p>
          <p className="text-3xl font-bold text-psu-text tabular-nums">{report.totalEvaluations}</p>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 gap-4 mb-8">
        <div className="border border-psu-border bg-white rounded-lg p-5">
          <p className="text-[11px] font-medium text-psu-muted uppercase tracking-wider mb-2">Average Rating</p>
          <p className="text-4xl font-bold text-psu-text tabular-nums mb-2">{report.averageRating}</p>
          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-psu-primary/10 text-psu-primary text-[13px] font-semibold">
            {report.averageRating} / 5
          </span>
        </div>
      </div>

      {/* Export Subject Report Summary card */}
      {subjectAssignments.length > 0 && (
        <div className="border border-psu-border bg-white rounded-lg p-5 mb-8">
          <h2 className="text-[13px] font-semibold text-psu-text mb-1">Export Subject Report Summary</h2>
          <p className="text-[12px] text-psu-muted mb-4">
            Generate a customized, professional evaluation report (DOCX) for a specific subject and section.
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
            <button
              disabled={!selectedAssignment || generating}
              onClick={handleGenerateSubjectReport}
              className="bg-psu-primary text-white rounded-lg px-5 py-2.5 text-[13px] font-semibold hover:bg-psu-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                'Download Report Summary (DOCX)'
              )}
            </button>
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
        </div>
      </div>

      {/* Prescriptive recommendations */}
      <div className="border border-psu-border bg-white rounded-lg overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-psu-border flex items-center gap-2">
          <HiOutlineLightBulb className="h-4 w-4 text-psu-muted" />
          <h2 className="text-[13px] font-semibold text-psu-text">Prescriptive Recommendations</h2>
        </div>
        <div className="divide-y divide-psu-border">
          {report.recommendations.map((rec, i) => {
            const isPositive = rec.toLowerCase().includes('excellent') ||
                               rec.toLowerCase().includes('strong') ||
                               rec.toLowerCase().includes('appreciate') ||
                               rec.toLowerCase().includes('maintain') ||
                               rec.toLowerCase().includes('nominating') ||
                               rec.toLowerCase().includes('recognition');
            return (
              <div key={i} className="px-6 py-4 flex items-start gap-3">
                {isPositive ? (
                  <HiOutlineCheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <HiOutlineExclamation className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                )}
                <p className="text-[14px] text-psu-text leading-relaxed">{rec}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent feedback */}
      <div className="border border-psu-border bg-white rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-psu-border flex items-center gap-2">
          <HiOutlineChat className="h-4 w-4 text-psu-muted" />
          <h2 className="text-[13px] font-semibold text-psu-text">Recent Feedback</h2>
        </div>
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
      </div>
    </div>
  );
};

export default FacultyReport;