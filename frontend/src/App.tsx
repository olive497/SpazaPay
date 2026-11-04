import { useEffect, useMemo, useState } from "react"
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

type Lang = "en" | "zu"
type Screen =
  | "language"
  | "onboarding"
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
  walletAddress: string
}

const copy = {
  en: {
    accept: "Accept",
    sales: "Sales",
    history: "History",
    settings: "Settings",
    today: "Today",
    week: "This week",
    all: "All",
    hello: "Welcome",
    ready: "Ready to receive money",
    scan: "Ask your customer to scan",
    scanHelp: "Works with any supported bank or wallet app",
    copy: "Copy",
    copied: "Wallet address copied",
    enter: "Enter amount",
    totalToday: "Today's sales",
    payments: "payments",
    low: "Low data",
    amount: "Enter amount",
    clear: "Clear amount",
    showQr: "Show payment QR",
    waiting: "Waiting for payment…",
    waitingHelp:
      "Keep this screen open. We will confirm when the money arrives.",
    cancel: "Cancel payment",
    received: "Money received",
    receivedHelp: "The payment is in your SpazaPay wallet.",
    done: "View sales",
    newPayment: "Take another payment",
    failed: "Payment not completed",
    failedHelp: "No money was taken. Ask the customer to try again.",
    tryAgain: "Try again",
    dashboard: "Sales overview",
    balance: "Available balance",
    transactions: "Transactions",
    last7: "Last 7 days",
    recent: "Recent payments",
    viewAll: "View all",
    transactionHistory: "Payment history",
    detail: "Payment details",
    paid: "Paid",
    pending: "Pending",
    provider: "Customer wallet",
    reference: "Reference ID",
    date: "Date & time",
    shopSettings: "Shop settings",
    language: "Language",
    profile: "Shop profile",
    wallet: "Wallet address",
    help: "Help & support",
    customerPage: "Preview customer payment page",
    noSales: "No sales yet today",
    noSalesHelp: "Your first payment will appear here.",
    payShop: "Pay shop",
    payAmount: "Amount to pay",
    walletInput: "Your wallet address",
    walletPlaceholder: "$yourname.wallet",
    confirmPay: "Continue to approve",
    approve: "Approve payment",
    secure: "You will approve this payment securely with your wallet.",
    approved: "Payment approved",
    backShop: "Back to shop page",
  },
  zu: {
    accept: "Yamukela",
    sales: "Ukuthengisa",
    history: "Umlando",
    settings: "Izilungiselelo",
    today: "Namuhla",
    week: "Leli sonto",
    all: "Konke",
    hello: "Siyakwamukela",
    ready: "Usulungele ukwamukela imali",
    scan: "Cela ikhasimende liskenе",
    scanHelp: "Isebenza nebhange noma i-wallet esekelwayo",
    copy: "Kopisha",
    copied: "Ikheli le-wallet likopishiwe",
    enter: "Faka inani",
    totalToday: "Ukuthengisa kwanamuhla",
    payments: "izinkokhelo",
    low: "Idatha encane",
    amount: "Faka inani",
    clear: "Sula inani",
    showQr: "Bonisa i-QR yokukhokha",
    waiting: "Silinde inkokhelo…",
    waitingHelp:
      "Gcina lesi sikrini sivulekile. Sizokwazisa uma imali ifikile.",
    cancel: "Khansela inkokhelo",
    received: "Imali yamukelwe",
    receivedHelp: "Inkokhelo isiku-wallet yakho ye-SpazaPay.",
    done: "Bheka ukuthengisa",
    newPayment: "Yamukela enye inkokhelo",
    failed: "Inkokhelo ayiphelanga",
    failedHelp: "Akukho mali ethathiwe. Cela ikhasimende lizame futhi.",
    tryAgain: "Zama futhi",
    dashboard: "Ukubuka ukuthengisa",
    balance: "Ibhalansi etholakalayo",
    transactions: "Izinkokhelo",
    last7: "Izinsuku eziyi-7",
    recent: "Izinkokhelo zakamuva",
    viewAll: "Bheka konke",
    transactionHistory: "Umlando wezinkokhelo",
    detail: "Imininingwane yenkokhelo",
    paid: "Ikhokhiwe",
    pending: "Ilindile",
    provider: "I-wallet yekhasimende",
    reference: "Inombolo yenkomba",
    date: "Usuku nesikhathi",
    shopSettings: "Izilungiselelo zesitolo",
    language: "Ulimi",
    profile: "Iphrofayela yesitolo",
    wallet: "Ikheli le-wallet",
    help: "Usizo nokwesekwa",
    customerPage: "Buka ikhasi lokukhokha lekhasimende",
    noSales: "Akukho okuthengisiwe namuhla",
    noSalesHelp: "Inkokhelo yakho yokuqala izovela lapha.",
    payShop: "Khokhela isitolo",
    payAmount: "Inani lokukhokha",
    walletInput: "Ikheli lakho le-wallet",
    walletPlaceholder: "$igama-lakho.wallet",
    confirmPay: "Qhubeka uyovuma",
    approve: "Vuma inkokhelo",
    secure: "Uzovuma le nkokhelo ngokuphepha nge-wallet yakho.",
    approved: "Inkokhelo ivunyiwe",
    backShop: "Buyela ekhasini lesitolo",
  },
}

