import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowSquareOut,
  Check,
  ClipboardText,
  Copy,
  Download,
  Eye,
  FileText,
  FloppyDisk,
  MagicWand,
  PencilSimple,
  Plus,
  ShareNetwork,
  Star,
  Trash,
  Wrench,
  SpinnerGap,
} from '@phosphor-icons/react';
import api, { apiBaseUrl } from '../lib/api';
import type { GeneratedSurvey, SavedSurvey, SurveyDetail, SurveyField, SurveyStatus } from '../lib/types';

type EditorState = {
  id: number | null;
  title: string;
  description: string;
  goal: string;
  status: SurveyStatus;
  public_token: string | null;
  public_url: string | null;
  published_at: string | null;
  updated_at: string | null;
  question_count: number;
  schema: GeneratedSurvey | null;
};

const statusStyles: Record<SurveyStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-amber-500/15 text-amber-700 border-amber-500/25' },
  published: { label: 'Published', className: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/25' },
  archived: { label: 'Archived', className: 'bg-slate-500/15 text-slate-700 border-slate-500/25' },
};

function emptyEditor(): EditorState {
  return {
    id: null,
    title: '',
    description: '',
    goal: '',
    status: 'draft',
    public_token: null,
    public_url: null,
    published_at: null,
    updated_at: null,
    question_count: 0,
    schema: null,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildFieldHtml(field: SurveyField, index: number): string {
  const required = field.required ? '<span style="color:#ef4444">*</span>' : '';
  const name = `field_${index}`;
  const label = `<div class="field"><label for="${name}">${escapeHtml(field.label)} ${required}</label>`;

  let input = '';
  switch (field.type) {
    case 'textarea':
      input = `<textarea id="${name}" name="${name}" placeholder="${escapeHtml(field.placeholder ?? '')}"${field.required ? ' required' : ''}></textarea>`;
      break;
    case 'select':
      input = `<select id="${name}" name="${name}"${field.required ? ' required' : ''}><option value="">Select…</option>${(field.options ?? []).map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join('')}</select>`;
      break;
    case 'radio':
      input = `<div class="opts">${(field.options ?? []).map((option) => `<label><input type="radio" name="${name}" value="${escapeHtml(option)}"${field.required ? ' required' : ''}/> ${escapeHtml(option)}</label>`).join('')}</div>`;
      break;
    case 'checkbox':
      input = `<div class="opts">${(field.options ?? []).map((option) => `<label><input type="checkbox" name="${name}[]" value="${escapeHtml(option)}"/> ${escapeHtml(option)}</label>`).join('')}</div>`;
      break;
    case 'rating':
      input = `<div class="stars">${Array.from({ length: field.max ?? 5 }, (_, rating) => `<input type="radio" name="${name}" id="${name}_${rating + 1}" value="${rating + 1}"/><label for="${name}_${rating + 1}">★</label>`).join('')}</div>`;
      break;
    case 'number':
      input = `<input type="number" id="${name}" name="${name}" placeholder="${escapeHtml(field.placeholder ?? '')}"${field.min !== undefined ? ` min="${field.min}"` : ''}${field.max !== undefined ? ` max="${field.max}"` : ''}${field.required ? ' required' : ''}/>`;
      break;
    default:
      input = `<input type="${escapeHtml(field.type)}" id="${name}" name="${name}" placeholder="${escapeHtml(field.placeholder ?? '')}"${field.required ? ' required' : ''}/>`;
  }

  return `${label}${input}</div>`;
}

function generateHtml(survey: GeneratedSurvey): string {
  const fields = survey.fields.map(buildFieldHtml).join('\n');

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${escapeHtml(survey.title)}</title>
<style>
*,*::before,*::after{box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:760px;margin:40px auto;padding:0 20px;color:#1e293b;background:#fff;line-height:1.6}
h1{font-size:1.5rem;font-weight:700;margin-bottom:6px}
p.d{color:#64748b;margin-bottom:32px;font-size:.95rem}
.field{margin-bottom:20px}
label{display:block;font-size:.875rem;font-weight:600;color:#374151;margin-bottom:6px}
input,textarea,select{width:100%;padding:8px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:.9rem;color:#1e293b;background:#f9fafb}
input:focus,textarea:focus,select:focus{outline:none;border-color:#2563eb;background:#fff}
textarea{resize:vertical;min-height:80px}
.opts label{font-weight:400;display:flex;align-items:center;gap:8px;margin-bottom:4px}
.stars input[type=radio]{display:none}.stars label{font-size:1.5rem;cursor:pointer;color:#d1d5db;margin:0}
.btn{display:block;width:100%;padding:12px;background:#2563eb;color:#fff;border:none;border-radius:8px;font-size:1rem;font-weight:600;cursor:pointer;margin-top:32px}
.btn:hover{background:#1d4ed8}
footer{margin-top:48px;text-align:center;font-size:.75rem;color:#94a3b8}
@media print{body{margin:0}.btn{display:none}}
</style></head>
<body>
<h1>${escapeHtml(survey.title)}</h1>
${survey.description ? `<p class="d">${escapeHtml(survey.description)}</p>` : ''}
<form>
${fields}
<button type="submit" class="btn">Submit</button>
</form>
<footer>Generated by ISET Observatory · Survey Manager</footer>
</body></html>`;
}

function absolutePublicUrl(publicPath: string | null): string | null {
  if (!publicPath) return null;
  const origin = apiBaseUrl.replace(/\/api\/?$/, '');
  return `${origin}${publicPath}`;
}

function toEditor(detail: SurveyDetail): EditorState {
  return {
    id: detail.id,
    title: detail.title,
    description: detail.description ?? '',
    goal: detail.goal ?? '',
    status: detail.status,
    public_token: detail.public_token,
    public_url: detail.public_url,
    published_at: detail.published_at,
    updated_at: detail.updated_at,
    question_count: detail.question_count,
    schema: detail.schema,
  };
}

function applySummary(editor: EditorState, summary: SavedSurvey): EditorState {
  return {
    ...editor,
    id: summary.id,
    title: summary.title,
    description: summary.description ?? '',
    goal: summary.goal ?? editor.goal,
    status: summary.status,
    public_token: summary.public_token,
    public_url: summary.public_url,
    published_at: summary.published_at,
    updated_at: summary.updated_at,
    question_count: summary.question_count,
  };
}

function SurveyFieldPreview({ field }: { field: SurveyField }) {
  const inputClass = 'w-full rounded-xl border px-3 py-2 text-sm bg-white/80';

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        {field.label}
        {field.required && <span className="ml-1 text-red-500">*</span>}
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
          {field.options?.map((option) => <option key={option}>{option}</option>)}
        </select>
      )}
      {field.type === 'radio' && (
        <div className="space-y-1.5">
          {field.options?.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm text-slate-600">
              <input type="radio" name={field.id} disabled className="accent-cyan-600" /> {option}
            </label>
          ))}
        </div>
      )}
      {field.type === 'checkbox' && (
        <div className="space-y-1.5">
          {field.options?.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" disabled className="rounded accent-cyan-600" /> {option}
            </label>
          ))}
        </div>
      )}
      {field.type === 'rating' && (
        <div className="flex gap-1 text-amber-500">
          {Array.from({ length: field.max || 5 }, (_, index) => (
            <Star key={index} size={22} weight={index < 3 ? 'fill' : 'regular'} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SurveyGeneratorPage() {
  const [goalInput, setGoalInput] = useState('');
  const [context, setContext] = useState('');
  const [generating, setGenerating] = useState(false);

  const [editor, setEditor] = useState<EditorState>(emptyEditor());
  const [selectedSurveyId, setSelectedSurveyId] = useState<number | null>(null);
  const [surveys, setSurveys] = useState<SavedSurvey[]>([]);
  const [loadingSurveys, setLoadingSurveys] = useState(true);
  const [loadingSurvey, setLoadingSurvey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchSurveys = useCallback(async () => {
    setLoadingSurveys(true);
    try {
      const { data } = await api.get<{ success: boolean; data: SavedSurvey[] }>('/surveys');
      if (data.success) {
        setSurveys(data.data);
      }
    } catch {
      setSurveys([]);
    } finally {
      setLoadingSurveys(false);
    }
  }, []);

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  async function loadSurvey(id: number) {
    setSelectedSurveyId(id);
    setLoadingSurvey(true);
    setPreviewMode(false);
    try {
      const { data } = await api.get<{ success: boolean; data: SurveyDetail }>(`/surveys/${id}`);
      if (data.success) {
        setEditor(toEditor(data.data));
        setGoalInput(data.data.goal ?? '');
        setContext('');
      }
    } catch {
      alert('Failed to load survey.');
    } finally {
      setLoadingSurvey(false);
    }
  }

  function startNewSurvey() {
    setSelectedSurveyId(null);
    setEditor(emptyEditor());
    setGoalInput('');
    setContext('');
    setPreviewMode(false);
  }

  async function handleGenerate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!goalInput.trim() || generating) return;

    setGenerating(true);
    setPreviewMode(false);
    try {
      const { data } = await api.post<{ success: boolean; data: GeneratedSurvey }>('/ai/survey/generate', {
        goal: goalInput.trim(),
        context: context.trim() || undefined,
      });

      if (data.success) {
        setEditor({
          id: null,
          title: data.data.title,
          description: data.data.description,
          goal: data.data.goal,
          status: 'draft',
          public_token: null,
          public_url: null,
          published_at: null,
          updated_at: null,
          question_count: data.data.fields.length,
          schema: data.data,
        });
        setSelectedSurveyId(null);
      }
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      alert(message || 'Survey generation failed.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave(): Promise<SavedSurvey | null> {
    if (!editor.schema || saving) return null;

    setSaving(true);
    try {
      if (editor.id === null) {
        const { data } = await api.post<{ success: boolean; data: SavedSurvey }>('/surveys', {
          title: editor.title,
          description: editor.description,
          goal: editor.goal,
          schema: editor.schema,
        });

        if (data.success) {
          const nextEditor = applySummary(editor, data.data);
          setEditor(nextEditor);
          setSelectedSurveyId(nextEditor.id);
          await fetchSurveys();
          return data.data;
        }
      } else {
        const { data } = await api.patch<{ success: boolean; data: SavedSurvey }>(`/surveys/${editor.id}`, {
          title: editor.title,
          description: editor.description,
          goal: editor.goal,
          schema: editor.schema,
        });

        if (data.success) {
          const nextEditor = applySummary(editor, data.data);
          setEditor(nextEditor);
          setSelectedSurveyId(nextEditor.id);
          await fetchSurveys();
          return data.data;
        }
      }

      return null;
    } catch {
      alert('Failed to save survey.');
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!editor.schema || publishing) return;

    if (editor.id === null) {
      const saved = await handleSave();
      if (!saved) return;
      setEditor((current) => applySummary(current, saved));
    }

    setPublishing(true);
    try {
      const { data } = await api.post<{ success: boolean; data: SavedSurvey }>(`/surveys/${editor.id}/publish`);
      if (data.success) {
        setEditor((current) => applySummary(current, data.data));
        setSelectedSurveyId(data.data.id);
        await fetchSurveys();
      }
    } catch {
      alert('Failed to publish survey.');
    } finally {
      setPublishing(false);
    }
  }

  async function handleArchive() {
    if (!editor.id || archiving) return;

    setArchiving(true);
    try {
      const { data } = await api.post<{ success: boolean; data: SavedSurvey }>(`/surveys/${editor.id}/archive`);
      if (data.success) {
        setEditor((current) => applySummary(current, data.data));
        await fetchSurveys();
      }
    } catch {
      alert('Failed to archive survey.');
    } finally {
      setArchiving(false);
    }
  }

  async function handleDelete() {
    if (!editor.id || deleting) return;
    if (!confirm('Delete this survey permanently?')) return;

    setDeleting(true);
    try {
      await api.delete(`/surveys/${editor.id}`);
      startNewSurvey();
      await fetchSurveys();
    } catch {
      alert('Failed to delete survey.');
    } finally {
      setDeleting(false);
    }
  }

  async function copyJson() {
    if (!editor.schema) return;
    await navigator.clipboard.writeText(JSON.stringify(editor.schema, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 1800);
  }

  async function copyPublicLink() {
    const link = absolutePublicUrl(editor.public_url);
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1800);
  }

  function downloadHtml() {
    if (!editor.schema) return;

    const html = generateHtml(editor.schema);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${editor.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'survey'}.html`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (previewMode && editor.schema) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => setPreviewMode(false)}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={16} /> Back to manager
        </button>

        <div className="ag-card p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">{editor.title}</h2>
              <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[editor.status].className}`}>
                {statusStyles[editor.status].label}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">{editor.description}</p>
          </div>

          <div className="space-y-5">
            {editor.schema.fields.map((field) => <SurveyFieldPreview key={field.id} field={field} />)}
          </div>

          <button type="button" className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white opacity-50 cursor-not-allowed">
            Read-only preview
          </button>
        </div>
      </div>
    );
  }

  const publicLink = absolutePublicUrl(editor.public_url);

  return (
    <div className="flex gap-5 items-start">
      <aside className="hidden xl:flex flex-col w-72 shrink-0 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <ClipboardText size={18} className="text-cyan-700" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">Survey Library</p>
              <p className="text-xs text-slate-500 truncate">Drafts, published surveys, and archives</p>
            </div>
          </div>
          <button onClick={startNewSurvey} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
            <Plus size={14} /> New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[160px]">
          {loadingSurveys ? (
            <p className="px-2 py-3 text-xs text-slate-400">Loading surveys…</p>
          ) : surveys.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              No surveys yet. Generate one to start managing it here.
            </div>
          ) : (
            surveys.map((survey) => {
              const isSelected = selectedSurveyId === survey.id;
              return (
                <button
                  key={survey.id}
                  onClick={() => loadSurvey(survey.id)}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition ${isSelected ? 'border-cyan-500 bg-cyan-50' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-slate-900">{survey.title}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusStyles[survey.status].className}`}>
                          {statusStyles[survey.status].label}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-slate-500">{survey.question_count} questions</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">Updated {new Date(survey.updated_at).toLocaleDateString()}</p>
                    </div>
                    {survey.public_url && <ShareNetwork size={14} className="mt-0.5 text-cyan-700" />}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <div className="flex-1 min-w-0 space-y-5">
        <header className="ag-card p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                <Wrench size={14} /> Survey Management
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Create, publish, and manage surveys</h1>
                <p className="mt-1 max-w-2xl text-sm text-slate-600">
                  Build survey definitions with AI, keep them as drafts, publish stable versions for future client apps, and manage their lifecycle from one place.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{surveys.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-amber-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-amber-700">Drafts</p>
                <p className="mt-1 text-lg font-semibold text-amber-800">{surveys.filter((survey) => survey.status === 'draft').length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-emerald-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-emerald-700">Published</p>
                <p className="mt-1 text-lg font-semibold text-emerald-800">{surveys.filter((survey) => survey.status === 'published').length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Questions</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{editor.question_count}</p>
              </div>
            </div>
          </div>
        </header>

        <form onSubmit={handleGenerate} className="ag-card p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <MagicWand size={16} className="text-cyan-700" /> Generate a survey
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Survey goal <span className="text-red-500">*</span>
            </label>
            <textarea
              value={goalInput}
              onChange={(event) => setGoalInput(event.target.value)}
              rows={3}
              placeholder='e.g. Collect feedback from alumni about employment status and satisfaction with ISET education'
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Additional context <span className="text-slate-400">(optional)</span>
            </label>
            <input
              value={context}
              onChange={(event) => setContext(event.target.value)}
              placeholder="Target audience, language, date range, program, or anything else the generator should know"
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cyan-500"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={generating || !goalInput.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generating ? <SpinnerGap size={16} className="animate-spin" /> : <MagicWand size={16} />} Generate survey
            </button>
            <button
              type="button"
              onClick={startNewSurvey}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Plus size={16} /> New draft
            </button>
          </div>
        </form>

        {editor.schema && (
          <div className="space-y-4">
            <section className="ag-card p-5 space-y-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold text-slate-900">{editor.title}</h2>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[editor.status].className}`}>
                      {statusStyles[editor.status].label}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                      {editor.question_count} questions
                    </span>
                  </div>
                  <p className="max-w-3xl text-sm text-slate-600">{editor.description}</p>
                  <p className="text-xs text-slate-500">
                    Last updated {editor.updated_at ? new Date(editor.updated_at).toLocaleString() : 'just now'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setPreviewMode(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <Eye size={14} /> Preview
                  </button>
                  <button
                    onClick={copyJson}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    {copiedJson ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />} {copiedJson ? 'Copied' : 'Copy JSON'}
                  </button>
                  <button
                    onClick={downloadHtml}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <Download size={14} /> Download HTML
                  </button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Survey title</label>
                    <input
                      value={editor.title}
                      onChange={(event) => setEditor((current) => ({ ...current, title: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Description</label>
                    <textarea
                      value={editor.description}
                      onChange={(event) => setEditor((current) => ({ ...current, description: event.target.value }))}
                      rows={4}
                      className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Goal</label>
                    <input
                      value={editor.goal}
                      onChange={(event) => setEditor((current) => ({ ...current, goal: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Publication</p>
                  <div className="space-y-2 text-sm text-slate-700">
                    <div className="flex items-center justify-between gap-2">
                      <span>Status</span>
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[editor.status].className}`}>{statusStyles[editor.status].label}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>Public</span>
                      <span className="text-slate-500">{editor.public_url ? 'Enabled' : 'Not published'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>Published</span>
                      <span className="text-slate-500">{editor.published_at ? new Date(editor.published_at).toLocaleDateString() : '—'}</span>
                    </div>
                  </div>

                  {publicLink && (
                    <div className="space-y-2 rounded-2xl border border-cyan-200 bg-cyan-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Public read-only link</p>
                      <p className="break-all text-xs text-cyan-900">{publicLink}</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={copyPublicLink}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-cyan-800"
                        >
                          {copiedLink ? <Check size={14} /> : <Copy size={14} />} {copiedLink ? 'Copied' : 'Copy link'}
                        </button>
                        <a
                          href={publicLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-200 px-3 py-2 text-xs font-semibold text-cyan-800 transition hover:bg-cyan-100"
                        >
                          <ArrowSquareOut size={14} /> Open
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving || !editor.schema}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? <SpinnerGap size={16} className="animate-spin" /> : <FloppyDisk size={16} />} Save draft
                    </button>
                    <button
                      type="button"
                      onClick={handlePublish}
                      disabled={publishing || !editor.schema}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {publishing ? <SpinnerGap size={16} className="animate-spin" /> : <ShareNetwork size={16} />} Publish
                    </button>
                    <button
                      type="button"
                      onClick={handleArchive}
                      disabled={archiving || !editor.id}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <PencilSimple size={16} /> Archive
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting || !editor.id}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash size={16} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="ag-card overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
                <h3 className="text-sm font-semibold text-slate-900">Survey fields</h3>
                <span className="text-xs text-slate-500">Read-only structure generated by AI</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-2.5">#</th>
                    <th className="px-5 py-2.5">Label</th>
                    <th className="px-5 py-2.5">Type</th>
                    <th className="px-5 py-2.5">Required</th>
                    <th className="px-5 py-2.5">Options</th>
                  </tr>
                </thead>
                <tbody>
                  {editor.schema.fields.map((field, index) => (
                    <tr key={field.id} className="border-t border-slate-100">
                      <td className="px-5 py-2.5 text-slate-500">{index + 1}</td>
                      <td className="px-5 py-2.5 text-slate-900">{field.label}</td>
                      <td className="px-5 py-2.5"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{field.type}</span></td>
                      <td className="px-5 py-2.5 text-slate-600">{field.required ? 'Yes' : 'No'}</td>
                      <td className="px-5 py-2.5 max-w-[240px] truncate text-xs text-slate-500">
                        {field.options?.join(', ') || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="ag-card overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
                <h3 className="text-sm font-semibold text-slate-900">JSON schema</h3>
                <button
                  type="button"
                  onClick={copyJson}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  {copiedJson ? <Check size={13} className="text-emerald-600" /> : <FileText size={13} />} {copiedJson ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="max-h-80 overflow-x-auto p-4 text-xs leading-relaxed text-emerald-700">
                {JSON.stringify(editor.schema, null, 2)}
              </pre>
            </section>
          </div>
        )}

        {!loadingSurvey && !editor.schema && (
          <div className="ag-card p-6 text-center text-slate-500">
            Choose a survey from the library or generate a new one to begin managing it.
          </div>
        )}

        {loadingSurvey && (
          <div className="ag-card p-6 text-center text-slate-500">
            Loading survey…
          </div>
        )}
      </div>
    </div>
  );
}