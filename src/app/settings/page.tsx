"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Record<string, string | null>>({});
  const [hasPassword, setHasPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((response) => response.json())
      .then((data: Record<string, string | boolean | null>) => {
        const { hasPassword: passwordSet, ...rest } = data;
        setSettings(rest as Record<string, string | null>);
        setHasPassword(Boolean(passwordSet));
      })
      .catch(() => undefined);
  }, []);

  async function reloadSettings() {
    const response = await fetch("/api/settings");
    const data = (await response.json()) as Record<string, string | boolean | null>;
    const { hasPassword: passwordSet, ...rest } = data;
    setSettings(rest as Record<string, string | null>);
    setHasPassword(Boolean(passwordSet));
  }

  async function handleSave() {
    setSaving(true);

    const body: Record<string, string | null> = {
      telegram_bot_token: settings.telegram_bot_token ?? null,
      telegram_chat_id: settings.telegram_chat_id ?? null,
      reminder_time_day_before: settings.reminder_time_day_before ?? "20:00",
      reminder_time_same_day: settings.reminder_time_same_day ?? "08:00",
    };

    if (newPassword !== "") {
      body.password = newPassword;
    }

    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    setNewPassword("");
    await reloadSettings();
  }

  async function handleClearPassword() {
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "" }),
    });
    await reloadSettings();
  }

  async function handleTestNotification() {
    setTestResult(null);
    const response = await fetch("/api/reminders/test", { method: "POST" });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    setTestResult(data.ok ? "发送成功！请检查 Telegram。" : `发送失败：${data.error}`);
  }

  function updateSetting(key: string, value: string) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-bold">设置</h1>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          ← 返回
        </button>
      </div>

      <section className="mb-8">
        <h2 className="mb-4 text-sm font-semibold text-[var(--accent-light)]">访问密码</h2>
        <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
          <p className="mb-3 text-xs text-[var(--text-muted)]">
            {hasPassword
              ? "已设置密码。输入新密码以更改，或清空密码以关闭认证。"
              : "未设置密码，任何人可直接访问。"}
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="输入新密码"
              className="flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
            />
            {hasPassword ? (
              <button
                type="button"
                onClick={handleClearPassword}
                className="rounded-lg border border-[var(--danger-border)] px-3 py-2 text-xs text-[var(--danger)] hover:bg-[var(--danger-bg)]"
              >
                清空密码
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-sm font-semibold text-[var(--accent-light)]">Telegram 通知</h2>
        <div className="space-y-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
          <div>
            <label className="mb-1 block text-xs text-[var(--text-muted)]">Bot Token</label>
            <input
              type="text"
              value={settings.telegram_bot_token ?? ""}
              onChange={(event) => updateSetting("telegram_bot_token", event.target.value)}
              placeholder="123456:ABC-DEF..."
              className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--text-muted)]">Chat ID</label>
            <input
              type="text"
              value={settings.telegram_chat_id ?? ""}
              onChange={(event) => updateSetting("telegram_chat_id", event.target.value)}
              placeholder="123456789"
              className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={handleTestNotification}
            className="rounded-lg border border-[var(--border-default)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent-light)]"
          >
            发送测试通知
          </button>
          {testResult ? (
            <p className={`text-xs ${testResult.includes("成功") ? "text-green-400" : "text-[var(--danger)]"}`}>
              {testResult}
            </p>
          ) : null}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-sm font-semibold text-[var(--accent-light)]">提醒时间</h2>
        <div className="space-y-3 rounded-lg border border-[var(--border-default)] bg-[var(--bg-card)] p-4">
          <div>
            <label className="mb-1 block text-xs text-[var(--text-muted)]">前一天提醒时间</label>
            <input
              type="time"
              value={settings.reminder_time_day_before ?? "20:00"}
              onChange={(event) => updateSetting("reminder_time_day_before", event.target.value)}
              className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[var(--text-muted)]">当天提醒时间</label>
            <input
              type="time"
              value={settings.reminder_time_same_day ?? "08:00"}
              onChange={(event) => updateSetting("reminder_time_same_day", event.target.value)}
              className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
            />
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-lg bg-[var(--accent)] py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "保存中..." : "保存设置"}
      </button>
    </div>
  );
}