const transactions = [
  {
    amount: "€85.00",
    time: "Today, 10:42",
    ref: "Airtime & bread",
    provider: "MTN MoMo",
    status: "success" as const,
  },
  {
    amount: "€24.50",
    time: "Today, 09:18",
    ref: "Cold drink",
    provider: "Capitec Pay",
    status: "pending" as const,
  },
  {
    amount: "€120.00",
    time: "18 Jun, 08:05",
    ref: "Groceries",
    provider: "Nedbank",
    status: "success" as const,
  },
  {
    amount: "€32.00",
    time: "17 Jun, 16:20",
    ref: "Milk & eggs",
    provider: "Standard Bank",
    status: "failed" as const,
  },
]

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

function LanguageSwitcher({
  lang,
  setLang,
}: {
  lang: Lang
  setLang: (lang: Lang) => void
}) {
  return (
    <button
      className="language-switcher"
      onClick={() => setLang(lang === "en" ? "zu" : "en")}
      aria-label="Change language"
    >
      <Languages size={19} />
      <span>{lang === "en" ? "EN" : "ZU"}</span>
    </button>
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
        <span>SpazaPay</span>
      </div>
      <div className="header-actions">
        {!minimal && (
          <span className="connection">
            <SignalLow size={17} />
            <span>{copy[lang].low}</span>
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
      <button className="icon-button" onClick={onBack} aria-label="Go back">
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
  t,
}: {
  active: Screen
  go: (s: Screen) => void
  t: typeof copy.en
}) {
  const items = [
    { screen: "home" as Screen, label: t.accept, Icon: QrCode },
    { screen: "dashboard" as Screen, label: t.sales, Icon: BarChart3 },
    { screen: "history" as Screen, label: t.history, Icon: History },
    { screen: "settings" as Screen, label: t.settings, Icon: Settings },
  ]
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
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
  t,
  desktopTitle,
}: {
  children: React.ReactNode
  screen: Screen
  go: (s: Screen) => void
  t: typeof copy.en
  desktopTitle: string
}) {
  return (
    <div className="app-frame">
      <aside className="desktop-sidebar">
        <div className="brand brand--large">
          <span className="brand-mark">
            <Store size={23} />
          </span>
          <span>SpazaPay</span>
        </div>
        <div className="shop-pill">
          <span>SP</span>
          <div>
            <strong>Your shop</strong>
            <small>SpazaPay</small>
          </div>
        </div>
        <BottomNav active={screen} go={go} t={t} />
        <div className="sidebar-help">
          <CircleHelp size={20} />
          <span>Need help?</span>
        </div>
      </aside>
      <section className="workspace">
        <div className="desktop-topbar">
          <div>
            <span className="eyebrow">SPAZAPAY</span>
            <strong>{desktopTitle}</strong>
          </div>
          <span className="connection">
            <Wifi size={17} /> Connected
          </span>
        </div>
        {children}
        <BottomNav active={screen} go={go} t={t} />
      </section>
    </div>
  )
}

function QRPattern({ amount }: { amount?: string }) {
  const cells = useMemo(
    () =>
      Array.from(
        { length: 121 },
        (_, i) => (i * 17 + (amount?.length || 3) * 7) % 13 < 6,
      ),
    [amount],
  )
  return (
    <div className="qr" aria-label="Payment QR code">
      {cells.map((on, i) => (
        <i key={i} className={on ? "on" : ""} />
      ))}
      <span className="qr-center">
        <Store size={22} />
      </span>
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
  t,
  onClick,
}: {
  item: typeof transactions[0]
  t: typeof copy.en
  onClick: () => void
}) {
  return (
    <button className="transaction-row" onClick={onClick}>
      <span className="transaction-icon">
        {item.status === "success" ? (
          <Check size={18} />
        ) : item.status === "pending" ? (
          <Clock3 size={18} />
        ) : (
          <XCircle size={18} />
        )}
      </span>
      <span className="transaction-copy">
        <strong>{item.ref}</strong>
        <small>
          {item.time} · {item.provider}
        </small>
      </span>
      <span className="transaction-amount">
        <strong>{item.amount}</strong>
        <StatusChip
          status={item.status}
          label={
            item.status === "success"
              ? "PAID"
              : item.status === "pending"
                ? "PENDING"
                : "EXPIRED"
          }
        />
      </span>
      <ChevronRight size={19} className="chevron" />
    </button>
  )
}

function LanguageScreen({ choose }: { choose: (l: Lang) => void }) {
  const languages = [
    ["en", "English", "Continue in English", "EN"],
    ["zu", "isiZulu", "Qhubeka ngesiZulu", "ZU"],
    ["en", "Afrikaans", "Gaan voort in Afrikaans", "AF"],
    ["en", "Sesotho", "Tsoela pele ka Sesotho", "ST"],
  ] as const
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
          <span>SpazaPay</span>
        </div>
        <p className="eyebrow">WELCOME · SIYAKWAMUKELA</p>
        <h1>Choose your language</h1>
        <p className="lead">Khetha ulimi lwakho</p>
        <div className="language-grid">
          {languages.map(([code, name, description, short]) => (
            <button
              key={name}
              className="language-card"
              onClick={() => choose(code)}
            >
              <span className="language-code">{short}</span>
              <span>
                <strong>{name}</strong>
                <small>{description}</small>
              </span>
              <ChevronRight size={22} />
            </button>
          ))}
        </div>
        <p className="trust-note">
          <LockKeyhole size={17} /> Safe, simple payments for your shop
        </p>
      </section>
    </main>
  )
}

