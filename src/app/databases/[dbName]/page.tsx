"use client";

import Sidebar from "@/src/components/custom/Sidebar";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Layers, ChevronRight, Database, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { useParams } from "next/navigation";

export default function CollectionsPage() {
  const { dbName } = useParams();

  const { data: collections, isLoading, error } = useQuery({
    queryKey: ["collections", dbName],
    queryFn: async () => {
      const res = await fetch(`/api/databases/${dbName}/collections`);
      if (!res.ok) throw new Error("Failed to fetch collections");
      return res.json();
    },
  });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-compass-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8">
            <Link href="/databases" className="text-sm text-blue-600 dark:text-compass-green hover:underline flex items-center gap-1 mb-4">
              <ArrowLeft size={14} />
              Back to Databases
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                <Database size={24} />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-compass-text truncate">{dbName}</h1>
            </div>
            <p className="text-gray-500 dark:text-compass-muted mt-2">Browse collections in this database.</p>
          </header>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p>Loading collections...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg text-red-700 dark:text-red-400">
              Error: {(error as Error).message}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {collections?.map((col: any) => (
                <Link key={col.name} href={`/databases/${dbName}/${col.name}`}>
                  <div className="p-6 bg-white dark:bg-compass-bg border border-gray-200 dark:border-compass-border rounded-xl hover:border-blue-300 dark:hover:border-compass-green hover:shadow-md transition-all group cursor-pointer">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
                        <Layers size={20} />
                      </div>
                      <ChevronRight size={18} className="text-gray-300 dark:text-gray-700 group-hover:text-blue-500 dark:group-hover:text-compass-green transition-colors" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-compass-text mb-1">{col.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-compass-muted">
                      {col.documentCount} documents
                    </p>
                  </div>
                </Link>
              ))}
              {collections?.length === 0 && (
                <div className="col-span-full p-12 text-center text-gray-500 dark:text-compass-muted border border-dashed dark:border-compass-border rounded-xl">
                  No collections found in this database.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
