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

  // Load history + available tables on mount
  useEffect(() => {
    api.get('/ai/history').then((r) => setMessages(r.data.data)).catch(() => {});
    api.get('/ai/tables').then((r) => setTables(r.data.data)).catch(() => {});
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || loading) return;

    // Optimistic user message
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
    <div className="flex flex-col h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-purple-400" />
            AI Analysis
          </h1>
          <p className="text-gray-400 mt-1">Ask questions about your data in plain language.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTables(!showTables)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Database className="w-4 h-4" />
            Tables ({tables.length})
          </button>
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
              title="Clear history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tables sidebar (collapsible) */}
      {showTables && (
        <div className="mb-4 bg-gray-800/50 border border-gray-700 rounded-xl p-4 shrink-0">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Available Tables</h3>
          {tables.length === 0 ? (
            <p className="text-xs text-gray-500">No imported tables yet. Import data first.</p>
          ) : (
            <div className="space-y-2">
              {tables.map((t) => (
                <div key={t.id} className="flex items-start gap-2 text-xs">
                  <Table2 className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-white font-mono">{t.table_name}</span>
                    <span className="text-gray-500 ml-1">({t.row_count} rows)</span>
                    <div className="text-gray-500 mt-0.5">
                      {t.column_mapping?.map((c) => c.columnName).join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto bg-gray-800/30 border border-gray-700 rounded-xl p-4 space-y-4 min-h-0">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm">No messages yet. Ask a question about your data!</p>
            <div className="mt-4 space-y-1.5 text-xs text-gray-600">
              <p>Try asking:</p>
              <p className="text-gray-400">"How many students are from Tozeur?"</p>
              <p className="text-gray-400">"What is the average GPA by city?"</p>
              <p className="text-gray-400">"Show me the top 10 highest grades"</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-purple-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Thinking…
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="mt-4 shrink-0 flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about your data…"
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}

// ─── Message Bubble Component ────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const [showSql, setShowSql] = useState(false);
  const [showData, setShowData] = useState(false);

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-purple-600/20 border border-purple-500/30 rounded-xl px-4 py-2.5 max-w-[80%]">
          <p className="text-sm text-white">{message.content}</p>
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex justify-start">
      <div className="bg-gray-800/60 border border-gray-700 rounded-xl px-4 py-3 max-w-[90%] space-y-2">
        <p className="text-sm text-gray-200">{message.content}</p>

        {/* SQL toggle */}
        {message.sql && (
          <button
            onClick={() => setShowSql(!showSql)}
            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            <Code className="w-3.5 h-3.5" />
            {showSql ? 'Hide' : 'Show'} SQL
            {showSql ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        )}
        {showSql && message.sql && (
          <pre className="bg-gray-900 rounded-lg p-3 text-xs text-green-400 overflow-x-auto font-mono">
            {message.sql}
          </pre>
        )}

        {/* Data table toggle */}
        {message.data && message.data.length > 0 && (
          <>
            <button
              onClick={() => setShowData(!showData)}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Table2 className="w-3.5 h-3.5" />
              {showData ? 'Hide' : 'Show'} Results ({message.rowCount} rows)
              {showData ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {showData && <ResultTable data={message.data} />}
          </>
        )}

        {/* No results */}
        {message.sql && message.data && message.data.length === 0 && (
          <div className="flex items-center gap-1.5 text-xs text-yellow-500">
            <AlertCircle className="w-3.5 h-3.5" />
            Query returned no results.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Result Table ────────────────────────────────────────────────

function ResultTable({ data }: { data: Record<string, unknown>[] }) {
  if (data.length === 0) return null;
  const columns = Object.keys(data[0]);

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-700">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-gray-900 text-gray-400 border-b border-gray-700">
            {columns.map((c) => (
              <th key={c} className="px-3 py-2 text-left font-medium whitespace-nowrap">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700/40">
          {data.slice(0, 50).map((row, ri) => (
            <tr key={ri} className="hover:bg-gray-800/40 text-gray-300">
              {columns.map((c) => (
                <td key={c} className="px-3 py-1.5 whitespace-nowrap max-w-[200px] truncate">
                  {String(row[c] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 50 && (
        <p className="text-xs text-gray-500 text-center py-2">
          Showing 50 of {data.length} rows
        </p>
      )}
    </div>
  );
}
