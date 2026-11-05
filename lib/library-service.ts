// Note: Prisma client is imported for future database integration
// Currently using static data, but structure allows for easy migration to database

// OpenSciEd Middle School Grades and Units
export const openSciEdGrades = [
    {
        grade: "6",
        label: "Grade 6",
        description: "Explore the foundations of physical, earth, and life science with hands-on investigations and real-world phenomena.",
        units: [
            { id: "6.1", title: "Light & Matter" },
            { id: "6.2", title: "Thermal Energy" },
            { id: "6.3", title: "Weather, Climate & Water Cycling" },
            { id: "6.4", title: "Plate Tectonics & Rock Cycling" },
            { id: "6.5", title: "Natural Hazards" },
            { id: "6.6", title: "Cells & Systems" },
        ],
    },
    {
        grade: "7",
        label: "Grade 7",
        description: "Deepen understanding of chemical reactions, ecosystems, and human impact through engaging labs and projects.",
        units: [
            { id: "7.1", title: "Chemical Reactions & Matter Transformation" },
            { id: "7.2", title: "Chemical Reactions & Energy" },
            { id: "7.3", title: "Metabolic Reactions" },
            { id: "7.4", title: "Matter Cycling & Photosynthesis" },
            { id: "7.5", title: "Ecosystem Dynamics & Biodiversity" },
            { id: "7.6", title: "Earth's Resources & Human Impact" },
        ],
    },
    {
        grade: "8",
        label: "Grade 8",
        description: "Investigate forces, genetics, and the universe with advanced experiments and data analysis.",
        units: [
            { id: "8.1", title: "Contact Forces" },
            { id: "8.2", title: "Sound Waves" },
            { id: "8.3", title: "Forces at a Distance" },
            { id: "8.4", title: "Earth in Space" },
            { id: "8.5", title: "Genetics" },
            { id: "8.6", title: "Natural Selection & Common Ancestry" },
        ],
    },
]

