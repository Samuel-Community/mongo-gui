"use client";

import Sidebar from "@/src/components/custom/Sidebar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2, Layers, ArrowLeft, Trash2, Edit3, FileJson, Search,
  Check, AlertCircle, AlertTriangle, Wand2, Download, Upload,
  RefreshCw, ChevronLeft, ChevronRight, X,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import { Input } from "@/src/components/ui/input";
import Editor from "@/src/components/custom/MonacoEditorLazy";
import { cn } from "@/src/lib/utils";
import { convertToCSV } from "@/src/lib/data-utils";

// ─── Helpers ────────────────────────────────────────────────────────────────

function DocumentValue({ value }: { value: unknown }) {
  if (value === null) return <span className="text-gray-400 dark:text-gray-500">null</span>;
  if (typeof value === "boolean") return <span className="text-purple-600 dark:text-purple-400">{String(value)}</span>;
  if (typeof value === "number")  return <span className="text-blue-600 dark:text-blue-400">{value}</span>;
  if (typeof value === "string") {
    if (/^[0-9a-fA-F]{24}$/.test(value)) {
      return (
        <span>
          <span className="text-orange-600 dark:text-orange-400">ObjectId</span>
          <span className="text-gray-400">(</span>
          <span className="text-orange-700 dark:text-orange-300">&apos;{value}&apos;</span>
          <span className="text-gray-400">)</span>
        </span>
      );
    }
    if (!isNaN(Date.parse(value)) && value.includes("-")) {
      return <span className="text-blue-700 dark:text-blue-300">{value}</span>;
    }
    return <span className="text-cyan-700 dark:text-cyan-300">&quot;{value}&quot;</span>;
  }
  if (Array.isArray(value)) {
    return <span className="text-gray-400 dark:text-gray-500">Array({value.length})</span>;
  }
  if (typeof value === "object") {
    return <span className="text-gray-400 dark:text-gray-500">Object</span>;
  }
  return <span className="text-gray-900 dark:text-compass-text">{String(value)}</span>;
}

/**
 * Collapsible tree node — mirrors MongoDB Compass behaviour.
 * Nested objects/arrays are collapsed by default, root fields are expanded.
 */
