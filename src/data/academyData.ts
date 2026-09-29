export interface Question {
  question: string;
  options: string[];
  correct: number;
}

export interface CourseData {
  points: string[];
  questions: Question[];
}

export const ACADEMY_DATA: Record<string, CourseData> = {
  'opms-admin': {
    points: [
      'The Organizational Performance Management System (OPMS) aligns municipal key performance indicators with SDBIP targets.',
      'SDBIP (Service Delivery and Budget Implementation Plan) serves as the contract between administration, council, and community.',
      'Quarterly actual deliverables require substantiated Portfolios of Evidence (POE) before approval.',
      'Internal Audit reviews OPMS deliverables to assure validity, completeness, and accuracy.',
      'DPMC moderation ensures uniform performance rating standards across all municipal departments.'
    ],
    questions: [
      {
        question: 'What is the primary role of the SDBIP in municipal governance?',
        options: ['Internal chat network', 'Contract between administration, council, and community', 'Employee payroll roster', 'Marketing catalog'],
        correct: 1
      },
      {
        question: 'What is mandatory prior to submitting quarterly deliverables for review?',
        options: ['Social media post', 'Portfolio of Evidence (POE)', 'Council lunch voucher', 'Annual report printout'],
        correct: 1
      }
    ]
  },
  'opms-political': {
    points: [
      'Political oversight over performance reports is exercised through Section 79 & 80 committees and MPAC.',
      'Executive Mayoral committee reviews quarterly performance before quarterly submission to Council.',
      'Council resolutions mandate accountability and corrective action for underperforming indicators.'
    ],
    questions: [
      {
        question: 'Which committee conducts municipal oversight hearings on the annual performance report?',
        options: ['MPAC (Municipal Public Accounts Committee)', 'Tender Adjudication Board', 'Sports & Culture Forum', 'Youth Desk'],
        correct: 0
      }
    ]
  },
  'ipms': {
    points: [
      'Individual Performance Management System (IPMS) cascades strategic priorities down to individual employee work plans.',
      'Job Specific Competencies (JSC) evaluate operational roles alongside core competencies and KPIs.',
      'Self-evaluation allows officials to input actual achievements and attach supporting PoE documents.',
      'Line managers review individual submissions, moderate scores, and forward vetted KPIs to Internal Audit.'
    ],
    questions: [
      {
        question: 'What does IPMS cascade to individual municipal employees?',
        options: ['Leave balances only', 'Strategic priorities and measurable performance targets', 'Parking spots', 'Uniform allowances'],
        correct: 1
      },
      {
        question: 'Who verifies and moderates an employee self-evaluation before audit dispatch?',
        options: ['External vendor', 'Line Manager', 'Security guard', 'General public'],
        correct: 1
      }
    ]
  },
  'mf-connect': {
    points: [
      'MzansiFlow Connect provides unified directory lookup and real-time inter-departmental notification pipelines.',
      'Role-based access ensures confidential employee performance and audit deliberations remain secure.'
    ],
    questions: [
      {
        question: 'What guarantees data privacy in MzansiFlow Connect?',
        options: ['Public bulletin boards', 'Role-based access control and tenant isolation', 'Open guest accounts', 'Unencrypted emails'],
        correct: 1
      }
    ]
  },
  'more': {
    points: [
      'Continuous professional development is supported through municipal bursaries and training programs.',
      'Municipal Regulations on Minimum Competency Levels set statutory requirements for senior officials.'
    ],
    questions: [
      {
        question: 'What legislation sets competency requirements for municipal financial officials?',
        options: ['Road Traffic Act', 'Municipal Regulations on Minimum Competency Levels', 'Postal Services Act', 'Consumer Protection Act'],
        correct: 1
      }
    ]
  }
};
