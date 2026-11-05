// Mock data for the application - no database queries
// Real data is handled by the seed script

export interface Assessment {
  id: string
  title: string
  unitName: string
  gradeName?: string | null
  subject: string
  grade: number
  type: string
  dueDate: string
  totalRecords: number
  pendingRecords: number
  description?: string
  duration?: string
  googleFormUrl?: string
}

export interface AvailableAssessment {
  id: string
  title: string
  unitName: string
  subject: string
  grade: number
  type: string
  description: string
  pointValue: number
  estimatedDuration: string
  standards: string[]
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  tags: string[]
  createdDate: string
  lastModified: string
}

export interface AssignmentInstance {
  id: string
  assessmentId: string
  assignedBy: string
  assignedDate: string
  dueDate: string
  assignedTo: AssignedTarget[]
  sessionLink: string
  qrCode: string
  status: "draft" | "active" | "completed" | "expired"
  sessions: AssignmentSession[]
  instructions?: string
  sessionData?: Record<string, unknown>
}

export interface AssignedTarget {
  type: "individual" | "group" | "class"
  id: string
  name: string
}

export interface AssignmentSession {
  id: string
  assignmentInstanceId: string
  studentId: string
  studentName: string
  submittedDate?: string
  status: "not_started" | "in_progress" | "submitted" | "late"
  sessionData?: Record<string, unknown>
}

export interface Session {
  id: string
  assessmentId: string
  student: string
  studentId?: string
  status: "pending" | "feedback generated" | "reviewed"
  submittedDate: string
  content?: string
  score: number | null
  reviewedDate?: string
  teacherFeedback?: string
  flagged: boolean
  feedback: Feedback[]
}

export interface Feedback {
  type: "strength" | "improvement"
  section: string
  content: string
}

// Function to get assessments - returns mock data only
export async function getAssessments(): Promise<Assessment[]> {
  return mockAssessments
}

// Function to get sessions - returns mock data only
export async function getSessions(): Promise<Session[]> {
  return mockSessions
}

export const mockAssessments: Assessment[] = [
  {
    id: "assess-1",
    title: "Earth's Systems Interactions",
    unitName: "Earth Systems",
    subject: "Earth & Space Science",
    grade: 6,
    type: "Constructed Response",
    dueDate: "May 10, 2024",
    pendingRecords: 2,
    totalRecords: 25,
    description:
      "Students will explain how Earth's systems interact and analyze how changes in one system affect others.",
  },
  {
    id: "assess-2",
    title: "Energy Transfer Lab Report",
    unitName: "Energy & Matter",
    subject: "Physical Science",
    grade: 7,
    type: "Lab Assessment",
    dueDate: "May 12, 2024",
    pendingRecords: 5,
    totalRecords: 28,
  },
  {
    id: "assess-3",
    title: "Natural Selection Analysis",
    unitName: "Evolution",
    subject: "Life Science",
    grade: 8,
    type: "Data Analysis",
    dueDate: "May 15, 2024",
    pendingRecords: 0,
    totalRecords: 26,
  },
  {
    id: "assess-4",
    title: "Chemical Reactions Investigation",
    unitName: "Chemical Processes",
    subject: "Physical Science",
    grade: 7,
    type: "Hands-on Assessment",
    dueDate: "May 20, 2024",
    pendingRecords: 14,
    totalRecords: 27,
  },
  {
    id: "assess-5",
    title: "Ecosystem Modeling",
    unitName: "Biodiversity",
    subject: "Life Science",
    grade: 6,
    type: "Project-Based",
    dueDate: "May 25, 2024",
    pendingRecords: 20,
    totalRecords: 25,
  },
  {
    id: "assess-6",
    title: "Forces & Motion Explanation",
    unitName: "Physics of Motion",
    subject: "Physical Science",
    grade: 8,
    type: "Constructed Response",
    dueDate: "May 18, 2024",
    pendingRecords: 0,
    totalRecords: 28,
  },
  {
    id: "assess-7",
    title: "Green Anole Lizard Competition",
    unitName: "Genetics",
    subject: "Life Science",
    grade: 8,
    type: "Data Analysis",
    dueDate: "May 30, 2024",
    pendingRecords: 1,
    totalRecords: 24,
    description:
      "Students analyze how competition with brown anoles affects green anole traits on different islands using the General Model of Natural Selection.",
  },
]

