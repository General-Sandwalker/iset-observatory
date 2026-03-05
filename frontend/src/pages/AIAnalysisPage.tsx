import { useState, useEffect, useRef } from 'react';
import {
  BrainCircuit,
  Send,
  Loader2,
  Database,
  Trash2,
  Table2,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Code,
} from 'lucide-react';
import api from '../lib/api';
import type { ChatMessage, QueryableTable } from '../lib/types';

export default function AIAnalysisPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState<QueryableTable[]>([]);
  const [showTables, setShowTables] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/ai/history').then((r) => setMessages(r.data.data)).catch(() => {});
    api.get('/ai/tables').then((r) => setTables(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || loading) return;

    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setQuestion('');
    setLoading(true);

    try {
      const res = await api.post('/ai/query', { question: q });
      const result = res.data.data;
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: result.explanation,
          sql: result.sql,
          data: result.data,
          rowCount: result.rowCount,
          insights: result.insights,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: err.response?.data?.message || 'Something went wrong. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function clearHistory() {
    if (!confirm('Clear all chat history?')) return;
    await api.delete('/ai/history').catch(() => {});
    setMessages([]);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--ag-text)' }}>
            <BrainCircuit className="w-6 h-6" style={{ color: 'var(--ag-accent)' }} />
            AI Analysis
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ag-text2)' }}>
            Ask questions about your data in plain language.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTables(!showTables)}
            className="ag-btn-ghost flex items-center gap-1.5 px-3 py-2 text-xs"
          >
            <Database className="w-4 h-4" />
            Tables ({tables.length})
          </button>
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--ag-text3)' }}
              onMouseOver={(e) => (e.currentTarget.style.color = 'var(--ag-red)')}
              onMouseOut={(e) => (e.currentTarget.style.color = 'var(--ag-text3)')}
              title="Clear history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tables sidebar */}
      {showTables && (
        <div className="ag-card mb-4 p-4 shrink-0">
          <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--ag-text2)' }}>Available Tables</h3>
          {tables.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--ag-text3)' }}>No imported tables yet.</p>
          ) : (
            <div className="space-y-2">
              {tables.map((t) => (
                <div key={t.id} className="flex items-start gap-2 text-xs">
                  <Table2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: 'var(--ag-accent)' }} />
                  <div>
                    <span className="font-mono font-medium" style={{ color: 'var(--ag-text)' }}>{t.table_name}</span>
                    <span className="ml-1" style={{ color: 'var(--ag-text3)' }}>({t.row_count} rows)</span>
                    <div className="mt-0.5" style={{ color: 'var(--ag-text3)' }}>
                      {t.column_mapping?.map((c) => c.columnName).join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat area */}
      <div
        className="flex-1 overflow-y-auto ag-card p-4 space-y-4 min-h-0"
        style={{ background: 'var(--ag-surface2)' }}
      >
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full" style={{ color: 'var(--ag-text3)' }}>
            <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No messages yet. Ask a question about your data!</p>
            <div className="mt-4 space-y-1.5 text-xs">
              <p style={{ color: 'var(--ag-text3)' }}>Try asking:</p>
              <p style={{ color: 'var(--ag-text2)' }}>"How many students are from Tozeur?"</p>
              <p style={{ color: 'var(--ag-text2)' }}>"What is the average GPA by city?"</p>
              <p style={{ color: 'var(--ag-text2)' }}>"Show me the top 10 highest grades"</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--ag-accent)' }}>
            <Loader2 className="w-4 h-4 animate-spin" />
            Querying and analysing your data…
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-4 shrink-0 flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about your data…"
          className="ag-input flex-1 px-4 py-3 text-sm"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="ag-btn-primary px-4 py-3"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const [showSql, setShowSql] = useState(false);
  const [showData, setShowData] = useState(true);

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div
          className="rounded-xl px-4 py-2.5 max-w-[80%]"
          style={{
            background: 'var(--ag-accent-lo)',
            border: '1px solid var(--ag-accent)',
          }}
        >
          <p className="text-sm" style={{ color: 'var(--ag-text)' }}>{message.content}</p>
        </div>
      </div>
    );
  }

  const hasResults = message.data && message.data.length > 0;
  const hasInsights = !!message.insights;

  return (
    <div className="flex justify-start">
      <div className="ag-card max-w-[92%] overflow-hidden" style={{ background: 'var(--ag-surface)' }}>

        {/* Insights banner — shown when we have real data analysis */}
        {hasInsights ? (
          <div
            className="px-4 py-3 text-sm leading-relaxed"
            style={{
              background: 'var(--ag-accent-lo)',
              borderBottom: '1px solid var(--ag-accent)',
              color: 'var(--ag-text)',
            }}
          >
            <div className="flex items-start gap-2">
              <BrainCircuit
                className="w-4 h-4 mt-0.5 shrink-0"
                style={{ color: 'var(--ag-accent)' }}
              />
              <p>{message.insights}</p>
            </div>
          </div>
        ) : (
          /* Fallback: plain explanation when no insights (e.g. error or empty result) */
          <div className="px-4 py-3">
            <p className="text-sm" style={{ color: 'var(--ag-text)' }}>{message.content}</p>
          </div>
        )}

        {/* Stats strip */}
        {message.sql && (
          <div
            className="flex items-center gap-3 px-4 py-2 text-xs"
            style={{
              borderBottom: hasResults || true ? '1px solid var(--ag-border)' : undefined,
              background: 'var(--ag-surface2)',
              color: 'var(--ag-text3)',
            }}
          >
            {message.rowCount !== undefined && (
              <span
                className="flex items-center gap-1 font-medium"
                style={{ color: message.rowCount > 0 ? 'var(--ag-green)' : 'var(--ag-amber)' }}
              >
                <Table2 className="w-3.5 h-3.5" />
                {message.rowCount} {message.rowCount === 1 ? 'row' : 'rows'} returned
              </span>
            )}
            <button
              onClick={() => setShowSql(!showSql)}
              className="ml-auto flex items-center gap-1 transition-colors hover:opacity-80"
              style={{ color: 'var(--ag-accent)' }}
            >
              <Code className="w-3.5 h-3.5" />
              {showSql ? 'Hide SQL' : 'View SQL'}
              {showSql ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          </div>
        )}

        {/* SQL block (collapsible) */}
        {showSql && message.sql && (
          <pre
            className="px-4 py-3 text-xs overflow-x-auto font-mono"
            style={{
              background: 'var(--ag-bg2)',
              color: 'var(--ag-green)',
              borderBottom: '1px solid var(--ag-border)',
            }}
          >
            {message.sql}
          </pre>
        )}

        {/* Empty result warning */}
        {message.sql && message.data && message.data.length === 0 && (
          <div className="flex items-center gap-1.5 px-4 py-3 text-xs" style={{ color: 'var(--ag-amber)' }}>
            <AlertCircle className="w-3.5 h-3.5" />
            Query returned no results.
          </div>
        )}

        {/* Results table */}
        {hasResults && (
          <div className="px-4 py-3">
            <button
              onClick={() => setShowData(!showData)}
              className="flex items-center gap-1.5 text-xs mb-2 transition-colors"
              style={{ color: 'var(--ag-text2)' }}
            >
              <Table2 className="w-3.5 h-3.5" />
              <span className="font-medium">Results</span>
              <span style={{ color: 'var(--ag-text3)' }}>({message.rowCount} rows)</span>
              {showData ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {showData && <ResultTable data={message.data!} />}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultTable({ data }: { data: Record<string, unknown>[] }) {
  if (data.length === 0) return null;
  const columns = Object.keys(data[0]);

  return (
    <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid var(--ag-border)' }}>
      <table className="w-full text-xs">
        <thead>
          <tr className="ag-table-head">
            {columns.map((c) => (
              <th key={c} className="px-3 py-2 text-left font-medium whitespace-nowrap">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 50).map((row, ri) => (
            <tr key={ri} className="ag-table-row">
              {columns.map((c) => (
                <td key={c} className="px-3 py-1.5 whitespace-nowrap max-w-[200px] truncate"
                  style={{ color: 'var(--ag-text2)' }}>
                  {String(row[c] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 50 && (
        <p className="text-xs text-center py-2" style={{ color: 'var(--ag-text3)' }}>
          Showing 50 of {data.length} rows
        </p>
      )}
    </div>
  );
}
