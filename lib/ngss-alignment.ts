import fs from 'node:fs'
import path from 'node:path'

export function loadNGSSAlignment() {
    try {
        const alignmentPath = path.join(process.cwd(), 'data', 'seed', 'ngss_alignment.json')
        const fileContent = fs.readFileSync(alignmentPath, 'utf8')
        return JSON.parse(fileContent)
    } catch (error) {
        console.error('Error loading NGSS alignment:', error)
        return { standards: {} }
    }
}

export function getStandardDetails(code: string) {
    const alignment = loadNGSSAlignment()
    return alignment.standards[code] || null
} 