function DocumentTreeNode({ label, value, depth }: { label: string; value: unknown; depth: number }) {
  const isExpandable = typeof value === "object" && value !== null;
  const [open, setOpen] = useState(false);

  const isArray = Array.isArray(value);
  const keys    = isExpandable ? Object.keys(value as object) : [];
  const preview = isArray
    ? `Array(${keys.length})`
    : `{${keys.slice(0, 3).join(", ")}${keys.length > 3 ? ", …" : ""}}`;

  return (
    <div className="py-[1px]">
      <div className="flex items-start gap-1">
        {isExpandable ? (
          <button
            onClick={() => setOpen((o) => !o)}
            className="mt-[3px] shrink-0 w-4 h-4 flex items-center justify-center text-gray-400 hover:text-blue-500 dark:hover:text-compass-green transition-colors"
          >
            <svg viewBox="0 0 10 10" className={cn("w-2.5 h-2.5 transition-transform duration-150", open && "rotate-90")} fill="none">
              <path d="M3 1.5 L7 5 L3 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <span className="shrink-0 w-4" />
        )}
        <span className="text-gray-600 dark:text-gray-300 font-medium shrink-0">{label}:</span>
        {isExpandable ? (
          !open && (
            <span className="text-gray-400 dark:text-gray-500 italic text-xs mt-[2px] truncate max-w-[300px]">
              {preview}
            </span>
          )
        ) : (
          <DocumentValue value={value} />
        )}
      </div>
      {isExpandable && open && (
        <div className="ml-5 border-l border-gray-200 dark:border-compass-border/40 pl-2">
          {keys.map((k) => (
            <DocumentTreeNode key={k} label={k} value={(value as Record<string, unknown>)[k]} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentTree({ data }: { data: unknown }) {
  if (data === null || typeof data !== "object") return <DocumentValue value={data} />;
  const keys = Object.keys(data as object);
  if (keys.length === 0) return <span className="text-gray-500 font-mono text-sm">{Array.isArray(data) ? "[]" : "{}"}</span>;
  return (
    <div className="font-mono text-sm">
      {keys.map((key) => (
        <DocumentTreeNode key={key} label={key} value={(data as Record<string, unknown>)[key]} depth={0} />
      ))}
    </div>
  );
}

// ─── Main content ────────────────────────────────────────────────────────────

function DocumentsContent() {
  const params         = useParams();
  const dbName         = params.dbName         as string;
  const collectionName = params.collectionName as string;
  const router         = useRouter();
  const searchParams   = useSearchParams();
  const queryClient    = useQueryClient();

  const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1"));
  const limit  = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const filter = searchParams.get("filter") ?? "{}";

  const [filterInput, setFilterInput] = useState(filter);
  const [editingDoc,  setEditingDoc]  = useState<Record<string, unknown> | null>(null);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [editorValue, setEditorValue] = useState("");
  const [jsonError,   setJsonError]   = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setFilterInput(filter); }, [filter]);

  useEffect(() => {
    if (editingDoc) {
      const { _id, ...rest } = editingDoc;
      void _id;
      setEditorValue(JSON.stringify(rest, null, 2));
    } else {
      setEditorValue("");
    }
  }, [editingDoc]);

  useEffect(() => {
    if (editingDoc) validateJson(editorValue);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorValue]);

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ["documents", dbName, collectionName, page, limit, filter],
    queryFn:  async () => {
      const p = new URLSearchParams({ page: String(page), limit: String(limit), filter });
      const res = await fetch(`/api/databases/${dbName}/collections/${collectionName}/documents?${p}`);
      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json();
    },
  });

  const documents  = data?.documents  ?? [];
  const pagination = data?.pagination ?? { total: 0, page: 1, limit: 20, pages: 1 };

  const importMutation = useMutation({
    mutationFn: async (docs: unknown[]) => {
      const res = await fetch(`/api/databases/${dbName}/collections/${collectionName}/documents`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(docs),
      });
      if (!res.ok) throw new Error("Failed to import documents");
      return res.json();
    },
    onSuccess: (d) => {
      alert(d.message);
      queryClient.invalidateQueries({ queryKey: ["documents", dbName, collectionName] });
    },
    onError: (err: Error) => alert("Import failed: " + err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      const res = await fetch(
        `/api/databases/${dbName}/collections/${collectionName}/documents/${docId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Failed to delete document");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents", dbName, collectionName] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ docId, data }: { docId: string; data: unknown }) => {
      const res = await fetch(
        `/api/databases/${dbName}/collections/${collectionName}/documents/${docId}`,
        { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }
      );
      if (!res.ok) throw new Error("Failed to update document");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", dbName, collectionName] });
      setEditingDoc(null);
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const updateUrl = (newParams: { page?: number; filter?: string }) => {
    const p = new URLSearchParams(searchParams.toString());
    if (newParams.page   !== undefined) p.set("page",   String(newParams.page));
    if (newParams.filter !== undefined) p.set("filter", newParams.filter);
    router.push(`?${p.toString()}`);
  };

  const handleFind = () => {
    try { JSON.parse(filterInput); updateUrl({ filter: filterInput, page: 1 }); }
    catch { alert("Invalid JSON filter"); }
  };

  const handleReset = () => { setFilterInput("{}"); router.push("?page=1&limit=20&filter={}"); };

  const handleReload = () =>
    queryClient.invalidateQueries({ queryKey: ["documents", dbName, collectionName] });

  const downloadBlob = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: name });
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const handleExport = (format: "json" | "csv") => {
    if (format === "json") {
      downloadBlob(new Blob([JSON.stringify(documents, null, 2)], { type: "application/json" }), `${collectionName}_export.json`);
    } else {
      downloadBlob(new Blob([convertToCSV(documents)], { type: "text/csv" }), `${collectionName}_export.csv`);
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        importMutation.mutate(Array.isArray(json) ? json : [json]);
      } catch { alert("Invalid JSON file"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const validateJson = (value: string): boolean => {
    if (!value.trim()) { setJsonError("JSON cannot be empty"); return false; }
    try { JSON.parse(value); setJsonError(null); return true; }
    catch (e: unknown) { setJsonError((e as Error).message); return false; }
  };

  const handleEditorChange    = (value: string | undefined) => setEditorValue(value ?? "");
  const handleEditorDidMount  = (editor: { layout: () => void }) => setTimeout(() => editor.layout(), 100);
  const handleEdit    = (doc: Record<string, unknown>) => { setEditingDoc(doc); setJsonError(null); };
  const handleDelete  = (id: string) => setDocToDelete(id);
  const confirmDelete = () => { if (docToDelete) { deleteMutation.mutate(docToDelete); setDocToDelete(null); } };

  const handleBeautify = () => {
    try { setEditorValue(JSON.stringify(JSON.parse(editorValue), null, 2)); }
    catch (e: unknown) { setJsonError("Cannot beautify: " + (e as Error).message); }
  };

  const handleSave = () => {
    try {
      const parsed = JSON.parse(editorValue);
      updateMutation.mutate({ docId: editingDoc!._id as string, data: parsed });
    } catch { /* validation prevents reaching here */ }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-compass-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <header className="mb-6 md:mb-8">
            <Link href={`/databases/${dbName}`} className="text-sm text-blue-600 dark:text-compass-green hover:underline flex items-center gap-1 mb-4">
              <ArrowLeft size={14} /> Back to Collections
            </Link>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-compass-green rounded-lg shrink-0">
                    <Layers size={24} />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-compass-text truncate">{collectionName}</h1>
                    <p className="text-gray-500 dark:text-compass-muted text-sm truncate">Database: {dbName}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={handleReload} disabled={isFetching}
                    className="h-10 md:h-9 flex-1 md:flex-none dark:border-compass-border dark:hover:bg-compass-border/30 dark:hover:text-white">
                    <RefreshCw size={14} className={cn("mr-2", isFetching && "animate-spin")} /> Reload
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-10 md:h-9 flex-1 md:flex-none dark:border-compass-border dark:hover:bg-compass-border/30 dark:hover:text-white">
                        <Download size={14} className="mr-2" /> Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 dark:bg-compass-bg dark:border-compass-border">
                      <DropdownMenuItem onClick={() => handleExport("json")} className="cursor-pointer gap-2 dark:hover:bg-compass-border/30">
                        <FileJson size={16} className="text-blue-500" /><span>JSON Format</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport("csv")} className="cursor-pointer gap-2 dark:hover:bg-compass-border/30">
                        <Layers size={16} className="text-compass-green" /><span>CSV (Excel)</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button variant="outline" size="sm" onClick={handleImportClick} disabled={importMutation.isPending}
                    className="h-10 md:h-9 flex-1 md:flex-none dark:border-compass-border dark:hover:bg-compass-border/30 dark:hover:text-white">
                    {importMutation.isPending ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Upload size={14} className="mr-2" />}
                    Import
                  </Button>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
                </div>
              </div>

              {/* Filter bar */}
              <div className="flex flex-col sm:flex-row gap-2 bg-white dark:bg-compass-bg p-2 md:p-3 rounded-xl border border-gray-200 dark:border-compass-border shadow-sm">
                <div className="flex-1 relative">
                  <div className="absolute left-3 top-3 text-gray-400 dark:text-compass-muted font-mono text-[10px] font-bold">FILTER</div>
                  <Input value={filterInput} onChange={(e) => setFilterInput(e.target.value)}
                    placeholder='{ "key": "value" }'
                    className="pl-14 h-12 md:h-10 font-mono text-sm bg-white dark:bg-compass-bg border-slate-200 dark:border-compass-border text-gray-900 dark:text-compass-text"
                    onKeyDown={(e) => e.key === "Enter" && handleFind()} />
                  {filterInput !== "{}" && (
                    <button onClick={() => setFilterInput("{}")} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-compass-text">
                      <X size={18} />
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleFind} className="flex-1 sm:flex-none h-12 md:h-10 dark:bg-compass-green dark:text-compass-bg dark:hover:bg-compass-green/90">
                    <Search size={18} className="mr-2" /> Find
                  </Button>
                  <Button variant="ghost" onClick={handleReset} className="text-slate-500 dark:text-compass-muted h-12 md:h-10 dark:hover:bg-compass-border/30">
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Loader2 className="animate-spin mb-4" size={32} /><p>Loading documents…</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg text-red-700 dark:text-red-400">
              Error: {(error as Error).message}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pagination info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400 px-1">
                <div className="text-center sm:text-left">
                  Showing <span className="font-bold text-gray-900 dark:text-gray-100">{documents.length}</span> of{" "}
                  <span className="font-bold text-gray-900 dark:text-gray-100">{pagination.total}</span> documents
                </div>
                <div className="flex items-center justify-center gap-1">
                  <Button variant="outline" size="icon" className="h-10 w-10 md:h-8 md:w-8 dark:border-slate-700 dark:hover:bg-slate-800"
                    disabled={page <= 1} onClick={() => updateUrl({ page: page - 1 })}>
                    <ChevronLeft size={18} />
                  </Button>
                  <div className="px-3 py-2 md:py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md font-medium text-gray-900 dark:text-gray-100 min-w-[100px] text-center">
                    Page {page} / {pagination.pages}
                  </div>
                  <Button variant="outline" size="icon" className="h-10 w-10 md:h-8 md:w-8 dark:border-slate-700 dark:hover:bg-slate-800"
                    disabled={page >= pagination.pages} onClick={() => updateUrl({ page: page + 1 })}>
                    <ChevronRight size={18} />
                  </Button>
                </div>
              </div>

              {/* Document list */}
              <div className="space-y-4">
                {documents.map((doc: Record<string, unknown>) => (
                  <div key={String(doc._id)} className="border border-gray-300 dark:border-compass-border rounded-xl overflow-hidden bg-white dark:bg-compass-bg shadow-sm hover:shadow-md transition-shadow">
                    <div className="bg-gray-100 dark:bg-compass-bg px-4 py-3 border-b border-gray-300 dark:border-compass-border flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      <div className="flex items-center gap-2 text-xs font-mono text-gray-600 dark:text-compass-muted truncate">
                        <FileJson size={14} className="shrink-0" />
                        <span className="truncate">ID: {String(doc._id)}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm"
                          className="flex-1 sm:flex-none h-10 sm:h-8 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-compass-border/30 dark:border-compass-border"
                          onClick={() => handleEdit(doc)}>
                          <Edit3 size={14} className="mr-1" /> Edit
                        </Button>
                        <Button variant="outline" size="sm"
                          className="flex-1 sm:flex-none h-10 sm:h-8 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-compass-border/30 dark:border-compass-border"
                          onClick={() => handleDelete(String(doc._id))}>
                          <Trash2 size={14} className="mr-1" /> Delete
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 overflow-x-auto bg-white dark:bg-compass-bg">
                      <DocumentTree data={doc} />
                    </div>
                  </div>
                ))}
                {documents.length === 0 && (
                  <div className="p-12 text-center text-gray-500 dark:text-compass-muted border border-dashed dark:border-compass-border rounded-xl">
                    No documents found in this collection.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Edit Modal ─────────────────────────────────────────────────────── */}
      {editingDoc && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-2 md:p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-[95%] md:w-full max-w-4xl flex flex-col h-[90vh] md:max-h-[95vh] shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden">

            {/* Modal header */}
            <div className="p-4 md:p-6 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-gray-100/50 dark:bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg shrink-0">
                  <Edit3 size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">Edit Document</h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-mono mt-0.5 truncate">Collection: {collectionName}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setEditingDoc(null)} className="rounded-full h-10 w-10 dark:hover:bg-slate-800">✕</Button>
            </div>

            {/* ID + Beautify bar */}
            <div className="px-4 md:px-6 py-3 md:py-4 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-500 shrink-0">ID</span>
                <code className="text-[10px] md:text-xs font-mono bg-white dark:bg-slate-900 px-2 py-1 rounded border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 shadow-sm truncate">
                  {String(editingDoc._id)}
                </code>
              </div>
              <Button variant="outline" size="sm" onClick={handleBeautify}
                className="h-10 md:h-8 text-xs gap-1.5 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-blue-400 flex-1 sm:flex-none">
                <Wand2 size={14} /> Beautify
              </Button>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-hidden flex flex-col relative">
              <div className="flex-1 min-h-0 border-b border-gray-100 dark:border-slate-800 bg-[#1e1e1e]">
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  theme="vs-dark"
                  value={editorValue}
                  onChange={handleEditorChange}
                  onMount={handleEditorDidMount}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    formatOnPaste: true,
                    tabSize: 2,
                    padding: { top: 12, bottom: 12 },
                    fixedOverflowWidgets: true,
                    wordWrap: "on",
                  }}
                />
              </div>
              {/* Validation bar */}
              <div className={cn(
                "px-4 md:px-6 py-2 md:py-3 flex items-center text-xs md:text-sm transition-colors",
                jsonError
                  ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400"
                  : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
              )}>
                {jsonError ? (
                  <><AlertCircle size={14} className="shrink-0 mr-2" /><span className="font-medium mr-1">Invalid:</span><span className="opacity-80 truncate">{jsonError}</span></>
                ) : (
                  <><Check size={14} className="shrink-0 mr-2" /><span className="font-medium">Valid JSON</span></>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div className="p-4 md:p-6 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center bg-gray-50/50 dark:bg-slate-950/50 gap-4">
              <Button variant="destructive" className="w-full sm:w-auto h-12 sm:h-10"
                onClick={() => setDocToDelete(String(editingDoc._id))}>
                <Trash2 size={16} className="mr-2" /> Delete Document
              </Button>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button variant="outline" onClick={() => setEditingDoc(null)}
                  className="flex-1 sm:flex-none h-12 sm:h-10 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending || !!jsonError}
                  className="flex-1 sm:min-w-[140px] h-12 sm:h-10">
                  {updateMutation.isPending ? <Loader2 className="animate-spin mr-2" size={16} /> : <Check className="mr-2" size={16} />}
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ───────────────────────────────────────────────────── */}
      {docToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#001e2b] text-white w-full max-w-md rounded-lg shadow-2xl border border-gray-800 overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-red-900/50 text-red-500 rounded-full"><AlertTriangle size={24} /></div>
                  <h2 className="text-2xl font-bold">Delete Document?</h2>
                </div>
                <button onClick={() => setDocToDelete(null)} className="text-gray-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <p className="text-gray-300 mb-6">
                Are you sure? This action <span className="text-red-400 font-bold">cannot be undone</span>.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setDocToDelete(null)} className="text-gray-300 hover:text-white hover:bg-gray-800">
                  Cancel
                </Button>
                <Button onClick={() => { confirmDelete(); if (editingDoc) setEditingDoc(null); }}
                  className="bg-red-600 hover:bg-red-700 text-white min-w-[120px]">
                  {deleteMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page wrapper (required for useSearchParams) ─────────────────────────────

export default function DocumentsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-white dark:bg-compass-bg">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    }>
      <DocumentsContent />
    </Suspense>
  );
}