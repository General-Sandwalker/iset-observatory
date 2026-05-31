import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import {
  architecture, usecaseAdmin, usecaseClient,
  sequenceLogin, sequenceDataImport, sequenceAI,
  sequenceChart, sequenceSurvey, classDiagram,
  activityImport, activityDashboard, deployment, componentDiagram
} from './diagrams.mjs';

const RES = path.join(import.meta.dirname, 'res');
const TMP = '/tmp/obs-mmd';
fs.mkdirSync(TMP, { recursive: true });

const diagrams = {
  'diagram-architecture-system': architecture,
  'diagram-usecase-admin': usecaseAdmin,
  'diagram-usecase-client': usecaseClient,
  'diagram-sequence-login': sequenceLogin,
  'diagram-sequence-data-import': sequenceDataImport,
  'diagram-sequence-ai-query': sequenceAI,
  'diagram-sequence-chart-creation': sequenceChart,
  'diagram-sequence-survey': sequenceSurvey,
  'diagram-class-model': classDiagram,
  'diagram-activity-import': activityImport,
  'diagram-activity-dashboard': activityDashboard,
  'diagram-deployment': deployment,
  'diagram-component': componentDiagram,
};

let count = 0;
for (const [name, content] of Object.entries(diagrams)) {
  const mmdFile = path.join(TMP, `${name}.mmd`);
  const pngFile = path.join(RES, `${name}.png`);
  fs.writeFileSync(mmdFile, content);

  try {
    execSync(`mmdc -i "${mmdFile}" -o "${pngFile}" -w 1200 -H 900 --backgroundColor white`, {
      timeout: 15000,
      stdio: 'pipe'
    });
    const kb = fs.statSync(pngFile).size;
    console.log(`  ${name}.png (${(kb / 1024).toFixed(0)}KB)`);
    count++;
  } catch (e) {
    console.log(`  [FAIL] ${name}: ${e.message.substring(0, 100)}`);
  }
}

// Cleanup
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch {}
console.log(`\nGenerated ${count}/${Object.keys(diagrams).length} diagrams`);