export const mockAvailableAssessments: AvailableAssessment[] = [
  {
    id: "avail-1",
    title: "Water Cycle and Climate Systems",
    unitName: "Earth Systems",
    subject: "Earth & Space Science",
    grade: 6,
    type: "Constructed Response",
    description:
      "Students analyze the water cycle's role in Earth's climate system and explain how human activities impact these processes. Includes data interpretation and scientific explanation components.",
    pointValue: 25,
    estimatedDuration: "45 minutes",
    standards: ["MS-ESS2-4", "MS-ESS3-5"],
    difficulty: "Intermediate",
    tags: ["water cycle", "climate", "human impact", "data analysis"],
    createdDate: "2024-03-15",
    lastModified: "2024-04-20",
  },
  {
    id: "avail-2",
    title: "Energy Transfer in Ecosystems",
    unitName: "Energy & Matter",
    subject: "Physical Science",
    grade: 7,
    type: "Lab Assessment",
    description:
      "Hands-on investigation of energy transfer through food webs. Students design experiments, collect data, and analyze energy flow patterns in different ecosystem models.",
    pointValue: 30,
    estimatedDuration: "90 minutes",
    standards: ["MS-LS2-1", "MS-LS2-3"],
    difficulty: "Advanced",
    tags: ["energy transfer", "ecosystems", "food webs", "experimental design"],
    createdDate: "2024-03-10",
    lastModified: "2024-04-18",
  },
  {
    id: "avail-3",
    title: "Genetic Variation and Natural Selection",
    unitName: "Evolution",
    subject: "Life Science",
    grade: 8,
    type: "Data Analysis",
    description:
      "Students analyze real-world data sets showing genetic variation in populations and explain how natural selection leads to evolutionary changes over time.",
    pointValue: 20,
    estimatedDuration: "60 minutes",
    standards: ["MS-LS4-4", "MS-LS4-6"],
    difficulty: "Intermediate",
    tags: ["genetics", "natural selection", "evolution", "data interpretation"],
    createdDate: "2024-03-20",
    lastModified: "2024-04-25",
  },
  {
    id: "avail-4",
    title: "Chemical Reactions and Conservation",
    unitName: "Chemical Processes",
    subject: "Physical Science",
    grade: 7,
    type: "Hands-on Assessment",
    description:
      "Laboratory investigation of chemical reactions with emphasis on conservation of mass. Students plan investigations, collect evidence, and construct explanations.",
    pointValue: 35,
    estimatedDuration: "120 minutes",
    standards: ["MS-PS1-2", "MS-PS1-5"],
    difficulty: "Advanced",
    tags: ["chemical reactions", "conservation of mass", "investigation", "evidence"],
    createdDate: "2024-03-12",
    lastModified: "2024-04-22",
  },
  {
    id: "avail-5",
    title: "Biodiversity and Ecosystem Services",
    unitName: "Biodiversity",
    subject: "Life Science",
    grade: 6,
    type: "Project-Based",
    description:
      "Multi-part project where students research local biodiversity, analyze ecosystem services, and propose conservation strategies for their community.",
    pointValue: 40,
    estimatedDuration: "3-4 class periods",
    standards: ["MS-LS2-4", "MS-LS2-5"],
    difficulty: "Beginner",
    tags: ["biodiversity", "ecosystem services", "conservation", "research project"],
    createdDate: "2024-03-08",
    lastModified: "2024-04-15",
  },
  {
    id: "avail-6",
    title: "Forces, Motion, and Engineering Design",
    unitName: "Physics of Motion",
    subject: "Physical Science",
    grade: 8,
    type: "Engineering Challenge",
    description:
      "Students apply understanding of forces and motion to design and test solutions to engineering problems. Includes iterative design process and data collection.",
    pointValue: 45,
    estimatedDuration: "2-3 class periods",
    standards: ["MS-PS2-2", "MS-ETS1-3"],
    difficulty: "Advanced",
    tags: ["forces", "motion", "engineering design", "problem solving"],
    createdDate: "2024-03-18",
    lastModified: "2024-04-28",
  },
  {
    id: "avail-7",
    title: "Green Anole Lizard Competition",
    unitName: "Genetics",
    subject: "Life Science",
    grade: 8,
    type: "Data Analysis",
    description:
      "Construct an explanation for how the presence of brown anoles changes green anole traits over time on different islands.",
    pointValue: 15,
    estimatedDuration: "45 minutes",
    standards: ["MS-LS4-4", "MS-LS4-6"],
    difficulty: "Intermediate",
    tags: ["natural selection", "lizards", "competition", "evidence"],
    createdDate: "2024-04-01",
    lastModified: "2024-05-01",
  },
]