function Onboarding({
  lang,
  setLang,
  finish,
}: {
  lang: Lang
  setLang: (l: Lang) => void
  finish: (profile: Profile) => void
}) {
  const [step, setStep] = useState(1)
  const [shop, setShop] = useState("")
  const [owner, setOwner] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [handle, setHandle] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [walletStatus, setWalletStatus] = useState<
    "idle" | "verified" | "error"
  >("idle")
  const info =
    lang === "en"
      ? [
          [
            "Tell us about your shop",
            "What should customers see when they pay?",
          ],
          ["About you", "We use your number to keep your account safe."],
          ["Secure your account", "Add an email and create a safe password."],
          [
            "Choose your wallet address",
            "Customers use this address to send you money.",
          ],
        ]
      : [
          ["Sitshele ngesitolo sakho", "Amakhasimende azobonani uma ekhokha?"],
          [
            "Mayelana nawe",
            "Sisebenzisa inombolo yakho ukugcina i-akhawunti iphephile.",
          ],
          [
            "Vikela i-akhawunti yakho",
            "Faka i-imeyili bese udala iphasiwedi ephephile.",
          ],
          [
            "Khetha ikheli le-wallet",
            "Amakhasimende asebenzisa leli kheli ukukuthumela imali.",
          ],
        ]
  const updateError = (name: string, message = "") =>
    setErrors((current) => ({ ...current, [name]: message }))
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const continueOnboarding = () => {
    if (step === 1 && !shop.trim()) {
      updateError("shop", "Enter your shop name")
      return
    }
    if (step === 2 && (!owner.trim() || !phone.trim())) {
      setErrors({
        owner: owner.trim() ? "" : "Enter your name",
        phone: phone.trim() ? "" : "Enter your phone number",
      })
      return
    }
    if (step === 3 && (!emailIsValid || password.length < 8)) {
      setErrors({
        email: emailIsValid ? "" : "Enter a valid email address",
        password:
          password.length >= 8 ? "" : "Password must be at least 8 characters",
      })
      return
    }
    if (step < 4) {
      setErrors({})
      setStep(step + 1)
      return
    }
    if (walletStatus !== "verified") {
      if (!handle.trim() || handle.toLowerCase().includes("missing")) {
        setWalletStatus("error")
        updateError("wallet", "Wallet address not found")
      } else {
        setWalletStatus("verified")
        updateError("wallet")
      }
      return
    }
    finish({
      shopName: shop,
      ownerName: owner,
      email,
      walletAddress: `$ilp.interledger-test.dev/${handle}`,
    })
  }
  return (
    <main className="onboarding-shell">
      <Header lang={lang} setLang={setLang} minimal />
      <div className="onboarding-card">
        <div className="progress-row">
          <span>
            {lang === "en"
              ? `Step ${step} of 4`
              : `Isinyathelo ${step} kwezine`}
          </span>
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
            label={lang === "en" ? "Shop name" : "Igama lesitolo"}
            value={shop}
            setValue={(value) => {
              setShop(value)
              updateError("shop")
            }}
            placeholder={lang === "en" ? "e.g. Corner Market" : "isb. Isitolo Sami"}
            error={errors.shop}
            helper={
              lang === "en"
                ? "You can change this later"
                : "Ungakushintsha lokhu kamuva"
            }
          />
        )}
        {step === 2 && (
          <>
            <Field
              label={lang === "en" ? "Your name" : "Igama lakho"}
              value={owner}
              setValue={(value) => {
                setOwner(value)
                updateError("owner")
              }}
              placeholder={lang === "en" ? "Your full name" : "Igama lakho lonke"}
              error={errors.owner}
            />
            <Field
              label={lang === "en" ? "Phone number" : "Inombolo yocingo"}
              value={phone}
              setValue={(value) => {
                setPhone(value)
                updateError("phone")
              }}
              placeholder="e.g. 071 234 5678"
              inputMode="tel"
              error={errors.phone}
            />
          </>
        )}
        {step === 3 && (
          <>
            <Field
              label={lang === "en" ? "Email address" : "Ikheli le-imeyili"}
              value={email}
              setValue={(value) => {
                setEmail(value)
                updateError("email")
              }}
              placeholder="you@example.com"
              inputMode="email"
              type="email"
              error={errors.email}
              onBlur={() =>
                email &&
                updateError(
                  "email",
                  emailIsValid ? "" : "Enter a valid email address",
                )
              }
            />
            <Field
              label={lang === "en" ? "Password" : "Iphasiwedi"}
              value={password}
              setValue={(value) => {
                setPassword(value)
                updateError("password")
              }}
              placeholder={lang === "en" ? "Create a password" : "Dala iphasiwedi"}
              type={showPassword ? "text" : "password"}
              helper={lang === "en" ? "Minimum 8 characters" : "Okungenani izinhlamvu eziyi-8"}
              error={errors.password}
              trailing={
                <button
                  type="button"
                  className="field-action"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
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
              label={
                lang === "en"
                  ? "Wallet address name"
                  : "Igama lekheli le-wallet"
              }
              value={handle}
              setValue={(v) => {
                setHandle(v.toLowerCase().replace(/\s+/g, "-"))
                setWalletStatus("idle")
                updateError("wallet")
              }}
              prefix="$ilp.interledger-test.dev/"
              placeholder="spazapay"
              error={errors.wallet}
            />
            {walletStatus === "verified" && (
              <div className="wallet-preview">
                <span>
                  {lang === "en" ? "Wallet verified" : "I-wallet iqinisekisiwe"}
                </span>
                <strong>$ilp.interledger-test.dev/{handle}</strong>
                <small>
                  <CheckCircle2 size={15} />{" "}
                  {lang === "en" ? "Address found" : "Ikheli litholakele"}
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
            >
              {lang === "en" ? "Back" : "Emuva"}
            </Button>
          )}
          <Button
            icon={
              step < 4 || walletStatus !== "verified" ? (
                <ArrowRight size={20} />
              ) : (
                <Check size={20} />
              )
            }
            onClick={continueOnboarding}
          >
            {step < 4
              ? lang === "en"
                ? "Continue"
                : "Qhubeka"
              : walletStatus !== "verified"
                ? lang === "en"
                  ? "Verify wallet"
                  : "Qinisekisa i-wallet"
              : lang === "en"
                ? "Create my shop"
                : "Dala isitolo sami"}
          </Button>
        </div>
      </div>
    </main>
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
        {error || "\u00a0"}
      </small>
    </label>
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
        <p className="eyebrow">{lang === "en" ? "ALL DONE" : "SEKUPHELILE"}</p>
        <h1>
          {lang === "en"
            ? "Your shop is ready to get paid."
            : "Isitolo sakho sesilungele ukukhokhelwa."}
        </h1>
        <p className="lead">
          {lang === "en"
            ? "Share your QR code and receive money from any supported wallet."
            : "Yabelana nge-QR yakho uthole imali kunoma iyiphi i-wallet esekelwayo."}
        </p>
        <div className="mini-wallet">
          <WalletCards />
          <span>
            <small>
              {lang === "en" ? "Your wallet address" : "Ikheli lakho le-wallet"}
            </small>
            <strong>{profile.walletAddress}</strong>
          </span>
        </div>
        <Button onClick={go} icon={<QrCode size={21} />}>
          {lang === "en" ? "Show my payment QR" : "Bonisa i-QR yami yokukhokha"}
        </Button>
      </div>
    </main>
  )
}

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
  const t = copy[lang]
  const [toast, setToast] = useState(false)
  return (
    <AppFrame screen="home" go={go} t={t} desktopTitle={t.accept}>
      <main className="screen">
        <Header lang={lang} setLang={setLang} />
        <PageTitle eyebrow={t.hello}>{t.accept}</PageTitle>
        <div className="status-banner">
          <span>
            <CheckCircle2 size={21} />
          </span>
          <div>
            <strong>{t.ready}</strong>
            <small>
              {lang === "en"
                ? "Payments are working normally"
                : "Izinkokhelo zisebenza kahle"}
            </small>
          </div>
        </div>
        <div className="home-layout">
          <section className="qr-card">
            <div className="qr-heading">
              <div>
                <h2>{t.scan}</h2>
                <p>{t.scanHelp}</p>
              </div>
              <QrCode size={26} />
            </div>
            <QRPattern />
            <strong className="shop-name">
              {profile.shopName || "Your shop"}
            </strong>
            <div className="wallet-address">
              <span>{profile.walletAddress}</span>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(profile.walletAddress)
                  setToast(true)
                  setTimeout(() => setToast(false), 2200)
                }}
              >
                <Copy size={17} />
                {t.copy}
              </button>
            </div>
          </section>
          <aside className="home-actions">
            <Button
              onClick={() => go("amount")}
              icon={<ReceiptText size={22} />}
            >
              {t.enter}
            </Button>
            <article className="today-card">
              <span>{t.totalToday}</span>
              <strong>€229.50</strong>
              <small>3 {t.payments}</small>
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
                <strong>{t.customerPage}</strong>
                <small>
                  {lang === "en"
                    ? "See what your customer sees"
                    : "Bona lokho ikhasimende elikubonayo"}
                </small>
              </span>
              <ChevronRight size={20} />
            </button>
          </aside>
        </div>
        {toast && (
          <div className="toast">
            <CheckCircle2 size={19} />
            {t.copied}
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
  confirm: (amount: string) => void
}) {
  const t = copy[lang]
  const [amount, setAmount] = useState("")
  const press = (key: string) => {
    if (key === "back") return setAmount(amount.slice(0, -1))
    if (key === "." && amount.includes(".")) return
    if (amount.length < 7) setAmount(amount === "0" ? key : amount + key)
  }
  return (
    <main className="focused-screen">
      <BackHeader
        title={t.amount}
        onBack={() => go("home")}
        lang={lang}
        setLang={setLang}
      />
      <div className="amount-shell">
        <p>
          {lang === "en"
            ? "How much should the customer pay?"
            : "Ikhasimende kufanele likhokhe malini?"}
        </p>
        <div className="amount-display">
          <span>€</span>
          <strong>{amount || "0.00"}</strong>
        </div>
        <button className="clear-link" onClick={() => setAmount("")}>
          <RefreshCw size={16} />
          {t.clear}
        </button>
        <div className="keypad">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"].map(
            (k) => (
              <button
                key={k}
                onClick={() => press(k)}
                aria-label={k === "back" ? "Delete" : k}
              >
                {k === "back" ? <Delete size={25} /> : k}
              </button>
            ),
          )}
        </div>
        <Button
          onClick={() => confirm(amount)}
          disabled={!amount || Number(amount) === 0}
          icon={<QrCode size={21} />}
        >
          {t.showQr}
        </Button>
      </div>
    </main>
  )
}

