"use client";

import { useCallback, useEffect, useState } from "react";
import { clearOpenRouterApiKey, isOpenRouterConfigured, setOpenRouterApiKey } from "@/lib/ai";

type OpenRouterSettingsProps = {
  onConfiguredChange?: (configured: boolean) => void;
};

export function OpenRouterSettings({ onConfiguredChange }: OpenRouterSettingsProps) {
  const [apiKey, setApiKey] = useState("");
  const [configured, setConfigured] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const notifyConfigured = useCallback(
    (value: boolean) => {
      setConfigured(value);
      onConfiguredChange?.(value);
    },
    [onConfiguredChange],
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await setOpenRouterApiKey(apiKey);
      setApiKey("");
      notifyConfigured(true);
      setSuccess("Clé OpenRouter enregistrée.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible d'enregistrer la clé.",
      );
    } finally {
      setSaving(false);
    }
  }, [apiKey, notifyConfigured]);

  const handleClear = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await clearOpenRouterApiKey();
      notifyConfigured(false);
      setSuccess("Clé OpenRouter supprimée.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de supprimer la clé.",
      );
    } finally {
      setSaving(false);
    }
  }, [notifyConfigured]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const value = await isOpenRouterConfigured();
        if (!cancelled) {
          notifyConfigured(value);
        }
      } catch {
        if (!cancelled) {
          notifyConfigured(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [notifyConfigured]);

  return (
    <section className="home__settings" aria-labelledby="openrouter-settings-title">
      <h2 id="openrouter-settings-title" className="home__settings-title">
        OpenRouter
      </h2>
      <p className="home__settings-hint">
        Clé API stockée de façon sécurisée hors du navigateur (format{" "}
        <code>sk-or-…</code>).
      </p>
      {configured ? (
        <p className="home__settings-status">Clé configurée</p>
      ) : (
        <p className="home__settings-status home__settings-status--muted">
          Aucune clé enregistrée
        </p>
      )}
      <label className="home__settings-label" htmlFor="openrouter-api-key">
        Clé API
      </label>
      <input
        id="openrouter-api-key"
        className="home__settings-input"
        type="password"
        autoComplete="off"
        placeholder="sk-or-…"
        value={apiKey}
        onChange={(event) => setApiKey(event.target.value)}
        disabled={saving}
      />
      <div className="home__settings-actions">
        <button
          type="button"
          className="home__cta"
          onClick={() => {
            void handleSave();
          }}
          disabled={saving || apiKey.trim().length === 0}
        >
          {saving ? "Enregistrement…" : "Enregistrer la clé"}
        </button>
        {configured ? (
          <button
            type="button"
            className="home__cta home__cta--secondary"
            onClick={() => {
              void handleClear();
            }}
            disabled={saving}
          >
            Supprimer
          </button>
        ) : null}
      </div>
      {error ? <p className="home__settings-error">{error}</p> : null}
      {success ? <p className="home__settings-success">{success}</p> : null}
    </section>
  );
}