export const mockAssignmentInstances: AssignmentInstance[] = [
  {
    id: "assign-1",
    assessmentId: "avail-1",
    assignedBy: "Ms. Johnson",
    assignedDate: "2024-05-01",
    dueDate: "2024-05-15",
    assignedTo: [{ type: "class", id: "class-6a", name: "6th Grade - Section A" }],
    sessionLink: "https://opensci.ed/submit/assign-1",
    qrCode:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxNHB4Ij5RUiBDb2RlPC90ZXh0Pgo8L3N2Zz4K",
    status: "active",
    sessions: [
      {
        id: "sub-assign-1",
        assignmentInstanceId: "assign-1",
        studentId: "student-1",
        studentName: "Sophia Johnson",
        submittedDate: "2024-05-10",
        status: "submitted",
      },
      {
        id: "sub-assign-2",
        assignmentInstanceId: "assign-1",
        studentId: "student-2",
        studentName: "Ethan Williams",
        status: "in_progress",
      },
      {
        id: "sub-assign-3",
        assignmentInstanceId: "assign-1",
        studentId: "student-3",
        studentName: "Olivia Martinez",
        status: "not_started",
      },
    ],
    instructions:
      "Complete all three sections of the assessment. Pay special attention to the data analysis portion and use specific evidence from the provided graphs.",
  },
  {
    id: "assign-2",
    assessmentId: "avail-2",
    assignedBy: "Teacher A",
    assignedDate: "2024-05-10",
    dueDate: "2024-05-25",
    assignedTo: [{ type: "class", id: "class-7b", name: "7th Grade - Section B" }],
    sessionLink: "https://opensci.ed/submit/assign-2",
    qrCode:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxNHB4Ij5RUiBDb2RlPC90ZXh0Pgo8L3N2Zz4K",
    status: "active",
    sessions: [
      {
        id: "sub-assign-2-1",
        assignmentInstanceId: "assign-2",
        studentId: "student-4",
        studentName: "Liam Rodriguez",
        submittedDate: "2024-05-18",
        status: "submitted",
      },
      {
        id: "sub-assign-2-2",
        assignmentInstanceId: "assign-2",
        studentId: "student-5",
        studentName: "Emma Davis",
        submittedDate: "2024-05-18",
        status: "submitted",
      },
      {
        id: "sub-assign-2-3",
        assignmentInstanceId: "assign-2",
        studentId: "student-6",
        studentName: "Noah Thompson",
        status: "in_progress",
      },
      {
        id: "sub-assign-2-4",
        assignmentInstanceId: "assign-2",
        studentId: "student-7",
        studentName: "Olivia Martinez",
        status: "not_started",
      },
    ],
    instructions:
      "Complete the lab report thoroughly and include photos of your experiment setup.",
  },
  {
    id: "assign-3",
    assessmentId: "avail-7",
    assignedBy: "Mr. Lee",
    assignedDate: "2024-05-20",
    dueDate: "2024-06-05",
    assignedTo: [{ type: "class", id: "class-8c", name: "8th Grade - Section C" }],
    sessionLink: "https://opensci.ed/submit/assign-3",
    qrCode:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxNHB4Ij5RUiBDb2RlPC90ZXh0Pgo8L3N2Zz4K",
    status: "active",
    sessions: [
      {
        id: "sub-assign-3-1",
        assignmentInstanceId: "assign-3",
        studentId: "student-8",
        studentName: "Ava Nguyen",
        submittedDate: "2024-05-28",
        status: "submitted",
      },
      {
        id: "sub-assign-3-2",
        assignmentInstanceId: "assign-3",
        studentId: "student-9",
        studentName: "Mason Patel",
        status: "in_progress",
      },
      {
        id: "sub-assign-3-3",
        assignmentInstanceId: "assign-3",
        studentId: "student-10",
        studentName: "Isabella Brown",
        status: "not_started",
      },
    ],
    instructions:
      "Use the General Model of Natural Selection to explain how competition with brown anoles affects green anole traits.",
  },
]

