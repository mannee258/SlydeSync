"use client";

import React, { useRef, useState } from "react";
import { Folder, FolderPlus, Pencil, Trash2, X, Check } from "lucide-react";

function displayName(folder) {
  return folder === "default" ? "All Images" : folder;
}

export default function FolderPicker({
  folders,
  folderCounts,
  selectedFolder,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}) {
  const [creating, setCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState("");

  // Per-folder editing state: { folder: string } | null
  const [editingFolder, setEditingFolder] = useState(null);
  const [editName, setEditName] = useState("");
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState("");
  const editInputRef = useRef(null);

  // ── Create ──────────────────────────────────────────────────────────────
  async function handleCreate() {
    const trimmed = newFolderName.trim();
    if (!trimmed || createBusy) return;
    setCreateError("");
    setCreateBusy(true);
    try {
      await onCreateFolder(trimmed);
      setNewFolderName("");
      setCreating(false);
    } catch (err) {
      setCreateError(err?.message || "Failed to create folder.");
    } finally {
      setCreateBusy(false);
    }
  }

  function handleCreateKeyDown(e) {
    if (e.key === "Enter") handleCreate();
    if (e.key === "Escape") {
      setCreating(false);
      setNewFolderName("");
      setCreateError("");
    }
  }

  // ── Rename ───────────────────────────────────────────────────────────────
  function startEdit(folder, e) {
    e.stopPropagation();
    setEditingFolder(folder);
    setEditName(folder);
    setEditError("");
    setTimeout(() => editInputRef.current?.select(), 0);
  }

  function cancelEdit() {
    setEditingFolder(null);
    setEditName("");
    setEditError("");
  }

  async function commitEdit(folder) {
    const trimmed = editName.trim();
    if (!trimmed || editBusy) return;
    if (trimmed === folder) { cancelEdit(); return; }
    setEditError("");
    setEditBusy(true);
    try {
      await onRenameFolder(folder, trimmed);
      setEditingFolder(null);
    } catch (err) {
      setEditError(err?.message || "Failed to rename folder.");
    } finally {
      setEditBusy(false);
    }
  }

  function handleEditKeyDown(e, folder) {
    if (e.key === "Enter") commitEdit(folder);
    if (e.key === "Escape") cancelEdit();
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  async function handleDelete(folder, e) {
    e.stopPropagation();
    if (!confirm(`Delete folder "${displayName(folder)}" and all its images?`)) return;
    try {
      await onDeleteFolder(folder);
    } catch (err) {
      alert(err?.message || "Failed to delete folder.");
    }
  }

  return (
    <div className="bg-[#0C1016] border border-[#1C222B] rounded-2xl p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/80">
          <Folder className="w-4 h-4 text-[#3F82FF]" />
          <h2 className="font-semibold text-sm">Folders</h2>
          <span className="text-xs font-semibold tabular-nums bg-[#1B1F27] border border-[#242A34] text-white/50 px-1.5 py-0.5 rounded-md">
            {folders.length}
          </span>
        </div>
        <button
          onClick={() => {
            setCreating((v) => !v);
            setNewFolderName("");
            setCreateError("");
          }}
          className="p-1 rounded-md text-white/40 hover:text-[#3F82FF] hover:bg-white/5 transition"
          title="New folder"
        >
          {creating ? <X className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
        </button>
      </div>

      {/* New folder input */}
      {creating && (
        <div className="flex gap-2">
          <input
            autoFocus
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={handleCreateKeyDown}
            placeholder="folder-name"
            className="flex-1 min-w-0 bg-[#1B1F27] border border-[#242A34] focus:border-[#3F82FF] text-white rounded-lg px-3 py-1.5 text-xs outline-none transition"
          />
          <button
            onClick={handleCreate}
            disabled={createBusy || !newFolderName.trim()}
            className="px-2.5 py-1.5 rounded-lg bg-[#3F82FF] text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2f72ef] transition"
          >
            Add
          </button>
        </div>
      )}
      {createError && <p className="text-xs text-red-400 -mt-1">{createError}</p>}

      {/* Folder list */}
      <div className="flex flex-col gap-0.5">
        {folders.map((folder) => {
          const isActive = folder === selectedFolder;
          const isEditing = editingFolder === folder;
          const isDefault = folder === "default";

          return (
            <div key={folder} className="group relative">
              {isEditing ? (
                /* ── Inline rename row ── */
                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-[#1B1F27] border border-[#3F82FF]/40">
                  <Folder className="w-4 h-4 shrink-0 text-[#3F82FF]" />
                  <input
                    ref={editInputRef}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => handleEditKeyDown(e, folder)}
                    className="flex-1 min-w-0 bg-transparent text-white text-sm outline-none"
                    disabled={editBusy}
                  />
                  <button
                    onClick={() => commitEdit(folder)}
                    disabled={editBusy || !editName.trim()}
                    className="p-0.5 text-[#3F82FF] hover:text-white disabled:opacity-40 transition"
                    title="Save"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-0.5 text-white/40 hover:text-white transition"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                /* ── Normal folder row ── */
                <button
                  onClick={() => onSelectFolder(folder)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition text-sm ${
                    isActive
                      ? "bg-[#3F82FF] text-white"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Folder className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-white/30"}`} />
                  <span className="flex-1 truncate font-medium">{displayName(folder)}</span>

                  {/* Action icons — shown on group hover, hidden for default folder */}
                  {!isDefault && (
                    <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => startEdit(folder, e)}
                        onKeyDown={(e) => e.key === "Enter" && startEdit(folder, e)}
                        title="Rename folder"
                        className={`p-1 rounded-md transition ${
                          isActive
                            ? "hover:bg-white/20 text-white/70 hover:text-white"
                            : "hover:bg-white/10 text-white/40 hover:text-white"
                        }`}
                      >
                        <Pencil className="w-3 h-3" />
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => handleDelete(folder, e)}
                        onKeyDown={(e) => e.key === "Enter" && handleDelete(folder, e)}
                        title="Delete folder"
                        className={`p-1 rounded-md transition ${
                          isActive
                            ? "hover:bg-red-500/30 text-white/70 hover:text-red-300"
                            : "hover:bg-red-500/20 text-white/40 hover:text-red-400"
                        }`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </span>
                    </span>
                  )}

                  <span
                    className={`text-xs font-semibold tabular-nums shrink-0 ${
                      isActive ? "text-white/80" : "text-white/30"
                    }`}
                  >
                    {Number(folderCounts?.[folder] || 0)}
                  </span>
                </button>
              )}
              {/* Per-folder edit error */}
              {isEditing && editError && (
                <p className="text-xs text-red-400 px-2 mt-1">{editError}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Info box */}
      <div className="pt-3">
        <p className="text-xs text-white/30 leading-relaxed">
          Organize your images into folders for better management. The slideshow
          can play from a specific folder or all images.
        </p>
      </div>
    </div>
  );
}
