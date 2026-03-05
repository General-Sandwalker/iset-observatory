import { useState } from 'react';
import {
  ClipboardList, Wand2, Loader2, Eye, Copy, Check, ArrowLeft, Star,
} from 'lucide-react';
import api from '../lib/api';
import type { GeneratedSurvey, SurveyField } from '../lib/types';

export default function SurveyGeneratorPage() {
  const [goal, setGoal] = useState('');
  const [context, setContext] = useState('');
  const [generating, setGenerating] = useState(false);
  const [survey, setSurvey] = useState<GeneratedSurvey | null>(null);
  const [copied, setCopied] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!goal.trim() || generating) return;
    setGenerating(true);
    setSurvey(null);
    setPreviewMode(false);
    try {
      const res = await api.post('/ai/survey/generate', {
        goal: goal.trim(),
        context: context.trim() || undefined,
      });
      setSurvey(res.data.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Survey generation failed.');
    } finally {
      setGenerating(false);
    }
  }

  async function copyJSON() {
    if (!survey) return;
    await navigator.clipboard.writeText(JSON.stringify(survey, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (previewMode && survey) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          onClick={() => setPreviewMode(false)}
          className="flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: 'var(--ag-text2)' }}
          onMouseOver={(e) => (e.currentTarget.style.color = 'var(--ag-text)')}
          onMouseOut={(e) => (e.currentTarget.style.color = 'var(--ag-text2)')}
        >
          <ArrowLeft className="w-4 h-4" /> Back to editor
        </button>

        <div className="ag-card p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--ag-text)' }}>{survey.title}</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--ag-text2)' }}>{survey.description}</p>
          </div>
          <div className="space-y-5">
            {survey.fields.map((field) => <SurveyFieldPreview key={field.id} field={field} />)}
          </div>
          <button
            type="button"
            className="w-full px-4 py-2.5 text-sm font-medium rounded-lg opacity-50 cursor-not-allowed text-white"
            style={{ background: 'var(--ag-accent)' }}
          >
            Submit (Preview Only)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--ag-text)' }}>
          <ClipboardList className="w-6 h-6" style={{ color: 'var(--ag-accent)' }} />
          AI Survey Generator
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--ag-text2)' }}>
          Describe your survey goal and AI will generate a professional survey form.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="ag-card p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ag-text2)' }}>
            Survey Goal <span style={{ color: 'var(--ag-red)' }}>*</span>
          </label>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            rows={3}
            placeholder='e.g. "Collect feedback from alumni about employment status and satisfaction with ISET education"'
            className="ag-input w-full px-3 py-2 text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ag-text2)' }}>
            Additional Context <span style={{ color: 'var(--ag-text3)' }}>(optional)</span>
          </label>
          <input
            type="text"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g. Target audience: 2020-2024 graduates, bilingual French/Arabic"
            className="ag-input w-full px-3 py-2.5 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={generating || !goal.trim()}
          className="ag-btn-primary flex items-center gap-2 px-5 py-2.5 text-sm"
        >
          {generating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
          ) : (
            <><Wand2 className="w-4 h-4" /> Generate Survey</>
          )}
        </button>
      </form>

      {survey && (
        <div className="space-y-4">
          <div className="ag-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--ag-text)' }}>{survey.title}</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--ag-text2)' }}>{survey.description}</p>
                <p className="text-xs mt-2" style={{ color: 'var(--ag-text3)' }}>{survey.fields.length} fields generated</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setPreviewMode(true)}
                  className="ag-btn-ghost flex items-center gap-1.5 px-3 py-2 text-xs"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <button
                  onClick={copyJSON}
                  className="ag-btn-ghost flex items-center gap-1.5 px-3 py-2 text-xs"
                >
                  {copied
                    ? <><Check className="w-3.5 h-3.5" style={{ color: 'var(--ag-green)' }} /> Copied!</>
                    : <><Copy className="w-3.5 h-3.5" /> Copy JSON</>
                  }
                </button>
              </div>
            </div>
          </div>

          <div className="ag-card overflow-hidden">
            <div className="px-5 py-3 ag-table-head">
              <h3 className="text-sm font-medium">Survey Fields</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="ag-table-head">
                  <th className="px-5 py-2.5 text-left">#</th>
                  <th className="px-5 py-2.5 text-left">Label</th>
                  <th className="px-5 py-2.5 text-left">Type</th>
                  <th className="px-5 py-2.5 text-left">Required</th>
                  <th className="px-5 py-2.5 text-left">Options</th>
                </tr>
              </thead>
              <tbody>
                {survey.fields.map((f, i) => (
                  <tr key={f.id} className="ag-table-row">
                    <td className="px-5 py-2.5" style={{ color: 'var(--ag-text3)' }}>{i + 1}</td>
                    <td className="px-5 py-2.5" style={{ color: 'var(--ag-text)' }}>{f.label}</td>
                    <td className="px-5 py-2.5">
                      <span className="ag-badge">{f.type}</span>
                    </td>
                    <td className="px-5 py-2.5" style={{ color: 'var(--ag-text2)' }}>{f.required ? 'Yes' : 'No'}</td>
                    <td className="px-5 py-2.5 max-w-[200px] truncate" style={{ color: 'var(--ag-text3)', fontSize: '0.7rem' }}>
                      {f.options?.join(', ') || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ag-card overflow-hidden">
            <div className="px-5 py-3 ag-table-head">
              <h3 className="text-sm font-medium">JSON Schema</h3>
            </div>
            <pre
              className="p-4 text-xs overflow-x-auto max-h-64 font-mono"
              style={{ color: 'var(--ag-green)' }}
            >
              {JSON.stringify(survey, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function SurveyFieldPreview({ field }: { field: SurveyField }) {
  const labelStyle = { color: 'var(--ag-text2)' };
  const inputClass = 'ag-input w-full px-3 py-2 text-sm';

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={labelStyle}>
        {field.label}
        {field.required && <span className="ml-0.5" style={{ color: 'var(--ag-red)' }}>*</span>}
      </label>

      {(field.type === 'text' || field.type === 'email' || field.type === 'date') && (
        <input type={field.type} placeholder={field.placeholder} className={inputClass} disabled />
      )}
      {field.type === 'number' && (
        <input type="number" placeholder={field.placeholder} min={field.min} max={field.max} className={inputClass} disabled />
      )}
      {field.type === 'textarea' && (
        <textarea placeholder={field.placeholder} rows={3} className={`${inputClass} resize-none`} disabled />
      )}
      {field.type === 'select' && (
        <select className={inputClass} disabled>
          <option>Select…</option>
          {field.options?.map((o) => <option key={o}>{o}</option>)}
        </select>
      )}
      {field.type === 'radio' && (
        <div className="space-y-1.5">
          {field.options?.map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm" style={{ color: 'var(--ag-text2)' }}>
              <input type="radio" name={field.id} disabled style={{ accentColor: 'var(--ag-accent)' }} /> {o}
            </label>
          ))}
        </div>
      )}
      {field.type === 'checkbox' && (
        <div className="space-y-1.5">
          {field.options?.map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm" style={{ color: 'var(--ag-text2)' }}>
              <input type="checkbox" disabled style={{ accentColor: 'var(--ag-accent)' }} className="rounded" /> {o}
            </label>
          ))}
        </div>
      )}
      {field.type === 'rating' && (
        <div className="flex gap-1">
          {Array.from({ length: field.max || 5 }, (_, i) => (
            <Star key={i} className={`w-6 h-6 ${i < 3 ? 'fill-current' : ''}`}
              style={{ color: i < 3 ? 'var(--ag-amber)' : 'var(--ag-border)' }} />
          ))}
        </div>
      )}
    </div>
  );
}
