'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

/**
 * Monaco Editor lazy-loaded with next/dynamic.
 *
 * Without this, Monaco (~2 MB of JS) is bundled into the main chunk and
 * downloaded on every page load — even on mobile where the user may never
 * open the edit modal. With dynamic(), it is only fetched when the component
 * actually mounts (i.e. when the user clicks "Edit" on a document).
 */
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
        <Loader2 className="animate-spin text-gray-400 mr-2" size={20} />
        <span className="text-gray-400 text-sm">Loading editor…</span>
      </div>
    ),
  }
);

export default MonacoEditor;
