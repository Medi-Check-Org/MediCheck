"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/ui/loading";
import { Key, Plus, Copy, RotateCcw, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";

/** API key record as returned by GET /api/web/api-keys */
interface ApiKeyRecord {
  id: string;
  name: string;
  organizationId: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt: string | null;
}

/** Response from POST /api/web/api-keys (create) */
interface CreateKeyResponse {
  name: string;
  apiKey: string;
  scopes: string[];
  expiresAt: string | null;
}

type PendingAction =
  | { type: "revoke" | "rotate"; id: string; name: string }
  | null;

/** Extract user-facing message from API error response (supports both { error: string } and toErrorResponse shape). */
function apiErrorMessage(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "error" in data) {
    const e = (data as { error: unknown }).error;
    if (typeof e === "string") return e;
    if (e && typeof e === "object" && "message" in e && typeof (e as { message: unknown }).message === "string") {
      return (e as { message: string }).message;
    }
  }
  return fallback;
}

export function ManufacturerApiKeys() {
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [rawKeyModal, setRawKeyModal] = useState<{ key: string; label: string } | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [creating, setCreating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const isMutating = revokingId !== null || rotatingId !== null;

  const [newName, setNewName] = useState("");
  const [newScopes, setNewScopes] = useState<string[]>([]);
  const [scopeInput, setScopeInput] = useState("");
  const [expiryMode, setExpiryMode] = useState<"never" | "date">("never");
  const [newExpiresAt, setNewExpiresAt] = useState("");

  const loadKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/web/api-keys");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(apiErrorMessage(data, "Failed to load API keys"));
      }
      const data: ApiKeyRecord[] = await res.json();
      setKeys(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load API keys");
      setKeys([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newScopes.length === 0) {
      toast.error("Name and at least one scope are required");
      return;
    }

    if (expiryMode === "date") {
      if (!newExpiresAt) {
        toast.error("Choose an expiry date/time or select Never expires");
        return;
      }
      const parsedDate = new Date(newExpiresAt);
      if (Number.isNaN(parsedDate.getTime()) || parsedDate <= new Date()) {
        toast.error("Expiry date must be a valid future date/time");
        return;
      }
    }

    setCreating(true);
    try {
      const res = await fetch("/api/web/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          permissions: newScopes,
          expiresAt:
            expiryMode === "date" && newExpiresAt
              ? new Date(newExpiresAt).toISOString()
              : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(apiErrorMessage(data, "Failed to create API key"));
      const created = data as CreateKeyResponse;
      setCreateOpen(false);
      setNewName("");
      setNewScopes([]);
      setScopeInput("");
      setExpiryMode("never");
      setNewExpiresAt("");
      setRawKeyModal({ key: created.apiKey, label: `Created: ${created.name}` });
      loadKeys();
      toast.success("API key created. Copy it now — it won’t be shown again.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const submitPendingAction = async () => {
    if (!pendingAction) return;
    const { id, type } = pendingAction;
    if (type === "revoke") {
      setRevokingId(id);
    } else {
      setRotatingId(id);
    }

    try {
      const endpoint =
        type === "revoke"
          ? `/api/web/api-keys/${id}/revoke`
          : `/api/web/api-keys/${id}/rotate`;
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          apiErrorMessage(
            data,
            type === "revoke" ? "Failed to revoke key" : "Failed to rotate key",
          ),
        );
      }

      if (type === "rotate") {
        const newKey =
          typeof data.newApiKey === "string" && data.newApiKey.length > 0
            ? data.newApiKey
            : null;
        if (!newKey) {
          throw new Error("Invalid response: missing new API key");
        }
        setRawKeyModal({ key: newKey, label: `New key for: ${pendingAction.name}` });
        toast.success("Key rotated. Copy the new key — it won’t be shown again.");
      } else {
        toast.success("API key revoked");
      }

      loadKeys();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : type === "revoke"
            ? "Failed to revoke key"
            : "Failed to rotate key",
      );
    } finally {
      setPendingAction(null);
      setRevokingId(null);
      setRotatingId(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (!successful) {
          throw new Error("Copy command failed");
        }
      }
      toast.success("Copied to clipboard");
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      toast.error("Failed to copy to clipboard");
    }
  };

  const addScope = () => {
    const scope = scopeInput.trim();
    if (!scope) return;
    if (!newScopes.includes(scope)) {
      setNewScopes((prev) => [...prev, scope]);
    }
    setScopeInput("");
  };

  const removeScope = (scope: string) => {
    setNewScopes((prev) => prev.filter((s) => s !== scope));
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" }) : "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans font-bold text-3xl text-foreground">Integrations</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Manage API keys for the Partner API to connect batches, transfers, and other systems.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              Active keys for this organization. Use any scope format your integration expects. Revoked or expired keys are not shown.
            </CardDescription>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto cursor-pointer">
                <Plus className="h-4 w-4 mr-2" />
                Create key
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create API key</DialogTitle>
                <DialogDescription>
                  Add a name, define scopes, and choose token lifespan. The raw key is shown only once after creation.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="key-name" className="text-sm font-medium">Name</Label>
                  <Input
                    id="key-name"
                    placeholder="e.g. Production integration"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-10 sm:h-11"
                  />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label className="text-sm font-medium">Scopes</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Add scope (e.g. batches:read)"
                      value={scopeInput}
                      onChange={(e) => setScopeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          addScope();
                        }
                      }}
                      className="h-10 sm:h-11"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addScope} className="cursor-pointer">
                      Add
                    </Button>
                  </div>
                  {newScopes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newScopes.map((scope) => (
                        <span
                          key={scope}
                          className="inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-1 text-xs"
                        >
                          {scope}
                          <button
                            type="button"
                            onClick={() => removeScope(scope)}
                            className="text-muted-foreground hover:text-foreground"
                            aria-label={`Remove ${scope}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Scopes are free-form. Add any non-empty value used by your integrations.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Token lifespan</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={expiryMode === "never" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setExpiryMode("never");
                        setNewExpiresAt("");
                      }}
                      className="cursor-pointer"
                    >
                      Never expires
                    </Button>
                    <Button
                      type="button"
                      variant={expiryMode === "date" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setExpiryMode("date")}
                      className="cursor-pointer"
                    >
                      Set expiry date
                    </Button>
                  </div>
                  {expiryMode === "date" && (
                    <Input
                      type="datetime-local"
                      value={newExpiresAt}
                      onChange={(e) => setNewExpiresAt(e.target.value)}
                      className="h-10 sm:h-11"
                    />
                  )}
                </div>
                <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateOpen(false)}
                    className="w-full sm:w-auto cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating} className="w-full sm:w-auto cursor-pointer">
                    {creating ? "Creating…" : "Create key"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingSpinner size="large" text="Loading API keys..." />
          ) : keys.length === 0 ? (
            <div className="text-center py-6 sm:py-8 px-4">
              <Key className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">No API keys yet</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 max-w-md mx-auto">
                Create an API key to connect external systems or use the Partner API for batches and transfers.
              </p>
              <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto cursor-pointer">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Create your first API key</span>
                <span className="sm:hidden">Create key</span>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Scopes</TableHead>
                    <TableHead className="hidden sm:table-cell">Created</TableHead>
                    <TableHead className="hidden md:table-cell">Last used</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((k) => (
                  <TableRow key={k.id}>
                      <TableCell className="font-medium">{k.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[180px] truncate" title={k.scopes?.join(", ")}>
                        {k.scopes?.join(", ") ?? "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        {formatDate(k.createdAt)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {formatDate(k.lastUsedAt)}
                      </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setPendingAction({
                              type: "rotate",
                              id: k.id,
                              name: k.name,
                            })
                          }
                          disabled={isMutating}
                          className="cursor-pointer"
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1" />
                          {rotatingId === k.id ? "Rotating…" : "Rotate"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive cursor-pointer"
                          onClick={() =>
                            setPendingAction({
                              type: "revoke",
                              id: k.id,
                              name: k.name,
                            })
                          }
                          disabled={isMutating}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          {revokingId === k.id ? "Revoking…" : "Revoke"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* One-time raw key display (create/rotate) */}
      <Dialog open={!!rawKeyModal} onOpenChange={(open) => !open && setRawKeyModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Copy your API key</DialogTitle>
            <DialogDescription>
              {rawKeyModal?.label}. This is the only time it will be shown. Store it securely.
            </DialogDescription>
          </DialogHeader>
          {rawKeyModal && (
            <div className="flex gap-2">
              <Input
                readOnly
                value={rawKeyModal.key}
                className="font-mono text-sm h-10 sm:h-11"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(rawKeyModal.key)}
                title="Copy"
                aria-label="Copy API key to clipboard"
                className="cursor-pointer shrink-0 h-10 w-10 sm:h-11 sm:w-11"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!pendingAction}
        onOpenChange={(open) => !open && !isMutating && setPendingAction(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {pendingAction?.type === "revoke" ? "Revoke API key" : "Rotate API key"}
            </DialogTitle>
            <DialogDescription>
              {pendingAction?.type === "revoke"
                ? `Revoke "${pendingAction.name}"? It will stop working immediately.`
                : `Rotate "${pendingAction?.name}"? A new key will be generated and the old one will stop working.`}
            </DialogDescription>
          </DialogHeader>
          {pendingAction?.type === "rotate" && (
            <p className="text-xs text-muted-foreground">
              Rotate only when a key might be exposed, compromised, or due for security hygiene.
            </p>
          )}
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingAction(null)}
              disabled={isMutating}
              className="w-full sm:w-auto cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={pendingAction?.type === "revoke" ? "destructive" : "default"}
              onClick={submitPendingAction}
              disabled={isMutating}
              className="w-full sm:w-auto cursor-pointer"
            >
              {pendingAction?.type === "revoke"
                ? revokingId
                  ? "Revoking..."
                  : "Revoke key"
                : rotatingId
                  ? "Rotating..."
                  : "Rotate key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
