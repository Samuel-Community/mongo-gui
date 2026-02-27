"use client";

import Sidebar from "@/src/components/custom/Sidebar";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Database, Layers, Activity } from "lucide-react";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";

export default function Home() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-compass-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-compass-text">Dashboard</h1>
            <p className="text-gray-500 dark:text-compass-muted mt-2">Welcome to your modernized MongoDB management interface.</p>
          </header>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <div className="p-6 bg-white dark:bg-compass-bg rounded-xl border border-gray-200 dark:border-compass-border relative overflow-hidden shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-600 dark:text-compass-muted">Total Databases</h3>
                <Database className="text-blue-600 dark:text-blue-500 w-5 h-5" />
              </div>
              {isLoading ? (
                <Loader2 className="animate-spin text-gray-400" />
              ) : (
                <p className="text-3xl font-bold text-gray-900 dark:text-compass-text">{stats?.dbCount ?? 0}</p>
              )}
            </div>

            <div className="p-6 bg-white dark:bg-compass-bg rounded-xl border border-gray-200 dark:border-compass-border relative overflow-hidden shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-600 dark:text-compass-muted">Total Collections</h3>
                <Layers className="text-purple-600 dark:text-purple-500 w-5 h-5" />
              </div>
              {isLoading ? (
                <Loader2 className="animate-spin text-gray-400" />
              ) : (
                <p className="text-3xl font-bold text-gray-900 dark:text-compass-text">{stats?.collectionCount ?? 0}</p>
              )}
            </div>

            <div className="p-6 bg-white dark:bg-compass-bg rounded-xl border border-gray-200 dark:border-compass-border relative overflow-hidden shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-600 dark:text-compass-muted">Server Status</h3>
                <Activity className="text-compass-green w-5 h-5" />
              </div>
              {isLoading ? (
                <Loader2 className="animate-spin text-gray-400" />
              ) : (
                <p className={stats?.status === "online" ? "text-emerald-600 dark:text-compass-green font-bold text-xl" : "text-red-600 dark:text-red-400 font-bold text-xl"}>
                  {stats?.status === "online" ? "Online" : "Offline"}
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-8 p-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl text-amber-800 dark:text-amber-200">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg text-amber-600 dark:text-amber-400">
                  <Activity size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Connection Error</h3>
                  <p className="text-sm opacity-90 mb-4">
                    The application could not connect to the MongoDB server at <code>127.0.0.1:27017</code>. 
                    If you are using a remote database (like MongoDB Atlas), please ensure your <code>MONGODB_URI</code> is correctly configured.
                  </p>
                  <div className="flex gap-3">
                    <Link href="/connections">
                      <Button variant="default" className="bg-amber-600 hover:bg-amber-700 text-white border-none">
                        Configure Connection
                      </Button>
                    </Link>
                    <Button variant="outline" onClick={() => window.location.reload()} className="border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50">
                      Retry
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
