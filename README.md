# SVG MCP Server

An MCP server providing access to **200,000+ icons** from 150+ libraries. Search, retrieve, convert, and optimize icons for your applications.

## Installation

```bash
git clone https://github.com/devstroop/svg-mcp.git
cd svg-mcp
npm install
npm run build
```

## Setup

**VS Code** (`.vscode/mcp.json`):
```json
{
  "servers": {
    "svg": {
      "command": "node",
      "args": ["/path/to/svg-mcp/dist/index.js"]
    }
  }
}
```

**Claude Desktop** (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "svg": {
      "command": "node",
      "args": ["/path/to/svg-mcp/dist/index.js"]
    }
  }
}
```

---

## Tools

### `recommend_icons`
Get icon suggestions for UI use cases.

```
useCase: "navigation" | "ecommerce" | "user" | "status" | "settings" | "social" | ...
```

### `search_icons`
Search 200k+ icons by keyword.

```
query: "shopping cart"
limit: 10
```

### `get_icon`
Get a single icon as SVG/PNG.

```
name: "lucide:home"
size: 24
color: "#000"
```

### `get_multiple_icons`
Batch fetch up to 50 icons.

```
icons: [{ name: "lucide:home" }, { name: "lucide:user" }]
```

### `list_libraries`
List available icon libraries.

### `list_categories`
Get categories from a library.

### `create_sprite`
Combine icons into a single SVG sprite.

```
icons: ["lucide:home", "lucide:user"]
library: "iconify"
optimize: true
```

### `convert_icon`
Convert SVG → PNG at any size.

```
iconData: "<svg>...</svg>"
toFormat: "png"
size: 128
```

### `optimize_svg`
Compress SVG with SVGO (50-70% reduction).

---

## Icon Format

Icons use `prefix:name` format:

| Prefix | Library | Count |
|--------|---------|-------|
| `lucide` | Lucide | 1,500+ |
| `mdi` | Material Design | 7,000+ |
| `heroicons` | Heroicons | 300+ |
| `tabler` | Tabler | 5,000+ |
| `ph` | Phosphor | 7,000+ |
| `fa6-solid` | Font Awesome | 2,000+ |
| `simple-icons` | Brand Logos | 3,000+ |

Browse all: [icon-sets.iconify.design](https://icon-sets.iconify.design/)

---

## Examples

**Get home icon:**
```json
{ "name": "lucide:home" }
```

**Search icons:**
```json
{ "query": "arrow", "limit": 5 }
```

**Dashboard icons:**
```json
{
  "icons": [
    { "name": "lucide:home" },
    { "name": "lucide:users" },
    { "name": "lucide:settings" }
  ]
}
```

**Status icons with colors:**
```json
{
  "icons": [
    { "name": "lucide:check", "color": "#22c55e" },
    { "name": "lucide:x", "color": "#ef4444" }
  ]
}
```

---

## License

MIT