function WaitingScreen({
  lang,
  setLang,
  go,
  amount,
}: {
  lang: Lang
  setLang: (l: Lang) => void
  go: (s: Screen) => void
  amount: string
}) {
  const t = copy[lang]
  const [seconds, setSeconds] = useState(900)
  useEffect(() => {
    const timer = window.setInterval(
      () => setSeconds((current) => Math.max(0, current - 1)),
      1000,
    )
    return () => window.clearInterval(timer)
  }, [])
  useEffect(() => {
    if (seconds === 0) go("expired")
  }, [seconds, go])
  const countdown = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`
  return (
    <main className="focused-screen">
      <BackHeader
        title={`€${amount || "0.00"}`}
        onBack={() => go("amount")}
        lang={lang}
        setLang={setLang}
      />
      <div className="waiting-layout">
        <div className="waiting-qr">
          <QRPattern amount={amount} />
          <span className="scan-line" />
        </div>
        <div className="countdown" aria-label={`${countdown} remaining`}>
          <Clock3 size={19} />
          <strong>{countdown}</strong>
          <span>{lang === "en" ? "remaining" : "kusele"}</span>
        </div>
        <div className="pulse-icon">
          <LoaderCircle size={30} />
        </div>
        <h1>{t.waiting}</h1>
        <p className="lead">{t.waitingHelp}</p>
        <div className="secure-note">
          <LockKeyhole size={18} />
          {lang === "en"
            ? "Secure payment · Do not refresh"
            : "Inkokhelo ephephile · Ungavuseleli"}
        </div>
        <div className="state-preview" aria-label="Preview payment states">
          <button onClick={() => go("received")}>PAID</button>
          <button onClick={() => go("expired")}>EXPIRED</button>
          <button onClick={() => go("connectionError")}>CONNECTION ERROR</button>
        </div>
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
}: {
  lang: Lang
  setLang: (l: Lang) => void
  go: (s: Screen) => void
  state: "paid" | "expired" | "connection"
  amount: string
}) {
  const t = copy[lang]
  const paid = state === "paid"
  const expired = state === "expired"
  const title = paid
    ? t.received
    : expired
      ? "Expired, create a new one"
      : "Connection error"
  const description = paid
    ? t.receivedHelp
    : expired
      ? "This payment QR is no longer active. Create a new one to continue."
      : "We could not check this payment. Check your connection and try again."
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
          {paid ? "PAID" : expired ? "EXPIRED" : "CONNECTION ERROR"}
        </p>
        <h1>{title}</h1>
        {paid && <div className="received-amount">€{amount || "0.00"}</div>}
        <p className="lead">{description}</p>
        {paid && (
          <div className="receipt-line">
            <span>MTN MoMo</span>
            <strong>SPZ-48291</strong>
          </div>
        )}
        <div className="result-actions">
          <Button
            onClick={() =>
              go(paid ? "dashboard" : expired ? "amount" : "waiting")
            }
            icon={paid ? <BarChart3 size={20} /> : <RefreshCw size={20} />}
          >
            {paid ? t.done : expired ? "Create a new one" : t.tryAgain}
          </Button>
          {paid && (
            <Button
              variant="secondary"
              onClick={() => go("home")}
              icon={<QrCode size={20} />}
            >
              {t.newPayment}
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
}: {
  lang: Lang
  setLang: (l: Lang) => void
  go: (s: Screen) => void
}) {
  const t = copy[lang]
  const dailyTotals = [
    ["Today", "€354.50", "4 payments"],
    ["Yesterday", "€412.00", "6 payments"],
    ["16 June", "€286.25", "5 payments"],
    ["15 June", "€198.00", "3 payments"],
    ["14 June", "€507.80", "8 payments"],
  ]
  return (
    <AppFrame screen="dashboard" go={go} t={t} desktopTitle={t.sales}>
      <main className="screen">
        <Header lang={lang} setLang={setLang} />
        <PageTitle eyebrow={lang === "en" ? "DAILY TOTALS" : "IMALI YOSUKU"}>
          {t.sales}
        </PageTitle>
        <StatCard
          label={t.today}
          value="€354.50"
          detail={`4 ${t.transactions.toLowerCase()}`}
          featured
        />
        <section className="daily-totals">
          {dailyTotals.map(([date, total, count]) => (
            <div key={date}>
              <span>
                <strong>{date}</strong>
                <small>{count}</small>
              </span>
              <strong>{total}</strong>
            </div>
          ))}
        </section>
      </main>
    </AppFrame>
  )
}

function HistoryScreen({
  lang,
  setLang,
  go,
}: {
  lang: Lang
  setLang: (l: Lang) => void
  go: (s: Screen) => void
}) {
  const t = copy[lang]
  const [filter, setFilter] = useState("Today")
  return (
    <AppFrame
      screen="history"
      go={go}
      t={t}
      desktopTitle={t.transactionHistory}
    >
      <main className="screen">
        <Header lang={lang} setLang={setLang} />
        <PageTitle eyebrow={lang === "en" ? "YOUR MONEY" : "IMALI YAKHO"}>
          {t.transactionHistory}
        </PageTitle>
        <div className="filter-chips">
          {[t.today, t.week, t.all].map((x, i) => (
            <button
              key={x}
              className={filter === ["Today", "Week", "All"][i] ? "active" : ""}
              onClick={() => setFilter(["Today", "Week", "All"][i])}
            >
              {x}
            </button>
          ))}
        </div>
        <section className="history-list">
          <div className="history-summary">
            <span>
              {filter === "Today"
                ? t.today
                : filter === "Week"
                  ? t.week
                  : t.all}
            </span>
            <strong>€354.50</strong>
            <small>4 {t.transactions.toLowerCase()}</small>
          </div>
          {transactions.map((item, i) => (
            <TransactionRow
              key={i}
              item={item}
              t={t}
              onClick={() => go("detail")}
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
}: {
  lang: Lang
  setLang: (l: Lang) => void
  go: (s: Screen) => void
}) {
  const t = copy[lang]
  return (
    <main className="focused-screen">
      <BackHeader
        title={t.detail}
        onBack={() => go("history")}
        lang={lang}
        setLang={setLang}
      />
      <div className="detail-card">
        <div className="detail-success">
          <Check size={30} />
        </div>
        <StatusChip status="success" label={t.paid} />
        <strong className="detail-amount">€85.00</strong>
        <span className="detail-ref">Airtime & bread</span>
        <div className="detail-rows">
          <div>
            <span>{t.date}</span>
            <strong>18 June 2025, 10:42</strong>
          </div>
          <div>
            <span>{t.provider}</span>
            <strong>MTN MoMo</strong>
          </div>
          <div>
            <span>{t.reference}</span>
            <strong>SPZ-48291-KM</strong>
          </div>
          <div>
            <span>{lang === "en" ? "Paid to" : "Ikhokhelwe ku"}</span>
            <strong>$ilp.interledger-test.dev/spazapay</strong>
          </div>
        </div>
        <Button
          variant="secondary"
          icon={<Copy size={19} />}
          onClick={() => navigator.clipboard?.writeText("SPZ-48291-KM")}
        >
          {lang === "en" ? "Copy reference" : "Kopisha inkomba"}
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
  saveWallet: (walletAddress: string) => void
  logout: () => void
}) {
  const t = copy[lang]
  const [editingWallet, setEditingWallet] = useState(false)
  const [wallet, setWallet] = useState(profile.walletAddress)
  const rows = [
    [
      Languages,
      t.language,
      lang === "en" ? "English" : "isiZulu",
      () => setLang(lang === "en" ? "zu" : "en"),
    ],
    [
      WalletCards,
      lang === "en" ? "Change wallet address" : "Shintsha ikheli le-wallet",
      profile.walletAddress,
      () => setEditingWallet(!editingWallet),
    ],
    [
      LogOut,
      lang === "en" ? "Log out" : "Phuma",
      lang === "en" ? "Return to sign in" : "Buyela ekungeneni",
      logout,
    ],
  ] as const
  return (
    <AppFrame screen="settings" go={go} t={t} desktopTitle={t.settings}>
      <main className="screen">
        <Header lang={lang} setLang={setLang} />
        <PageTitle eyebrow={profile.shopName || "SPAZAPAY"}>
          {t.shopSettings}
        </PageTitle>
        <section className="settings-list">
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
              label={t.wallet}
              value={wallet}
              setValue={setWallet}
              placeholder="$ilp.interledger-test.dev/spazapay"
            />
            <Button
              icon={<Check size={19} />}
              onClick={() => {
                saveWallet(wallet)
                setEditingWallet(false)
              }}
            >
              {lang === "en" ? "Save wallet address" : "Londoloza ikheli"}
            </Button>
          </section>
        )}
        <div className="support-banner">
          <CircleHelp size={24} />
          <div>
            <strong>{lang === "en" ? "Need a hand?" : "Udinga usizo?"}</strong>
            <small>
              {lang === "en"
                ? "Call us free on 0800 772 929"
                : "Sishayele mahhala ku-0800 772 929"}
            </small>
          </div>
        </div>
      </main>
    </AppFrame>
  )
}

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
  const t = copy[lang]
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
          eyebrow: "APPROVED",
          title: t.approved,
          body: `${shopName || "The shop"} has received your money.`,
        }
      : state === "customerDeclined"
        ? {
            eyebrow: "DECLINED",
            title: "Payment declined",
            body: "Your wallet declined this payment. No money was sent.",
          }
        : state === "customerInsufficient"
          ? {
              eyebrow: "NOT ENOUGH MONEY",
              title: "Not enough money",
              body: "Add money to your wallet or choose another wallet.",
            }
          : {
              eyebrow: "WALLET NOT FOUND",
              title: "Wallet not found",
              body: "Check the wallet address and try again.",
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
            <strong className="customer-amount">€{amount || "0.00"}</strong>
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
              {state === "customerDone" ? t.backShop : t.tryAgain}
            </Button>
          </>
        ) : (
          <>
            <div className="merchant-logo">
              <Store size={30} />
            </div>
            <p className="eyebrow">SPAZAPAY SECURE PAYMENT</p>
            <h1>{shopName ? `Pay ${shopName}` : t.payShop}</h1>
            <div className="customer-amount-label">
              <span>{t.payAmount}</span>
              <strong>€{amount || "0.00"}</strong>
            </div>
            {state === "customerApprove" ? (
              <div className="approve-box">
                <WalletCards size={28} />
                <div>
                  <span>{t.walletInput}</span>
                  <strong>{wallet}</strong>
                </div>
                <CheckCircle2 size={22} />
              </div>
            ) : (
              <Field
                label={t.walletInput}
                value={wallet}
                setValue={setWallet}
                placeholder="$ilp.interledger-test.dev/yourname"
                helper="Example: $ilp.interledger-test.dev/yourname"
              />
            )}
            <p className="secure-note">
              <LockKeyhole size={18} />
              {t.secure}
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
              {state === "customerApprove" ? t.approve : t.confirmPay}
            </Button>
            {state === "customerApprove" && (
              <div className="state-preview customer-state-preview">
                <button onClick={() => go("customerDone")}>APPROVED</button>
                <button onClick={() => go("customerDeclined")}>DECLINED</button>
                <button onClick={() => go("customerInsufficient")}>
                  NOT ENOUGH MONEY
                </button>
                <button onClick={() => go("customerWalletNotFound")}>
                  WALLET NOT FOUND
                </button>
              </div>
            )}
            <button className="back-link" onClick={() => go("home")}>
              {lang === "en" ? "Cancel and go back" : "Khansela ubuyele emuva"}
            </button>
          </>
        )}
      </div>
    </main>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("language")
  const [lang, setLang] = useState<Lang>("en")
  const [paymentAmount, setPaymentAmount] = useState("0.00")
  const [profile, setProfile] = useState<Profile>({
    shopName: "",
    ownerName: "",
    email: "",
    walletAddress: "$ilp.interledger-test.dev/spazapay",
  })
  const go = (next: Screen) => {
    setScreen(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
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
        finish={(savedProfile) => {
          setProfile(savedProfile)
          go("success")
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
        confirm={(amount) => {
          setPaymentAmount(amount)
          go("waiting")
        }}
      />
    )
  if (screen === "waiting")
    return (
      <WaitingScreen
        lang={lang}
        setLang={setLang}
        go={go}
        amount={paymentAmount}
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
      />
    )
  if (screen === "dashboard")
    return <Dashboard lang={lang} setLang={setLang} go={go} />
  if (screen === "history")
    return <HistoryScreen lang={lang} setLang={setLang} go={go} />
  if (screen === "detail")
    return <DetailScreen lang={lang} setLang={setLang} go={go} />
  if (screen === "settings")
    return (
      <SettingsScreen
        lang={lang}
        setLang={setLang}
        go={go}
        profile={profile}
        saveWallet={(walletAddress) =>
          setProfile((current) => ({ ...current, walletAddress }))
        }
        logout={() => {
          setProfile({
            shopName: "",
            ownerName: "",
            email: "",
            walletAddress: "$ilp.interledger-test.dev/spazapay",
          })
          go("language")
        }}
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
