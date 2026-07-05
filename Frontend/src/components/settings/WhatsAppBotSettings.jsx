import { useState, useEffect } from "react";
import {
  LoaderCircle,
  Bot,
  Key,
  Smartphone,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import {
  getBotCredentialsStatus,
  saveBotCredentials,
  toggleBotActiveStatus,
} from "../../lib/api/settingsapi.js";
import { notify } from "../../lib/toast.js";
import { SchoolProfileIllustration } from "../common/SchoolIllustrations.jsx";

// Reusable styling helpers matching parent settingspage patterns
const inputClassName =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-60";

export function Field({ label, children }) {
  return (
    <label className="space-y-1 block">
      <span className="text-[10px] font-extrabold text-slate-500 block uppercase tracking-wider">
        {label}
      </span>
      {children}
    </label>
  );
}

export function SectionCard({ eyebrow, title, action, illustration, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-start gap-4">
          {illustration && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              {illustration}
            </div>
          )}
          <div>
            {eyebrow && (
              <p className="text-[10px] font-extrabold uppercase text-indigo-600 tracking-wider">
                {eyebrow}
              </p>
            )}
            <h2 className="text-base font-extrabold text-slate-950">
              {title}
            </h2>
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}

export default function WhatsAppBotSettings() {
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [activationCommand, setActivationCommand] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Visibility states for passwords
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Active status states
  const [botActive, setBotActive] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);

  // Active Status Confirmation Modal
  const [showActiveConfirm, setShowActiveConfirm] = useState(false);
  const [targetActiveState, setTargetActiveState] = useState(false);

  // UI state
  const [showChangePassword, setShowChangePassword] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBotCredentialsStatus();
      setStatusData(data);
      if (data) {
        if (data.activationCommand) {
          setActivationCommand(data.activationCommand);
        }
        setBotActive(Boolean(data.isActive));
      }
    } catch (err) {
      console.error("[WhatsAppBotSettings] Error fetching status:", err);
      setError("Failed to load bot credentials status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSaveCredentials = async (e) => {
    e.preventDefault();
    setValidationError("");

    const cmd = activationCommand.trim();
    if (!cmd) {
      setValidationError("Activation command is required.");
      return;
    }

    if (cmd.length < 6 || cmd.length > 30 || !/^[a-zA-Z0-9]+$/.test(cmd)) {
      setValidationError(
        "Activation command must be between 6 and 30 characters and alphanumeric."
      );
      return;
    }

    if (!password || password.length < 8) {
      setValidationError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setValidationError("Passwords do not match.");
      return;
    }

    try {
      setSaving(true);
      await saveBotCredentials({
        activationCommand: cmd,
        password,
      });
      notify.success("Bot credentials configured successfully!");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
      setShowChangePassword(false);
      await fetchStatus();
    } catch (err) {
      notify.error(err, "Failed to save bot credentials");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleClick = () => {
    setTargetActiveState(!botActive);
    setShowActiveConfirm(true);
  };

  const handleConfirmActiveToggle = async () => {
    try {
      setTogglingActive(true);
      await toggleBotActiveStatus(targetActiveState);
      setBotActive(targetActiveState);
      notify.success(
        targetActiveState ? "WhatsApp Bot activated" : "WhatsApp Bot deactivated"
      );
      setShowActiveConfirm(false);
    } catch (err) {
      notify.error(err, "Failed to update active status");
    } finally {
      setTogglingActive(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2">
        <LoaderCircle className="animate-spin text-indigo-600" size={28} />
        <p className="text-xs font-semibold text-slate-500">
          Loading credentials status...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-center">
        <AlertCircle className="text-red-500" size={32} />
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">
            Failed to Load Status
          </h3>
          <p className="text-xs font-medium text-slate-500 mt-0.5">{error}</p>
        </div>
        <button
          onClick={fetchStatus}
          className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-extrabold text-white shadow hover:bg-indigo-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const isConfigured = statusData && statusData.status !== "not_configured";
  const hasPhoneBound = statusData && statusData.hasPhoneBound;

  return (
    <div className="max-w-3xl">
      <SectionCard
        eyebrow="WhatsApp Authentication"
        title="Principal Bot Settings"
        illustration={<SchoolProfileIllustration className="h-6 w-6" />}
        action={
          isConfigured ? (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold text-slate-500">
                {botActive ? "Active" : "Inactive"}
              </span>
              <button
                type="button"
                disabled={togglingActive}
                onClick={handleToggleClick}
                className={`flex h-5 w-10 items-center rounded-full p-0.5 transition focus:outline-none ${
                  botActive ? "bg-indigo-600" : "bg-slate-200"
                }`}
                title={botActive ? "Deactivate WhatsApp bot" : "Activate WhatsApp bot"}
              >
                <span
                  className={`h-4 w-4 rounded-full bg-white shadow transition transform ${
                    botActive ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
          ) : null
        }
      >
        {!isConfigured ? (
          /* Form for first-time configuration */
          <form onSubmit={handleSaveCredentials} className="space-y-4">
            <p className="text-xs font-medium text-slate-500">
              Configure credentials to enable the school principal to securely authenticate
              and query student fees directly on WhatsApp.
            </p>

            {validationError && (
              <div className="flex items-center gap-2 rounded-xl bg-[#FEE2E2] border border-red-200 p-2.5 text-xs font-semibold text-[#DC2626]">
                <AlertCircle size={16} className="shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Activation Command">
                <input
                  type="text"
                  value={activationCommand}
                  onChange={(e) => setActivationCommand(e.target.value)}
                  placeholder="e.g. ActivateMyBot"
                  disabled={saving}
                  className={inputClassName}
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Letters and numbers only. Case-insensitive lookup key.
                </span>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Bot Password">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    disabled={saving}
                    className={`${inputClassName} pr-9`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>

              <Field label="Confirm Password">
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    disabled={saving}
                    className={`${inputClassName} pr-9`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </Field>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-extrabold text-white shadow hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {saving ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Bot size={16} />
              )}
              Save Bot Credentials
            </button>
          </form>
        ) : (
          /* Compact Display status when configured */
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <Field label="Activation Command">
                  <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-800">
                    {statusData.activationCommand}
                  </div>
                </Field>

                <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  {hasPhoneBound ? (
                    <>
                      <CheckCircle2 size={16} className="text-[#16A34A] shrink-0" />
                      <span className="text-[11px] font-bold text-green-700">
                        Linked & bound to verified number
                      </span>
                    </>
                  ) : (
                    <>
                      <Smartphone size={16} className="text-slate-400 shrink-0" />
                      <span className="text-[11px] font-bold text-slate-500">
                        Awaiting WhatsApp message to link phone
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col justify-end space-y-2">
                <button
                  type="button"
                  onClick={() => setShowChangePassword(!showChangePassword)}
                  className="w-full h-10 flex items-center justify-center gap-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-xs font-extrabold text-slate-700"
                >
                  <Key size={14} />
                  {showChangePassword ? "Cancel Password Reset" : "Change Password"}
                </button>
              </div>
            </div>

            {showChangePassword && (
              <form
                onSubmit={handleSaveCredentials}
                className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-3"
              >
                {validationError && (
                  <div className="flex items-center gap-2 rounded-xl bg-[#FEE2E2] border border-red-250 p-2 text-xs font-semibold text-[#DC2626]">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="New Bot Password">
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        disabled={saving}
                        className={`${inputClassName} pr-9`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </Field>

                  <Field label="Confirm Password">
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        disabled={saving}
                        className={`${inputClassName} pr-9`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={14} />
                        ) : (
                          <Eye size={14} />
                        )}
                      </button>
                    </div>
                  </Field>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex h-9 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-extrabold text-white shadow hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {saving ? (
                    <LoaderCircle size={14} className="animate-spin" />
                  ) : (
                    <Key size={14} />
                  )}
                  Save New Password
                </button>
              </form>
            )}
          </div>
        )}
      </SectionCard>

      {/* Confirmation Modal for Bot Activation/Deactivation */}
      {showActiveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900">
                {targetActiveState ? "Activate WhatsApp Bot?" : "Deactivate WhatsApp Bot?"}
              </h2>
              <button
                disabled={togglingActive}
                onClick={() => setShowActiveConfirm(false)}
                className="rounded-xl p-2 hover:bg-slate-100 transition"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            <p className="mt-2 text-xs font-semibold text-slate-500 leading-relaxed">
              {targetActiveState
                ? "This will allow the principal to log in and query database records via WhatsApp using the activation command."
                : "This will immediately block all query requests and logins from the principal's WhatsApp number until reactivated."}
            </p>

            <div className="mt-5 flex gap-3">
              <button
                disabled={togglingActive}
                onClick={() => setShowActiveConfirm(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>

              <button
                disabled={togglingActive}
                onClick={handleConfirmActiveToggle}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-extrabold text-white transition shadow-sm ${
                  targetActiveState
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {togglingActive ? (
                  <LoaderCircle size={14} className="animate-spin" />
                ) : (
                  targetActiveState ? "Activate" : "Deactivate"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact X button helper
function X({ size, className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 24}
      height={size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
