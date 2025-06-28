# Icons MCP Server

A Model Context Protocol (MCP) server that provides programmatic access to icon libraries and icon-related operations.

## Features

- 🔍 **Search Icons** - Search across multiple icon libraries
- 📦 **Multiple Providers** - Support for Font Awesome, Material Icons, Feather, and more
- 🎨 **Format Conversion** - Convert between SVG, PNG, and other formats
- 💾 **Smart Caching** - Cache frequently accessed icons for better performance
- 🏷️ **Rich Metadata** - Get icon categories, tags, and usage recommendations
- 🚀 **Sprite Generation** - Create optimized icon sprite sheets
- 🧹 **SVG Optimization** - Clean and optimize SVG files by removing unnecessary metadata and attributes

## Installation

```bash
npm install icones-mcp
```

## Configuration

```json
{
  "mcpServers": {
    "icones": {
      "command": "node",
      "args": ["path/to/icones-mcp/dist/index.js"],
      "env": {
        "ICONS_CACHE_DIR": "/tmp/icons-cache",
        "ICONS_API_KEY": "your-api-key-if-needed"
      }
    }
  }
}
```

## Available Tools

### search_icons
Search for icons across multiple libraries.

```typescript
{
  "query": "home",
  "libraries": ["fontawesome", "material"],
  "limit": 20
}
```

### get_icon
Retrieve a specific icon in the desired format.

```typescript
{
  "name": "home",
  "library": "fontawesome",
  "format": "svg",
  "size": 24,
  "color": "#000000",
  "optimize": true  // Enable SVG optimization
}
```

### list_categories
Get available icon categories from a library.

```typescript
{
  "library": "material"
}
```

### convert_icon
Convert an icon between different formats.

```typescript
{
  "iconData": "<svg>...</svg>",
  "fromFormat": "svg",
  "toFormat": "png",
  "size": 64
}
```

### create_sprite
Generate an icon sprite sheet.

```typescript
{
  "icons": ["home", "user", "settings"],
  "library": "fontawesome",
  "format": "svg",
  "optimize": true  // Optimize the sprite
}
```

### optimize_svg
Clean and optimize SVG files.

```typescript
{
  "svgContent": "<svg>...</svg>",
  "options": {
    "removeMetadata": true,
    "removeComments": true,
    "removeDimensions": false,
    "removeViewBox": false,
    "removeStyleElements": true,
    "removeScriptElements": true,
    "removeTitle": false,
    "removeDesc": false,
    "removeUselessDefs": true,
    "removeEditorsNSData": true,
    "removeEmptyAttrs": true,
    "removeHiddenElems": true,
    "removeEmptyText": true,
    "removeEmptyContainers": true,
    "cleanupIDs": true,
    "minifyStyles": true,
    "convertColors": {
      "currentColor": false,
      "names2hex": true,
      "rgb2hex": true
    }
  }
}
```

## Supported Icon Libraries

- Font Awesome (Free & Pro)
- Material Design Icons
- Feather Icons
- Heroicons
- Bootstrap Icons
- Tabler Icons
- Simple Icons

## SVG Optimization Features

The Icons MCP server includes comprehensive SVG optimization capabilities:

### Automatic Cleanup
- Remove unnecessary metadata and comments
- Strip editor-specific namespaces (Adobe Illustrator, Sketch, etc.)
- Remove empty elements and attributes
- Clean up IDs and classes

### Size Optimization
- Minify styles
- Convert colors to shorter representations
- Remove redundant attributes
- Optimize path data

### Placeholder Handling
- Remove placeholder elements
- Clean up temporary layers
- Strip debugging information
- Remove hidden elements

### Customizable Options
- Configure which optimizations to apply
- Preserve specific attributes when needed
- Control color conversions
- Maintain accessibility features (title, desc)

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Run tests
npm test
```

## Architecture

```
icones-mcp/
├── src/
│   ├── index.ts          # MCP server entry point
│   ├── providers/        # Icon library providers
│   │   ├── fontawesome.ts
│   │   ├── material.ts
│   │   └── ...
│   ├── tools/           # MCP tool implementations
│   │   ├── search.ts
│   │   ├── retrieve.ts
│   │   ├── optimize.ts  # SVG optimization tool
│   │   └── ...
│   ├── utils/           # Utility functions
│   │   ├── cache.ts
│   │   ├── converter.ts
│   │   ├── svg-optimizer.ts  # SVG optimization logic
│   │   └── ...
│   └── types/           # TypeScript type definitions
├── tests/               # Test files
├── dist/               # Compiled output
└── package.json
```

## Example Usage

### Getting an optimized icon
```javascript
// Request an icon with optimization
const result = await mcp.callTool('get_icon', {
  name: 'home',
  library: 'fontawesome',
  format: 'svg',
  optimize: true
});

// Result will contain a cleaned, optimized SVG
```

### Batch optimization
```javascript
// Optimize multiple SVG files
const optimized = await mcp.callTool('optimize_svg', {
  svgContent: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">...</svg>',
  options: {
    removeMetadata: true,
    removeComments: true,
    minifyStyles: true
  }
});
```

## Roadmap

- [x] Basic icon search and retrieval
- [x] SVG optimization and cleanup
- [ ] SVG to PNG conversion
- [ ] Icon sprite generation
- [ ] Caching layer
- [ ] Support for premium icon libraries
- [ ] Batch operations
- [ ] Icon usage analytics
- [ ] Custom icon upload support
- [ ] Advanced placeholder detection and removal
- [ ] Icon accessibility improvements

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Built on top of the [Model Context Protocol](https://modelcontextprotocol.io/)
- Icon data provided by respective icon library maintainers
- SVG optimization powered by SVGO and custom algorithms
