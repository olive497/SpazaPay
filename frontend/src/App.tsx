import { useCallback, useEffect, useRef, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Copy,
  Delete,
  Eye,
  EyeOff,
  History,
  House,
  Languages,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mail,
  QrCode,
  ReceiptText,
  RefreshCw,
  Settings,
  Store,
  SignalLow,
  Smartphone,
  UserRound,
  WalletCards,
  Wifi,
  XCircle,
} from "lucide-react"
import { api, ApiError, clearToken, getToken, setToken } from "./lib/api"
import { LANG_KEY, WALLET_BASE } from "./lib/config"
import { eurToZar, formatZar, round2, zarToEur } from "./lib/money"
import { LANGUAGES, t, type Lang } from "./lib/translations"

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Screen =
  | "language"
  | "onboarding"
  | "login"
  | "success"
  | "home"
  | "amount"
  | "waiting"
  | "received"
  | "expired"
  | "connectionError"
  | "dashboard"
  | "history"
  | "detail"
  | "settings"
  | "customer"
  | "customerApprove"
  | "customerDone"
  | "customerDeclined"
  | "customerInsufficient"
  | "customerWalletNotFound"

type Profile = {
  shopName: string
  ownerName: string
  email: string
  walletAddress: string // canonical https://... form
}

type ShopDto = {
  id: number
  ownerName: string
  email: string
  shopName: string
  walletAddress: string | null
  preferredLanguage: string | null
}

type TxDto = {
  id: number
  amount: number // EUR, major units
  currency: string
  description: string | null
  status: string // PENDING | PAID | EXPIRED
  incomingPaymentUrl: string
  qrPayload: string
  expiresAt: string | null
  paidAt: string | null
  createdAt: string
}

type Tx = TxDto & {
  zar: number
  note: string
  uiStatus: "success" | "pending" | "failed"
}

type Payment = {
  id: number
  qr: string
  expiresAt: string | null
  zar: number
  reference: string
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const SA_TZ = "Africa/Johannesburg"
const BACKEND_LANGS = ["en", "zu", "af", "st"] // languages the backend accepts
const DEV =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("dev")

const showWallet = (url: string) => (url ? url.replace(/^https:\/\//, "$") : "")

const cleanHandle = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^\$/, "")
    .replace(/^ilp\.interledger-test\.dev\//, "")
    .replace(/\s+/g, "-")

const normalizeWallet = (value: string) => {
  const s = value.trim()
  if (s.startsWith("$")) return `https://${s.slice(1)}`
  if (/^https?:\/\//.test(s)) return s
  if (s.startsWith("ilp.")) return `https://${s}`
  return `${WALLET_BASE}${cleanHandle(s)}`
}

const errorText = (lang: Lang, e: unknown) =>
  e instanceof ApiError && e.status === 0
    ? t(lang, "offline")
    : t(lang, "serverError")

const dayKey = (iso: string) =>
  new Date(iso).toLocaleDateString("en-CA", { timeZone: SA_TZ }) // YYYY-MM-DD

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: SA_TZ,
  })

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    timeZone: SA_TZ,
  })

const fullDate = (iso: string) =>
  new Date(iso).toLocaleString("en-ZA", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: SA_TZ,
  })

const todayKey = () => dayKey(new Date().toISOString())

// The exact Rand amount is stored in the description ("R85.00"), because the
// wallet itself is in EUR. Fall back to converting the EUR amount.
const toTx = (dto: TxDto): Tx => {
  const match = /^R(\d+(?:\.\d{1,2})?)/.exec(dto.description ?? "")
  const zar = match ? Number.parseFloat(match[1]) : eurToZar(dto.amount)
  const note = (dto.description ?? "").split(" – ")[1] ?? ""
  const uiStatus =
    dto.status === "PAID"
      ? "success"
      : dto.status === "PENDING"
        ? "pending"
        : "failed"
  return { ...dto, zar, note, uiStatus }
}

const referenceOf = (incomingPaymentUrl: string) =>
  incomingPaymentUrl.split("/").filter(Boolean).pop() ?? ""

function useTransactions() {
  const [items, setItems] = useState<Tx[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const list = await api<TxDto[]>("/transactions")
      setItems(list.map(toTx))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => {
    load()
  }, [load])
  return { items, loading, error, reload: load }
}

function salesStats(items: Tx[]) {
  const paid = items.filter((i) => i.status === "PAID")
  const byDay = new Map<string, { total: number; count: number }>()
  for (const p of paid) {
    const key = dayKey(p.paidAt ?? p.createdAt)
    const cur = byDay.get(key) ?? { total: 0, count: 0 }
    byDay.set(key, { total: round2(cur.total + p.zar), count: cur.count + 1 })
  }
  const today = byDay.get(todayKey()) ?? { total: 0, count: 0 }
  const days = [...byDay.entries()]
    .filter(([key]) => key !== todayKey())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 7)
  return { today, days }
}

/* ------------------------------------------------------------------ */
/* Shared UI                                                           */
/* ------------------------------------------------------------------ */

function Button({
  children,
  onClick,
  variant = "primary",
  icon,
  disabled,
  type = "button",
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: "primary" | "secondary" | "ghost" | "danger"
  icon?: React.ReactNode
  disabled?: boolean
  type?: "button" | "submit"
}) {
  return (
    <button
      className={`button button--${variant}`}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {icon}
      <span>{children}</span>
    </button>
  )
}

function PageTitle({
  children,
  eyebrow,
  action,
}: {
  children: React.ReactNode
  eyebrow?: string
  action?: React.ReactNode
}) {
  return (
    <div className="page-title">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{children}</h1>
      </div>
      {action}
    </div>
  )
}

function InlineMessage({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="alert"
      style={{ color: "#b3261e", textAlign: "center", margin: "8px 0" }}
    >
      {children}
    </p>
  )
}

function LanguageSwitcher({
  lang,
  setLang,
}: {
  lang: Lang
  setLang: (lang: Lang) => void
}) {
  return (
    <label className="language-switcher">
      <Languages size={19} />
      <select
        value={lang}
        onChange={(event) => setLang(event.target.value as Lang)}
        aria-label={t(lang, "changeLanguage")}
      >
        {LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {language.name}
          </option>
        ))}
      </select>
    </label>
  )
}

function Header({
  lang,
  setLang,
  minimal = false,
}: {
  lang: Lang
  setLang: (lang: Lang) => void
  minimal?: boolean
}) {
  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark">
          <Store size={21} strokeWidth={2.5} />
        </span>
        <span>{t(lang, "brand")}</span>
      </div>
      <div className="header-actions">
        {!minimal && (
          <span className="connection">
            <SignalLow size={17} />
            <span>{t(lang, "lowData")}</span>
          </span>
        )}
        <LanguageSwitcher lang={lang} setLang={setLang} />
      </div>
    </header>
  )
}

