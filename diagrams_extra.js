const { chromium } = require('@playwright/test');
const path = require('path');
const RES = path.join(__dirname, 'report', 'res');

const diagrams = [
  {
    name: 'figure-39-diagram-data-import-flow',
    diagram: `flowchart TD
        A[Upload CSV/XLSX] --> B[Parse Headers & Sample]
        B --> C[Column Mapping UI]
        C --> D[User maps columns to types]
        D --> E[Generate CREATE TABLE SQL]
        E --> F[Bulk Insert Rows]
        F --> G{Success?}
        G -->|Yes| H[Update dataset status: imported]
        G -->|No| I[Error report with skipped rows]
        H --> J[Dynamic table ready for queries]
        I --> K[User reviews errors]`
  },
  {
    name: 'figure-40-diagram-rbac-architecture',
    diagram: `flowchart LR
        subgraph Users["Users Layer"]
            A[Staff Users] --> B[User Roles]
            C[Client Users] --> D[Client Type]
        end
        subgraph Auth["Authentication"]
            E[JWT Login] --> F[Staff: email+password]
            E --> G[Client: username+password]
        end
        subgraph RBAC["Authorization"]
            H[Role Permissions] --> I[Middleware Check]
            I --> J{Has Permission?}
            J -->|Yes| K[Execute API]
            J -->|No| L[403 Forbidden]
        end
        B --> H
        D --> G`
  },
  {
    name: 'figure-41-diagram-deployment',
    diagram: `flowchart TD
        subgraph Docker["Docker Compose Stack"]
            subgraph Frontend["Frontend Service"]
                F1[React SPA\nVite Dev Server\nPort 5173]
            end
            subgraph Backend["Backend Service"]
                B1[Express API\nTypeScript\nPort 5000]
                B2[Migrations\n15 Scripts]
                B3[File Uploads\n/uploads]
            end
            subgraph DB["Database Service"]
                D1[PostgreSQL 15\nPort 5432]
            end
            F1 -->|REST API| B1
            B1 -->|SQL| D1
            B1 -->|AI Queries| G[Groq AI\nLLaMA 3.3 70B]
        end
        subgraph Production["Production Deployment"]
            V[Vercel SPA] -->|HTTPS| R[Railway Backend]
            R -->|internal| PD[Railway PostgreSQL]
        end`
  },
  {
    name: 'figure-42-diagram-component-interaction',
    diagram: `flowchart TD
        subgraph FrontendApp["React Application"]
            AC[AuthContext] -->|user state| P[Pages]
            TC[ThemeContext] -->|theme config| P
            NC[NotificationContext] -->|notifications| P
            P -->|HTTP calls| AX[Axios Instance]
            AX -->|JWT interceptor| API[Backend API]
        end
        subgraph Stores["Local Storage"]
            LS1[token\nuser\ni18n_lang]
            LS2[obs-theme\nobs-color-scheme]
        end
        AC <--> LS1
        TC <--> LS2`
  },
  {
    name: 'figure-43-diagram-survey-response-flow',
    diagram: `flowchart TD
        A[Admin creates survey] --> B[Publish survey]
        B --> C[Generate public URL + QR code]
        C --> D[Share with respondents]
        D --> E{Respondent type?}
        E -->|Anonymous| F[Fill public form]
        E -->|Client| G[Login → fill in portal]
        F --> H[Submit response]
        G --> H
        H --> I{Already responded?}
        I -->|No| J[Save to survey_responses]
        I -->|Yes| K[Show duplicate warning]
        J --> L[Increment responses_count]
        L --> M[Admin views aggregated results]`
  },
  {
    name: 'figure-44-diagram-chart-builder-workflow',
    diagram: `flowchart TD
        A[Select dataset] --> B[Choose X column]
        B --> C[Choose Y column]
        C --> D[Select aggregation]
        D --> E[Select chart type]
        E --> F[Configure appearance]
        F --> G[Live preview]
        G --> H{Satisfied?}
        H -->|No| B
        H -->|Yes| I[Save chart]
        I --> J[Available in Chart Library]
        J --> K[Can be added to Dashboard]`
  },
  {
    name: 'figure-45-diagram-dashboard-publishing',
    diagram: `flowchart TD
        A[Create Dashboard] --> B[Add Charts from Library]
        B --> C[Arrange in grid layout]
        C --> D[Set title & description]
        D --> E{Want to publish?}
        E -->|No| F[Keep as draft]
        E -->|Yes| G[Toggle is_public = true]
        G --> H[Dashboard visible at /public]
        H --> I[Anyone can view without login]
        F --> J[Only admins see in sidebar]`
  },
  {
    name: 'figure-46-diagram-class-structure-replace',
    diagram: `classDiagram
        class User {
            +int id
            +string email
            +string role
            +login()
        }
        class Dataset {
            +int id
            +string tableName
            +int rowCount
            +import()
            +getData()
        }
        class Chart {
            +int id
            +string title
            +string chartType
            +jsonb config
            +render()
        }
        class Dashboard {
            +int id
            +string title
            +jsonb layout
            +addChart()
            +exportPDF()
        }
        class Client {
            +int id
            +string cin
            +string clientType
            +clientLogin()
        }
        class Report {
            +int id
            +string title
            +text content
            +generate()
        }
        class Survey {
            +int id
            +jsonb schema
            +string status
            +publish()
        }
        User --> Dataset : uploads
        User --> Chart : creates
        User --> Dashboard : creates
        Dataset --> Chart : sourced from
        Client --> Report : subject of
        Client --> Survey : responds to
        User --> Survey : creates
        User --> Report : generates`
  }
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  const mermaidUrl = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';

  for (const d of diagrams) {
    const html = `<!DOCTYPE html>
<html><head><script src="${mermaidUrl}"></script></head>
<body>
  <div class="mermaid" style="display:flex;justify-content:center;padding:20px;background:#1a1a2e;">
${d.diagram}
  </div>
  <script>mermaid.initialize({startOnLoad:true,theme:'dark',fontSize:14});</script>
</body></html>`;

    await page.setContent(html);
    await page.waitForTimeout(2000);

    const rect = await page.evaluate(() => {
      const el = document.querySelector('.mermaid svg');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, w: r.width, h: r.height };
    });

    if (rect) {
      await page.screenshot({
        path: path.join(RES, d.name + '.png'),
        clip: { x: Math.max(0, rect.x - 20), y: Math.max(0, rect.y - 20), width: rect.w + 40, height: rect.h + 40 }
      });
      console.log(`  ✓ ${d.name}`);
    } else {
      console.log(`  ✗ ${d.name} - no SVG`);
    }
  }

  await browser.close();
  console.log('\nExtra diagrams done!');
})();
