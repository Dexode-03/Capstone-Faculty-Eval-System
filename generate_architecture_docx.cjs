const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  HeadingLevel,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  ImageRun,
} = require('./frontend/node_modules/docx');

// Palette constants (PSU Academic Blue & Gold/Slate Theme)
const COLOR_PRIMARY = '003366';      // PSU Navy Blue
const COLOR_SECONDARY = '1E40AF';    // Royal Blue
const COLOR_ACCENT = 'D97706';       // Amber/Gold
const COLOR_DARK = '0F172A';         // Slate 900
const COLOR_BODY = '334155';         // Slate 700
const COLOR_MUTED = '64748B';        // Slate 500
const COLOR_BG_LIGHT = 'F8FAFC';     // Slate 50
const COLOR_BG_HEADER = '003366';    // Navy Table Header
const COLOR_BG_ALT = 'F1F5F9';       // Slate 100
const COLOR_BORDER = 'CBD5E1';       // Slate 300

// Helper functions for formatting
const p = (text = '', options = {}) => {
  const runs = Array.isArray(text)
    ? text
    : [
        new TextRun({
          text,
          size: options.size || 21, // ~10.5pt
          font: options.font || 'Calibri',
          color: options.color || COLOR_BODY,
          bold: !!options.bold,
          italics: !!options.italics,
        }),
      ];

  return new Paragraph({
    children: runs,
    alignment: options.alignment || AlignmentType.LEFT,
    spacing: {
      before: options.spacingBefore ?? 60,
      after: options.spacingAfter ?? 60,
      line: options.line || 276, // 1.15 line spacing
    },
    bullet: options.bullet,
  });
};

const h1 = (title) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [
      new TextRun({
        text: title,
        size: 30, // 15pt
        font: 'Calibri',
        bold: true,
        color: COLOR_PRIMARY,
      }),
    ],
    spacing: { before: 280, after: 120 },
  });

const h2 = (title) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [
      new TextRun({
        text: title,
        size: 26, // 13pt
        font: 'Calibri',
        bold: true,
        color: COLOR_SECONDARY,
      }),
    ],
    spacing: { before: 200, after: 80 },
  });

const h3 = (title) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [
      new TextRun({
        text: title,
        size: 22, // 11pt
        font: 'Calibri',
        bold: true,
        color: COLOR_DARK,
      }),
    ],
    spacing: { before: 140, after: 60 },
  });

const calloutBox = (textArr, title = 'ARCHITECTURAL NOTE') => {
  const children = [
    new Paragraph({
      children: [
        new TextRun({
          text: `[${title}]`,
          bold: true,
          size: 20,
          font: 'Calibri',
          color: COLOR_PRIMARY,
        }),
      ],
      spacing: { before: 40, after: 40 },
    }),
  ];

  for (const t of textArr) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: t,
            size: 20,
            font: 'Calibri',
            italics: true,
            color: COLOR_BODY,
          }),
        ],
        spacing: { before: 40, after: 40 },
      })
    );
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.SINGLE, size: 24, color: COLOR_PRIMARY },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children,
            shading: { fill: 'F0F4F8', type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
          }),
        ],
      }),
    ],
  });
};

const createCell = (content, widthPct, isHeader = false, isAlt = false) => {
  let paragraphs;
  if (Array.isArray(content)) {
    paragraphs = content;
  } else if (typeof content === 'string') {
    paragraphs = [
      new Paragraph({
        children: [
          new TextRun({
            text: content,
            size: isHeader ? 20 : 19,
            font: 'Calibri',
            bold: isHeader,
            color: isHeader ? 'FFFFFF' : COLOR_BODY,
          }),
        ],
        alignment: isHeader ? AlignmentType.LEFT : AlignmentType.LEFT,
        spacing: { before: 40, after: 40, line: 260 },
      }),
    ];
  } else {
    paragraphs = [content];
  }

  return new TableCell({
    children: paragraphs,
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: {
      fill: isHeader ? COLOR_BG_HEADER : isAlt ? COLOR_BG_ALT : 'FFFFFF',
      type: ShadingType.CLEAR,
    },
    margins: { top: 100, bottom: 100, left: 120, right: 120 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
    },
  });
};

