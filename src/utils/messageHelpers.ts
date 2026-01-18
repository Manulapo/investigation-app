// Helper utilities for message processing
export function countWords(input: any): number {
    if (!input) return 0
    if (Array.isArray(input)) return input.reduce((s, it) => s + countWords(it), 0)
    const str = String(input).trim()
    if (!str) return 0
    return str.split(/\s+/).filter(Boolean).length
}

export default { countWords }
