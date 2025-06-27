import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default settings
  await prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      globalIgnorePatterns: [
        '*.log',
        '*.logs',
        '*.jpg',
        '*.jpeg',
        '*.png',
        '*.gif',
        '*.svg',
        '*.ico',
        '*.bmp',
        '*.tiff',
        '*.webp',
        '*.mp3',
        '*.wav',
        '*.mp4',
        '*.avi',
        '*.mov',
        '*.zip',
        '*.tar',
        '*.gz',
        '*.7z',
        '*.rar',
        '*.pdf',
        '*.doc',
        '*.docx',
        '*.xls',
        '*.xlsx',
        '*.ppt',
        '*.pptx',
        '*.exe',
        '*.dll',
        '*.so',
        '*.o',
        '*.a',
        '*.class',
        '*.jar',
        '*.war',
        '*.ear',
        '*.pyc',
        '*.pyo',
        '*.pyd',
        '*.db',
        '*.sqlite',
        '*.sqlite3',
        '*.db3',
        '*.sql',
        '*.bak',
        '*.tmp',
        '*.temp',
        '*.swp',
        '*.swo',
        '*.DS_Store',
        '*.idea',
        '*.vscode',
        '*.git',
        '*.svn',
        '*.hg',
        '*.bzr',
        '*.env',
        '*.env.*',
        '*.csv',
        'data',
        '.git',
        '.github',
        '.vscode',
        '.idea',
        '.husky',
        'venv',
        'node_modules',
        'dist',
        'build',
        'coverage',
        '.cache',
        'out/',
        'yarn.lock',
        'package-lock.json',
        'translations/*.json',
        'translations/'
      ]
    }
  });

  // Create default formats based on the old project
  const markdownFormat = await prisma.format.upsert({
    where: { name: 'markdown' },
    update: {},
    create: {
      name: 'markdown',
      instructions: `Use Markdown syntax.
Include code blocks with \`\`\`language for code samples.`,
      examples: `# User Profile Feature Implementation

## Overview
Implementation of a new user profile system with avatar support and form validation.

### Key Changes
- Added new UserProfile component
- Enhanced form validation
- Updated styling for profile page

## Component Implementation

### UserProfile Component
New React component for managing user profiles:

\`\`\`javascript
class UserProfile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: props.name || '',
      email: props.email || '',
      avatar: props.avatar || 'default.png'
    };
  }

  handleSubmit(event) {
    event.preventDefault();
    if (this.validateForm()) {
      this.props.onUpdate(this.state);
    }
  }
}
\`\`\`

> **Note:** Remember to run \`npm install\` after pulling these changes.`
    }
  });

  const structuredFormat = await prisma.format.upsert({
    where: { name: 'structured' },
    update: {},
    create: {
      name: 'structured',
      instructions: `Structure your response with clear section headers using === separators.
Use markdown-style formatting for code and lists.
Keep sections organized and clearly separated.`,
      examples: `====================================
IMPLEMENTATION SUMMARY
====================================
User profile feature implementation with avatar support and form validation.

Key Deliverables:
- New UserProfile React component
- Enhanced form validation utilities
- Updated profile page styling
- Comprehensive test coverage

====================================
COMPONENT CHANGES
====================================
UserProfile Component
--------------------
Location: src/components/UserProfile.js
Type: New Component
Purpose: Manage user profile data and form handling

\`\`\`javascript
class UserProfile extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: props.name || '',
      email: props.email || '',
      avatar: props.avatar || 'default.png'
    };
  }

  handleSubmit(event) {
    event.preventDefault();
    if (this.validateForm()) {
      this.props.onUpdate(this.state);
    }
  }
}
\`\`\`

====================================
DEPLOYMENT NOTES
====================================
Required Actions:
1. Run npm install
2. Update environment variables
3. Clear browser cache after deployment

Known Issues:
- None reported`
    }
  });

  const jsonFormat = await prisma.format.upsert({
    where: { name: 'json' },
    update: {},
    create: {
      name: 'json',
      instructions: `Respond with valid JSON only.
Structure your response as a JSON object with appropriate fields.
Do not include any text outside the JSON structure.`,
      examples: `{
  "summary": "User profile feature implementation",
  "changes": [
    {
      "type": "component",
      "name": "UserProfile",
      "location": "src/components/UserProfile.js",
      "status": "new"
    }
  ],
  "dependencies": {
    "added": ["@testing-library/react", "validator"],
    "removed": ["old-validation-lib"]
  },
  "testing": {
    "coverage": {
      "UserProfile": "85%",
      "Validation": "100%"
    }
  }
}`
    }
  });

  // Create default roles
  const expertRole = await prisma.role.upsert({
    where: { name: 'Expert Software Engineer' },
    update: {},
    create: {
      name: 'Expert Software Engineer',
      description: `You are an expert software engineer and technical consultant with extensive experience in code analysis, refactoring, and development across multiple programming languages and frameworks. You excel at understanding complex codebases and providing detailed, actionable solutions.

Key Areas of Expertise:
- Code analysis and understanding
- Software architecture and design patterns
- Best practices and coding standards
- Performance optimization
- Technical documentation

Approach:
1. Break down problems into clear components
2. Explain reasoning for decisions
3. Consider implications and trade-offs
4. Validate solutions against requirements
5. Provide clear, actionable steps`
    }
  });

  const architectRole = await prisma.role.upsert({
    where: { name: 'Software Architect' },
    update: {},
    create: {
      name: 'Software Architect',
      description: `You are a senior software architect with deep expertise in system design, scalability, and technical leadership. You focus on high-level design decisions, technology choices, and architectural patterns that ensure long-term maintainability and scalability.

Key Areas of Expertise:
- System architecture and design
- Scalability and performance
- Technology selection and evaluation
- Design patterns and best practices
- Technical strategy and roadmapping

Approach:
1. Think strategically about system design
2. Consider scalability and maintainability
3. Evaluate trade-offs between different approaches
4. Focus on long-term architectural health
5. Provide clear architectural guidance`
    }
  });

  console.log('✅ Database seeded successfully!');
  console.log(`Created formats: ${markdownFormat.name}, ${structuredFormat.name}, ${jsonFormat.name}`);
  console.log(`Created roles: ${expertRole.name}, ${architectRole.name}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });