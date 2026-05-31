export const architecture = `
graph TB
    subgraph Client["Clients"]
        A[Admin Browser]
        C[Client Browser]
        P[Public User]
    end

    subgraph Frontend["Frontend (React + Vite)"]
        FE["ISET Observatory SPA<br/>Port 5173"]
        LP[Landing Page]
        DP[Dashboard]
        IP[Data Import]
        CP[Charts]
        DBP[Dashboards]
        AIP[AI Analysis]
        SP[Surveys]
        RP[Reports]
        UP[User Management]
    end

    subgraph Backend["Backend (Express + TypeScript)"]
        API["REST API<br/>Port 5000"]
        AI[AI Service<br/>Groq Integration]
        ST[Statistics]
        IM[Import Engine]
        TB[Table Builder]
        BM[Bulk Manager]
    end

    subgraph Database["PostgreSQL 15"]
        DB[(Observatory DB<br/>Port 5432)]
        DT[Dynamic Tables<br/>dyn_*]
    end

    subgraph External["External Services"]
        GROQ[Groq AI API<br/>LLM Inference]
    end

    A --> FE
    C --> FE
    P --> FE
    FE --> API
    API --> AI
    AI --> GROQ
    API --> DB
    API --> DT
`;

export const usecaseAdmin = `
graph TD
    A[Administrator]
    A --> UC1[Login / Logout]
    A --> UC2[Import CSV/Excel Data]
    A --> UC3[Map Columns & Configure Types]
    A --> UC4[Preview Imported Data]
    A --> UC5[Create Visualizations]
    A --> UC6[Build Dashboards]
    A --> UC7[Ask AI Natural Language Questions]
    A --> UC8[Generate Surveys]
    A --> UC9[Create Reports]
    A --> UC10[Manage Users]
    A --> UC11[Manage Roles & Permissions]
    A --> UC12[Manage Clients]
    A --> UC13[Configure Settings & Themes]
    A --> UC14[View System Documentation]
`;

export const usecaseClient = `
graph TD
    C[Client User]
    C --> UC1[Login / Logout]
    C --> UC2[View Public Dashboards]
    C --> UC3[Complete Surveys]
    C --> UC4[View Personal Data]
    C --> UC5[View Shared Reports]
    C --> UC6[Update Profile]
`;

export const sequenceLogin = `
sequenceDiagram
    actor User
    participant UI as Frontend
    participant API as Backend API
    participant DB as Database

    User->>UI: Enter email & password
    UI->>API: POST /api/auth/login
    API->>DB: Verify credentials
    DB-->>API: User data
    API->>API: Generate JWT token
    API-->>UI: Return token + user info
    UI->>UI: Store token in localStorage
    UI-->>User: Redirect to dashboard
`;

export const sequenceDataImport = `
sequenceDiagram
    actor Admin
    participant UI as Import Page
    participant API as Backend API
    participant FS as File System
    participant TB as Table Builder
    participant DB as Database

    Admin->>UI: Click upload area
    Admin->>UI: Select CSV file
    UI->>API: POST /api/datasets/upload
    API->>FS: Save uploaded file
    API-->>UI: Dataset created (status: uploaded)
    UI-->>Admin: File appears in table

    Admin->>UI: Click "Preview & Map"
    UI->>API: GET /api/datasets/{id}/preview
    API->>FS: Parse CSV preview
    API-->>UI: Return headers + sample rows

    UI-->>Admin: Show mapping wizard
    Admin->>UI: Configure column types
    Admin->>UI: Click "Create & Import"
    UI->>API: POST /api/datasets/{id}/import
    API->>TB: Create dynamic table
    TB->>DB: CREATE TABLE dyn_*
    API->>FS: Read & parse CSV
    API->>TB: Bulk insert rows
    TB->>DB: INSERT INTO dyn_*
    API-->>UI: Import complete
    UI-->>Admin: Status: imported
`;

export const sequenceAI = `
sequenceDiagram
    actor User
    participant UI as AI Page
    participant API as Backend API
    participant AI as AI Service
    participant DB as Database

    User->>UI: Type natural language question
    UI->>API: POST /api/ai/ask
    API->>API: Analyze intent
    API->>DB: Query relevant data
    DB-->>API: Results
    API->>AI: Send context + question
    AI->>AI: Process via LLM
    AI-->>API: Generate response
    API->>API: Format response
    API-->>UI: Return answer + charts
    UI-->>User: Display response
`;

export const sequenceChart = `
sequenceDiagram
    actor User
    participant UI as Chart Builder
    participant API as Backend API
    participant DB as Database

    User->>UI: Click "Create Chart"
    UI-->>User: Show chart configuration form
    User->>UI: Select dataset & columns
    User->>UI: Choose chart type
    User->>UI: Configure options
    User->>UI: Click "Save"
    UI->>API: POST /api/charts
    API->>DB: Save chart config
    API-->>UI: Chart created
    UI->>API: GET /api/charts/{id}/render
    API->>DB: Query data
    API-->>UI: Return rendered chart
    UI-->>User: Display chart
`;