const createTable = (headers, rowsData, colWidths) => {
  const headerRow = new TableRow({
    children: headers.map((h, i) => createCell(h, colWidths[i], true)),
    tableHeader: true,
  });

  const bodyRows = rowsData.map((row, rIdx) => {
    const isAlt = rIdx % 2 === 1;
    return new TableRow({
      children: row.map((cellContent, cIdx) =>
        createCell(cellContent, colWidths[cIdx], false, isAlt)
      ),
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows],
  });
};

// ── BUILD FULL DOCUMENT SECTIONS ──────────────────────────────────────────

const buildDocument = () => {
  const content = [];

  // Institution Banner / Cover
  content.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'PANGASINAN STATE UNIVERSITY',
          bold: true,
          size: 28,
          font: 'Calibri',
          color: COLOR_PRIMARY,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 40 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Asingan Campus — Asingan, Pangasinan',
          size: 22,
          font: 'Calibri',
          color: COLOR_MUTED,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'COLLEGE OF INFORMATION AND COMMUNICATIONS TECHNOLOGY',
          bold: true,
          size: 20,
          font: 'Calibri',
          color: COLOR_DARK,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Course Code & Title: SIA 101: System Integration and Architecture (1st Sem A.Y. 2026-2027)\nCurriculum Study Guide: FM-AA-CIA-15 Rev. 0 (10-July-2020) — Module No. 2: Enterprise Architecture Framework',
          italics: true,
          size: 18,
          font: 'Calibri',
          color: COLOR_MUTED,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 180 },
    })
  );

  // Activity Header
  content.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'LABORATORY ACTIVITY NO. 2',
          bold: true,
          size: 26,
          font: 'Calibri',
          color: COLOR_ACCENT,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 40 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Enterprise Architecture Blueprint & System Deconstruction',
          bold: true,
          size: 32,
          font: 'Calibri',
          color: COLOR_PRIMARY,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Spewak's Enterprise Architecture Planning (EAP) & The Zachman Framework",
          italics: true,
          size: 22,
          font: 'Calibri',
          color: COLOR_SECONDARY,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // Metadata Table
  const metaHeaders = ['METADATA FIELD', 'PROJECT DETAILS & IDENTIFIERS'];
  const metaRows = [
    [
      'Capstone Project Title',
      'FEFAS — Faculty Evaluation and Feedback Analysis System with AI-Powered Sentiment and Prescriptive Analytics',
    ],
    [
      'Beneficiary / Partner Organization',
      'Pangasinan State University (PSU) – Asingan Campus (Office of the Campus Executive Director, Office of Academic Affairs, Dept. of Information Technology)',
    ],
    ['Student / Team Members', '[Insert Student / Team Member Names]'],
    ['Year, Program & Section', 'BSIT 4th Year - Section [A/B]'],
    ['Date of Submission', 'October 12, 2026'],
    ['Assigned Faculty / Instructor', '[Insert Faculty Name]'],
    ['Activity Evaluation Score', '________ / 10 Points (Rubric Range: 1 - 10)'],
  ];
  content.push(createTable(metaHeaders, metaRows, [30, 70]));
  content.push(p('', { spacingAfter: 180 }));

  // Executive Overview & Architectural Rationale
  content.push(h1('Executive Overview & Architectural Rationale'));
  content.push(
    p(
      'Module 2 explores how Enterprise Architecture (EA) frameworks bridge strategic business goals with integrated, scalable IT systems. Software projects often risk failure or organizational misalignment when treated merely as isolated coding tasks without regard to institutional context, data relationships, and deployment infrastructure.'
    )
  );
  content.push(
    calloutBox(
      [
        '"An enterprise architecture framework (EA framework) specifies how to design and implement an enterprise architecture, as well as the principles and practices for developing and implementing a system\'s architecture description. It provides tools and ideal approaches to assist enterprise architects in utilizing various architecture domains across the enterprise, transforming manual and automated processes into an integrated environment that is responsive, scalable, and supportive in the delivery of business objectives."',
        '— Study Guide in (SIA 101 System Integration and Architecture) Module No. 2, Page 1 (FM-AA-CIA-15 Rev. 0)',
      ],
      'PSU SIA 101 MODULE 2 RATIONALE'
    )
  );
  content.push(p('', { spacingAfter: 80 }));
  content.push(
    p(
      'FEFAS (Faculty Evaluation and Feedback Analysis System) is an integrated enterprise web application designed for Pangasinan State University – Asingan Campus. It transforms the legacy paper-based faculty appraisal system into an automated, confidential, and intelligence-driven evaluation environment. FEFAS combines 15 structured Likert-scale questions across three CHED/AACCUP teaching performance domains with dual open-ended prompts (strengths and weaknesses). An embedded Natural Language Processing (NLP) classifier categorizes student commentary by sentiment polarity and drives a prescriptive rule engine that generates immediate pedagogical intervention strategies.'
    )
  );
  content.push(
    p(
      "Spewak's Enterprise Architecture Planning (EAP) establishes that architecture domains are hierarchical: Business Architecture defines goals and drives Data Architecture; Data Architecture defines information needs and drives Application Architecture; and Application Architecture defines services that drive Technology Architecture. Concurrently, Technology supports Applications, Applications support Data, and Data supports Business."
    )
  );

  // Part 1: Stakeholder Viewpoint & Concern Identification
  content.push(h1('Part 1: Stakeholder Viewpoint & Concern Identification'));
  content.push(h2('1.1 Beneficiary Organization & Business Setting'));
  content.push(
    p(
      'The beneficiary organization is Pangasinan State University (PSU) – Asingan Campus, specifically the Office of Academic Affairs, Campus Executive Director, Department Chairpersons (Information Technology, Computer Science, Teacher Education, Industrial Technology), faculty members, and enrolled students. PSU Asingan administers semestral academic programs mandated by the Commission on Higher Education (CHED) and the Accrediting Agency of Chartered Colleges and Universities in the Philippines (AACCUP) to conduct periodic evaluations of teaching effectiveness.'
    )
  );
  content.push(
    p(
      'Historical paper surveys suffered from low student turnout (~60%) due to fear of faculty retribution, tabulation delays lasting 4–8 weeks after semester completion, complete neglect of written qualitative feedback due to encoding workload, and non-actionable raw scores that offered instructors no guidance for self-improvement.'
    )
  );

  content.push(h2('1.2 Stakeholder Metamodel Mapping (Module 2, Figure 1)'));
  content.push(
    p(
      'According to the ISO/IEC/IEEE 42010 conceptual metamodel adopted in Module 2 Study Guide (Figure 1): Stakeholders identify the Architecture Framework; Stakeholders have Concerns; the Architecture Framework identifies Architecture Viewpoints; Architecture Viewpoints frame Concerns; Architecture Viewpoints govern Architecture Views; Model Kinds govern Architecture Models; and Architecture Views consist of concrete Architectural Models.'
    )
  );

  content.push(h2('1.3 Stakeholder Analysis Table'));
  const stHeaders = [
    'STAKEHOLDER ROLE',
    'CORE CONCERN / REQUIREMENT',
    'ARCHITECTURE VIEWPOINT',
    'ARCHITECTURAL ARTIFACT TO PRESENT',
  ];
  const stRows = [
    [
      'Client Executive / Owner\n(Campus Executive Director, Dean of Academic Affairs, Dept Chairs)',
      '• Institutional visibility over faculty performance.\n• Instantaneous KPI calculation and CHED/AACCUP accreditation reports.\n• Prescriptive intervention plans for low-scoring departments.\n• Elimination of manual survey tallying delays and costs.',
      'Business / Motivation View\n(Strategic Governance)',
      '• Process Flow Diagram: End-to-End Evaluation & Decision Cycle\n• Executive KPI Summary Sheet\n• Departmental Sentiment Heatmap Model\n• Prescriptive Intervention Decision Tree',
    ],
    [
      'Operational End-User: Evaluator\n(Enrolled Students)',
      '• Guaranteed confidentiality and non-retribution (anonymity).\n• Frictionless, mobile-responsive UI with minimal steps.\n• Accurate filtering of enrolled instructors only.\n• Bilingual Taglish/English/Filipino text input support.',
      'Application / Operational View\n(End-User UX & Workflow)',
      '• UI Wireframes & Two-Step Wizard Submission Model\n• Use Case Activity Diagram (Student Evaluation Lifecycle)\n• Client-Side Validation & Anti-Spam Sequence Diagram',
    ],
    [
      'Operational End-User: Evaluatee\n(Faculty Members / Instructors)',
      '• Timely receipt of objective performance feedback before the next semester starts.\n• Granular breakdown across criteria (Classroom Management, Pedagogy, Commitment).\n• Constructive, actionable self-improvement guidance.\n• Safeguards against malicious spam and abusive commentary.',
      'Application / Operational View\n(Faculty Analytics)',
      '• Faculty Individual Scorecard View Wireframe\n• Thematic Keyword & Category Breakdown Visualization\n• Prescriptive Feedback Delivery Model',
    ],
    [
      'IT Admin / Technical Officer\n(Campus MIS / Systems Administrator)',
      '• Role-Based Access Control (RBAC) and JWT security.\n• Cryptographic decoupling of student identity (AES-256-GCM).\n• High database availability, ACID compliance, and relational normalization.\n• Zero costly per-token external cloud AI API subscriptions.',
      'Technology / Security View\n(Infrastructure & Security)',
      '• Physical Deployment Topology Diagram\n• Cryptographic Anonymization Pipeline (AES-256-GCM Envelope Model)\n• Relational Schema Diagram & Automated Backup Runbook',
    ],
  ];
  content.push(createTable(stHeaders, stRows, [22, 28, 25, 25]));
  content.push(p('', { spacingAfter: 120 }));

  // Part 2: Deconstruction across the 4 Architecture Domains
  content.push(h1("Part 2: Deconstruction Across the 4 Architecture Domains (Spewak's EAP)"));
  content.push(
    p(
      "Spewak's Enterprise Architecture Planning (EAP) framework deconstructs enterprise systems into four interdependent domains. In alignment with Page 3 of the PSU Module 2 Study Guide, these domains map directly into the five universal enterprise architecture layers: Environment, Business Layer, Data Layer, Information System Layer, and Technology Layer."
    )
  );

  const layersHeaders = ['EA LAYER (STUDY GUIDE P. 3)', 'FEFAS ARCHITECTURAL REALIZATION & SCOPE'];
  const layersRows = [
    [
      '1. Environment',
      'CHED quality assurance standards, AACCUP accreditation criteria, Republic Act 10173 (Data Privacy Act of 2012), PSU academic regulations, and campus student-faculty stakeholders.',
    ],
    [
      '2. Business Layer',
      'Automated semestral teaching appraisals, academic teaching load ingestion, prescriptive faculty development planning, and executive performance analytics monitoring.',
    ],
    [
      '3. Data Layer',
      'MariaDB relational database, enrolment junction ledgers, standardized question banks, Likert atomic responses, AES-256 encrypted respondent tokens, and sentiment indices.',
    ],
    [
      '4. Information System Layer\n(Applications)',
      'FEFAS React 19 Frontend SPA, Express REST API controllers, Natural.js NLP Sentiment Classifier, Rule-Based Prescriptive Engine, and DOCX Executive Summary Export Service.',
    ],
    [
      '5. Technology Layer',
      'Node.js 18+ LTS runtime, MariaDB 10.4 InnoDB engine, Railway Cloud PaaS / On-Premise LAN Apache deployment, TLS 1.3 HTTPS, and Google Gmail SMTP transactional mailer.',
    ],
  ];
  content.push(createTable(layersHeaders, layersRows, [30, 70]));
  content.push(p('', { spacingAfter: 120 }));

  // 2.1 Business Architecture
  content.push(h2('2.1 Business Architecture'));
  content.push(
    p(
      'Business Architecture defines the organizational structure and functional capabilities required to achieve institutional goals. It addresses the vision, strategy, and people responsible for delivering business services.'
    )
  );
  content.push(h3('Primary Business Processes Automated & Optimized:'));
  content.push(
    p(
      '1. Academic Period & Course Load Activation: Academic administrators configure the active academic term and map faculty-to-student subject linkages.\n' +
        '2. Authenticated Subject-Bound Evaluation: Enrolled students log in via institutional credentials and access strictly their enrolled instructors.\n' +
        '3. Multi-Criteria Scoring & Commentary: Students submit ratings across 15 CHED/SUC indicators (Management of Teaching, Pedagogy, Commitment) and qualitative comments on instructor strengths and weaknesses.\n' +
        '4. Automated NLP Sentiment Classification: Feedback is sanitized and classified into sentiment polarities (positive, neutral, negative) with confidence ratings.\n' +
        '5. Prescriptive Action Plan Formulation: Scores and feedback themes are evaluated against heuristic rules to generate targeted improvement plans.\n' +
        '6. Executive Performance Monitoring: Chairpersons and Deans access comparative scorecards, heatmaps, and downloadable formal appraisal reports (.docx).'
    )
  );

  content.push(h3('Operational Bottlenecks & Explicit Measurable Outcomes:'));
  const botHeaders = [
    'OPERATIONAL BOTTLENECK',
    'ARCHITECTURAL INTERVENTION IN FEFAS',
    'EXPLICIT MEASURABLE OUTCOME',
  ];
  const botRows = [
    [
      'Paper-Handling & Tabulation Lag: Manual questionnaire optical scanning and calculation takes 4 to 8 weeks after final exams.',
      'Web-based responsive data capture and instant database SQL aggregations.',
      '98% reduction in report turnaround time: Scorecards generated immediately upon survey closure.',
    ],
    [
      'Unprocessed Qualitative Data: Thousands of written student comments are left unread due to encoding labor requirements.',
      'Embedded Natural.js Naive Bayes NLP pipeline with unigram/bigram tokenization for Taglish, English, and Filipino.',
      '100% of open-ended student comments categorized by sentiment polarity and thematic topic.',
    ],
    [
      'Retribution Anxiety & Low Participation: Students fear faculty retribution, causing turnout to drop below 60%.',
      'Cryptographic AES-256-GCM respondent tokens decouple student identity from evaluation records.',
      'Student participation increases to >95% with mathematically guaranteed non-retribution.',
    ],
    [
      'Non-Actionable Raw Metrics: Faculty receive arbitrary numbers (e.g. 3.8/5.0) without pedagogical context or guidance.',
      'Rule-based prescriptive analytics engine triggered by category scores and feedback keywords.',
      '100% of evaluated faculty receive personalized, actionable intervention strategies.',
    ],
  ];
  content.push(createTable(botHeaders, botRows, [28, 42, 30]));
  content.push(p('', { spacingAfter: 120 }));

  // 2.2 Data Architecture
  content.push(h2('2.2 Data Architecture'));
  content.push(
    p(
      'Data Architecture outlines the logical and physical data assets, entities, and data management resources of the organization. The FEFAS data architecture uses an ACID-compliant MariaDB/MySQL schema operating on the InnoDB engine with full referential integrity.'
    )
  );
  content.push(h3('Core Business Entities:'));
  const entHeaders = ['ENTITY NAME', 'DATABASE TABLE', 'PURPOSE & KEY ATTRIBUTES'];
  const entRows = [
    [
      'Academic Period',
      'academic_periods',
      'Controls operational evaluation windows. Attributes: id, academic_year, semester, is_active, start_date, end_date.',
    ],
    [
      'Administrator',
      'admins',
      'Administrative identities with system-wide privileges. Attributes: id, name, email, password (bcrypt), email_verified.',
    ],
    [
      'Faculty Member',
      'faculty',
      'Academic staff evaluatees. Attributes: id (ASIN-XXXXXX), name, email, department, email_verified.',
    ],
    [
      'Student',
      'students',
      'Enrolled student evaluators. Attributes: id (23-AS-XXXX), name, email, year_level, section, department, email_verified.',
    ],
    [
      'Subject',
      'subjects',
      'Course catalog offerings. Attributes: id, code (IT411), name, department, semester, year_level.',
    ],
    [
      'Faculty Subject Junction',
      'faculty_subjects',
      'Many-to-many junction mapping faculty teaching loads per subject. Attributes: id, faculty_id, subject_id, section.',
    ],
    [
      'Student Subject Junction',
      'student_subjects',
      'Many-to-many junction mapping student enrollments per subject. Attributes: id, student_id, subject_id, faculty_id.',
    ],
    [
      'Evaluation Question Bank',
      'evaluation_questions',
      'Standardized question instrument (15 rating items + 2 text prompts). Attributes: id, category, question_type, question, sort_order, is_active.',
    ],
    [
      'Evaluation Master Record',
      'evaluations',
      'Evaluation header capturing overall rating, comments, sentiment, sentiment_score, and anonymous_student_ref (AES-256 token).',
    ],
    [
      'Evaluation Atomic Response',
      'evaluation_responses',
      'Normalized responses mapping individual question items to specific ratings (1–5) and remarks. Attributes: id, evaluation_id, question_id, rating, text_response.',
    ],
  ];
  content.push(createTable(entHeaders, entRows, [22, 23, 55]));
  content.push(p('', { spacingAfter: 120 }));

  // Logical Entity-Relationship Diagram (ERD) Image & Specification
  content.push(h3('Logical Entity-Relationship Diagram (ERD) with Cryptographic Anonymization:'));
  content.push(
    p(
      'The diagram below illustrates the logical schema of FEFAS. Primary keys (PK), foreign keys (FK), unique constraints (UK), and the AES-256-GCM encrypted respondent token are modeled with their respective relational cardinalities and integrity constraints.'
    )
  );

  const erdImagePath = path.join(__dirname, 'FEFAS_Entity_Relationship_Diagram.png');
  if (fs.existsSync(erdImagePath)) {
    content.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: fs.readFileSync(erdImagePath),
            transformation: {
              width: 620, // 6.45 inches width in points
              height: 410,
            },
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 60 },
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Figure 2.1: Logical Entity-Relationship Diagram (ERD) of FEFAS with Cryptographic Anonymization Topology',
            size: 18,
            font: 'Calibri',
            italics: true,
            color: COLOR_MUTED,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 140 },
      })
    );
  }

  content.push(h3('Relational Cardinality & Referential Integrity Rules:'));
  const relHeaders = [
    'RELATIONSHIP',
    'CARDINALITY',
    'FOREIGN KEY MAPPING',
    'BUSINESS & INTEGRITY RULE',
  ];
  const relRows = [
    [
      'academic_periods → evaluations',
      '1 : N (One-to-Many)',
      'evaluations.academic_period_id → academic_periods.id',
      'Scopes evaluation submissions to the active semestral window. Restricted deletion preserves historic appraisals.',
    ],
    [
      'students → student_subjects',
      '1 : N (One-to-Many)',
      'student_subjects.student_id → students.id',
      'Maps student enrollment per academic subject. Enforces UNIQUE(student_id, subject_id).',
    ],
    [
      'subjects → student_subjects',
      '1 : N (One-to-Many)',
      'student_subjects.subject_id → subjects.id',
      'Associates enrolled curriculum courses with student cohorts.',
    ],
    [
      'subjects → faculty_subjects',
      '1 : N (One-to-Many)',
      'faculty_subjects.subject_id → subjects.id',
      'Defines teaching load allocations. Enforces UNIQUE(subject_id, section).',
    ],
    [
      'faculty → faculty_subjects',
      '1 : N (One-to-Many)',
      'faculty_subjects.faculty_id → faculty.id',
      'Assigns professors to departmental course offerings.',
    ],
    [
      'faculty → evaluations',
      '1 : N (One-to-Many)',
      'evaluations.faculty_id → faculty.id',
      'Links cumulative student appraisal scores to individual faculty members.',
    ],
    [
      'students → evaluations\n(Cryptographic Anonymity)',
      '1 : N (One-to-Many)\n(Decoupled)',
      'evaluations.anonymous_student_ref (AES-256-GCM Envelope)',
      'Student ID is encrypted into an immutable token (v1.iv.tag.data). Prevents faculty or evaluators from unmasking respondent identity.',
    ],
    [
      'evaluations → evaluation_responses',
      '1 : N (One-to-Many)',
      'evaluation_responses.evaluation_id → evaluations.id',
      'Atomically decomposes each survey into 15 Likert ratings and 2 text answers. ON DELETE CASCADE ensures transactional cleanliness.',
    ],
    [
      'evaluation_questions → evaluation_responses',
      '1 : N (One-to-Many)',
      'evaluation_responses.question_id → evaluation_questions.id',
      'Binds individual atomic responses to standardized pedagogical questions (Management, Pedagogy, Commitment).',
    ],
    [
      'users (students/admins) → audit_logs',
      '1 : N (One-to-Many)',
      'audit_logs.user_id → users.id',
      'Tracks administrative events, system configurations, and authentication audit trails for security governance.',
    ],
  ];
  content.push(createTable(relHeaders, relRows, [24, 18, 28, 30]));
  content.push(p('', { spacingAfter: 120 }));

  // 2.3 Application Architecture
  content.push(h2('2.3 Application Architecture'));
  content.push(
    p(
      'Application Architecture specifies the modular software components, services, and communication protocols that deliver business capabilities.'
    )
  );
  content.push(h3('Modular Functional Components:'));
  content.push(
    p(
      '1. Authentication & RBAC Module (authController.js): Manages registration, institutional @psu.edu.ph email validation, bcrypt password hashing (10 salt rounds), and stateless JWT issuance with 7-day expiration.\n' +
        '2. Evaluation Submission & Validation Engine (evaluationController.js): Filters assigned faculty based on student enrollments, prevents duplicate submissions per active period, and sanitizes input against XSS and spam.\n' +
        '3. AI Sentiment & Prescriptive Engine (sentimentAnalyzer.js): Analyzes student strengths and weaknesses using a trained Naive Bayes classifier (unigram/bigram tokenization for Taglish/English/Filipino) and produces category-specific pedagogical recommendations.\n' +
        '4. Privacy & Anonymization Engine (privacy.js): Encrypts student identifiers using AES-256-GCM authenticated encryption into versioned tokens (v1.iv.tag.data), decoupling student identity from evaluation records.\n' +
        '5. Reporting & Document Generation Engine: Generates executive summaries in Word (.docx) format using the docx library, styled with PSU institutional colors and structured tables.'
    )
  );

  content.push(h3('Component Communication Mechanisms:'));
  content.push(
    p(
      '• Client-to-Backend: Asynchronous RESTful JSON requests over HTTPS (GET, POST, PUT, DELETE) with Axios interceptors attaching JWT Bearer tokens.\n' +
        '• Backend-to-AI Engine: Direct in-process synchronous invocation in the Node.js event loop, eliminating external API latency and cloud costs.\n' +
        '• Backend-to-Database: Asynchronous TCP socket pooling using mysql2/promise with prepared statements.'
    )
  );

  // 2.4 Technology Architecture
  content.push(h2('2.4 Technology Architecture'));
  content.push(
    p(
      'Technology Architecture specifies the software runtimes, hardware platforms, database systems, and networking protocols supporting the application.'
    )
  );

  const techHeaders = ['ARCHITECTURAL LAYER', 'TECHNOLOGY SELECTION', 'OPERATIONAL JUSTIFICATION'];
  const techRows = [
    [
      'Client Runtime',
      'Modern Evergreen Web Browsers\n(Chrome, Edge, Firefox, Safari)',
      'Standards-compliant HTML5/ES6 execution; eliminates software installation on campus lab PCs and student mobile phones.',
    ],
    [
      'Frontend Framework',
      'React 19 + Vite 7 + TailwindCSS 4',
      'Fast Virtual DOM rendering, compact production bundles, and mobile-responsive styling suited for low-bandwidth networks.',
    ],
    [
      'Backend Runtime',
      'Node.js 18+ LTS + Express 4.x',
      'Non-blocking, event-driven I/O model handles concurrent student submission surges during semestral deadlines without thread starvation.',
    ],
    [
      'Database System',
      'MariaDB 10.4 / MySQL 8.0 (InnoDB Engine)',
      'ACID compliance, relational foreign key constraints, utf8mb4 collation for Filipino characters, and low resource overhead.',
    ],
    [
      'AI / Machine Learning',
      'Natural.js (Naive Bayes Classifier)',
      'Self-hosted Node.js NLP library; executes on-server with zero recurring cloud API fees and complete data sovereignty.',
    ],
    [
      'Cryptography & Security',
      'Node.js crypto (AES-256-GCM) & bcryptjs',
      'Military-grade authenticated encryption for student anonymity and salted credential hashing.',
    ],
    [
      'Host Platforms',
      'Railway PaaS / Cloud VPS (Primary)\nCampus LAN On-Premise Apache (Fallback)',
      'Dual-deployment flexibility ensures continuous evaluation operations even during external internet disruptions.',
    ],
    [
      'Communication Protocols',
      'HTTPS (TLS 1.3), REST/JSON, SMTPS (587/465)',
      'Secure encrypted transmission for evaluation submissions, dashboard queries, and automated email verification.',
    ],
  ];
  content.push(createTable(techHeaders, techRows, [22, 28, 50]));
  content.push(p('', { spacingAfter: 120 }));

  // Part 3: Mini-Zachman Framework Matrix
  content.push(h1('Part 3: Mini-Zachman Framework Matrix'));
  content.push(
    p(
      'As detailed in Module 2 (Pages 5–6, Figures 3 & 4), the Zachman Framework is an enterprise classification matrix created by John Zachman at IBM. It organizes an enterprise across 6 Communication Interrogatives (Columns: What, How, Where, Who, When, Why) and 6 Reification Perspectives (Rows: Planner, Owner, Designer, Builder, Programmer, User).'
    )
  );
  content.push(
    p(
      'Below is the 2×6 Mini-Zachman Matrix mapping FEFAS across the first two perspectives: Scope / Contextual (Planner View) and Enterprise Model / Conceptual (Owner View).'
    )
  );

  const zHeaders = [
    'PERSPECTIVE / ROLE',
    'DATA (What)',
    'FUNCTION (How)',
    'NETWORK (Where)',
    'PEOPLE (Who)',
    'TIME (When)',
    'MOTIVATION (Why)',
  ];
  const zRows = [
    [
      'ROW 1:\nScope / Contextual\n(Planner View)\n\nRole:\nStrategist & Planner',
      'Major enterprise entities tracked:\n• Student Enrolment Rosters\n• Faculty Teaching Loads\n• Course Offerings\n• Question Bank\n• Evaluation Records\n• Sentiment Scores\n• Prescriptive Recommendations',
      'High-level business functions:\n• Course-to-Instructor Mapping\n• Student Evaluation Input\n• Text Sentiment Classification\n• Faculty Report Generation\n• Executive Analytics Summary\n• Word (.docx) Export',
      'Deployment locations:\n• Cloud VPS/PaaS (Railway)\n• On-Premises Server (PSU Asingan)\n• Campus Computer Labs\n• Department Offices\n• Student Mobile Devices via Wi-Fi/4G',
      'Target user groups:\n• Students (Evaluators)\n• Faculty (Evaluatees)\n• Department Chairs\n• Campus Executive Director\n• Dean of Academic Affairs\n• Campus MIS Unit\n• CHED/AACCUP Accreditors',
      'Operational cycles & triggers:\n• Semestral Evaluation Windows (Midterm & Finals, 2–3 weeks)\n• Academic Period Activation\n• Survey Deadline Closure\n• Semestral Accreditation Audit Deadlines',
      'Strategic business goals:\n• Fulfill CHED/AACCUP accreditation mandates\n• Replace paper evaluation costs\n• Eliminate fear of retribution\n• Transform student feedback into actionable pedagogical improvements',
    ],
    [
      'ROW 2:\nEnterprise Model\n(Owner View)\n\nRole:\nExecutive Business Owner',
      'Conceptual data models:\n• students (identities, programs)\n• faculty (credentials, depts)\n• subjects (catalog)\n• faculty_subjects (workload)\n• student_subjects (enrolment)\n• academic_periods\n• evaluation_questions (17 items)\n• evaluations (AES-256 tokens)\n• evaluation_responses (atomic scores)',
      'Detailed process workflows:\n• Student: Login → Roster Verification → Multi-step Form → Anti-Spam Check → AES-256 Crypto → Naive Bayes NLP → Confirmation\n• Faculty: Login → Scorecard → Category Review → Sentiment Overview → Prescriptive Actions\n• Admin: Period Setup → Data Ingestion → Heatmap Audit → Word Export → Interventions',
      'Network distribution scheme:\n• Client Tier (React SPA) connects over HTTPS (Port 443)\n• App Tier (Node.js API) on Port 5000\n• Data Tier (MariaDB) on Port 3306/3307\n• Transactional Mail (SMTP) on Port 587/465',
      'Organizational role tiers:\n• Student: Access restricted to assigned faculty forms\n• Faculty: Read-only access to own aggregated report\n• Admin: Full CRUD control over accounts, periods, question bank, and campus analytics',
      'Process timing & triggers:\n• Form submission: Real-time NLP analysis (<50ms)\n• Period closure: Instant campus report generation\n• Password reset: 60-min token expiration\n• Session: 7-day JWT expiry',
      'Business rules & policies:\n• PSU Academic Quality Assurance Guidelines\n• CHED Memo Orders on Faculty Appraisals\n• Republic Act 10173 (Data Privacy Act of 2012)\n• SUC Teaching Performance Assessment Guidelines',
    ],
  ];
  content.push(createTable(zHeaders, zRows, [16, 14, 14, 14, 14, 14, 14]));
  content.push(p('', { spacingAfter: 120 }));

  // Part 4: Architectural Integration & Constraint Analysis
  content.push(h1('Part 4: Architectural Integration & Constraint Analysis'));
  content.push(h2('4.1 Interoperability & Data Exchange Analysis'));
  content.push(
    p(
      'Enterprise interoperability governs how FEFAS exchanges data with institutional subsystems and external services:'
    )
  );
  content.push(
    p(
      '1. Communication & Notification Gateway (Google SMTP / Nodemailer): Delivers account verification links, password reset tokens, and administrative alerts using HTML MIME envelopes over SMTP/TLS (Ports 587 and 465).\n' +
        '2. Institutional SIS / Registrar Interoperability (Planned / Extensible Interface): Ingests official student enrolment rosters and faculty loading assignments via JSON/CSV data structures over authenticated REST endpoints.\n' +
        '3. Report Generation & Document Exchange (Office Open XML Engine): Exports formal evaluation summaries in Microsoft Word (.docx) format using the docx library and file-saver binary transmission, styled with PSU institutional colors.\n' +
        '4. Internal Client-Server Data Contracts: Strict JSON schemas with standard HTTP status codes (200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Error).'
    )
  );

  content.push(h2('4.2 Deployment & Operational Constraints Analysis'));
  content.push(
    p(
      'Deploying enterprise software in state university environments requires addressing real-world infrastructural, financial, and behavioral limitations:'
    )
  );

  const conHeaders = [
    'REAL-WORLD CONSTRAINT',
    'ARCHITECTURAL MITIGATION IN FEFAS',
    'OPERATIONAL IMPACT & BENEFIT',
  ];
  const conRows = [
    [
      'Intermittent Campus Bandwidth: Campus internet connection experiences latency spikes, throttling, and intermittent outages during peak hours.',
      'Single-Page Application (SPA) architecture with Vite chunk splitting, Tailwind compiled CSS, and lightweight JSON payloads (<5 KB).',
      'Initial bundle loads once; subsequent evaluation operations require minimal data transfer, functioning smoothly even on 3G mobile connections.',
    ],
    [
      'Zero Cloud AI Budget: State universities operate under strict fiscal limits and cannot fund recurring commercial AI API fees (e.g. OpenAI tokens).',
      'Self-contained, open-source Natural.js Naive Bayes NLP engine executing directly within the Node.js runtime on the host server.',
      'Zero recurring API costs, complete operational autonomy, and zero external dependency risk.',
    ],
    [
      'Hardware Heterogeneity: Students access the portal using diverse hardware ranging from campus lab PCs to entry-level budget Android smartphones.',
      'Mobile-first responsive design using TailwindCSS with native HTML dropdown selectors instead of heavy UI libraries.',
      'Smooth performance, low memory footprint, and reliable form submission across all device classes.',
    ],
    [
      'Digital Literacy & Taglish Input: Students have varying language preferences and frequently write in informal "Taglish" (mixed Tagalog and English).',
      'Guided two-step evaluation wizard with explicit rating definitions (1=Poor to 5=Outstanding) and a bilingual Taglish NLP training dataset.',
      'Students express genuine opinions naturally without language barriers, and the AI accurately interprets colloquial sentiment.',
    ],
    [
      'Data Privacy & Retribution Fear: Students hesitate to provide honest feedback if there is any chance instructors can trace comments back to them.',
      'AES-256-GCM encryption transforms student IDs into anonymous reference tokens (v1.iv.tag.data); text comments contain no user metadata.',
      'Guarantees full compliance with RA 10173 (Data Privacy Act of 2012) and encourages candid, authentic feedback.',
    ],
  ];
  content.push(createTable(conHeaders, conRows, [26, 44, 30]));
  content.push(p('', { spacingAfter: 120 }));

  // Conclusion & References
  content.push(h1('Conclusion & References'));
  content.push(
    p(
      'The formal enterprise architecture blueprinting of FEFAS validates that the system bridges strategic university quality goals with an integrated, secure, and cost-effective IT infrastructure. By deconstructing the system across Spewak’s four domains and the foundational rows of the Zachman Framework, the design guarantees that business processes drive software capabilities, ensuring long-term institutional alignment and sustainability.'
    )
  );

  content.push(h2('References'));
  const refs = [
    '1. Pangasinan State University. (2020). Study Guide for Module No. 2: Enterprise Architecture Framework (FM-AA-CIA-15 Rev. 0). SIA 101: System Integration and Architecture.',
    '2. Spewak, S. H., & Hill, S. C. (1993). Enterprise Architecture Planning: Developing a Blueprint for Data, Applications, and Technology. John Wiley & Sons, Inc.',
    '3. Zachman, J. A. (1987). A Framework for Information Systems Architecture. IBM Systems Journal, 26(3), 276–292.',
    '4. The Open Group. (2018). The TOGAF® Standard, Version 9.2. The Open Group.',
    '5. ISO/IEC/IEEE 42010:2011. Systems and software engineering — Architecture description. International Organization for Standardization.',
    '6. Republic of the Philippines. (2012). Republic Act No. 10173: Data Privacy Act of 2012. Official Gazette.',
    '7. FEFAS Technical Documentation. (2026). Faculty Evaluation and Feedback Analysis System Architecture Guide & Specifications. Pangasinan State University – Asingan Campus.',
  ];
  for (const r of refs) {
    content.push(p(r, { spacingBefore: 40, spacingAfter: 40, size: 19 }));
  }

  // Create docx document
  return new Document({
    creator: 'Antigravity AI / Pangasinan State University CICT',
    title: 'FEFAS Enterprise Architecture Blueprint - SIA 101 Module 2',
    description: 'Laboratory Activity 2 in SIA 101: System Integration and Architecture',
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Pangasinan State University – Asingan Campus | SIA 101 Laboratory Activity 2',
                    size: 16,
                    font: 'Calibri',
                    color: COLOR_MUTED,
                    italics: true,
                  }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'FEFAS Enterprise Architecture Blueprint (Spewak EAP & Zachman Framework) | Page ',
                    size: 16,
                    font: 'Calibri',
                    color: COLOR_MUTED,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    font: 'Calibri',
                    color: COLOR_MUTED,
                    bold: true,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: content,
      },
    ],
  });
};

async function main() {
  console.log('Generating FEFAS Architecture Report DOCX...');
  const doc = buildDocument();
  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(
    __dirname,
    'Laboratory_Activity_2_SIA101_FEFAS_Architecture_Report.docx'
  );
  try {
    fs.writeFileSync(outputPath, buffer);
    console.log(`Document successfully written to: ${outputPath} (${buffer.length} bytes)`);
  } catch (err) {
    if (err.code === 'EBUSY') {
      const fallbackPath = path.join(
        __dirname,
        'Laboratory_Activity_2_SIA101_FEFAS_Architecture_Report_With_ERD.docx'
      );
      fs.writeFileSync(fallbackPath, buffer);
      console.log(`Original file was locked in Word. Saved to: ${fallbackPath} (${buffer.length} bytes)`);
    } else {
      throw err;
    }
  }
}

main().catch((err) => {
  console.error('Error generating DOCX:', err);
  process.exit(1);
});
