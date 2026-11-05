/**
 * @typedef {Object} LessonOpportunity
 * @property {number} lesson
 * @property {string} title
 * @property {'Pre-Assessment' | 'Formative' | 'Summative'} type
 * @property {string} purpose
 * @property {string} keyFocus
 * @property {string} [buildingTowards]
 * @property {string} [whatToLookFor]
 * @property {string} [whatToDo]
 */

/**
 * @typedef {Object} LessonOverview
 * @property {number} lesson
 * @property {string} title
 * @property {number} pacingDays
 * @property {string} [drivingQuestion]
 */

/**
 * @typedef {Object} UnitOverview
 * @property {string} unitCode
 * @property {string} unitName
 * @property {string} drivingQuestion
 * @property {LessonOverview[]} [lessons]
 * @property {LessonOpportunity[]} opportunities
 * @property {string[]} supplementalTools
 */

/** @type {UnitOverview[]} */
export const unitOverviews = [
  {
    unitCode: '8.1',
    unitName: 'Contact Forces',
    drivingQuestion: 'Why do things sometimes get damaged when they hit each other?',
    lessons: [
      {
        lesson: 1,
        title: 'Things hitting each other',
        pacingDays: 3,
        drivingQuestion: 'What happens when objects collide, and how can we represent those interactions?',
      },
      {
        lesson: 2,
        title: 'Motion and shape in collisions',
        pacingDays: 2,
        drivingQuestion: 'How does the motion and shape of colliding objects change during a collision?',
      },
      {
        lesson: 3,
        title: 'Do all objects bend?',
        pacingDays: 1,
        drivingQuestion: 'Do all objects bend when contact forces are applied during a collision?',
      },
      {
        lesson: 4,
        title: 'Variables in collision investigations',
        pacingDays: 2,
        drivingQuestion: 'Which variables should we measure and control in collision investigations?',
      },
      {
        lesson: 5,
        title: 'Planning group investigations',
        pacingDays: 2,
        drivingQuestion: 'How can we plan an investigation to test what affects collision outcomes?',
      },
      {
        lesson: 6,
        title: 'Peak forces in soccer collisions',
        pacingDays: 2,
        drivingQuestion: 'What affects the peak force during a soccer collision?',
      },
      {
        lesson: 7,
        title: 'Energy transfer during collisions',
        pacingDays: 2,
        drivingQuestion: 'How is energy transferred when objects collide?',
      },
      {
        lesson: 8,
        title: 'Comparing collision outcomes',
        pacingDays: 2,
        drivingQuestion: 'How do different collision conditions lead to different amounts of damage?',
      },
      {
        lesson: 9,
        title: 'Explaining damage during collisions',
        pacingDays: 2,
        drivingQuestion: 'Why do some collisions cause more damage than others?',
      },
      {
        lesson: 10,
        title: 'Applying collision evidence',
        pacingDays: 2,
        drivingQuestion: 'How can we use evidence from investigations to explain collision damage?',
      },
      {
        lesson: 11,
        title: 'Protection device design',
        pacingDays: 2,
        drivingQuestion: 'How can we design a device to protect an object during a collision?',
      },
      {
        lesson: 12,
        title: 'Testing protection devices',
        pacingDays: 2,
        drivingQuestion: 'How can we test whether a protection device reduces peak force?',
      },
      {
        lesson: 13,
        title: 'Optimizing device designs',
        pacingDays: 2,
        drivingQuestion: 'How can we improve a protection device based on test results?',
      },
      {
        lesson: 14,
        title: 'Peer feedback on device designs',
        pacingDays: 2,
        drivingQuestion: 'How can peer feedback help us refine a protection device design?',
      },
      {
        lesson: 15,
        title: 'Summative: minimizing peak force',
        pacingDays: 2,
        drivingQuestion: 'How can materials and design choices minimize peak force during a collision?',
      },
      {
        lesson: 16,
        title: 'Unit synthesis and reflection',
        pacingDays: 3,
        drivingQuestion: 'Why do things sometimes get damaged when they hit each other?',
      },
    ],
    opportunities: [
      {
        lesson: 1,
        title: 'Initial Model: Objects During Collisions',
        type: 'Pre-Assessment',
        purpose: 'Elicit students\u2019 initial ideas and questions about collisions and damage',
        keyFocus: 'Analyze student models; highlight diverse thinking in Consensus Discussion'
      },
      {
        lesson: 4,
        title: 'Independent, Dependent, and Controlled Variables',
        type: 'Formative',
        purpose: 'Check understanding of variables used in investigations',
        keyFocus: 'Use of handout on variables as ongoing reference'
      },
      {
        lesson: 5,
        title: 'Slide K + Science Notebook Entry',
        type: 'Formative',
        purpose: 'Evaluate planning skills for group investigations',
        keyFocus: 'Check for proper variable identification and organized data tables'
      },
      {
        lesson: 6,
        title: 'Review driving question progress',
        type: 'Formative',
        purpose: 'Connect soccer collision investigations back to the unit driving question.',
        keyFocus: 'Listen for references to peak force, contact area, and damage during collisions.',
        buildingTowards: 'Connect soccer collision investigations back to the unit driving question.',
        whatToLookFor:
          'Listen for references to peak force, contact area, and damage during collisions.',
        whatToDo:
          'Facilitate a brief discussion after the soccer investigation and capture ideas on the Driving Question Board.',
      },
      {
        lesson: 6,
        title: 'Soccer assessment (in TE block)',
        type: 'Formative',
        purpose: 'Assess understanding of peak forces and energy transfer during soccer collisions.',
        keyFocus: 'Student-drawn free-body diagrams and written explanations of peak force.',
        buildingTowards: 'Assess understanding of peak forces and energy transfer during soccer collisions.',
        whatToLookFor: 'Student-drawn free-body diagrams and written explanations of peak force.',
        whatToDo:
          'Use the Teacher Edition soccer assessment block to collect notebooks and note common gaps before the next lesson.',
      },
      {
        lesson: 10,
        title: 'Lesson 10 Assessment',
        type: 'Formative',
        purpose: 'Apply understanding of collisions to new scenarios',
        keyFocus: 'Use evidence from previous lessons to explain damage during collisions'
      },
      {
        lesson: 11,
        title: 'Protection Device Design Thinking',
        type: 'Pre-Assessment',
        purpose: 'Gauge understanding of materials and damage mitigation',
        keyFocus: 'Students draft early design ideas and diagrams'
      },
      {
        lesson: 14,
        title: 'Device Redesign',
        type: 'Summative',
        purpose: 'Assess ability to optimize designs based on feedback',
        keyFocus: 'Evaluate reasoning behind material choice and trade-offs'
      },
      {
        lesson: 15,
        title: 'Cheerleading Headgear Assessment',
        type: 'Summative',
        purpose: 'Evaluate final understanding of force reduction and material properties',
        keyFocus: 'Analyze design arguments for minimizing peak force'
      }
    ],
    supplementalTools: [
      'Progress Tracker \u2013 Reflective student log for documenting discoveries and progress.',
      'Self-Assessment Discussion Rubric \u2013 Tool for student reflection on participation.',
      'Peer Feedback \u2013 Opportunities to give and receive peer input throughout the unit.'
    ]
  }
]

/**
 * @param {string} code
 * @returns {UnitOverview | undefined}
 */
export function getUnitOverview(code) {
  return unitOverviews.find((u) => u.unitCode === code)
}
