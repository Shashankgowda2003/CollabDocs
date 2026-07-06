"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { saveApiKey, deleteApiKey, getApiKeys } from "@/server/actions/api-keys";

interface Props {
  onClose: () => void;
}

interface ApiKeyEntry {
  id: string;
  provider: string;
  createdAt: Date;
  updatedAt: Date;
}

export function ApiKeySettings({ onClose }: Props) {
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
  const [provider, setProvider] = useState("openai");
  const [key, setKey] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getApiKeys().then(setKeys).catch(() => {});
  }, []);

  async function handleSave() {
    if (!key.trim()) return;
    setLoading(true);
    setMessage("");
    try {
      await saveApiKey(provider, key.trim());
      setKey("");
      setMessage("API key saved.");
      const updated = await getApiKeys();
      setKeys(updated);
    } catch {
      setMessage("Failed to save key.");
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    try {
      await deleteApiKey(id);
      setKeys((prev) => prev.filter((k) => k.id !== id));
      setMessage("Key removed.");
    } catch {
      setMessage("Failed to remove key.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">AI API Keys</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Bring your own API keys to use your preferred AI provider. Keys are stored encrypted.
          </p>

          {message && (
            <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-2.5 text-xs text-blue-600 dark:text-blue-400">
              {message}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-sm text-zinc-900 dark:text-white"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">API Key</label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-..."
              className="mt-1.5 w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2.5 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={loading || !key.trim()}
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 py-2.5 text-sm font-semibold text-white disabled:opacity-40 shadow-lg shadow-purple-500/20"
          >
            {loading ? "Saving..." : "Save Key"}
          </button>

          {keys.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-xs font-medium text-zinc-500">Saved Keys</p>
              {keys.map((k) => (
                <div key={k.id} className="flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2.5">
                  <div>
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 capitalize">{k.provider}</span>
                    <span className="text-[10px] text-zinc-400 ml-2">
                      Added {new Date(k.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(k.id)}
                    className="rounded-lg p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