export const mockSessions: Session[] = [
  {
    id: "sub-1",
    assessmentId: "assess-1",
    student: "Sophia Johnson",
    status: "reviewed",
    submittedDate: "May 9, 2024",
    score: 8,
    reviewedDate: "May 12, 2024",
    flagged: false,
    feedback: [
      {
        type: "strength",
        section: "Scientific Explanation",
        content:
          "Excellent work explaining the water cycle with accurate terminology. Your explanation clearly shows how water moves through Earth's systems and why this process is important.",
      },
      {
        type: "improvement",
        section: "Data Analysis",
        content:
          "Your analysis accurately identifies the temperature trend, but could be strengthened by providing specific evidence from the graph (e.g., specific years or temperature changes) to support your conclusions about human impact.",
      },
      {
        type: "strength",
        section: "Diagram",
        content:
          "Your diagram clearly shows the connections between Earth's four major systems. The arrows effectively illustrate matter and energy transfer between systems.",
      },
    ],
  },
  {
    id: "sub-2",
    assessmentId: "assess-1",
    student: "Ethan Williams",
    status: "feedback generated",
    submittedDate: "May 10, 2024",
    score: null,
    flagged: true,
    feedback: [
      {
        type: "strength",
        section: "Scientific Explanation",
        content:
          "You've provided a clear explanation of the water cycle that covers the key processes. Your connection to the importance for living things shows good understanding of how Earth's systems support life.",
      },
      {
        type: "improvement",
        section: "Data Analysis",
        content:
          "While you correctly identified that temperatures are rising, your analysis would be stronger if you discussed specific patterns in the data and provided more specific evidence for why human activities are the likely cause rather than natural cycles.",
      },
      {
        type: "improvement",
        section: "Diagram",
        content:
          "Your diagram includes all four Earth systems, but some connections between systems are missing or inaccurate. Consider showing how matter and energy transfer between each system pair with more specific examples.",
      },
    ],
  },
  {
    id: "sub-3",
    assessmentId: "assess-1",
    student: "Olivia Martinez",
    status: "pending",
    submittedDate: "May 10, 2024",
    score: null,
    flagged: false,
    feedback: [],
  },
  {
    id: "sub-4",
    assessmentId: "assess-1",
    student: "Noah Thompson",
    status: "feedback generated",
    submittedDate: "May 9, 2024",
    score: null,
    flagged: false,
    feedback: [
      {
        type: "strength",
        section: "Scientific Explanation",
        content:
          "Your explanation of the water cycle is thorough and scientifically accurate. You've correctly identified all major processes and used appropriate terminology throughout.",
      },
      {
        type: "strength",
        section: "Data Analysis",
        content:
          "Your analysis of the temperature data is detailed and shows strong critical thinking. You correctly identified the acceleration of warming since 1980 and made a well-supported connection to human activities.",
      },
      {
        type: "improvement",
        section: "Diagram",
        content:
          "While your diagram includes all four Earth systems, the interactions between the biosphere and geosphere could be more clearly illustrated. Consider adding examples of how living organisms interact with land features.",
      },
    ],
  },
  {
    id: "sub-5",
    assessmentId: "assess-1",
    student: "Emma Davis",
    status: "reviewed",
    submittedDate: "May 8, 2024",
    score: 7,
    reviewedDate: "May 11, 2024",
    flagged: false,
    feedback: [
      {
        type: "improvement",
        section: "Scientific Explanation",
        content:
          "Your explanation of the water cycle includes the main processes but could be improved by using more precise scientific vocabulary (e.g., 'condensation' instead of 'forming clouds') and explaining more about how energy from the sun drives the cycle.",
      },
      {
        type: "strength",
        section: "Data Analysis",
        content:
          "You've provided a thoughtful analysis of the temperature data and made good connections between the timing of temperature increases and human activities. Your conclusion is well supported by the evidence.",
      },
      {
        type: "strength",
        section: "Diagram",
        content:
          "Your diagram clearly shows all four Earth systems and includes multiple examples of interactions between each pair of systems. The arrows effectively show the direction of matter and energy transfer.",
      },
    ],
  },
  {
    id: "sub-6",
    assessmentId: "assess-1",
    student: "Liam Rodriguez",
    status: "pending",
    submittedDate: "May 10, 2024",
    score: null,
    flagged: false,
    feedback: [],
  },
  {
    id: "sub-green-1",
    assessmentId: "assess-7",
    student: "Ava Nguyen",
    status: "feedback generated",
    submittedDate: "May 28, 2024",
    score: null,
    flagged: false,
    feedback: [
      {
        type: "strength",
        section: "Model Explanation",
        content:
          "Clearly links limb-length changes to survival advantages on tree trunks.",
      },
      {
        type: "improvement",
        section: "Data Use",
        content: "Reference specific island data to support trends.",
      },
    ],
    content: `Timestamp: 4/28/2025 8:12:06\nHour: Hour 3\nQ1: When the green lizards were living in Florida alone they tended to stay high in the tree. when the brown lizards came the green lizards moved farther up the tree.\nQ2: The green lizards used to be farther down the tree but now they are farther up because of the brown lizards and this could change the green lizards to have a better grip because its harder to stay that high in a tree for a very long time and the brown lizards could have stronger jaws so they can eat the stronger branches on the bottom.\nai_annotated_response: **Part 1:** *When the green lizards were living in Florida alone they tended to stay high in the tree. when the brown lizards came the green lizards moved farther up the tree.* **Part 2:** *The green lizards used to be farther down the tree but now they are farther up because of the brown lizards and this could change the green lizards to have a better grip because its harder to stay that high in a tree for a very long time and the brown lizards could have stronger jaws so they can eat the stronger branches on the bottom.*\nai_score_SEP: 2.0\nai_score_DCI: 2.0\nai_score_CCC: 2.0\nai_score_Communication: 2.0\nai_score_Overall: 2.0\nai_feedback_strengths: - The student identifies the interaction between green and brown lizards and how this led to the green lizards moving higher up the tree, which demonstrates a basic understanding of environmental influence on behavior. - The response suggests a potential trait advantage (better grip for green lizards and stronger jaws for brown lizards), showing emerging reasoning about adaptation.\nai_feedback_suggestions: - Add more detail about how genetic variation in traits (e.g., grip strength) might lead to survival differences among green lizards at higher tree levels. This will strengthen the connection to natural selection. - Clarify how environmental changes (presence of brown lizards) create competition and how this competition results in the predominance of certain traits over generations. - Use cause-and-effect reasoning to explicitly explain how changes in the green lizard population occur over time due to inheritance of advantageous traits. - Organize the explanation in a logical structure with clear connections between environmental changes, trait advantages, and reproduction/inheritance.`
  },
  {
    id: "sub-green-2",
    assessmentId: "assess-7",
    student: "Mason Patel",
    status: "pending",
    submittedDate: "May 29, 2024",
    score: null,
    flagged: false,
    feedback: [],
  },
  {
    id: "sub-green-3",
    assessmentId: "assess-7",
    student: "Isabella Brown",
    status: "pending",
    submittedDate: "May 29, 2024",
    score: null,
    flagged: false,
    feedback: [],
  },
]