// OpenSciEd Units with detailed information
export const openSciEdUnits = [
    // Grade 6 units
    {
        id: "1",
        unitNumber: "6.1",
        title: "Light & Matter",
        subject: "Physical Science",
        grade: 6,
        question: "Why do we sometimes see different things when looking at the same object?",
        description: "Students investigate how light interacts with matter to create different visual experiences.",
        standards: ["MS-PS4-2", "MS-PS1-4"],
        link: "https://openscied.org/instructional-materials/6-1-light-matter/",
    },
    {
        id: "2",
        unitNumber: "6.2",
        title: "Thermal Energy",
        subject: "Physical Science",
        grade: 6,
        question: "How can containers keep stuff from warming up or cooling down?",
        description: "Students investigate thermal energy transfer and design solutions to control temperature.",
        standards: ["MS-PS3-3", "MS-PS3-4"],
        link: "https://openscied.org/instructional-materials/6-2-thermal-energy/",
    },
    {
        id: "3",
        unitNumber: "6.3",
        title: "Weather, Climate & Water Cycling",
        subject: "Earth & Space Science",
        grade: 6,
        question: "Why does a lot of hail, rain, or snow fall at some times and not others?",
        description: "Students analyze weather patterns and the water cycle's role in Earth's climate system.",
        standards: ["MS-ESS2-4", "MS-ESS3-5"],
        link: "https://openscied.org/instructional-materials/6-3-weather-climate-water-cycling/",
    },
    {
        id: "4",
        unitNumber: "6.4",
        title: "Plate Tectonics & Rock Cycling",
        subject: "Earth & Space Science",
        grade: 6,
        question: "What causes Earth's surface to change?",
        description: "Students analyze evidence for plate tectonics and explain how rock cycling shapes Earth's surface.",
        standards: ["MS-ESS1-4", "MS-ESS2-1"],
        link: "https://openscied.org/instructional-materials/6-4-rock-cycling-plate-tectonics/",
    },
    {
        id: "5",
        unitNumber: "6.5",
        title: "Natural Hazards",
        subject: "Earth & Space Science",
        grade: 6,
        question: "Where do natural hazards happen and how do we prepare for them?",
        description: "Students investigate natural hazard patterns and develop emergency preparedness plans.",
        standards: ["MS-ESS3-2", "MS-ESS3-3"],
        link: "https://openscied.org/instructional-materials/6-5-natural-hazards/",
    },
    {
        id: "6",
        unitNumber: "6.6",
        title: "Cells & Systems",
        subject: "Life Science",
        grade: 6,
        question: "How do living things heal?",
        description: "Students investigate how cells and body systems work together to maintain life and respond to injury.",
        standards: ["MS-LS1-3", "MS-LS1-8"],
        link: "https://openscied.org/instructional-materials/6-6-cells-systems/",
    },
    // Grade 7 units
    {
        id: "7",
        unitNumber: "7.1",
        title: "Chemical Reactions & Matter",
        subject: "Physical Science",
        grade: 7,
        question: "How can we make something new that was not there before?",
        description: "Students design investigations to understand chemical reactions and conservation of matter.",
        standards: ["MS-PS1-2", "MS-PS1-5"],
        link: "https://openscied.org/instructional-materials/7-1-chemical-reactions-matter/",
    },
    {
        id: "8",
        unitNumber: "7.2",
        title: "Chemical Reactions & Energy",
        subject: "Physical Science",
        grade: 7,
        question: "How can we use chemical reactions to design a solution to a problem?",
        description: "Students design flameless heaters using energy-releasing chemical reactions.",
        standards: ["MS-PS1-6", "MS-ETS1-2"],
        link: "https://openscied.org/instructional-materials/7-2-chemical-reactions-energy/",
    },
    {
        id: "9",
        unitNumber: "7.3",
        title: "Metabolic Reactions",
        subject: "Life Science",
        grade: 7,
        question: "How do things inside our bodies work together to make us feel the way we do?",
        description: "Students investigate cellular respiration and metabolic processes.",
        standards: ["MS-LS1-5", "MS-LS1-7"],
        link: "https://openscied.org/instructional-materials/7-3-metabolic-reactions/",
    },
    {
        id: "10",
        unitNumber: "7.4",
        title: "Matter Cycling & Photosynthesis",
        subject: "Life Science",
        grade: 7,
        question: "Where does food come from and where does it go next?",
        description: "Students investigate photosynthesis and matter cycling in ecosystems.",
        standards: ["MS-LS1-5", "MS-LS2-3"],
        link: "https://openscied.org/instructional-materials/7-4-matter-cycling-photosynthesis/",
    },
    {
        id: "11",
        unitNumber: "7.5",
        title: "Ecosystem Dynamics",
        subject: "Life Science",
        grade: 7,
        question: "How does changing an ecosystem affect what lives there?",
        description: "Students investigate energy transfer through food webs and analyze ecosystem interactions.",
        standards: ["MS-LS2-1", "MS-LS2-3"],
        link: "https://openscied.org/instructional-materials/7-5-ecosystem-dynamics/",
    },
    {
        id: "12",
        unitNumber: "7.6",
        title: "Earth's Resources & Human Impact",
        subject: "Earth & Space Science",
        grade: 7,
        question: "How do changes in the Earth's system impact our communities and what can we do about it?",
        description: "Students analyze human impacts on Earth's systems.",
        standards: ["MS-ESS3-3", "MS-ESS3-4"],
        link: "https://openscied.org/instructional-materials/7-6-earth-resources-human-impact/",
    },
    // Grade 8 units
    {
        id: "13",
        unitNumber: "8.1",
        title: "Contact Forces",
        subject: "Physical Science",
        grade: 8,
        question: "Why do things sometimes get damaged when they hit each other?",
        description: "Students explore collisions, forces, and engineer solutions to protect objects from damage.",
        standards: ["MS-PS2-1", "MS-PS2-2", "MS-PS3-1", "MS-ETS1-2", "MS-ETS1-3", "MS-LS1-8"],
        link: "https://openscied.org/instructional-materials/8-1-contact-forces/",
    },
    {
        id: "14",
        unitNumber: "8.2",
        title: "Sound Waves",
        subject: "Physical Science",
        grade: 8,
        question: "How can a sound make something move?",
        description: "Students investigate sound, vibrations, and energy transfer in physical systems.",
        standards: ["MS-PS4-1", "MS-PS4-2", "MS-PS4-3"],
        link: "https://openscied.org/instructional-materials/8-2-sound-waves/",
    },
    {
        id: "15",
        unitNumber: "8.3",
        title: "Forces at a Distance",
        subject: "Physical Science",
        grade: 8,
        question: "How can a magnet move another object without touching it?",
        description: "Students explore magnetic and gravitational forces and their effects.",
        standards: ["MS-PS2-3", "MS-PS2-5", "MS-PS3-2"],
        link: "https://openscied.org/instructional-materials/8-3-forces-at-a-distance/",
    },
    {
        id: "16",
        unitNumber: "8.4",
        title: "Earth in Space",
        subject: "Earth & Space Science",
        grade: 8,
        question: "How are we connected to the patterns we see in the sky and space?",
        description: "Students model the Earth-Sun-Moon system and explore celestial patterns.",
        standards: ["MS-ESS1-1", "MS-ESS1-2", "MS-ESS1-3", "MS-PS2-4", "MS-PS4-2"],
        link: "https://openscied.org/instructional-materials/8-4-earth-in-space/",
    },
    {
        id: "17",
        unitNumber: "8.5",
        title: "Genetics",
        subject: "Life Science",
        grade: 8,
        question: "Why are living things different from one another?",
        description: "Students investigate inheritance, variation, and genetic traits.",
        standards: ["MS-LS3-1", "MS-LS3-2", "MS-LS4-2"],
        link: "https://openscied.org/instructional-materials/8-5-genetics/",
    },
    {
        id: "18",
        unitNumber: "8.6",
        title: "Natural Selection & Common Ancestry",
        subject: "Life Science",
        grade: 8,
        question: "How could things living today be connected to the things that lived long ago?",
        description: "Students explore natural selection, adaptation, and evolutionary relationships.",
        standards: ["MS-LS1-4", "MS-LS4-1", "MS-LS4-2", "MS-LS4-3", "MS-LS4-4", "MS-LS4-6"],
        link: "https://openscied.org/instructional-materials/8-6-natural-selection-common-ancestry/",
    },
]

