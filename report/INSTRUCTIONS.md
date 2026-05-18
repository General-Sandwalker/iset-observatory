# INSTRUCTIONS FOR AI AGENT – Full Report & Presentation Generation

You are an AI assistant helping a student produce their final PFE (Bachelor) report and presentation for a project called **"Digital Observatory of Academic and Professional Integration Indicators for ISET Tozeur"**.

## Your Task

1. **Read the entire project** – You have access to the codebase, configuration files, documentation, and version control history. Specifically:
   - `frontend/` – all source code
   - `backend/` – all source code
   - `db/init/` – SQL scripts, migrations
   - `.env` – environment variables (do not expose secrets in output)
   - `docker-compose.yml` – if present
   - `PROGRESS.md` in the root – contains development progress, milestones, issues
   - `docs/*` – any additional documentation
   - Git history (commits, branches, tags) and GitHub milestones/issues (via repo metadata if accessible)

2. **Analyse and infer** – From the codebase, determine:
   - Actual tech stack
   - Features implemented
   - Architecture
   - Agile workflow used (milestones, issues, branches)
   - Any unique decisions

3. **Produce two Markdown files** inside the `report/` folder:
   - `FINAL_REPORT.md` – complete PFE report (≈80 pages equivalent)
   - `PRESENTATION.md` – Slidev presentation (20‑25 slides)

## Critical Formatting Rules for the Report

### Figures (including Mermaid diagrams, screenshot placeholders)
- Every figure must have a **caption** and a **number** that increments per chapter (e.g., Figure 1.1, Figure 1.2; then Figure 2.1, etc.).  
- Caption format: `Figure X.Y: Short description.` placed **below** the figure content.
- For **Mermaid diagrams**, write the diagram code, then on the next line write the caption.
- For **screenshot placeholders**, write `[FIGURE: description of what the screenshot shows]` and on the next line write the caption (e.g., `Figure 3.5: Login page`). The student will replace the placeholder with the actual image later.
- In the text, refer to figures as `(see Figure X.Y)` or `as shown in Figure X.Y`.

### Tables
- Every table must have a **caption** and a **number** that increments per chapter (e.g., Table 2.1, Table 2.2).  
- Caption format: `Table X.Y: Title.` placed **above** the table.
- Use standard GitHub Markdown table syntax.
- Refer to tables in text as `(see Table X.Y)`.

### List of Figures and List of Tables
- At the beginning of the report (after Table of Contents), include two placeholder sections:
List of Figures
(This list will be generated automatically by the word processor – placeholder only)

List of Tables
(This list will be generated automatically – placeholder only)

text
- The agent does NOT need to generate the actual lists; just these placeholders.

## Report Structure (`FINAL_REPORT.md`)

Follow the structure below exactly. All content must be based on your analysis of the actual project.
Design and Development of a Digital Observatory for Academic and Professional Integration Indicators at ISET Tozeur
[First page – text only, leave a placeholder line like "[LOGO: ISET Tozeur logo here]". Include: Ministry, Institute, Department, report title, author, supervisors, host organisation, dates, academic year.]

Abstract
[~250 words]

Table of Contents
(will be added manually)

List of Figures
(placeholder)

List of Tables
(placeholder)

Acronyms
[Table of acronyms]

Introduction
Context

Problem statement

What is a digital observatory? (definition + examples)

Proposed solution

Scope

Report organisation

Chapter 1: Project Context and Problem Analysis
1.1 Host Organisation: ISET Tozeur and the 4C Cell
1.2 Problem Statement
[Include Table 1.1: Current data fragmentation with columns: Data Type, Current Storage, Consequences]

1.3 Proposed Solution: Digital Observatory Platform
1.4 Comparison with Existing Solutions
[Include Table 1.2: Comparison of existing tools vs. proposed solution]

Chapter 2: Requirements Analysis
2.1 Functional Requirements
[Include Table 2.1: Functional requirements (ID, Feature, Description, Priority)]

2.2 Non‑Functional Requirements
[Include Table 2.2: Non-functional requirements (Category, Requirement, Acceptance Metric)]

2.3 User Roles and Permissions Matrix
[Include Table 2.3: Roles and permissions (rows: roles, columns: actions)]

Chapter 3: System Design
3.1 Software Architecture
[Include a Mermaid architecture diagram and caption Figure 3.1]

