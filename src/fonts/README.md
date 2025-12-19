# SF Pro Font Configuration

This project uses SF Pro font through system font fallbacks for optimal performance and compatibility.

## Current Setup

The project is configured to use SF Pro fonts through system font fallbacks:

### Font Stack Priority
1. **-apple-system** (macOS/iOS system font - closest to SF Pro)
2. **BlinkMacSystemFont** (macOS Chrome)
3. **SF Pro Display/Text** (if available on system)
4. **Segoe UI** (Windows)
5. **Roboto** (Android)
6. **Helvetica Neue, Arial** (generic fallbacks)

## Configuration Files

- `src/app/layout.tsx` - Font configuration
- `src/app/globals.css` - CSS font declarations
- `tailwind.config.ts` - Tailwind font family configuration

## Usage in Components

```tsx
// Using Tailwind classes
<div className="font-sf-pro">Text with SF Pro</div>
<div className="font-sf-pro-display">Heading with SF Pro Display</div>
<div className="font-sf-pro-text">Body text with SF Pro Text</div>

// Using CSS variables
<div style={{ fontFamily: 'var(--font-sf-pro)' }}>Text with SF Pro</div>
```

## Font Weights

All standard font weights are supported:
- `font-normal` (400)
- `font-medium` (500)
- `font-semibold` (600)
- `font-bold` (700)

## Benefits of This Approach

1. **No Font Loading**: Uses system fonts for instant loading
2. **Cross-Platform**: Works on all devices with appropriate fallbacks
3. **Performance**: No additional HTTP requests for font files
4. **Native Feel**: Uses the device's native font rendering

## Adding Custom SF Pro Files (Optional)

If you want to add actual SF Pro font files:

1. Download SF Pro fonts from Apple Developer
2. Convert to WOFF2 format
3. Place in this directory
4. Update `src/app/layout.tsx` to use `localFont` from `next/font/local`
5. Update font paths in the configuration

## Current Status

✅ **System font fallbacks configured**
✅ **Tailwind classes ready**
✅ **Cross-platform compatibility**
✅ **Performance optimized**