// High School Subjects
export const highSchoolSubjects = [
    {
        subject: 'Biology',
        label: 'Biology',
        description: 'Explore ecosystems, genetics, evolution, and the diversity of life with hands-on labs and inquiry-based learning.',
        units: [
            {
                id: 'B.1',
                unitNumber: 'B.1',
                title: 'Ecosystem Interactions & Dynamics',
                question: 'How do ecosystems work, and how can understanding them help us protect them?',
                subject: 'Biology',
                description: 'Students analyze ecosystem interactions and develop conservation strategies.',
                standards: ['HS-LS2-1', 'HS-LS2-6'],
                link: 'https://openscied.org/instructional-materials/b-1-ecosystem-interactions-dynamics/',
            },
            {
                id: 'B.2',
                unitNumber: 'B.2',
                title: 'Ecosystems: Matter & Energy',
                question: 'What causes fires in ecosystems to burn, and how should we manage them?',
                subject: 'Biology',
                description: 'Students investigate matter and energy flow in ecosystems and develop fire management strategies.',
                standards: ['HS-LS2-3', 'HS-LS2-4'],
                link: 'https://openscied.org/instructional-materials/b-2-ecosystems-matter-energy/',
            },
            {
                id: 'B.3',
                unitNumber: 'B.3',
                title: 'Inheritance & Variation of Traits',
                question: 'Who gets cancer and why? What can we do about it?',
                subject: 'Biology',
                description: 'Students analyze genetic data to understand inheritance patterns and disease risk factors.',
                standards: ['HS-LS3-1', 'HS-LS3-2'],
                link: 'https://openscied.org/instructional-materials/b-3-inheritance-variation-of-traits/',
            },
        ],
        curriculumLink: 'https://openscied.org/instructional-materials/high-school-biology/',
    },
    {
        subject: 'Chemistry',
        label: 'Chemistry',
        description: 'Investigate matter, energy, and chemical reactions through laboratory experiments and molecular modeling.',
        units: [
            {
                id: 'C.1',
                unitNumber: 'C.1',
                title: 'Structure & Properties of Matter',
                question: 'How can we explain the properties of materials around us?',
                subject: 'Chemistry',
                description: 'Students investigate atomic structure and molecular interactions.',
                standards: ['HS-PS1-1', 'HS-PS1-3'],
                link: 'https://openscied.org/instructional-materials/c-1-structure-properties-matter/',
            },
            {
                id: 'C.2',
                unitNumber: 'C.2',
                title: 'Chemical Reactions',
                question: 'How do we make something new that was not there before?',
                subject: 'Chemistry',
                description: 'Students design and analyze chemical reactions and their applications.',
                standards: ['HS-PS1-2', 'HS-PS1-7'],
                link: 'https://openscied.org/instructional-materials/c-2-chemical-reactions/',
            },
        ],
        curriculumLink: 'https://openscied.org/instructional-materials/high-school-chemistry/',
    },
    {
        subject: 'Physics',
        label: 'Physics',
        description: 'Explore forces, energy, and motion through mathematical modeling and experimental design.',
        units: [
            {
                id: 'P.1',
                unitNumber: 'P.1',
                title: 'Forces & Motion',
                question: 'How can we predict an object\'s continued motion, changes in motion, and stability?',
                subject: 'Physics',
                description: 'Students investigate Newton\'s laws and their applications to real-world systems.',
                standards: ['HS-PS2-1', 'HS-PS2-2'],
                link: 'https://openscied.org/instructional-materials/p-1-forces-motion/',
            },
            {
                id: 'P.2',
                unitNumber: 'P.2',
                title: 'Energy & Fields',
                question: 'How can energy be transferred from one object or system to another?',
                subject: 'Physics',
                description: 'Students explore energy conservation and field interactions.',
                standards: ['HS-PS3-1', 'HS-PS3-2'],
                link: 'https://openscied.org/instructional-materials/p-2-energy-fields/',
            },
        ],
        curriculumLink: 'https://openscied.org/instructional-materials/high-school-physics/',
    },
]

