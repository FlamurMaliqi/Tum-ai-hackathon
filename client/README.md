# Client Development

## Getting Started

This client directory is set up to use [Vite](https://vitejs.dev/) for fast development and building.

### Creating a New Vite App

To create a new Vite application in this directory:

```bash
npm create vite@latest .
```

When prompted:
- **Select a framework**: Choose your preferred framework (React, Vue, Svelte, etc.)
- **Select a variant**: Choose TypeScript or JavaScript
- **Project name**: Use `.` to create the app in the current directory

Alternatively, you can specify everything in one command:

```bash
npm create vite@latest . -- --template react-ts
```

### After Creating the App

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

### Docker

The Dockerfile is configured to build and serve your Vite app. The default port is 3000, which matches the compose.yaml configuration.

