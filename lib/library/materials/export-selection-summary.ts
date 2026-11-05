export function exportSelectionSummary(count: number): string {
  if (count === 0) {
    return 'Select materials to export to your Google Drive.'
  }
  const noun = count === 1 ? 'material' : 'materials'
  return `${count} ${noun} selected — copies will be placed in your Drive.`
}