3.2 Technology Stack
[Include Table 3.1: Technology stack (Layer, Technology, Justification)]

3.3 Data Model (MCD)
[Include Mermaid ER diagram, caption Figure 3.2]

3.4 UML Diagrams
3.4.1 Use Case Diagram (overall)
[Mermaid flowchart, caption Figure 3.3]

3.4.2 Class Diagram (core entities)
[Mermaid class diagram, caption Figure 3.4]

3.4.3 Sequence Diagrams
Authentication (Figure 3.5)

Submitting a survey response (Figure 3.6)

Generating a report (Figure 3.7)

3.4.4 Activity Diagram
[E.g., Survey creation flow, caption Figure 3.8]

Chapter 4: Implementation
4.1 Development Workflow (Agile with GitHub Milestones)
[Include a Mermaid timeline or table of milestones, caption Figure 4.1 or Table 4.1]

4.2 Backend Implementation
Key API endpoints (Table 4.2)

Authentication mechanism

Password handling

CSV import logic

Indicator calculation

Code organisation (tree view – can be a code block)

4.3 Frontend Implementation
Main pages/components

State management

Responsive design

Communication with backend

4.4 Database Schema
[Provide simplified DDL – use a code block with SQL]

4.5 Screenshot Placeholders
[For each major interface, write a placeholder and a figure caption. Example:]
[FIGURE: Login page showing email and password fields]
Figure 4.2: Login page
[FIGURE: Admin dashboard with KPI cards]
Figure 4.3: Administrator dashboard
[FIGURE: Student list with filters and import button]
Figure 4.4: Student management interface
... (add as many as needed)

Chapter 5: Testing and Validation
5.1 Testing Strategy
5.2 Test Cases Summary
[Include Table 5.1: Test cases (ID, Feature, Test Case, Expected Result, Status)]

5.3 Performance Testing
[If performed, include Table 5.2: Performance results or state "[not formally tested]"]

5.4 Security Validation
[Include Table 5.3: Security threat mitigation table]

5.5 User Acceptance Testing
[Summarise feedback, include Table 5.4 if ratings exist]

Chapter 6: Conclusion and Perspectives
6.1 Summary of Achievements
6.2 Contributions
6.3 Limitations
6.4 Future Work
6.5 Personal Reflection
Appendices
Appendix A: Installation and Deployment Guide
Appendix B: User Manual (extract)
Appendix C: Project Management Artifacts
[Placeholders with captions: Figure A.1 (GitHub milestones screenshot), etc.]

Appendix D: Complete Database Schema (SQL DDL)
Appendix E: API Documentation (OpenAPI summary)
Bibliography
Acknowledgements
text

## Presentation Structure (`PRESENTATION.md`)

Produce a Slidev presentation with 20‑25 slides using `---` separators and YAML frontmatter. Slides should be text + placeholders for figures (no need for figure numbers). Keep concise.

Example frontmatter:
```yaml
---
theme: seriph
title: Digital Observatory for ISET Tozeur
class: text-center
---
Slide list:

Title slide

Plan

Context – ISET Tozeur & 4C

Problem statement (table)

What is a Digital Observatory?

Proposed solution + architecture (Mermaid)

Functional requirements (bullets)

Use case diagram (Mermaid)

Technology stack (table)

Database design (simplified ER)

Implementation screenshots (grid of placeholders)

Dashboard & visualisations

Survey module

Report generation

Role‑based access (table)

Agile workflow (milestones)

Testing results (summary)

Results achieved (before/after)

Limitations

Future work

Personal reflection

Thank you / Q&A
```
For each slide, use [FIGURE: description] where an image would go.

Important Rules
Do not embed real images. Use only [FIGURE: description] placeholders.

All diagrams must be Mermaid inside ```mermaid blocks. Every Mermaid block must have a caption line below it (for the report) – but for presentation, captions are optional.

Number figures and tables per chapter (e.g., Figure 1.1, Table 2.1). Restart numbering in each appendix as A.1, A.2, etc.

Refer to figures/tables in text using (see Figure X.Y).

Write in British English.

Base everything on actual code – do not invent features. If something is missing, state [not implemented] or [pending].

Do not output secrets from .env.

Output Files
Write directly to:

report/FINAL_REPORT.md

report/PRESENTATION.md

Begin
Now analyse the project and generate the two files.