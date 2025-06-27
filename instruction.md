Absolument. Voici une proposition de prompt complet et détaillé, conçu pour initialiser une IA afin de reconstruire votre projet `ai-prompt-tool` sur des bases modernes et robustes. Ce prompt intègre toutes les fonctionnalités et améliorations que nous avons discutées, en utilisant les meilleures pratiques de prompt engineering pour guider l'IA pas à pas.

---

### **PROMPT COMPLET POUR L'IA**

====================================
ROLE AND EXPERTISE
====================================
You are an expert full-stack software architect and senior developer. Your expertise covers modern web application development, including system design, database architecture, backend and frontend implementation, and containerization. You excel at migrating legacy projects to robust, scalable, and maintainable technology stacks. You write clean, well-documented, and efficient code in TypeScript.

====================================
PROJECT CONTEXT: FROM v1 to v2
====================================
I am providing you with the complete codebase of an existing project called `ai-prompt-tool` (let's call it v1). This tool helps me build complex prompts for LLMs by analyzing a local project directory.

The v1 architecture has significant flaws: it started as a command-line script and had a web UI bolted on later. This resulted in a fragile system relying on Node.js calling Python scripts (`child_process.exec`), with configuration managed through manually edited YAML files. This is not a sustainable model.

Your primary mission is to lead the complete rewrite of this tool into a modern, database-driven, real-time web application (v2). You must **NOT** replicate the v1 architecture. Instead, you will analyze the v1 code to understand its core *business logic* and *user-facing features*, then reimplement them correctly within the new, superior architecture.

**Key v1 Files to Analyze for Business Logic:**
*   `scripts/generate_structure.py`: Understand the logic for scanning a directory, respecting `exclude_patterns`, and building a project tree. Note how it handles wildcards. This logic needs to be ported to TypeScript/Node.js.
*   `scripts/generate_prompt.py` & `templates/prompt_template.txt.jinja2`: Understand the core templating logic. This is about assembling different pieces of context (role, request, structure, code content, format instructions) into a final string. This logic will be ported to use Nunjucks in Node.js.
*   `config/formats/*.txt`: Analyze the structure of these files. They contain instructions and examples for the AI's response format. This feature will be migrated to a database model.
*   `config/project_data.yaml` & `perso/*.md`: These files show the *intent* of providing detailed project context and persona information to the prompt. This will also be migrated to a database model.
*   `server.js`: Observe the fragile API endpoints that wrap Python script executions. This entire communication layer will be replaced with a pure TypeScript REST API.
*   `web_ui/index.html` & `web_ui/configuration.html`: Understand the basic UI components that existed in v1 (file tree, selectors, text areas). The v2 UI will be far more advanced but will serve similar purposes.

====================================
DYNAMIC TASK - USER REQUEST
====================================
Your task is to design and implement the v2 of `ai-prompt-tool` from scratch. The new application will be a self-contained, containerized, full-stack application with a clear separation of concerns, a persistent database, and a real-time user interface.

### **1. Core Philosophy of v2**

*   **Database-Driven:** All user configurations (projects, formats, roles, settings) are stored in a PostgreSQL database, not in files.
*   **API-First:** The backend provides a clean, stateless RESTful API for all operations.
*   **Real-Time:** The UI updates automatically when changes are made to the local filesystem, using WebSockets for communication.
*   **User-Centric:** The UI is intuitive, allowing users to manage all configurations through graphical interfaces, not by editing text files.

### **2. Technology Stack**

*   **Monorepo Structure:** Use a simple folder-based monorepo (`/backend`, `/frontend`).
*   **Backend:**
    *   Language: **TypeScript**
    *   Framework: **Fastify** (for its performance and developer experience)
    *   ORM: **Prisma**
    *   Real-time: **`socket.io`**
    *   Filesystem Watcher: **`chokidar`**
    *   Templating: **Nunjucks** (as a replacement for Jinja2)
*   **Frontend:**
    *   Framework: **React** with **TypeScript** and **Vite**
    *   State Management: **Zustand** (for its simplicity and power)
    *   Styling: **Tailwind CSS** (for rapid UI development)
    *   Real-time: **`socket.io-client`**
*   **Database:** **PostgreSQL**
*   **Containerization:** **Docker** and **`docker-compose`** for development and production environments.

### **3. Database Schema (`schema.prisma`)**

You will define the following models. This is the foundation of the entire application.

```prisma
// This is a guide for your schema.prisma file

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// A Workspace represents a project directory the user is working on.
model Workspace {
  id                String   @id @default(cuid())
  name              String
  path              String   @unique // Absolute path to the project directory on the server
  selectedFiles     String[] // List of relative paths of files selected for the prompt
  lastFinalRequest  String?  @db.Text
  ignorePatterns    String[] // Workspace-specific ignore patterns
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  defaultFormatId   String?
  defaultFormat     Format?  @relation("DefaultFormat", fields: [defaultFormatId], references: [id])
  defaultRoleId     String?
  defaultRole       Role?    @relation("DefaultRole", fields: [defaultRoleId], references: [id])
}

// A Format defines how the LLM should structure its response.
model Format {
  id           String   @id @default(cuid())
  name         String   @unique
  instructions String   @db.Text
  examples     String   @db.Text
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  defaultForWorkspaces Workspace[] @relation("DefaultFormat")
}

// A Role defines the persona the LLM should adopt.
model Role {
  id          String   @id @default(cuid())
  name        String   @unique
  description String   @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  defaultForWorkspaces Workspace[] @relation("DefaultRole")
}

// Global settings for the application.
model Setting {
  id                  Int      @id @default(1) // Singleton table
  globalIgnorePatterns String[]
}
```

### **4. Backend Implementation (in `/backend`)**

1.  **Project Setup:** Initialize a Node.js project with TypeScript, Fastify, Prisma, `socket.io`, `chokidar`, and Nunjucks.
2.  **API Endpoints (CRUD):** Implement full CRUD (Create, Read, Update, Delete) endpoints for `Workspaces`, `Formats`, and `Roles`.
    *   Example: `POST /api/workspaces`, `GET /api/workspaces`, `GET /api/workspaces/:id`, `PUT /api/workspaces/:id`, `DELETE /api/workspaces/:id`.
3.  **Core Logic Endpoints:**
    *   `GET /api/workspaces/:id/structure`:
        *   Receives a workspace ID.
        *   Reads the `path` from the workspace in the DB.
        *   Uses Node.js `fs` module to scan the directory recursively.
        *   Filters files/folders using both global and workspace-specific `ignorePatterns`.
        *   Returns a JSON representation of the file tree.
    *   `POST /api/prompt/generate`:
        *   Receives a payload: `{ workspaceId: string, finalRequest: string, selectedFilePaths: string[], formatId: string, roleId: string }`.
        *   Fetches all necessary data from the DB (Workspace details, Format instructions, Role description).
        *   Reads the content of each file in `selectedFilePaths`.
        *   Uses Nunjucks to render the final prompt string using a template similar to v1's `prompt_template.txt.jinja2`.
        *   Returns the generated prompt as a string.
4.  **Real-time Service (WebSockets):**
    *   On server start, initialize `socket.io`.
    *   When a client connects and selects a workspace, start a `chokidar` watcher on that workspace's path.
    *   When `chokidar` detects a change (add, unlink, rename), emit a `filesystem:change` event to the specific client.
    *   Manage watchers efficiently: stop watching when the client disconnects or switches workspaces.

### **5. Frontend Implementation (in `/frontend`)**

1.  **Project Setup:** Initialize a React project with Vite, TypeScript, and install Tailwind CSS, Zustand, and `socket.io-client`.
2.  **Application Layout & Routing:**
    *   A main layout with a persistent navigation sidebar.
    *   **Main Page (`/`):** The core prompt-building interface.
    *   **Settings Pages (`/settings/...`):**
        *   `/settings/workspaces`: A page to list, create, and delete workspaces.
        *   `/settings/formats`: A full CRUD interface for managing response formats.
        *   `/settings/roles`: A full CRUD interface for managing roles.
        *   `/settings/ignore-patterns`: An interface to edit the global ignore patterns.
3.  **Core Components (Main Page):**
    *   **Workspace Selector:** A dropdown to select the active workspace. Changing it updates the entire view.
    *   **File Tree:** A component that takes the file structure JSON and renders an interactive, collapsible tree with checkboxes.
    *   **Editors & Selectors:** Textarea for the "Final Request", dropdowns for selecting the active Format and Role.
    *   **Token Counter:** A small component that estimates and displays the token count of the generated prompt in real-time as the user types or selects files.
    *   **Output Display:** A `pre` block to show the final generated prompt, with a "Copy to Clipboard" button.
4.  **State Management (Zustand + `localStorage`):**
    *   Create a store to manage the application's UI state.
    *   Persist the ID of the *last active workspace* and the content of the "Final Request" textarea to `localStorage` to survive page reloads.
    *   On app load, check `localStorage` to restore the user's session.
5.  **Real-time Integration:**
    *   When a workspace is selected, establish a WebSocket connection.
    *   Listen for the `filesystem:change` event. Upon receiving it, automatically trigger a refetch of the workspace structure from the API to update the file tree.

### **6. Deprecated v1 Features**
*   The entire "apply diff" functionality (`apply_diff.py`, `diff.html`, and related API endpoints) **must be removed**. It is out of scope for v2.

### **7. Implementation Plan**
Start by setting up the complete project structure and Docker configuration.

1.  Create the `docker-compose.yml` file to orchestrate the `backend`, `frontend`, and `postgres` services.
2.  Create the `Dockerfile` for the `backend` and `frontend`.
3.  Initialize the projects in `/backend` and `/frontend` with their respective `package.json` files.
4.  Define the `schema.prisma` file. This is your contract.
5.  Implement the backend's CRUD APIs for all models.
6.  Implement the frontend settings pages to interact with the CRUD APIs.
7.  Implement the backend's core logic (`/structure` and `/generate`).
8.  Implement the frontend's main page and its components.
9.  Finally, integrate the real-time WebSocket layer.

Produce the code file by file, starting with the configuration and setup files. I will be here to review and guide you through the process.