// Service functions for library data
export async function getOpenSciEdGrades() {
    return openSciEdGrades
}

export async function getOpenSciEdUnits() {
    return openSciEdUnits
}

export async function getOpenSciEdUnitsByGrade(grade: string) {
    return openSciEdUnits.filter(unit => unit.grade.toString() === grade)
}

export async function getOpenSciEdUnitById(unitId: string) {
    return openSciEdUnits.find(unit => unit.id === unitId || unit.unitNumber === unitId)
}

export async function getHighSchoolSubjects() {
    return highSchoolSubjects
}

export async function getHighSchoolSubjectBySubject(subject: string) {
    return highSchoolSubjects.find(s => s.subject.toLowerCase() === subject.toLowerCase())
}

export async function getLibraryStatistics() {
    const middleSchoolUnits = openSciEdUnits.length
    const highSchoolUnits = highSchoolSubjects.reduce((total, subject) => total + subject.units.length, 0)
    const totalUnits = middleSchoolUnits + highSchoolUnits
    const totalSubjects = 3 + highSchoolSubjects.length // 3 middle school subjects + high school subjects

    return {
        totalCourses: 3, // Middle School, High School Biology, Chemistry, Physics
        totalUnits,
        totalSubjects,
        middleSchoolUnits,
        highSchoolUnits,
    }
}

// Function to get subject color tint for UI
export function getSubjectTint(subject: string): string {
    switch (subject.toLowerCase()) {
        case 'physical science': {
            return 'bg-blue-50 border-l-4 border-l-blue-500'
        }
        case 'life science': {
            return 'bg-green-50 border-l-4 border-l-green-500'
        }
        case 'earth & space science': {
            return 'bg-orange-50 border-l-4 border-l-orange-500'
        }
        case 'biology': {
            return 'bg-green-50 border-l-4 border-l-green-500'
        }
        case 'chemistry': {
            return 'bg-purple-50 border-l-4 border-l-purple-500'
        }
        case 'physics': {
            return 'bg-blue-50 border-l-4 border-l-blue-500'
        }
        default: {
            return 'bg-gray-50 border-l-4 border-l-gray-500'
        }
    }
} 