import { useState } from 'react';
import {
  ClipboardList,
  Wand2,
  Loader2,
  Eye,
  Copy,
  Check,
  ArrowLeft,
  Star,
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

  // ─── Preview mode: render the survey as a form ─────────────────

  if (previewMode && survey) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <button
          onClick={() => setPreviewMode(false)}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to editor
        </button>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">{survey.title}</h2>
            <p className="text-gray-400 text-sm mt-1">{survey.description}</p>
          </div>

          <div className="space-y-5">
            {survey.fields.map((field) => (
              <SurveyFieldPreview key={field.id} field={field} />
            ))}
          </div>

          <button
            type="button"
            className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg opacity-60 cursor-not-allowed"
          >
            Submit (Preview Only)
          </button>
        </div>
      </div>
    );
  }

  // ─── Main view ─────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-teal-400" />
          AI Survey Generator
        </h1>
        <p className="text-gray-400 mt-1">
          Describe your survey goal and AI will generate a professional survey form.
        </p>
      </div>

      {/* Input form */}
      <form onSubmit={handleGenerate} className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Survey Goal <span className="text-red-400">*</span>
          </label>
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            rows={3}
            placeholder='e.g. "Collect feedback from alumni about their employment status and satisfaction with their ISET education"'
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Additional Context <span className="text-gray-500">(optional)</span>
          </label>
          <input
            type="text"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g. Target audience: 2020-2024 graduates, bilingual French/Arabic"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={generating || !goal.trim()}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Generating…
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" /> Generate Survey
            </>
          )}
        </button>
      </form>

      {/* Result */}
      {survey && (
        <div className="space-y-4">
          {/* Survey summary card */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">{survey.title}</h2>
                <p className="text-gray-400 text-sm mt-1">{survey.description}</p>
                <p className="text-xs text-gray-500 mt-2">{survey.fields.length} fields generated</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setPreviewMode(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <button
                  onClick={copyJSON}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy JSON'}
                </button>
              </div>
            </div>
          </div>

          {/* Fields list */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-700">
              <h3 className="text-sm font-medium text-gray-300">Survey Fields</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-left">
                  <th className="px-5 py-2.5 font-medium">#</th>
                  <th className="px-5 py-2.5 font-medium">Label</th>
                  <th className="px-5 py-2.5 font-medium">Type</th>
                  <th className="px-5 py-2.5 font-medium">Required</th>
                  <th className="px-5 py-2.5 font-medium">Options</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/60">
                {survey.fields.map((f, i) => (
                  <tr key={f.id} className="hover:bg-gray-800/60 transition-colors">
                    <td className="px-5 py-2.5 text-gray-500">{i + 1}</td>
                    <td className="px-5 py-2.5 text-white">{f.label}</td>
                    <td className="px-5 py-2.5">
                      <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-700 text-gray-300">
                        {f.type}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-gray-400">{f.required ? 'Yes' : 'No'}</td>
                    <td className="px-5 py-2.5 text-gray-500 text-xs max-w-[200px] truncate">
                      {f.options?.join(', ') || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* JSON view */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-300">JSON Schema</h3>
            </div>
            <pre className="p-4 text-xs text-green-400 overflow-x-auto max-h-64 font-mono">
              {JSON.stringify(survey, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Survey Field Preview (renders a simple form widget) ─────────

function SurveyFieldPreview({ field }: { field: SurveyField }) {
  const labelClass = 'block text-sm font-medium text-gray-300 mb-1.5';
  const inputClass =
    'w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 outline-none';

  return (
    <div>
      <label className={labelClass}>
        {field.label}
        {field.required && <span className="text-red-400 ml-0.5">*</span>}
      </label>

      {(field.type === 'text' || field.type === 'email' || field.type === 'date') && (
        <input
          type={field.type}
          placeholder={field.placeholder}
          className={inputClass}
          disabled
        />
      )}

      {field.type === 'number' && (
        <input
          type="number"
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
          className={inputClass}
          disabled
        />
      )}

      {field.type === 'textarea' && (
        <textarea
          placeholder={field.placeholder}
          rows={3}
          className={`${inputClass} resize-none`}
          disabled
        />
      )}

      {field.type === 'select' && (
        <select className={inputClass} disabled>
          <option value="">Select…</option>
          {field.options?.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      )}

      {field.type === 'radio' && (
        <div className="space-y-1.5">
          {field.options?.map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm text-gray-300">
              <input type="radio" name={field.id} disabled className="accent-blue-500" />
              {o}
            </label>
          ))}
        </div>
      )}

      {field.type === 'checkbox' && (
        <div className="space-y-1.5">
          {field.options?.map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" disabled className="accent-blue-500 rounded" />
              {o}
            </label>
          ))}
        </div>
      )}

      {field.type === 'rating' && (
        <div className="flex gap-1">
          {Array.from({ length: field.max || 5 }, (_, i) => (
            <Star
              key={i}
              className={`w-6 h-6 ${i < 3 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
