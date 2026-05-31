import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import {
  architecture, usecaseAdmin, usecaseClient,
  sequenceLogin, sequenceDataImport, sequenceAI,
  sequenceChart, sequenceSurvey, classDiagram,
  activityImport, activityDashboard, deployment, componentDiagram,
  orgChart,
} from './diagrams.mjs';

const RES = path.join(import.meta.dirname, 'res');
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
  'diagram-org-chart': orgChart,
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });

let count = 0;
for (const [name, mermaidDef] of Object.entries(diagrams)) {
  // Compact sizing for A4 fit: use smaller container, smaller font
  const html = `<!DOCTYPE html><html><head>
<style>
  body { margin: 0; padding: 0; }
  .mermaid { width: 750px; margin: 10px auto; }
  .mermaid svg { max-width: 750px; height: auto; }
</style>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<script>
mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  themeVariables: {
    fontSize: '11px',
    primaryFontFamily: 'Arial',
    primaryBorderColor: '#555',
    lineColor: '#666',
    secondaryColor: '#f0f4ff',
    tertiaryColor: '#fff',
    primaryTextColor: '#222',
    secondaryTextColor: '#444'
  },
  flowchart: { useMaxWidth: true, htmlLabels: true, curve: 'basis' },
  sequence: { useMaxWidth: true, diagramMarginX: 8, diagramMarginY: 8, boxMargin: 6, actorMargin: 20, boxTextMargin: 4 }
});
</script>
</head><body>
<div class="mermaid">
${mermaidDef}
</div>
</body></html>`;

  fs.writeFileSync('/tmp/diagram.html', html);
  await page.goto('file:///tmp/diagram.html', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Wait for SVG to render
  const svg = page.locator('.mermaid svg');
  if (await svg.isVisible({ timeout: 10000 }).catch(() => false)) {
    const box = await svg.boundingBox();
    if (box) {
      await page.screenshot({
        path: path.join(RES, `${name}.png`),
        clip: { x: box.x, y: box.y, width: box.width, height: box.height },
        type: 'png'
      });
      const kb = fs.statSync(path.join(RES, `${name}.png`)).size;
      const dims = `${Math.round(box.width)}x${Math.round(box.height)}px`;
      console.log(`  ${name}.png (${(kb / 1024).toFixed(0)}KB, ${dims})`);
      count++;
    }
  } else {
    console.log(`  [FAIL] ${name}: SVG not rendered`);
  }
}

await browser.close();
console.log(`\nGenerated ${count}/${Object.keys(diagrams).length} diagrams`);