export const sequenceSurvey = `
sequenceDiagram
    actor Admin
    actor Client
    participant UI as Survey Module
    participant API as Backend API
    participant DB as Database

    Admin->>UI: Click "Create Survey"
    Admin->>UI: Configure title & fields
    Admin->>UI: Set question types
    Admin->>UI: Publish survey
    UI->>API: POST /api/surveys
    API->>DB: Save survey schema
    API-->>UI: Survey created

    Client->>UI: Access public survey link
    UI->>API: GET /api/public/surveys/{id}
    API-->>UI: Return survey form
    Client->>UI: Fill & submit responses
    UI->>API: POST /api/public/surveys/{id}/submit
    API->>DB: Save responses
    API-->>UI: Submission confirmed
    UI-->>Client: Thank you message

    Admin->>UI: View survey results
    UI->>API: GET /api/surveys/{id}/responses
    API->>DB: Query responses
    API-->>UI: Return aggregated data
    UI-->>Admin: Display results dashboard
`;

export const classDiagram = `
classDiagram
    class User {
        +Int id
        +String email
        +String password
        +String fullName
        +String role
        +String userType
        +login()
        +logout()
    }

    class Dataset {
        +Int id
        +String name
        +String status
        +String tableName
        +Int rowCount
        +upload()
        +preview()
        +import()
    }

    class Chart {
        +Int id
        +String title
        +String chartType
        +Object config
        +render()
    }

    class Dashboard {
        +Int id
        +String title
        +String description
        +Boolean isPublic
        +addChart()
        +removeChart()
    }

    class Survey {
        +Int id
        +String title
        +String description
        +Object schema
        +Boolean isPublic
        +publish()
        +collectResponses()
    }

    class Report {
        +Int id
        +String title
        +String reportType
        +Object content
        +generate()
        +export()
    }

    class ColumnMapping {
        +String originalHeader
        +String columnName
        +String columnType
    }

    User "1" --> "*" Dataset : uploads
    Dataset "1" --> "*" Chart : source
    Chart "*" --> "1" Dashboard : belongs to
    User "1" --> "*" Dashboard : creates
    User "1" --> "*" Survey : creates
    User "1" --> "*" Report : generates
    Dataset "1" --> "*" ColumnMapping : has
`;

export const activityImport = `
flowchart TD
    A([Start])
    B[Upload CSV]
    C[4-Step Wizard:<br/>Review → Types → Preview → Import]
    D{Success?}
    E[Dataset imported]
    F([Ready for analysis])

    A --> B
    B --> C
    C --> D
    D -->|Yes| E
    D -->|No| C
    E --> F
`;

export const activityDashboard = `
flowchart TD
    A([Start])
    B[Configure chart<br/>dataset, columns, type]
    C{Preview OK?}
    D[Save chart]
    E[Create dashboard<br/>& add charts]
    F[Dashboard ready]
    G([Done])

    A --> B
    B --> C
    C -->|Yes| D
    C -->|No| B
    D --> E
    E --> F
    F --> G
`;

export const deployment = `
graph TB
    subgraph Docker Host
        subgraph Network["Docker Network: observatory-net"]
            subgraph FrontendContainer["Frontend Container<br/>observatory-frontend"]
                FE[React SPA<br/>Vite Dev Server<br/>Port 5173]
            end

            subgraph BackendContainer["Backend Container<br/>observatory-backend"]
                API[Express API<br/>ts-node-dev<br/>Port 5000]
                AI[AI Service Module]
                IM[Import Engine]
            end

            subgraph DBContainer["Database Container<br/>observatory-db"]
                PG[PostgreSQL 15<br/>Port 5432]
            end
        end
    end

    subgraph External2["External"]
        GROQ[Groq Cloud API]
        CDN[CDN / Static Assets]
    end

    Internet[Users / Clients] --> FE
    FE --> API
    API --> PG
    API --> GROQ
    FE --> CDN
`;

export const componentDiagram = `
flowchart LR
    subgraph Frontend["Frontend (React + Vite)"]
        R[React 18]
        AD[Ant Design]
        I18[i18next]
        AX[Axios]
    end

    subgraph Backend["Backend (Express + TS)"]
        EX[Express.js]
        JWT[Auth]
        CSV[CSV Parse]
        MUL[Multer]
        GROQ[Groq SDK]
    end

    subgraph Data["Data Layer"]
        PG[PostgreSQL 15]
        TB[Table Builder]
    end

    Frontend -->|HTTP| Backend
    Backend --> Data
    Backend -->|API| GROQ
    GROQ -->|LLM| GroqAI
`;

export const orgChart = `
graph TD
    classDef director fill:#1e40af,color:#fff
    classDef vice fill:#2563eb,color:#fff
    classDef dept fill:#3b82f6,color:#fff
    classDef service fill:#93c5fd,color:#000
    classDef admin fill:#60a5fa,color:#000

    D[Director<br/>Dr. Mohamed Ali]:::director
    VD[Vice Director<br/>Academic Affairs]:::vice
    VD2[Vice Director<br/>Administration]:::vice

    D --> VD
    D --> VD2

    subgraph Academic["Academic Departments"]
        CS[Computer Science]:::dept
        BA[Business Admin]:::dept
        BIO[Biology]:::dept
        ME[Mechanical Eng]:::dept
    end

    subgraph Services["Administrative Services"]
        REG[Registrar]:::service
        FIN[Finance]:::service
        SA[Student Affairs]:::service
        IT[IT Support]:::service
    end

    VD --> Academic
    VD2 --> Services

    CS --> FC1[Faculty]:::admin
    BA --> FC2[Faculty]:::admin
    BIO --> FC3[Faculty]:::admin
    ME --> FC4[Faculty]:::admin
`;