function BackHeader({
  title,
  onBack,
  lang,
  setLang,
}: {
  title: string
  onBack: () => void
  lang: Lang
  setLang: (l: Lang) => void
}) {
  return (
    <header className="back-header">
      <button
        className="icon-button"
        onClick={onBack}
        aria-label={t(lang, "goBack")}
      >
        <ArrowLeft size={23} />
      </button>
      <strong>{title}</strong>
      <LanguageSwitcher lang={lang} setLang={setLang} />
    </header>
  )
}

function BottomNav({
  active,
  go,
  lang,
}: {
  active: Screen
  go: (s: Screen) => void
  lang: Lang
}) {
  const items = [
    { screen: "home" as Screen, label: t(lang, "accept"), Icon: QrCode },
    { screen: "dashboard" as Screen, label: t(lang, "sales"), Icon: BarChart3 },
    { screen: "history" as Screen, label: t(lang, "history"), Icon: History },
    { screen: "settings" as Screen, label: t(lang, "settings"), Icon: Settings },
  ]
  return (
    <nav className="bottom-nav" aria-label={t(lang, "mainNavigation")}>
      {items.map(({ screen, label, Icon }) => (
        <button
          key={screen}
          onClick={() => go(screen)}
          className={active === screen ? "active" : ""}
        >
          <Icon size={22} strokeWidth={active === screen ? 2.7 : 2} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}

function AppFrame({
  children,
  screen,
  go,
  lang,
  desktopTitle,
  shopName,
}: {
  children: React.ReactNode
  screen: Screen
  go: (s: Screen) => void
  lang: Lang
  desktopTitle: string
  shopName?: string
}) {
  return (
    <div className="app-frame">
      <aside className="desktop-sidebar">
        <div className="brand brand--large">
          <span className="brand-mark">
            <Store size={23} />
          </span>
          <span>{t(lang, "brand")}</span>
        </div>
        <div className="shop-pill">
          <span>{t(lang, "brandShort")}</span>
          <div>
            <strong>{shopName || t(lang, "yourShop")}</strong>
            <small>{t(lang, "brand")}</small>
          </div>
        </div>
        <BottomNav active={screen} go={go} lang={lang} />
        <div className="sidebar-help">
          <CircleHelp size={20} />
          <span>{t(lang, "needHelp")}</span>
        </div>
      </aside>
      <section className="workspace">
        <div className="desktop-topbar">
          <div>
            <span className="eyebrow">{t(lang, "brand")}</span>
            <strong>{desktopTitle}</strong>
          </div>
          <span className="connection">
            <Wifi size={17} /> {t(lang, "connected")}
          </span>
        </div>
        {children}
        <BottomNav active={screen} go={go} lang={lang} />
      </section>
    </div>
  )
}

// A real, scannable QR code.
function QrImage({ value, lang }: { value: string; lang: Lang }) {
  return (
    <div
      aria-label={t(lang, "paymentQr")}
      style={{
        background: "#fff",
        padding: 12,
        borderRadius: 16,
        display: "inline-block",
        lineHeight: 0,
        margin: "0 auto",
      }}
    >
      <QRCodeSVG value={value || " "} size={208} level="M" />
    </div>
  )
}

function StatusChip({
  status,
  label,
}: {
  status: "success" | "pending" | "failed"
  label: string
}) {
  return (
    <span className={`status-chip status-chip--${status}`}>
      {status === "success" ? (
        <CheckCircle2 size={15} />
      ) : status === "failed" ? (
        <XCircle size={15} />
      ) : (
        <Clock3 size={15} />
      )}
      {label}
    </span>
  )
}

function StatCard({
  label,
  value,
  detail,
  featured = false,
}: {
  label: string
  value: string
  detail?: string
  featured?: boolean
}) {
  return (
    <article className={`stat-card ${featured ? "stat-card--featured" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </article>
  )
}

function TransactionRow({
  item,
  lang,
  onClick,
}: {
  item: Tx
  lang: Lang
  onClick: () => void
}) {
  const when = item.createdAt
  const subtitle =
    dayKey(when) === todayKey()
      ? t(lang, "todayTime", { time: timeOf(when) })
      : `${dateLabel(when)}, ${timeOf(when)}`
  return (
    <button className="transaction-row" onClick={onClick}>
      <span className="transaction-icon">
        {item.uiStatus === "success" ? (
          <Check size={18} />
        ) : item.uiStatus === "pending" ? (
          <Clock3 size={18} />
        ) : (
          <XCircle size={18} />
        )}
      </span>
      <span className="transaction-copy">
        <strong>{item.note || t(lang, "payment")}</strong>
        <small>{subtitle}</small>
      </span>
      <span className="transaction-amount">
        <strong>{formatZar(item.zar)}</strong>
        <StatusChip
          status={item.uiStatus}
          label={
            item.uiStatus === "success"
              ? t(lang, "paidUpper")
              : item.uiStatus === "pending"
                ? t(lang, "pendingUpper")
                : t(lang, "expiredUpper")
          }
        />
      </span>
      <ChevronRight size={19} className="chevron" />
    </button>
  )
}

function Field({
  label,
  value,
  setValue,
  helper,
  prefix,
  inputMode,
  placeholder,
  type = "text",
  error,
  onBlur,
  trailing,
}: {
  label: string
  value: string
  setValue: (v: string) => void
  helper?: string
  prefix?: string
  inputMode?: "tel" | "email"
  placeholder?: string
  type?: "text" | "email" | "password"
  error?: string
  onBlur?: () => void
  trailing?: React.ReactNode
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input-wrap">
        {prefix && <b>{prefix}</b>}
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inputMode={inputMode}
          placeholder={placeholder}
          type={type}
          onBlur={onBlur}
          aria-invalid={Boolean(error)}
        />
        {trailing}
      </div>
      {helper && <small>{helper}</small>}
      <small className="field-error" aria-live="polite">
        {error || " "}
      </small>
    </label>
  )
}

/* ------------------------------------------------------------------ */
/* Language, sign up, login                                            */
/* ------------------------------------------------------------------ */

function LanguageScreen({ choose }: { choose: (l: Lang) => void }) {
  return (
    <main className="welcome-page">
      <div className="welcome-art">
        <div className="sun" />
        <div className="store-illustration">
          <span />
          <span />
          <Store size={58} />
        </div>
      </div>
      <section className="welcome-panel">
        <div className="brand brand--large">
          <span className="brand-mark">
            <Store size={23} />
          </span>
          <span>{t("en", "brand")}</span>
        </div>
        <p className="eyebrow">{t("en", "welcome")}</p>
        <h1>{t("en", "chooseLanguage")}</h1>
        <p className="lead">{t("en", "chooseLanguageLead")}</p>
        <div className="language-grid">
          {LANGUAGES.map(({ code, name, hint, short }) => (
            <button
              key={code}
              className="language-card"
              onClick={() => choose(code)}
            >
              <span className="language-code">{short}</span>
              <span>
                <strong>{name}</strong>
                <small>{hint}</small>
              </span>
              <ChevronRight size={22} />
            </button>
          ))}
        </div>
        <p className="trust-note">
          <LockKeyhole size={17} /> {t("en", "trustNote")}
        </p>
      </section>
    </main>
  )
}

function Onboarding({
  lang,
  setLang,
  finish,
  goLogin,
}: {
  lang: Lang
  setLang: (l: Lang) => void
  finish: (profile: Profile) => void
  goLogin: () => void
}) {
  const [step, setStep] = useState(1)
  const [shop, setShop] = useState("")
  const [owner, setOwner] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [handle, setHandle] = useState("")
  const [busy, setBusy] = useState(false)
  const [signedIn, setSignedIn] = useState(false) // account created + token saved
  const [verifiedWallet, setVerifiedWallet] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [walletStatus, setWalletStatus] = useState<
    "idle" | "verified" | "error"
  >("idle")
  const info = [
    [t(lang, "s1t"), t(lang, "s1l")],
    [t(lang, "s2t"), t(lang, "s2l")],
    [t(lang, "s3t"), t(lang, "s3l")],
    [t(lang, "s4t"), t(lang, "s4l")],
  ]
  const updateError = (name: string, message = "") =>
    setErrors((current) => ({ ...current, [name]: message }))
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  // Step 4, first press: create the account (once), then check the wallet
  // against the real Open Payments network.
  const verifyWallet = async () => {
    const clean = cleanHandle(handle)
    if (!clean) {
      setWalletStatus("error")
      updateError("wallet", t(lang, "walletNotFound"))
      return
    }
    setBusy(true)
    updateError("wallet")
    try {
      if (!signedIn) {
        try {
          await api("/auth/register", {
            method: "POST",
            auth: false,
            body: {
              ownerName: owner.trim(),
              email: email.trim(),
              password,
              shopName: shop.trim(),
              walletAddress: `${WALLET_BASE}${clean}`,
              ...(BACKEND_LANGS.includes(lang)
                ? { preferredLanguage: lang }
                : {}),
            },
          })
        } catch (e) {
          // 409 = email already registered: try to sign in with the same details.
          if (!(e instanceof ApiError && e.status === 409)) throw e
        }
        try {
          const login = await api<{ token: string }>("/auth/login", {
            method: "POST",
            auth: false,
            body: { email: email.trim(), password },
          })
          setToken(login.token)
          setSignedIn(true)
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) {
            setWalletStatus("error")
            updateError("wallet", t(lang, "emailTaken"))
            return
          }
          throw e
        }
      }
      const wallet = await api<{ id: string }>("/shops/me/wallet", {
        method: "PUT",
        body: { walletAddress: `${WALLET_BASE}${clean}` },
      })
      setVerifiedWallet(wallet.id)
      setWalletStatus("verified")
    } catch (e) {
      setWalletStatus("error")
      updateError(
        "wallet",
        e instanceof ApiError && e.status === 400
          ? t(lang, "walletNotFound")
          : errorText(lang, e),
      )
    } finally {
      setBusy(false)
    }
  }

  const continueOnboarding = () => {
    if (busy) return
    if (step === 1 && !shop.trim()) {
      updateError("shop", t(lang, "enterShopNameError"))
      return
    }
    if (step === 2 && (!owner.trim() || !phone.trim())) {
      setErrors({
        owner: owner.trim() ? "" : t(lang, "enterNameError"),
        phone: phone.trim() ? "" : t(lang, "enterPhoneError"),
      })
      return
    }
    if (step === 3 && (!emailIsValid || password.length < 8)) {
      setErrors({
        email: emailIsValid ? "" : t(lang, "emailError"),
        password: password.length >= 8 ? "" : t(lang, "passwordError"),
      })
      return
    }
    if (step < 4) {
      setErrors({})
      setStep(step + 1)
      return
    }
    if (walletStatus !== "verified") {
      void verifyWallet()
      return
    }
    finish({
      shopName: shop,
      ownerName: owner,
      email,
      walletAddress: verifiedWallet,
    })
  }

  return (
    <main className="onboarding-shell">
      <Header lang={lang} setLang={setLang} minimal />
      <div className="onboarding-card">
        <div className="progress-row">
          <span>{t(lang, "step", { n: step })}</span>
          <div>
            {[1, 2, 3, 4].map((i) => (
              <i key={i} className={i <= step ? "done" : ""} />
            ))}
          </div>
        </div>
        <div className="step-icon">
          {step === 1 ? (
            <Store />
          ) : step === 2 ? (
            <UserRound />
          ) : step === 3 ? (
            <Mail />
          ) : (
            <WalletCards />
          )}
        </div>
        <h1>{info[step - 1][0]}</h1>
        <p className="lead">{info[step - 1][1]}</p>
        {step === 1 && (
          <Field
            label={t(lang, "shopName")}
            value={shop}
            setValue={(value) => {
              setShop(value)
              updateError("shop")
            }}
            placeholder={t(lang, "shopPlaceholder")}
            error={errors.shop}
            helper={t(lang, "shopHelper")}
          />
        )}
        {step === 2 && (
          <>
            <Field
              label={t(lang, "yourName")}
              value={owner}
              setValue={(value) => {
                setOwner(value)
                updateError("owner")
              }}
              placeholder={t(lang, "ownerPlaceholder")}
              error={errors.owner}
            />
            <Field
              label={t(lang, "phone")}
              value={phone}
              setValue={(value) => {
                setPhone(value)
                updateError("phone")
              }}
              placeholder={t(lang, "phonePlaceholder")}
              inputMode="tel"
              error={errors.phone}
            />
          </>
        )}
        {step === 3 && (
          <>
            <Field
              label={t(lang, "email")}
              value={email}
              setValue={(value) => {
                setEmail(value)
                updateError("email")
              }}
              placeholder={t(lang, "emailPlaceholder")}
              inputMode="email"
              type="email"
              error={errors.email}
              onBlur={() =>
                email &&
                updateError(
                  "email",
                  emailIsValid ? "" : t(lang, "emailError"),
                )
              }
            />
            <Field
              label={t(lang, "password")}
              value={password}
              setValue={(value) => {
                setPassword(value)
                updateError("password")
              }}
              placeholder={t(lang, "passwordPlaceholder")}
              type={showPassword ? "text" : "password"}
              helper={t(lang, "min8")}
              error={errors.password}
              trailing={
                <button
                  type="button"
                  className="field-action"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword
                      ? t(lang, "hidePassword")
                      : t(lang, "showPassword")
                  }
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              }
            />
          </>
        )}
        {step === 4 && (
          <>
            <Field
              label={t(lang, "walletName")}
              value={handle}
              setValue={(v) => {
                setHandle(cleanHandle(v))
                setWalletStatus("idle")
                updateError("wallet")
              }}
              prefix={t(lang, "walletPrefix")}
              placeholder={t(lang, "walletPlaceholder")}
              error={errors.wallet}
            />
            {walletStatus === "verified" && (
              <div className="wallet-preview">
                <span>{t(lang, "walletVerified")}</span>
                <strong>{showWallet(verifiedWallet)}</strong>
                <small>
                  <CheckCircle2 size={15} /> {t(lang, "addressFound")}
                </small>
              </div>
            )}
          </>
        )}
        <div className="onboarding-actions">
          {step > 1 && (
            <Button
              variant="secondary"
              icon={<ArrowLeft size={20} />}
              onClick={() => setStep(step - 1)}
              disabled={busy}
            >
              {t(lang, "back")}
            </Button>
          )}
          <Button
            disabled={busy}
            icon={
              busy ? (
                <LoaderCircle size={20} />
              ) : step < 4 || walletStatus !== "verified" ? (
                <ArrowRight size={20} />
              ) : (
                <Check size={20} />
              )
            }
            onClick={continueOnboarding}
          >
            {busy
              ? t(lang, "loading")
              : step < 4
                ? t(lang, "continue")
                : walletStatus !== "verified"
                  ? t(lang, "verifyWallet")
                  : t(lang, "createShop")}
          </Button>
        </div>
        {step === 1 && (
          <button className="back-link" onClick={goLogin}>
            {t(lang, "haveAccount")}
          </button>
        )}
      </div>
    </main>
  )
}

function LoginScreen({
  lang,
  setLang,
  onSuccess,
  goSignUp,
}: {
  lang: Lang
  setLang: (l: Lang) => void
  onSuccess: (profile: Profile) => void
  goSignUp: () => void
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const submit = async () => {
    if (busy) return
    if (!email.trim() || !password) {
      setError(t(lang, "loginFailed"))
      return
    }
    setBusy(true)
    setError("")
    try {
      const res = await api<{ token: string; shop: ShopDto }>("/auth/login", {
        method: "POST",
        auth: false,
        body: { email: email.trim(), password },
      })
      setToken(res.token)
      onSuccess({
        shopName: res.shop.shopName,
        ownerName: res.shop.ownerName,
        email: res.shop.email,
        walletAddress: res.shop.walletAddress ?? "",
      })
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 401
          ? t(lang, "loginFailed")
          : errorText(lang, e),
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <main className="onboarding-shell">
      <Header lang={lang} setLang={setLang} minimal />
      <div className="onboarding-card">
        <div className="step-icon">
          <LockKeyhole />
        </div>
        <h1>{t(lang, "login")}</h1>
        <Field
          label={t(lang, "email")}
          value={email}
          setValue={(v) => {
            setEmail(v)
            setError("")
          }}
          placeholder={t(lang, "emailPlaceholder")}
          inputMode="email"
          type="email"
        />
        <Field
          label={t(lang, "password")}
          value={password}
          setValue={(v) => {
            setPassword(v)
            setError("")
          }}
          placeholder={t(lang, "passwordPlaceholder")}
          type={showPassword ? "text" : "password"}
          error={error}
          trailing={
            <button
              type="button"
              className="field-action"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={
                showPassword ? t(lang, "hidePassword") : t(lang, "showPassword")
              }
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          }
        />
        <div className="onboarding-actions">
          <Button
            disabled={busy}
            onClick={submit}
            icon={
              busy ? <LoaderCircle size={20} /> : <ArrowRight size={20} />
            }
          >
            {busy ? t(lang, "loading") : t(lang, "login")}
          </Button>
        </div>
        <button className="back-link" onClick={goSignUp}>
          {t(lang, "createShop")}
        </button>
      </div>
    </main>
  )
}

function SuccessScreen({
  lang,
  setLang,
  go,
  profile,
}: {
  lang: Lang
  setLang: (l: Lang) => void
  go: () => void
  profile: Profile
}) {
  return (
    <main className="result-page">
      <Header lang={lang} setLang={setLang} minimal />
      <div className="result-content">
        <div className="celebration">
          <Check size={48} />
          <i />
          <i />
          <i />
        </div>
        <p className="eyebrow">{t(lang, "allDone")}</p>
        <h1>{t(lang, "readyTitle")}</h1>
        <p className="lead">{t(lang, "readyLead")}</p>
        <div className="mini-wallet">
          <WalletCards />
          <span>
            <small>{t(lang, "yourWallet")}</small>
            <strong>{showWallet(profile.walletAddress)}</strong>
          </span>
        </div>
        <Button onClick={go} icon={<QrCode size={21} />}>
          {t(lang, "showMyQr")}
        </Button>
      </div>
    </main>
  )
}

/* ------------------------------------------------------------------ */
/* Main screens                                                        */
/* ------------------------------------------------------------------ */

function HomeScreen({
  lang,
  setLang,
  go,
  profile,
}: {
  lang: Lang
  setLang: (l: Lang) => void
  go: (s: Screen) => void
  profile: Profile
}) {
  const [toast, setToast] = useState(false)
  const { items } = useTransactions()
  const stats = salesStats(items)
  return (
    <AppFrame
      screen="home"
      go={go}
      lang={lang}
      desktopTitle={t(lang, "accept")}
      shopName={profile.shopName}
    >
      <main className="screen">
        <Header lang={lang} setLang={setLang} />
        <PageTitle eyebrow={t(lang, "hello")}>{t(lang, "accept")}</PageTitle>
        <div className="status-banner">
          <span>
            <CheckCircle2 size={21} />
          </span>
          <div>
            <strong>{t(lang, "ready")}</strong>
            <small>{t(lang, "paymentWorking")}</small>
          </div>
        </div>
        <div className="home-layout">
          <section className="qr-card">
            <div className="qr-heading">
              <div>
                <h2>{t(lang, "scan")}</h2>
                <p>{t(lang, "scanHelp")}</p>
              </div>
              <QrCode size={26} />
            </div>
            <QrImage value={profile.walletAddress} lang={lang} />
            <strong className="shop-name">
              {profile.shopName || t(lang, "yourShop")}
            </strong>
            <div className="wallet-address">
              <span>{showWallet(profile.walletAddress)}</span>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(
                    showWallet(profile.walletAddress),
                  )
                  setToast(true)
                  setTimeout(() => setToast(false), 2200)
                }}
              >
                <Copy size={17} />
                {t(lang, "copy")}
              </button>
            </div>
          </section>
          <aside className="home-actions">
            <Button
              onClick={() => go("amount")}
              icon={<ReceiptText size={22} />}
            >
              {t(lang, "enter")}
            </Button>
            <article className="today-card">
              <span>{t(lang, "totalToday")}</span>
              <strong>{formatZar(stats.today.total)}</strong>
              <small>{t(lang, "paymentCount", { count: stats.today.count })}</small>
              <div className="mini-bars">
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
            </article>
            <button className="customer-preview" onClick={() => go("customer")}>
              <Smartphone size={22} />
              <span>
                <strong>{t(lang, "customerPage")}</strong>
                <small>{t(lang, "customerPageHelp")}</small>
              </span>
              <ChevronRight size={20} />
            </button>
          </aside>
        </div>
        {toast && (
          <div className="toast">
            <CheckCircle2 size={19} />
            {t(lang, "copied")}
          </div>
        )}
      </main>
    </AppFrame>
  )
}

function AmountScreen({
  lang,
  setLang,
  go,
  confirm,
}: {
  lang: Lang
  setLang: (l: Lang) => void
  go: (s: Screen) => void
  confirm: (amount: string) => Promise<void>
}) {
  const [amount, setAmount] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const press = (key: string) => {
    setError("")
    if (key === "back") return setAmount(amount.slice(0, -1))
    if (key === "." && amount.includes(".")) return
    if (amount.includes(".") && amount.split(".")[1].length >= 2) return
    if (amount.length < 7) setAmount(amount === "0" ? key : amount + key)
  }
  const value = Number(amount)
  const tooSmall = !amount || !(value > 0) || zarToEur(value) < 0.01
  const submit = async () => {
    if (busy || tooSmall) return
    setBusy(true)
    setError("")
    try {
      await confirm(amount)
    } catch (e) {
      setError(errorText(lang, e))
      setBusy(false)
    }
  }
  return (
    <main className="focused-screen">
      <BackHeader
        title={t(lang, "enter")}
        onBack={() => go("home")}
        lang={lang}
        setLang={setLang}
      />
      <div className="amount-shell">
        <p>{t(lang, "howMuch")}</p>
        <div className="amount-display">
          <span>{t(lang, "currencySymbol")}</span>
          <strong>{amount || "0.00"}</strong>
        </div>
        <button className="clear-link" onClick={() => setAmount("")}>
          <RefreshCw size={16} />
          {t(lang, "clear")}
        </button>
        <div className="keypad">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"].map(
            (k) => (
              <button
                key={k}
                onClick={() => press(k)}
                aria-label={k === "back" ? t(lang, "deleteDigit") : k}
              >
                {k === "back" ? <Delete size={25} /> : k}
              </button>
            ),
          )}
        </div>
        {error && <InlineMessage>{error}</InlineMessage>}
        <Button
          onClick={submit}
          disabled={busy || tooSmall}
          icon={busy ? <LoaderCircle size={21} /> : <QrCode size={21} />}
        >
          {busy ? t(lang, "loading") : t(lang, "showQr")}
        </Button>
      </div>
    </main>
  )
}

const secondsLeft = (expiresAt: string | null) =>
  expiresAt
    ? Math.max(0, Math.round((Date.parse(expiresAt) - Date.now()) / 1000))
    : 900

function WaitingScreen({
  lang,
  setLang,
  go,
  payment,
}: {
  lang: Lang
  setLang: (l: Lang) => void
  go: (s: Screen) => void
  payment: Payment
}) {
  const [seconds, setSeconds] = useState(() => secondsLeft(payment.expiresAt))
  const goRef = useRef(go)
  goRef.current = go

  // Countdown to the real expiry time.
  useEffect(() => {
    const timer = window.setInterval(
      () => setSeconds(secondsLeft(payment.expiresAt)),
      1000,
    )
    return () => window.clearInterval(timer)
  }, [payment.expiresAt])
  useEffect(() => {
    if (seconds === 0) goRef.current("expired")
  }, [seconds])

  // Ask the backend every 3 seconds whether the money arrived.
  useEffect(() => {
    let stopped = false
    let failures = 0
    const check = async () => {
      try {
        const tx = await api<TxDto>(`/payments/${payment.id}`)
        failures = 0
        if (stopped) return
        if (tx.status === "PAID") goRef.current("received")
        else if (tx.status === "EXPIRED") goRef.current("expired")
      } catch {
        failures += 1
        if (failures >= 2 && !stopped) goRef.current("connectionError")
      }
    }
    check()
    const id = window.setInterval(check, 3000)
    return () => {
      stopped = true
      window.clearInterval(id)
    }
  }, [payment.id])

  const countdown = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`
  return (
    <main className="focused-screen">
      <BackHeader
        title={formatZar(payment.zar)}
        onBack={() => go("amount")}
        lang={lang}
        setLang={setLang}
      />
      <div className="waiting-layout">
        <div className="waiting-qr">
          <QrImage value={payment.qr} lang={lang} />
          <span className="scan-line" />
        </div>
        <div
          className="countdown"
          aria-label={t(lang, "countdownRemaining", { time: countdown })}
        >
          <Clock3 size={19} />
          <strong>{countdown}</strong>
          <span>{t(lang, "remaining")}</span>
        </div>
        <div className="pulse-icon">
          <LoaderCircle size={30} />
        </div>
        <h1>{t(lang, "waiting")}</h1>
        <p className="lead">{t(lang, "waitingHelp")}</p>
        <div className="secure-note">
          <LockKeyhole size={18} />
          {t(lang, "securePay")}
        </div>
        {DEV && (
          <div
            className="state-preview"
            aria-label={t(lang, "previewPaymentStates")}
          >
            <button onClick={() => go("received")}>
              {t(lang, "paidUpper")}
            </button>
            <button onClick={() => go("expired")}>
              {t(lang, "expiredUpper")}
            </button>
            <button onClick={() => go("connectionError")}>
              {t(lang, "connectionErrorUpper")}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

function ResultState({
  lang,
  setLang,
  go,
  state,
  amount,
  reference,
}: {
  lang: Lang
  setLang: (l: Lang) => void
  go: (s: Screen) => void
  state: "paid" | "expired" | "connection"
  amount: string
  reference: string
}) {
  const paid = state === "paid"
  const expired = state === "expired"
  const title = paid
    ? t(lang, "received")
    : expired
      ? t(lang, "expiredTitle")
      : t(lang, "connectionErrorTitle")
  const description = paid
    ? t(lang, "receivedHelp")
    : expired
      ? t(lang, "expiredBody")
      : t(lang, "connectionErrorBody")
  return (
    <main className={`result-page payment-result ${paid ? "" : "is-failed"}`}>
      <Header lang={lang} setLang={setLang} minimal />
      <div className="result-content">
        <div className="result-icon">
          {paid ? (
            <Check size={58} />
          ) : state === "connection" ? (
            <SignalLow size={52} />
          ) : (
            <Clock3 size={52} />
          )}
        </div>
        <p className="eyebrow">
          {paid
            ? t(lang, "paidUpper")
            : expired
              ? t(lang, "expiredUpper")
              : t(lang, "connectionErrorUpper")}
        </p>
        <h1>{title}</h1>
        {paid && (
          <div className="received-amount">{formatZar(amount || "0")}</div>
        )}
        <p className="lead">{description}</p>
        {paid && reference && (
          <div className="receipt-line">
            <span>{t(lang, "reference")}</span>
            <strong>{reference.slice(0, 8).toUpperCase()}</strong>
          </div>
        )}
        <div className="result-actions">
          <Button
            onClick={() =>
              go(paid ? "dashboard" : expired ? "amount" : "waiting")
            }
            icon={paid ? <BarChart3 size={20} /> : <RefreshCw size={20} />}
          >
            {paid
              ? t(lang, "done")
              : expired
                ? t(lang, "createNew")
                : t(lang, "tryAgain")}
          </Button>
          {paid && (
            <Button
              variant="secondary"
              onClick={() => go("home")}
              icon={<QrCode size={20} />}
            >
              {t(lang, "newPayment")}
            </Button>
          )}
        </div>
      </div>
    </main>
  )
}

function Dashboard({
  lang,
  setLang,
  go,
  shopName,
}: {
  lang: Lang
  setLang: (l: Lang) => void
  go: (s: Screen) => void
  shopName: string
}) {
  const { items, loading, error } = useTransactions()
  const { today, days } = salesStats(items)
  const yesterday = dayKey(new Date(Date.now() - 864e5).toISOString())
  return (
    <AppFrame
      screen="dashboard"
      go={go}
      lang={lang}
      desktopTitle={t(lang, "sales")}
      shopName={shopName}
    >
      <main className="screen">
        <Header lang={lang} setLang={setLang} />
        <PageTitle eyebrow={t(lang, "dailyTotals")}>
          {t(lang, "sales")}
        </PageTitle>
        {error && <InlineMessage>{t(lang, "offline")}</InlineMessage>}
        <StatCard
          label={t(lang, "today")}
          value={formatZar(today.total)}
          detail={
            loading
              ? t(lang, "loading")
              : t(lang, "paymentCount", { count: today.count })
          }
          featured
        />
        <section className="daily-totals">
          {days.map(([key, day]) => (
            <div key={key}>
              <span>
                <strong>
                  {key === yesterday
                    ? t(lang, "yesterday")
                    : dateLabel(`${key}T12:00:00+02:00`)}
                </strong>
                <small>{t(lang, "paymentCount", { count: day.count })}</small>
              </span>
              <strong>{formatZar(day.total)}</strong>
            </div>
          ))}
          {!loading && !error && days.length === 0 && today.count === 0 && (
            <div>
              <span>
                <strong>{t(lang, "noSales")}</strong>
                <small>{t(lang, "noSalesHelp")}</small>
              </span>
            </div>
          )}
        </section>
      </main>
    </AppFrame>
  )
}

function HistoryScreen({
  lang,
  setLang,
  go,
  shopName,
  onOpen,
}: {
  lang: Lang
  setLang: (l: Lang) => void
  go: (s: Screen) => void
  shopName: string
  onOpen: (tx: Tx) => void
}) {
  const [filter, setFilter] = useState("today")
  const filters = ["today", "week", "all"]
  const { items, loading, error } = useTransactions()
  const weekAgo = Date.now() - 7 * 864e5
  const visible = items.filter((i) =>
    filter === "today"
      ? dayKey(i.createdAt) === todayKey()
      : filter === "week"
        ? Date.parse(i.createdAt) >= weekAgo
        : true,
  )
  const paid = visible.filter((i) => i.status === "PAID")
  const total = round2(paid.reduce((sum, i) => sum + i.zar, 0))
  return (
    <AppFrame
      screen="history"
      go={go}
      lang={lang}
      desktopTitle={t(lang, "transactionHistory")}
      shopName={shopName}
    >
      <main className="screen">
        <Header lang={lang} setLang={setLang} />
        <PageTitle eyebrow={t(lang, "yourMoney")}>
          {t(lang, "transactionHistory")}
        </PageTitle>
        <div className="filter-chips">
          {filters.map((key) => (
            <button
              key={key}
              className={filter === key ? "active" : ""}
              onClick={() => setFilter(key)}
            >
              {t(lang, key)}
            </button>
          ))}
        </div>
        {error && <InlineMessage>{t(lang, "offline")}</InlineMessage>}
        <section className="history-list">
          <div className="history-summary">
            <span>{t(lang, filter)}</span>
            <strong>{formatZar(total)}</strong>
            <small>
              {loading
                ? t(lang, "loading")
                : t(lang, "paymentCount", { count: paid.length })}
            </small>
          </div>
          {!loading && !error && visible.length === 0 && (
            <div className="history-summary">
              <span>{t(lang, "noSales")}</span>
              <small>{t(lang, "noSalesHelp")}</small>
            </div>
          )}
          {visible.map((item) => (
            <TransactionRow
              key={item.id}
              item={item}
              lang={lang}
              onClick={() => onOpen(item)}
            />
          ))}
        </section>
      </main>
    </AppFrame>
  )
}

function DetailScreen({
  lang,
  setLang,
  go,
  tx,
  walletAddress,
}: {
  lang: Lang
  setLang: (l: Lang) => void
  go: (s: Screen) => void
  tx: Tx | null
  walletAddress: string
}) {
  if (!tx) {
    return (
      <main className="focused-screen">
        <BackHeader
          title={t(lang, "detail")}
          onBack={() => go("history")}
          lang={lang}
          setLang={setLang}
        />
      </main>
    )
  }
  const reference = referenceOf(tx.incomingPaymentUrl)
  return (
    <main className="focused-screen">
      <BackHeader
        title={t(lang, "detail")}
        onBack={() => go("history")}
        lang={lang}
        setLang={setLang}
      />
      <div className="detail-card">
        <div className="detail-success">
          {tx.uiStatus === "success" ? (
            <Check size={30} />
          ) : tx.uiStatus === "pending" ? (
            <Clock3 size={30} />
          ) : (
            <XCircle size={30} />
          )}
        </div>
        <StatusChip
          status={tx.uiStatus}
          label={
            tx.uiStatus === "success"
              ? t(lang, "paid")
              : tx.uiStatus === "pending"
                ? t(lang, "pending")
                : t(lang, "expired")
          }
        />
        <strong className="detail-amount">{formatZar(tx.zar)}</strong>
        <span className="detail-ref">{tx.note || t(lang, "payment")}</span>
        <div className="detail-rows">
          <div>
            <span>{t(lang, "date")}</span>
            <strong>{fullDate(tx.paidAt ?? tx.createdAt)}</strong>
          </div>
          <div>
            <span>{t(lang, "reference")}</span>
            <strong>{reference.slice(0, 8).toUpperCase()}</strong>
          </div>
          <div>
            <span>{t(lang, "paidTo")}</span>
            <strong>{showWallet(walletAddress)}</strong>
          </div>
        </div>
        <Button
          variant="secondary"
          icon={<Copy size={19} />}
          onClick={() => navigator.clipboard?.writeText(reference)}
        >
          {t(lang, "copyReference")}
        </Button>
      </div>
    </main>
  )
}

function SettingsScreen({
  lang,
  setLang,
  go,
  profile,
  saveWallet,
  logout,
}: {
  lang: Lang
  setLang: (l: Lang) => void
  go: (s: Screen) => void
  profile: Profile
  saveWallet: (walletAddress: string) => Promise<void>
  logout: () => void
}) {
  const [editingWallet, setEditingWallet] = useState(false)
  const [wallet, setWallet] = useState(showWallet(profile.walletAddress))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const rows = [
    [
      WalletCards,
      t(lang, "changeWallet"),
      showWallet(profile.walletAddress),
      () => setEditingWallet(!editingWallet),
    ],
    [LogOut, t(lang, "logout"), t(lang, "returnToSignIn"), logout],
  ] as const
  const save = async () => {
    if (busy || !wallet.trim()) return
    setBusy(true)
    setError("")
    try {
      await saveWallet(normalizeWallet(wallet))
      setEditingWallet(false)
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 400
          ? t(lang, "walletNotFound")
          : errorText(lang, e),
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <AppFrame
      screen="settings"
      go={go}
      lang={lang}
      desktopTitle={t(lang, "settings")}
      shopName={profile.shopName}
    >
      <main className="screen">
        <Header lang={lang} setLang={setLang} />
        <PageTitle eyebrow={profile.shopName || t(lang, "brand")}>
          {t(lang, "shopSettings")}
        </PageTitle>
        <section className="settings-list">
          <div className="settings-language-row">
            <span className="settings-icon">
              <Languages size={21} />
            </span>
            <span>
              <strong>{t(lang, "language")}</strong>
              <small>
                {LANGUAGES.find((language) => language.code === lang)?.name ??
                  t(lang, "language")}
              </small>
            </span>
            <LanguageSwitcher lang={lang} setLang={setLang} />
          </div>
          {rows.map(([Icon, title, subtitle, action]) => (
            <button key={title} onClick={action}>
              <span className="settings-icon">
                <Icon size={21} />
              </span>
              <span>
                <strong>{title}</strong>
                <small>{subtitle}</small>
              </span>
              <ChevronRight size={20} />
            </button>
          ))}
        </section>
        {editingWallet && (
          <section className="settings-editor">
            <Field
              label={t(lang, "wallet")}
              value={wallet}
              setValue={(v) => {
                setWallet(v)
                setError("")
              }}
              placeholder={t(lang, "walletPlaceholderFull")}
              error={error}
            />
            <Button
              disabled={busy}
              icon={
                busy ? <LoaderCircle size={19} /> : <Check size={19} />
              }
              onClick={save}
            >
              {busy ? t(lang, "loading") : t(lang, "saveWallet")}
            </Button>
          </section>
        )}
      </main>
    </AppFrame>
  )
}

/* ------------------------------------------------------------------ */
/* Customer page preview (design preview, not connected to a payment)  */
/* ------------------------------------------------------------------ */

function CustomerPage({
  lang,
  setLang,
  go,
  state,
  amount,
  shopName,
}: {
  lang: Lang
  setLang: (l: Lang) => void
  go: (s: Screen) => void
  state: Screen
  amount: string
  shopName: string
}) {
  const [wallet, setWallet] = useState("")
  const result = [
    "customerDone",
    "customerDeclined",
    "customerInsufficient",
    "customerWalletNotFound",
  ].includes(state)
  const resultCopy =
    state === "customerDone"
      ? {
          eyebrow: t(lang, "approvedUpper"),
          title: t(lang, "approved"),
          body: t(lang, "approvedBody", {
            shop: shopName || t(lang, "yourShop"),
          }),
        }
      : state === "customerDeclined"
        ? {
            eyebrow: t(lang, "declinedUpper"),
            title: t(lang, "declinedTitle"),
            body: t(lang, "declinedBody"),
          }
        : state === "customerInsufficient"
          ? {
              eyebrow: t(lang, "insufficientUpper"),
              title: t(lang, "insufficientTitle"),
              body: t(lang, "insufficientBody"),
            }
          : {
              eyebrow: t(lang, "walletNotFoundUpper"),
              title: t(lang, "walletNotFound"),
              body: t(lang, "walletNotFoundBody"),
            }
  return (
    <main className="customer-shell">
      <Header lang={lang} setLang={setLang} minimal />
      <div className="customer-card">
        {result ? (
          <>
            <div
              className={`result-icon ${state === "customerDone" ? "" : "result-icon--error"}`}
            >
              {state === "customerDone" ? (
                <Check size={50} />
              ) : (
                <XCircle size={50} />
              )}
            </div>
            <p className="eyebrow">{resultCopy.eyebrow}</p>
            <h1>{resultCopy.title}</h1>
            <strong className="customer-amount">
              {formatZar(amount || "0")}
            </strong>
            <p className="lead">{resultCopy.body}</p>
            <Button
              variant="secondary"
              onClick={() =>
                go(state === "customerDone" ? "home" : "customer")
              }
              icon={
                state === "customerDone" ? (
                  <House size={19} />
                ) : (
                  <RefreshCw size={19} />
                )
              }
            >
              {state === "customerDone"
                ? t(lang, "backShop")
                : t(lang, "tryAgain")}
            </Button>
          </>
        ) : (
          <>
            <div className="merchant-logo">
              <Store size={30} />
            </div>
            <p className="eyebrow">{t(lang, "securePayment")}</p>
            <h1>
              {shopName
                ? t(lang, "payShopName", { shop: shopName })
                : t(lang, "payShop")}
            </h1>
            <div className="customer-amount-label">
              <span>{t(lang, "payAmount")}</span>
              <strong>{formatZar(amount || "0")}</strong>
            </div>
            {state === "customerApprove" ? (
              <div className="approve-box">
                <WalletCards size={28} />
                <div>
                  <span>{t(lang, "walletInput")}</span>
                  <strong>{wallet}</strong>
                </div>
                <CheckCircle2 size={22} />
              </div>
            ) : (
              <Field
                label={t(lang, "walletInput")}
                value={wallet}
                setValue={setWallet}
                placeholder={t(lang, "walletCustomerPlaceholder")}
                helper={t(lang, "walletExample")}
              />
            )}
            <p className="secure-note">
              <LockKeyhole size={18} />
              {t(lang, "secure")}
            </p>
            <Button
              onClick={() =>
                go(state === "customerApprove" ? "customerDone" : "customerApprove")
              }
              disabled={state === "customer" && !wallet.trim()}
              icon={
                state === "customerApprove" ? (
                  <Check size={20} />
                ) : (
                  <ArrowRight size={20} />
                )
              }
            >
              {state === "customerApprove"
                ? t(lang, "approve")
                : t(lang, "confirmPay")}
            </Button>
            {state === "customerApprove" && DEV && (
              <div
                className="state-preview customer-state-preview"
                aria-label={t(lang, "previewCustomerStates")}
              >
                <button onClick={() => go("customerDone")}>
                  {t(lang, "approvedUpper")}
                </button>
                <button onClick={() => go("customerDeclined")}>
                  {t(lang, "declinedUpper")}
                </button>
                <button onClick={() => go("customerInsufficient")}>
                  {t(lang, "insufficientUpper")}
                </button>
                <button onClick={() => go("customerWalletNotFound")}>
                  {t(lang, "walletNotFoundUpper")}
                </button>
              </div>
            )}
            <button className="back-link" onClick={() => go("home")}>
              {t(lang, "cancelBack")}
            </button>
          </>
        )}
      </div>
    </main>
  )
}

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */

const emptyProfile: Profile = {
  shopName: "",
  ownerName: "",
  email: "",
  walletAddress: "",
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("language")
  const [booting, setBooting] = useState(() => Boolean(getToken()))
  const [lang, setLangState] = useState<Lang>(() => {
    let saved: string | null = null
    try {
      saved = window.localStorage.getItem(LANG_KEY)
    } catch {
      /* ignore */
    }
    return LANGUAGES.some((language) => language.code === saved)
      ? (saved as Lang)
      : "en"
  })
  const [paymentAmount, setPaymentAmount] = useState("0.00")
  const [payment, setPayment] = useState<Payment | null>(null)
  const [selectedTx, setSelectedTx] = useState<Tx | null>(null)
  const [profile, setProfile] = useState<Profile>(emptyProfile)

  const setLang = (nextLang: Lang) => {
    setLangState(nextLang)
    try {
      window.localStorage.setItem(LANG_KEY, nextLang)
    } catch {
      /* ignore */
    }
  }
  const go = (next: Screen) => {
    setScreen(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Already signed in? Skip straight to Home.
  useEffect(() => {
    if (!getToken()) {
      setBooting(false)
      return
    }
    api<ShopDto>("/shops/me")
      .then((shop) => {
        setProfile({
          shopName: shop.shopName,
          ownerName: shop.ownerName,
          email: shop.email,
          walletAddress: shop.walletAddress ?? "",
        })
        setScreen("home")
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status !== 0) clearToken()
      })
      .finally(() => setBooting(false))
  }, [])

  // The api helper fires this when the session is no longer valid.
  useEffect(() => {
    const onUnauthorized = () => {
      setProfile(emptyProfile)
      setPayment(null)
      setScreen("login")
    }
    window.addEventListener("spazapay:unauthorized", onUnauthorized)
    return () =>
      window.removeEventListener("spazapay:unauthorized", onUnauthorized)
  }, [])

  const createPayment = async (amount: string) => {
    const zar = round2(Number(amount))
    const tx = await api<TxDto>("/payments/request", {
      method: "POST",
      body: { amount: zarToEur(zar), description: `R${zar.toFixed(2)}` },
    })
    setPayment({
      id: tx.id,
      qr: tx.qrPayload,
      expiresAt: tx.expiresAt,
      zar,
      reference: referenceOf(tx.incomingPaymentUrl),
    })
    setPaymentAmount(zar.toFixed(2))
    go("waiting")
  }

  const saveWallet = async (walletAddress: string) => {
    const wallet = await api<{ id: string }>("/shops/me/wallet", {
      method: "PUT",
      body: { walletAddress },
    })
    setProfile((current) => ({ ...current, walletAddress: wallet.id }))
  }

  const logout = () => {
    clearToken()
    setProfile(emptyProfile)
    setPayment(null)
    go("language")
  }

  if (booting)
    return (
      <main className="result-page">
        <div className="result-content">
          <LoaderCircle size={36} />
          <p className="lead">{t(lang, "loading")}</p>
        </div>
      </main>
    )
  if (screen === "language")
    return (
      <LanguageScreen
        choose={(l) => {
          setLang(l)
          go("onboarding")
        }}
      />
    )
  if (screen === "onboarding")
    return (
      <Onboarding
        lang={lang}
        setLang={setLang}
        goLogin={() => go("login")}
        finish={(savedProfile) => {
          setProfile(savedProfile)
          go("success")
        }}
      />
    )
  if (screen === "login")
    return (
      <LoginScreen
        lang={lang}
        setLang={setLang}
        goSignUp={() => go("onboarding")}
        onSuccess={(loaded) => {
          setProfile(loaded)
          go("home")
        }}
      />
    )
  if (screen === "success")
    return (
      <SuccessScreen
        lang={lang}
        setLang={setLang}
        go={() => go("home")}
        profile={profile}
      />
    )
  if (screen === "home")
    return (
      <HomeScreen lang={lang} setLang={setLang} go={go} profile={profile} />
    )
  if (screen === "amount")
    return (
      <AmountScreen
        lang={lang}
        setLang={setLang}
        go={go}
        confirm={createPayment}
      />
    )
  if (screen === "waiting")
    return payment ? (
      <WaitingScreen
        lang={lang}
        setLang={setLang}
        go={go}
        payment={payment}
      />
    ) : (
      <AmountScreen
        lang={lang}
        setLang={setLang}
        go={go}
        confirm={createPayment}
      />
    )
  if (screen === "received")
    return (
      <ResultState
        lang={lang}
        setLang={setLang}
        go={go}
        state="paid"
        amount={paymentAmount}
        reference={payment?.reference ?? ""}
      />
    )
  if (screen === "expired")
    return (
      <ResultState
        lang={lang}
        setLang={setLang}
        go={go}
        state="expired"
        amount={paymentAmount}
        reference=""
      />
    )
  if (screen === "connectionError")
    return (
      <ResultState
        lang={lang}
        setLang={setLang}
        go={go}
        state="connection"
        amount={paymentAmount}
        reference=""
      />
    )
  if (screen === "dashboard")
    return (
      <Dashboard
        lang={lang}
        setLang={setLang}
        go={go}
        shopName={profile.shopName}
      />
    )
  if (screen === "history")
    return (
      <HistoryScreen
        lang={lang}
        setLang={setLang}
        go={go}
        shopName={profile.shopName}
        onOpen={(tx) => {
          setSelectedTx(tx)
          go("detail")
        }}
      />
    )
  if (screen === "detail")
    return (
      <DetailScreen
        lang={lang}
        setLang={setLang}
        go={go}
        tx={selectedTx}
        walletAddress={profile.walletAddress}
      />
    )
  if (screen === "settings")
    return (
      <SettingsScreen
        lang={lang}
        setLang={setLang}
        go={go}
        profile={profile}
        saveWallet={saveWallet}
        logout={logout}
      />
    )
  return (
    <CustomerPage
      lang={lang}
      setLang={setLang}
      go={go}
      state={screen}
      amount={paymentAmount}
      shopName={profile.shopName}
    />
  )
}
