
# PDFlexo - PDF Management & AI Tools

<div align="center">
  <img src="public/og-image.png" alt="PDFlexo Logo" width="250">
  <h3>A powerful browser-based PDF management suite with AI capabilities</h3>
  
  <p>
    <a href="#key-features">Features</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#desktop-application">Desktop App</a> •
    <a href="#development">Development</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#license">License</a>
  </p>
  
  <p><strong>⚠️ BETA VERSION ⚠️</strong><br />
  This software is currently in beta testing phase</p>
</div>

## Key Features

PDFlexo is a comprehensive PDF management tool that runs entirely in your browser, with all processing happening locally to ensure your documents remain private and secure.

- **View & Manage PDFs** - Open multiple PDFs in tabs, navigate, and organize your documents
- **Merge PDFs** - Combine multiple PDF files into a single document with drag-and-drop ordering
- **Split PDFs** - Divide larger documents into smaller ones by page ranges
- **AI-Powered Tools** <sup>BETA</sup>
  - **Summarize** - Generate concise summaries of document content
  - **Translate** - Convert documents between multiple languages
  - **Explain** - Simplify complex content for better understanding
  - **Format** - Convert paragraphs into structured formats like bullet points
  - **Extract** - Pull out key information like names, dates, and figures
  - **Answer** - Ask questions about document content and get accurate answers

## Getting Started

### Online Version

The easiest way to use PDFlexo is through our online version at [https://pdflexo.com](https://pdflexo.com)

### Local Installation

```sh
# Clone the repository
git clone https://github.com/yourusername/pdflexo.git

# Navigate to the project directory
cd pdflexo

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Desktop Application

PDFlexo is also available as a desktop application for Windows, macOS, and Linux. Download the latest version from our [releases page](https://github.com/yourusername/pdflexo/releases).

## Development

### Prerequisites

- Node.js 16.x or newer
- npm 7.x or newer

### Development Server

```sh
npm run dev
```

### Build for Production

```sh
npm run build
```

### Run Tests

```sh
npm test
```

## Tech Stack

PDFlexo is built with modern web technologies:

- [React](https://reactjs.org/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Vite](https://vitejs.dev/) - Build tool and development server
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF rendering
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Lucide](https://lucide.dev/) - Icon set
- [React Router](https://reactrouter.com/) - Routing
- [React Query](https://tanstack.com/query) - Data fetching and state management

## Privacy

PDFlexo processes all documents locally in your browser. Your files are never uploaded to any server unless you explicitly use cloud-based features.

## License

MIT License

Copyright (c) 2023 PDFlexo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
