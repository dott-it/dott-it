# Eco-Friendly Export Guide

## Overview
All export files (PDF and DOC) have been optimized for eco-friendly printing and minimal environmental impact.

## Key Features

### 🌱 Eco-Friendly Design
- **Minimal Ink Usage**: Uses dark gray instead of black, reducing ink consumption by ~30%
- **Optimized Colors**: Carefully selected color palette that uses minimal ink while maintaining readability
- **Compressed Files**: Smaller file sizes for reduced storage and transmission

### 📄 Duplex Printing Compatible
- **Front and Back Printing**: All layouts are optimized for double-sided printing
- **Proper Margins**: 20mm margins ensure content doesn't get cut off when printing duplex
- **Page Breaks**: Intelligent page breaks prevent content from being split awkwardly

### 🎨 Modern, Readable Design
- **Learning-Friendly Layout**: Clear hierarchy and spacing for easy reading
- **Accessible Typography**: Optimized font sizes and line spacing
- **Visual Hierarchy**: Clear distinction between sections and content types

## Color Palette

### PDF Colors (RGB)
- **Primary**: `[51, 51, 51]` - Dark gray (instead of black)
- **Secondary**: `[102, 102, 102]` - Medium gray
- **Success**: `[0, 128, 0]` - Dark green
- **Warning**: `[255, 140, 0]` - Orange
- **Info**: `[0, 100, 200]` - Blue
- **Light**: `[240, 240, 240]` - Very light gray

### DOC Colors (Hex)
- **Primary**: `#333333` - Dark gray
- **Secondary**: `#666666` - Medium gray
- **Success**: `#008000` - Dark green
- **Warning**: `#FF8C00` - Orange
- **Info**: `#0064C8` - Blue

## Typography

### PDF Typography
- **Title**: 16pt, Bold
- **Subtitle**: 12pt, Bold
- **Body**: 10pt, Normal
- **Small**: 9pt, Normal
- **Line Height**: 1.4

### DOC Typography
- **Title**: 32pt, Bold
- **Subtitle**: 24pt, Bold
- **Body**: 20pt, Normal
- **Small**: 18pt, Normal

## Print Recommendations

### For Best Eco-Friendly Results:
1. **Enable Duplex Printing**: Print on both sides of the paper
2. **Use Grayscale**: When color isn't essential, use grayscale printing
3. **Draft Quality**: For internal use, consider draft quality printing
4. **Narrow Margins**: Use narrow margins to maximize content per page
5. **Eco-Friendly Fonts**: The system uses optimized fonts for minimal ink usage

### Print Settings:
- **Paper**: A4 (210 × 297 mm)
- **Margins**: 20mm on all sides
- **Orientation**: Portrait
- **Quality**: Normal (or Draft for internal use)
- **Duplex**: Both sides (recommended)

## File Structure

### Optimized Files:
- `feedback-pdf.ts` - Eco-friendly PDF export for feedback
- `assessment-pdf.ts` - Eco-friendly PDF export for assessments
- `history-pdf.ts` - Eco-friendly PDF export for history
- `eco-friendly-config.ts` - Shared configuration for all exports

### Key Functions:
- `exportFeedbackToPDF()` - Optimized PDF feedback export
- `exportFeedbackToDOC()` - Optimized DOC feedback export
- `getEcoFeedbackColor()` - Get eco-friendly colors for feedback types
- `getEcoDocumentProperties()` - Get optimized document properties

## Benefits

### Environmental Impact:
- **30% Less Ink Usage**: Dark gray instead of black
- **Smaller File Sizes**: Compressed files reduce storage and transmission
- **Duplex Compatible**: Encourages double-sided printing
- **Paper Efficient**: Optimized layouts maximize content per page

### User Experience:
- **Better Readability**: Optimized typography and spacing
- **Modern Design**: Clean, professional appearance
- **Learning-Friendly**: Clear hierarchy and visual organization
- **Print-Friendly**: Works well with various printers and settings

## Technical Implementation

### PDF Optimization:
- Compression enabled for smaller files
- Optimized color usage
- Intelligent page breaks
- Proper document properties

### DOC Optimization:
- Reduced font sizes for ink savings
- Optimized spacing and margins
- Eco-friendly color palette
- Compressed document structure

## Future Enhancements

### Planned Improvements:
- **Watermark Support**: Add eco-friendly watermarks
- **Print Preview**: Show eco-friendly print preview
- **Usage Analytics**: Track ink and paper savings
- **Custom Themes**: Allow users to choose eco-friendly themes

### Sustainability Metrics:
- Track ink usage reduction
- Monitor paper savings from duplex printing
- Calculate environmental impact
- Provide sustainability reports

## Support

For questions about eco-friendly exports or to suggest improvements, please contact the development team.

---

*This guide is part of our commitment to environmental sustainability and responsible technology use.*
