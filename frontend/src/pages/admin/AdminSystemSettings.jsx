import AdminSidebar from '../../components/sidebar/AdminSidebar'
import { useEffect, useState } from 'react'

import {
    Bell,
    CircleHelp,
    Search,
    SlidersHorizontal,
    Shield,
    BellRing,
    DatabaseBackup,
    Workflow,
    Info,
    FileClock,
    Wrench,
    AlertTriangle,
    RotateCcw,
    Trash2,
    Download,
    RefreshCcw,
    ChevronDown,
    Save,
} from 'lucide-react'


// =========================================================
// Reusable Toggle component
// =========================================================
const Toggle = ({ enabled, onClick }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? "bg-blue-600" : "bg-gray-300"
                }`}
            aria-pressed={enabled}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? "translate-x-6" : "translate-x-1"
                    }`}
            />
        </button>
    );
};


const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
).replace(/\/$/, '')

const initialSettings = {
    general: {
        systemName: 'BizFlow BPA',
        organizationName: 'Kinetic Global Corp',
        organizationEmail: 'admin@bizflow.com',
        supportContact: '+1 (800) 555-0199',
        language: 'English (United States)',
        timeZone: '(GMT-05:00) Eastern Time',
        dateFormat: 'MM/DD/YYYY',
        currency: 'USD ($)',
    },
    security: {
        twoFA: true,
        passwordExpiryDays: 60,
        minPasswordLength: 12,
        maxLoginAttempts: 5,
        sessionTimeoutMinutes: 60,
    },
    notifications: {
        email: true,
        inApp: true,
        inventory: false,
        deadline: true,
        maintenance: true,
    },
    automation: {
        global: true,
        taskAssignment: true,
        approvals: true,
        inventory: false,
        sales: true,
    },
    maintenance: {
        maintenanceMode: false,
        scheduledWindow: '',
        maintenanceNotice: '',
    },
}



function AdminSystemSettings() {

    // =========================================================
    // TOGGLE STATES
    // =========================================================

    const [settings, setSettings] = useState(initialSettings)
    const [savedSettings, setSavedSettings] = useState(initialSettings)
    const [settingsLoading, setSettingsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [settingsMessage, setSettingsMessage] = useState(null)
    const [settingsLoadFailed, setSettingsLoadFailed] = useState(false)

    // Update one field without changing the other settings.
    const updateSetting = (section, field, value) => {
        setSettings((previous) => ({
            ...previous,
            [section]: {
                ...previous[section],
                [field]: value,
            },
        }))
    }

    // Restore the last successfully loaded or saved settings.
    const handleCancel = () => {
        setSettings(savedSettings)
        setSettingsMessage(null)
    }



    const handleSaveChanges = async () => {
        if (isSaving || settingsLoading) return

        setIsSaving(true)
        setSettingsMessage(null)

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/system-settings`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(settings),
                }
            )

            const data = await response.json()

            if (!response.ok || !data.success || !data.settings) {
                throw new Error(
                    data.message || 'Failed to save system settings.'
                )
            }

            const saved = data.settings

            const confirmedSettings = {
                general: {
                    ...initialSettings.general,
                    ...(saved.general || {}),
                },
                security: {
                    ...initialSettings.security,
                    ...(saved.security || {}),
                },
                notifications: {
                    ...initialSettings.notifications,
                    ...(saved.notifications || {}),
                },
                automation: {
                    ...initialSettings.automation,
                    ...(saved.automation || {}),
                },
                maintenance: {
                    ...initialSettings.maintenance,
                    ...(saved.maintenance || {}),
                },
            }

            setSettings(confirmedSettings)
            setSavedSettings(confirmedSettings)
            setSettingsMessage({
                type: 'success',
                text: 'System settings saved successfully.',
            })
        } catch (error) {
            console.error('Failed to save system settings:', error)

            setSettingsMessage({
                type: 'error',
                text: error.message || 'Unable to save system settings.',
            })
        } finally {
            setIsSaving(false)
        }
    }




    useEffect(() => {
        const controller = new AbortController()

        const loadSettings = async () => {
            setSettingsLoading(true)
            setSettingsLoadFailed(false)
            setSettingsMessage(null)


            try {
                const response = await fetch(
                    `${API_BASE_URL}/api/system-settings`,
                    { signal: controller.signal }
                )

                const data = await response.json()

                if (!response.ok || !data.success || !data.settings) {
                    throw new Error(
                        data.message || 'Unable to load system settings.'
                    )
                }

                const saved = data.settings

                // Merge with defaults so missing fields don't break the UI.
                const loadedSettings = {
                    general: {
                        ...initialSettings.general,
                        ...(saved.general || {}),
                    },
                    security: {
                        ...initialSettings.security,
                        ...(saved.security || {}),
                    },
                    notifications: {
                        ...initialSettings.notifications,
                        ...(saved.notifications || {}),
                    },
                    automation: {
                        ...initialSettings.automation,
                        ...(saved.automation || {}),
                    },
                    maintenance: {
                        ...initialSettings.maintenance,
                        ...(saved.maintenance || {}),
                    },
                }

                setSettings(loadedSettings)
                setSavedSettings(loadedSettings)
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Failed to load system settings:', error)

                    setSettingsLoadFailed(true)

                    setSettingsMessage({
                        type: 'error',
                        text: error.message || 'Unable to load system settings.',
                    })
                }
            } finally {
                if (!controller.signal.aborted) {
                    setSettingsLoading(false)
                }
            }
        }

        loadSettings()

        return () => controller.abort()
    }, [])


    



    // =========================================================
    // RENDER
    // =========================================================

    return (
        <main className="h-screen w-full overflow-hidden bg-[#FBFCFE] text-[#171B25]">

            <div className="flex h-screen w-full overflow-hidden">


                {/* =====================================================
                    SIDEBAR
                ====================================================== */}

                <AdminSidebar />


                {/* =====================================================
                    RIGHT SIDE
                ====================================================== */}

                <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">


                    {/* =================================================
                        HEADER
                    ================================================== */}

                    <header
                        className="
                            sticky
                            top-0
                            z-20
                            flex
                            h-16
                            shrink-0
                            items-center
                            justify-between
                            border-b
                            border-[#E1E4EA]
                            bg-white
                            px-6
                            lg:px-8
                        "
                    >

                        {/* Search */}

                        <div className="relative w-72">

                            <Search
                                size={16}
                                strokeWidth={1.8}
                                className="
                                    pointer-events-none
                                    absolute
                                    left-3
                                    top-1/2
                                    -translate-y-1/2
                                    text-[#7D8491]
                                "
                            />

                            <input
                                type="text"
                                placeholder="Search users, reports, settings..."
                                className="
                                    h-9
                                    w-full
                                    rounded-md
                                    border
                                    border-transparent
                                    bg-[#F1F3FA]
                                    pl-10
                                    pr-4
                                    text-xs
                                    text-[#343A47]
                                    outline-none
                                    transition
                                    placeholder:text-[#8B919D]
                                    focus:border-[#D4DCF0]
                                    focus:bg-white
                                "
                            />

                        </div>


                        {/* Header Right */}

                        <div className="flex items-center gap-5">

                            <button
                                type="button"
                                aria-label="Notifications"
                                className="text-[#59606E] transition hover:text-[#0757C9]"
                            >
                                <Bell
                                    size={18}
                                    strokeWidth={1.7}
                                />
                            </button>


                            <button
                                type="button"
                                aria-label="Help"
                                className="text-[#59606E] transition hover:text-[#0757C9]"
                            >
                                <CircleHelp
                                    size={18}
                                    strokeWidth={1.7}
                                />
                            </button>


                            <div className="h-7 w-px bg-[#E1E4EA]" />


                            <div className="flex items-center gap-3">

                                <div className="text-right">

                                    <p className="text-xs font-semibold text-[#242936]">
                                        Admin User
                                    </p>

                                    <p className="text-[9px] font-medium tracking-wide text-[#737A87]">
                                        SYSTEM ADMIN
                                    </p>

                                </div>


                                <div
                                    className="
                                        flex
                                        h-9
                                        w-9
                                        items-center
                                        justify-center
                                        rounded-full
                                        bg-[#DDE5F5]
                                        text-xs
                                        font-semibold
                                        text-[#315A9E]
                                    "
                                >
                                    AU
                                </div>

                            </div>

                        </div>

                    </header>


                    {/* =================================================
                        SCROLLABLE CONTENT
                    ================================================== */}

                    <div
                        className="
                            min-h-0
                            flex-1
                            overflow-x-hidden
                            overflow-y-auto
                        "
                    >

                        <div className="px-6 py-7 lg:px-8">


                            {/* =================================================
                                PAGE HEADER
                            ================================================== */}

                            <div className="flex items-start justify-between">

                                <div>

                                    <div className="flex items-center gap-2 text-xs">

                                        <span className="text-[#343A47]">
                                            Home
                                        </span>

                                        <span className="text-[#A1A6B0]">
                                            /
                                        </span>

                                        <span className="font-medium text-[#0757C9]">
                                            Settings
                                        </span>

                                    </div>


                                    <h2
                                        className="
                                            mt-2
                                            text-2xl
                                            font-bold
                                            tracking-tight
                                            text-[#171B25]
                                        "
                                    >
                                        System Settings
                                    </h2>


                                    <p className="mt-1 text-sm text-[#69707D]">
                                        Configure global platform settings,
                                        security, notifications, and system
                                        preferences.
                                    </p>

                                </div>


                                {/* Header Buttons */}

                                <div className="flex items-center gap-2 pt-7">

                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        disabled={isSaving || settingsLoading}
                                        className="
                                            rounded-md
                                            border
                                            border-[#D3D8E2]
                                            bg-white
                                            px-5
                                            py-2
                                            text-xs
                                            font-medium
                                            text-[#343A47]
                                            transition
                                            hover:bg-[#F7F8FB]
                                        "
                                    >
                                        Cancel
                                    </button>


                                    <button
                                        type="button"
                                        onClick={handleSaveChanges}
                                        disabled={isSaving || settingsLoading || settingsLoadFailed}
                                        className="
                                            flex
                                            items-center
                                            gap-2
                                            rounded-md
                                            bg-[#0757C9]
                                            px-5
                                            py-2
                                            text-xs
                                            font-medium
                                            text-white
                                            shadow-sm
                                            transition
                                            hover:bg-[#0045AD]
                                        "
                                    >
                                        <Save
                                            size={14}
                                            strokeWidth={2}
                                        />

                                        {settingsLoading
                                            ? 'Loading Settings...'
                                            : isSaving
                                                ? 'Saving...'
                                                : 'Save Changes'}
                                    </button>

                                </div>

                            </div>


                            {settingsMessage && (
                                <div
                                    role="status"
                                    aria-live="polite"
                                    className={`mt-4 rounded-lg border px-4 py-3 text-sm ${settingsMessage.type === 'success'
                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                            : 'border-red-200 bg-red-50 text-red-700'
                                        }`}
                                >
                                    {settingsMessage.text}
                                </div>
                            )}

                            {settingsLoading && (
                                <p className="mt-4 text-xs text-[#69707D]" role="status">
                                    Loading system settings from MongoDB...
                                </p>
                            )}



                            {/* =================================================
                                SETTINGS GRID
                            ================================================== */}

                            <div className="mt-7 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">


                                {/* =================================================
                                    GENERAL SETTINGS
                                ================================================== */}

                                <section
                                    className="
                                        rounded-lg
                                        border
                                        border-[#D9DEE9]
                                        bg-white
                                        p-5
                                        shadow-[0_2px_8px_rgba(15,23,42,0.03)]
                                    "
                                >

                                    <div className="flex items-center gap-3">

                                        <span
                                            className="
                                                flex
                                                h-8
                                                w-8
                                                items-center
                                                justify-center
                                                rounded-md
                                                bg-[#EAF1FF]
                                                text-[#0757C9]
                                            "
                                        >
                                            <SlidersHorizontal
                                                size={17}
                                                strokeWidth={1.8}
                                            />
                                        </span>

                                        <h3 className="text-sm font-semibold text-[#242936]">
                                            General Settings
                                        </h3>

                                    </div>


                                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">


                                        {/* System Name */}

                                        <div>

                                            <label className="mb-2 block text-[10px] font-semibold text-[#454B58]">
                                                System Name
                                            </label>

                                            <input
                                                type="text"
                                                value={settings.general.systemName}
                                                onChange={(event) =>
                                                    updateSetting('general', 'systemName', event.target.value)
                                                }
                                                className="
                                                    h-9
                                                    w-full
                                                    rounded-md
                                                    border
                                                    border-[#CDD3E0]
                                                    bg-[#F8F9FD]
                                                    px-3
                                                    text-xs
                                                    text-[#343A47]
                                                    outline-none
                                                    focus:border-[#0757C9]
                                                "
                                            />

                                        </div>


                                        {/* Organization Name */}

                                        <div>

                                            <label className="mb-2 block text-[10px] font-semibold text-[#454B58]">
                                                Organization Name
                                            </label>

                                            <input
                                                type="text"
                                                value={settings.general.organizationName}
                                                onChange={(event) =>
                                                    updateSetting('general', 'organizationName', event.target.value)
                                                }
                                                defaultValue="Kinetic Global Corp"
                                                className="
                                                    h-9
                                                    w-full
                                                    rounded-md
                                                    border
                                                    border-[#CDD3E0]
                                                    bg-[#F8F9FD]
                                                    px-3
                                                    text-xs
                                                    text-[#343A47]
                                                    outline-none
                                                    focus:border-[#0757C9]
                                                "
                                            />

                                        </div>


                                        {/* Organization Email */}

                                        <div>

                                            <label className="mb-2 block text-[10px] font-semibold text-[#454B58]">
                                                Organization Email
                                            </label>

                                            <input
                                                type="email"
                                                value={settings.general.organizationEmail}
                                                onChange={(event) =>
                                                    updateSetting('general', 'organizationEmail', event.target.value)
                                                }
                                                defaultValue="admin@bizflow.com"
                                                className="
                                                    h-9
                                                    w-full
                                                    rounded-md
                                                    border
                                                    border-[#CDD3E0]
                                                    bg-[#F8F9FD]
                                                    px-3
                                                    text-xs
                                                    text-[#343A47]
                                                    outline-none
                                                    focus:border-[#0757C9]
                                                "
                                            />

                                        </div>


                                        {/* Support Contact */}

                                        <div>

                                            <label className="mb-2 block text-[10px] font-semibold text-[#454B58]">
                                                Support Contact
                                            </label>

                                            <input
                                                type="text"
                                                value={settings.general.supportContact}
                                                onChange={(event) =>
                                                    updateSetting('general', 'supportContact', event.target.value)
                                                }
                                                defaultValue="+1 (800) 555-0199"
                                                className="
                                                    h-9
                                                    w-full
                                                    rounded-md
                                                    border
                                                    border-[#CDD3E0]
                                                    bg-[#F8F9FD]
                                                    px-3
                                                    text-xs
                                                    text-[#343A47]
                                                    outline-none
                                                    focus:border-[#0757C9]
                                                "
                                            />

                                        </div>


                                        {/* Default Language */}

                                        <div>

                                            <label className="mb-2 block text-[10px] font-semibold text-[#454B58]">
                                                Default Language
                                            </label>

                                            <div className="relative">

                                                <select
                                                    defaultValue="English (United States)"
                                                    value={settings.general.language}
                                                    onChange={(event) =>
                                                        updateSetting('general', 'language', event.target.value)
                                                    }
                                                    className="
                                                        h-9
                                                        w-full
                                                        appearance-none
                                                        rounded-md
                                                        border
                                                        border-[#CDD3E0]
                                                        bg-[#F8F9FD]
                                                        px-3
                                                        pr-9
                                                        text-xs
                                                        text-[#343A47]
                                                        outline-none
                                                        focus:border-[#0757C9]
                                                    "
                                                >
                                                    <option>
                                                        English (United States)
                                                    </option>

                                                    <option>
                                                        English (United Kingdom)
                                                    </option>

                                                    <option>
                                                        Sinhala
                                                    </option>

                                                    <option>
                                                        Tamil
                                                    </option>
                                                </select>

                                                <ChevronDown
                                                    size={14}
                                                    className="
                                                        pointer-events-none
                                                        absolute
                                                        right-3
                                                        top-1/2
                                                        -translate-y-1/2
                                                        text-[#69707D]
                                                    "
                                                />

                                            </div>

                                        </div>


                                        {/* Time Zone */}

                                        <div>

                                            <label className="mb-2 block text-[10px] font-semibold text-[#454B58]">
                                                Time Zone
                                            </label>

                                            <div className="relative">

                                                <select
                                                    defaultValue="(GMT-05:00) Eastern Time"
                                                    value={settings.general.timeZone}
                                                    onChange={(event) =>
                                                        updateSetting('general', 'timeZone', event.target.value)
                                                    }

                                                    className="
                                                        h-9
                                                        w-full
                                                        appearance-none
                                                        rounded-md
                                                        border
                                                        border-[#CDD3E0]
                                                        bg-[#F8F9FD]
                                                        px-3
                                                        pr-9
                                                        text-xs
                                                        text-[#343A47]
                                                        outline-none
                                                        focus:border-[#0757C9]
                                                    "
                                                >
                                                    <option>
                                                        (GMT-05:00) Eastern Time
                                                    </option>

                                                    <option>
                                                        (GMT+05:30) Sri Lanka
                                                    </option>

                                                    <option>
                                                        (GMT+00:00) UTC
                                                    </option>
                                                </select>

                                                <ChevronDown
                                                    size={14}
                                                    className="
                                                        pointer-events-none
                                                        absolute
                                                        right-3
                                                        top-1/2
                                                        -translate-y-1/2
                                                        text-[#69707D]
                                                    "
                                                />

                                            </div>

                                        </div>


                                        {/* Date Format */}

                                        <div>

                                            <label className="mb-2 block text-[10px] font-semibold text-[#454B58]">
                                                Date Format
                                            </label>

                                            <div className="relative">

                                                <select
                                                    defaultValue="MM/DD/YYYY"
                                                    value={settings.general.dateFormat}
                                                    onChange={(event) =>
                                                        updateSetting('general', 'dateFormat', event.target.value)
                                                    }
                                                    className="
                                                        h-9
                                                        w-full
                                                        appearance-none
                                                        rounded-md
                                                        border
                                                        border-[#CDD3E0]
                                                        bg-[#F8F9FD]
                                                        px-3
                                                        pr-9
                                                        text-xs
                                                        text-[#343A47]
                                                        outline-none
                                                        focus:border-[#0757C9]
                                                    "
                                                >
                                                    <option>
                                                        MM/DD/YYYY
                                                    </option>

                                                    <option>
                                                        DD/MM/YYYY
                                                    </option>

                                                    <option>
                                                        YYYY-MM-DD
                                                    </option>
                                                </select>

                                                <ChevronDown
                                                    size={14}
                                                    className="
                                                        pointer-events-none
                                                        absolute
                                                        right-3
                                                        top-1/2
                                                        -translate-y-1/2
                                                        text-[#69707D]
                                                    "
                                                />

                                            </div>

                                        </div>


                                        {/* Currency */}

                                        <div>

                                            <label className="mb-2 block text-[10px] font-semibold text-[#454B58]">
                                                Currency Format
                                            </label>

                                            <div className="relative">

                                                <select
                                                    defaultValue="USD ($)"
                                                    value={settings.general.currency}
                                                    onChange={(event) =>
                                                        updateSetting('general', 'currency', event.target.value)
                                                    }
                                                    className="
                                                        h-9
                                                        w-full
                                                        appearance-none
                                                        rounded-md
                                                        border
                                                        border-[#CDD3E0]
                                                        bg-[#F8F9FD]
                                                        px-3
                                                        pr-9
                                                        text-xs
                                                        text-[#343A47]
                                                        outline-none
                                                        focus:border-[#0757C9]
                                                    "
                                                >
                                                    <option>
                                                        USD ($)
                                                    </option>

                                                    <option>
                                                        LKR (Rs.)
                                                    </option>

                                                    <option>
                                                        GBP (£)
                                                    </option>

                                                    <option>
                                                        EUR (€)
                                                    </option>
                                                </select>

                                                <ChevronDown
                                                    size={14}
                                                    className="
                                                        pointer-events-none
                                                        absolute
                                                        right-3
                                                        top-1/2
                                                        -translate-y-1/2
                                                        text-[#69707D]
                                                    "
                                                />

                                            </div>

                                        </div>

                                    </div>

                                </section>


                                {/* =================================================
                                    SECURITY
                                ================================================== */}

                                <section
                                    className="
                                        rounded-lg
                                        border
                                        border-[#D9DEE9]
                                        bg-white
                                        p-5
                                        shadow-[0_2px_8px_rgba(15,23,42,0.03)]
                                    "
                                >

                                    <div className="flex items-center gap-3">

                                        <span
                                            className="
                                                flex
                                                h-8
                                                w-8
                                                items-center
                                                justify-center
                                                rounded-md
                                                bg-[#FDEBEC]
                                                text-[#C81E1E]
                                            "
                                        >
                                            <Shield
                                                size={17}
                                                strokeWidth={1.8}
                                            />
                                        </span>

                                        <h3 className="text-sm font-semibold text-[#242936]">
                                            Security
                                        </h3>

                                    </div>


                                    {/* 2FA */}

                                    <div className="mt-6 flex items-center justify-between">

                                        <div>

                                            <p className="text-xs font-semibold text-[#343A47]">
                                                Enable 2FA
                                            </p>

                                            <p className="mt-1 text-[10px] text-[#747B88]">
                                                Require mobile authenticator
                                            </p>

                                        </div>

                                        <Toggle
                                            enabled={settings.security.twoFA}
                                            onClick={() =>
                                                updateSetting('security', 'twoFA', !settings.security.twoFA)
                                            }
                                        />

                                    </div>


                                    {/* Password Expiry */}

                                    <div className="mt-6">

                                        <p className="text-[10px] font-semibold text-[#454B58]">
                                            Password Expiry Policy
                                        </p>

                                        <div className="mt-2 flex gap-2">

                                            {['30 Days', '60 Days', '90 Days'].map((item) => {
                                                const days = Number.parseInt(item, 10)
                                                const selected = settings.security.passwordExpiryDays === days

                                                return (
                                                    <button
                                                        key={item}
                                                        type="button"
                                                        onClick={() =>
                                                            updateSetting('security', 'passwordExpiryDays', days)
                                                        }
                                                        className={`rounded-md border px-3 py-2 text-[10px] font-semibold ${selected
                                                                ? 'border-[#0757C9] bg-[#F2F6FF] text-[#0757C9]'
                                                                : 'border-[#CDD3E0] bg-white text-[#454B58]'
                                                            }`}
                                                    >
                                                        {item}
                                                    </button>
                                                )
                                            })}

                                        </div>

                                    </div>


                                    {/* Min / Max */}

                                    <div className="mt-6 grid grid-cols-2 gap-3">

                                        <div>

                                            <label className="mb-2 block text-[10px] font-semibold text-[#454B58]">
                                                Min Length
                                            </label>

                                            <input
                                                type="number"
                                                value={settings.security.minPasswordLength}
                                                min={8}
                                                max={128}
                                                onChange={(event) =>
                                                    updateSetting(
                                                        'security',
                                                        'minPasswordLength',
                                                        event.target.value === '' ? '' : Number(event.target.value)
                                                    )
                                                }
                                                defaultValue="12"
                                                className="
                                                    h-9
                                                    w-full
                                                    rounded-md
                                                    border
                                                    border-[#CDD3E0]
                                                    bg-[#F8F9FD]
                                                    px-3
                                                    text-xs
                                                    text-[#343A47]
                                                    outline-none
                                                "
                                            />

                                        </div>


                                        <div>

                                            <label className="mb-2 block text-[10px] font-semibold text-[#454B58]">
                                                Max Attempts
                                            </label>

                                            <input
                                                type="number"
                                                value={settings.security.maxLoginAttempts}
                                                min={1}
                                                max={20}
                                                onChange={(event) =>
                                                    updateSetting(
                                                        'security',
                                                        'maxLoginAttempts',
                                                        event.target.value === '' ? '' : Number(event.target.value)
                                                    )
                                                }
                                                defaultValue="5"
                                                className="
                                                    h-9
                                                    w-full
                                                    rounded-md
                                                    border
                                                    border-[#CDD3E0]
                                                    bg-[#F8F9FD]
                                                    px-3
                                                    text-xs
                                                    text-[#343A47]
                                                    outline-none
                                                "
                                            />

                                        </div>

                                    </div>


                                    {/* Session Timeout */}


                                    <div className="mt-6">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-semibold text-[#454B58]">
                                                Session Timeout (min)
                                            </p>

                                            <span className="text-[9px] font-semibold text-[#0757C9]">
                                                {settings.security.sessionTimeoutMinutes}m
                                            </span>
                                        </div>

                                        <input
                                            type="range"
                                            min="15"
                                            max="120"
                                            step="15"
                                            value={settings.security.sessionTimeoutMinutes}
                                            onChange={(event) =>
                                                updateSetting(
                                                    'security',
                                                    'sessionTimeoutMinutes',
                                                    Number(event.target.value)
                                                )
                                            }
                                            aria-label="Session timeout in minutes"
                                            className="mt-3 w-full cursor-pointer accent-[#0757C9]"
                                        />

                                        <div className="mt-2 flex justify-between text-[9px] text-[#59606E]">
                                            <span>15m</span>
                                            <span>60m</span>
                                            <span>120m</span>
                                        </div>
                                    </div>


                                </section>


                            </div>


                            {/* =================================================
                                SECOND ROW
                            ================================================== */}

                            <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">


                                {/* =================================================
                                    NOTIFICATIONS
                                ================================================== */}

                                <section
                                    className="
                                        rounded-lg
                                        border
                                        border-[#D9DEE9]
                                        bg-white
                                        p-5
                                    "
                                >

                                    <div className="flex items-center gap-3">

                                        <span
                                            className="
                                                flex
                                                h-8
                                                w-8
                                                items-center
                                                justify-center
                                                rounded-md
                                                bg-[#EEF2FA]
                                                text-[#315A9E]
                                            "
                                        >
                                            <BellRing
                                                size={17}
                                                strokeWidth={1.8}
                                            />
                                        </span>

                                        <h3 className="text-sm font-semibold text-[#242936]">
                                            Notifications
                                        </h3>

                                    </div>


                                    <div className="mt-6 space-y-5">

                                        {[
                                            ['email', 'Email Notifications'],
                                            ['inApp', 'In-App Alerts'],
                                            ['inventory', 'Low Inventory Alerts'],
                                            ['deadline', 'Task Deadline Reminders'],
                                            ['maintenance', 'System Maintenance'],
                                        ].map(([key, label]) => (

                                            <div
                                                key={key}
                                                className="flex items-center justify-between"
                                            >

                                                <span className="text-xs text-[#343A47]">
                                                    {label}
                                                </span>

                                                <Toggle
                                                    enabled={settings.notifications[key]}
                                                    onClick={() =>
                                                        updateSetting('notifications', key, !settings.notifications[key])
                                                    }
                                                />

                                            </div>

                                        ))}

                                    </div>

                                </section>


                                {/* =================================================
                                    BACKUP & RECOVERY
                                ================================================== */}

                                <section
                                    className="
                                        rounded-lg
                                        border
                                        border-[#D9DEE9]
                                        bg-white
                                        p-5
                                    "
                                >

                                    <div className="flex items-center gap-3">

                                        <span
                                            className="
                                                flex
                                                h-8
                                                w-8
                                                items-center
                                                justify-center
                                                rounded-md
                                                bg-[#EAF1FF]
                                                text-[#0757C9]
                                            "
                                        >
                                            <DatabaseBackup
                                                size={17}
                                                strokeWidth={1.8}
                                            />
                                        </span>

                                        <h3 className="text-sm font-semibold text-[#242936]">
                                            Backup & Recovery
                                        </h3>

                                    </div>


                                    <div className="mt-5 rounded-md bg-[#F2F3FB] p-3">

                                        <div className="flex items-center justify-between">

                                            <span className="text-[9px] font-semibold uppercase tracking-wide text-[#59606E]">
                                                Status
                                            </span>

                                            <span className="rounded-full bg-[#D8F8E6] px-2 py-1 text-[9px] font-semibold text-[#159447]">
                                                Healthy
                                            </span>

                                        </div>


                                        <div className="mt-2 flex justify-between">

                                            <span className="text-[10px] text-[#59606E]">
                                                Last Backup:
                                            </span>

                                            <span className="text-[10px] font-semibold text-[#343A47]">
                                                Oct 24, 02:30 AM
                                            </span>

                                        </div>


                                        <div className="mt-2 flex justify-between">

                                            <span className="text-[10px] text-[#59606E]">
                                                Location:
                                            </span>

                                            <span className="text-[10px] font-semibold text-[#343A47]">
                                                Cloud AWS (US-East)
                                            </span>

                                        </div>

                                    </div>


                                    <div className="mt-4 grid grid-cols-2 gap-3">

                                        <button
                                            type="button"
                                            className="
                                                rounded-md
                                                bg-[#0757C9]
                                                px-3
                                                py-2
                                                text-[10px]
                                                font-semibold
                                                text-white
                                            "
                                        >
                                            Create Now
                                        </button>

                                        <button
                                            type="button"
                                            className="
                                                rounded-md
                                                border
                                                border-[#0757C9]
                                                bg-white
                                                px-3
                                                py-2
                                                text-[10px]
                                                font-semibold
                                                text-[#0757C9]
                                            "
                                        >
                                            Schedule
                                        </button>


                                        <button
                                            type="button"
                                            className="
                                                flex
                                                items-center
                                                justify-center
                                                gap-1
                                                rounded-md
                                                border
                                                border-[#CDD3E0]
                                                px-3
                                                py-2
                                                text-[10px]
                                                font-semibold
                                                text-[#454B58]
                                            "
                                        >
                                            <Download size={12} />
                                            Download
                                        </button>


                                        <button
                                            type="button"
                                            className="
                                                flex
                                                items-center
                                                justify-center
                                                gap-1
                                                rounded-md
                                                border
                                                border-[#CDD3E0]
                                                px-3
                                                py-2
                                                text-[10px]
                                                font-semibold
                                                text-[#454B58]
                                            "
                                        >
                                            <RefreshCcw size={12} />
                                            Restore
                                        </button>

                                    </div>

                                </section>


                                {/* =================================================
                                    WORKFLOW AUTOMATION
                                ================================================== */}

                                <section
                                    className="
                                        rounded-lg
                                        border
                                        border-[#D9DEE9]
                                        bg-white
                                        p-5
                                    "
                                >

                                    <div className="flex items-center gap-3">

                                        <span
                                            className="
                                                flex
                                                h-8
                                                w-8
                                                items-center
                                                justify-center
                                                rounded-md
                                                bg-[#FFF0E7]
                                                text-[#A84308]
                                            "
                                        >
                                            <Workflow
                                                size={17}
                                                strokeWidth={1.8}
                                            />
                                        </span>

                                        <h3 className="text-sm font-semibold text-[#242936]">
                                            Workflow Automation
                                        </h3>

                                    </div>


                                    <div className="mt-6 space-y-5">

                                        {[
                                            ['global', 'Global Automation'],
                                            ['taskAssignment', 'Auto Task Assignment'],
                                            ['approvals', 'Email Approvals'],
                                            ['inventory', 'Inventory Reorder'],
                                            ['sales', 'Sales Confirmation'],
                                        ].map(([key, label]) => (

                                            <div
                                                key={key}
                                                className="flex items-center justify-between"
                                            >

                                                <span className="text-xs text-[#343A47]">
                                                    {label}
                                                </span>

                                                <div className="text-[#A84308]">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateSetting('automation', key, !settings.automation[key])
                                                        }
                                                        className={`
                                                            relative
                                                            h-5
                                                            w-9
                                                            rounded-full
                                                            transition
                                                            ${settings.automation[key]
                                                                ? 'bg-[#A84308]'
                                                                : 'bg-[#DDE1EC]'
                                                            }
                                                        `}
                                                    >

                                                        <span
                                                            className={`
                                                                absolute
                                                                top-0.5
                                                                h-4
                                                                w-4
                                                                rounded-full
                                                                bg-white
                                                                shadow-sm
                                                                transition
                                                                ${settings.automation[key]
                                                                    ? 'left-4.5'
                                                                    : 'left-0.5'
                                                                }
                                                            `}
                                                        />

                                                    </button>

                                                </div>

                                            </div>

                                        ))}

                                    </div>

                                </section>

                            </div>


                            {/* =================================================
                                SYSTEM INFORMATION + AUDIT
                            ================================================== */}

                            <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">


                                {/* System Information */}

                                <section
                                    className="
                                        rounded-lg
                                        border
                                        border-[#D9DEE9]
                                        bg-white
                                        p-5
                                    "
                                >

                                    <div className="flex items-center gap-3">

                                        <span
                                            className="
                                                flex
                                                h-8
                                                w-8
                                                items-center
                                                justify-center
                                                rounded-md
                                                bg-[#F1F2F7]
                                                text-[#454B58]
                                            "
                                        >
                                            <Info
                                                size={17}
                                                strokeWidth={1.8}
                                            />
                                        </span>

                                        <h3 className="text-sm font-semibold text-[#242936]">
                                            System Information
                                        </h3>

                                    </div>


                                    <div className="mt-6 grid grid-cols-3 gap-6">

                                        <div>
                                            <p className="text-[9px] font-semibold uppercase text-[#59606E]">
                                                Version
                                            </p>

                                            <p className="mt-1 text-xs font-semibold text-[#343A47]">
                                                v2.4.0
                                            </p>
                                        </div>


                                        <div>
                                            <p className="text-[9px] font-semibold uppercase text-[#59606E]">
                                                Build
                                            </p>

                                            <p className="mt-1 text-xs font-semibold text-[#343A47]">
                                                #1024
                                            </p>
                                        </div>


                                        <div>
                                            <p className="text-[9px] font-semibold uppercase text-[#59606E]">
                                                DB Version
                                            </p>

                                            <p className="mt-1 text-xs font-semibold text-[#343A47]">
                                                v12.4
                                            </p>
                                        </div>


                                        <div>
                                            <p className="text-[9px] font-semibold uppercase text-[#59606E]">
                                                API Tier
                                            </p>

                                            <p className="mt-1 text-xs font-semibold text-[#343A47]">
                                                v3.1 Stable
                                            </p>
                                        </div>


                                        <div>
                                            <p className="text-[9px] font-semibold uppercase text-[#59606E]">
                                                Server Status
                                            </p>

                                            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-[#343A47]">
                                                <span className="h-1.5 w-1.5 rounded-full bg-[#18A957]" />
                                                Online
                                            </p>
                                        </div>


                                        <div>
                                            <p className="text-[9px] font-semibold uppercase text-[#59606E]">
                                                Hosting
                                            </p>

                                            <p className="mt-1 text-xs font-semibold text-[#343A47]">
                                                AWS - US East
                                            </p>
                                        </div>

                                    </div>

                                </section>


                                {/* Audit & Logging */}

                                <section
                                    className="
                                        rounded-lg
                                        border
                                        border-[#D9DEE9]
                                        bg-white
                                        p-5
                                    "
                                >

                                    <div className="flex items-center justify-between">

                                        <div className="flex items-center gap-3">

                                            <span
                                                className="
                                                    flex
                                                    h-8
                                                    w-8
                                                    items-center
                                                    justify-center
                                                    rounded-md
                                                    bg-[#EAF1FF]
                                                    text-[#0757C9]
                                                "
                                            >
                                                <FileClock
                                                    size={17}
                                                    strokeWidth={1.8}
                                                />
                                            </span>

                                            <h3 className="text-sm font-semibold text-[#242936]">
                                                Audit & Logging
                                            </h3>

                                        </div>


                                        <div className="text-right">

                                            <p className="text-[9px] font-semibold text-[#59606E]">
                                                Last Activity
                                            </p>

                                            <p className="text-[10px] font-semibold text-[#343A47]">
                                                2 mins ago
                                            </p>

                                        </div>

                                    </div>


                                    <div className="mt-5 flex items-center gap-6">

                                        <div>

                                            <p className="text-xl font-semibold text-[#0757C9]">
                                                12,450
                                            </p>

                                            <p className="text-[9px] text-[#59606E]">
                                                Total Log Entries
                                            </p>

                                        </div>


                                        <div className="h-10 w-px bg-[#D9DEE9]" />


                                        <div className="flex-1">

                                            <div className="h-1.5 overflow-hidden rounded-full bg-[#E7E9F2]">

                                                <div className="h-full w-3/4 rounded-full bg-[#0757C9]" />

                                            </div>

                                            <p className="mt-2 text-[9px] text-[#59606E]">
                                                Storage Utilization (8.2 GB / 12 GB)
                                            </p>

                                        </div>

                                    </div>


                                    <div className="mt-5 grid grid-cols-[1fr_auto_auto] gap-2">

                                        <button
                                            type="button"
                                            className="
                                                rounded-md
                                                border
                                                border-[#CDD3E0]
                                                px-3
                                                py-2
                                                text-[10px]
                                                font-semibold
                                                text-[#343A47]
                                            "
                                        >
                                            View Audit Logs
                                        </button>

                                        <button
                                            type="button"
                                            className="
                                                flex
                                                items-center
                                                gap-1
                                                rounded-md
                                                border
                                                border-[#CDD3E0]
                                                px-3
                                                py-2
                                                text-[10px]
                                                font-semibold
                                                text-[#454B58]
                                            "
                                        >
                                            <Download size={12} />
                                            Export
                                        </button>

                                        <button
                                            type="button"
                                            className="
                                                rounded-md
                                                border
                                                border-[#F2B5B5]
                                                px-3
                                                py-2
                                                text-[10px]
                                                font-semibold
                                                text-[#C81E1E]
                                            "
                                        >
                                            Clear
                                        </button>

                                    </div>

                                </section>

                            </div>


                            {/* =================================================
                                MAINTENANCE
                            ================================================== */}

                            <section
                                className="
                                    mt-5
                                    rounded-lg
                                    border
                                    border-[#D9DEE9]
                                    bg-white
                                    p-5
                                "
                            >

                                <div className="flex items-center gap-3">

                                    <span
                                        className="
                                            flex
                                            h-8
                                            w-8
                                            items-center
                                            justify-center
                                            rounded-md
                                            bg-[#FFF4E7]
                                            text-[#C65A00]
                                        "
                                    >
                                        <Wrench
                                            size={17}
                                            strokeWidth={1.8}
                                        />
                                    </span>

                                    <h3 className="text-sm font-semibold text-[#242936]">
                                        Maintenance
                                    </h3>

                                </div>


                                <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">


                                    {/* Maintenance Mode */}

                                    <div>

                                        <div className="rounded-md bg-[#F1F2FA] p-3">

                                            <div className="flex items-center justify-between">

                                                <div>

                                                    <p className="text-xs font-semibold text-[#343A47]">
                                                        Maintenance Mode
                                                    </p>

                                                    <p className="mt-1 text-[9px] text-[#59606E]">
                                                        Redirect users to landing page
                                                    </p>

                                                </div>


                                                <Toggle
                                                    enabled={settings.maintenance.maintenanceMode}
                                                    onClick={() =>
                                                        updateSetting(
                                                            'maintenance',
                                                            'maintenanceMode',
                                                            !settings.maintenance.maintenanceMode
                                                        )
                                                    }
                                                />

                                            </div>

                                        </div>


                                        <label className="mt-4 mb-2 block text-[10px] font-semibold text-[#454B58]">
                                            Scheduled Window
                                        </label>

                                        <input
                                            type="text"
                                            value={settings.maintenance.scheduledWindow}
                                            onChange={(event) =>
                                                updateSetting('maintenance', 'scheduledWindow', event.target.value)
                                            }
                                            placeholder="YYYY/MM/DD --:-- --"
                                            className="
                                                h-9
                                                w-full
                                                rounded-md
                                                border
                                                border-[#CDD3E0]
                                                bg-[#F8F9FD]
                                                px-3
                                                text-xs
                                                text-[#343A47]
                                                outline-none
                                            "
                                        />

                                    </div>


                                    {/* Maintenance Notice */}

                                    <div>

                                        <label className="mb-2 block text-[10px] font-semibold text-[#454B58]">
                                            Maintenance Notice (Publicly displayed)
                                        </label>

                                        <textarea
                                            value={settings.maintenance.maintenanceNotice}
                                            onChange={(event) =>
                                                updateSetting('maintenance', 'maintenanceNotice', event.target.value)
                                            }
                                            rows="4"
                                            placeholder="e.g. The system is currently undergoing scheduled maintenance to improve performance. We expect to be back online in 2 hours."
                                            className="
                                                w-full
                                                resize-none
                                                rounded-md
                                                border
                                                border-[#CDD3E0]
                                                bg-[#F8F9FD]
                                                p-3
                                                text-xs
                                                leading-5
                                                text-[#343A47]
                                                outline-none
                                                placeholder:text-[#858B97]
                                            "
                                        />

                                    </div>

                                </div>

                            </section>


                            {/* =================================================
                                DANGER ZONE
                            ================================================== */}

                            <section
                                className="
                                    mt-5
                                    rounded-lg
                                    border
                                    border-dashed
                                    border-[#F28B82]
                                    bg-[#FFFDFD]
                                    p-5
                                "
                            >

                                <div className="flex items-center gap-3">

                                    <span
                                        className="
                                            flex
                                            h-8
                                            w-8
                                            items-center
                                            justify-center
                                            rounded-md
                                            bg-[#FDE8E7]
                                            text-[#C81E1E]
                                        "
                                    >
                                        <AlertTriangle
                                            size={17}
                                            strokeWidth={1.8}
                                        />
                                    </span>

                                    <h3 className="text-sm font-semibold text-[#C81E1E]">
                                        Danger Zone
                                    </h3>

                                </div>


                                <div className="mt-5 flex flex-wrap gap-3">

                                    <button
                                        type="button"
                                        className="
                                            flex
                                            items-center
                                            gap-2
                                            rounded-md
                                            border
                                            border-[#E13A3A]
                                            px-4
                                            py-2
                                            text-[10px]
                                            font-semibold
                                            text-[#C81E1E]
                                            transition
                                            hover:bg-[#FFF3F3]
                                        "
                                    >
                                        <RotateCcw size={13} />
                                        Reset System Settings
                                    </button>


                                    <button
                                        type="button"
                                        className="
                                            flex
                                            items-center
                                            gap-2
                                            rounded-md
                                            border
                                            border-[#E13A3A]
                                            px-4
                                            py-2
                                            text-[10px]
                                            font-semibold
                                            text-[#C81E1E]
                                        "
                                    >
                                        <RefreshCcw size={13} />
                                        Clear Cache
                                    </button>


                                    <button
                                        type="button"
                                        className="
                                            flex
                                            items-center
                                            gap-2
                                            rounded-md
                                            border
                                            border-[#E13A3A]
                                            px-4
                                            py-2
                                            text-[10px]
                                            font-semibold
                                            text-[#C81E1E]
                                        "
                                    >
                                        <Trash2 size={13} />
                                        Delete Temp Files
                                    </button>


                                    <button
                                        type="button"
                                        className="
                                            flex
                                            items-center
                                            gap-2
                                            rounded-md
                                            bg-[#C81E1E]
                                            px-4
                                            py-2
                                            text-[10px]
                                            font-semibold
                                            text-white
                                            shadow-sm
                                            transition
                                            hover:bg-[#A91616]
                                        "
                                    >
                                        <RotateCcw size={13} />
                                        Restore Factory Settings
                                    </button>

                                </div>

                            </section>


                            {/* =================================================
                                FOOTER
                            ================================================== */}

                            <footer className="mt-8 border-t border-[#E1E4EA] py-5">

                                <div
                                    className="
                                        flex
                                        flex-col
                                        gap-3
                                        text-[10px]
                                        text-[#59606E]
                                        sm:flex-row
                                        sm:items-center
                                        sm:justify-between
                                    "
                                >

                                    <p>
                                        © 2026 BizFlow | Cloud-Based SaaS Platform
                                    </p>


                                    <div className="flex gap-5 text-[#343A47]">

                                        <button type="button">
                                            Privacy Policy
                                        </button>

                                        <button type="button">
                                            Terms of Service
                                        </button>

                                        <button type="button">
                                            Compliance
                                        </button>

                                    </div>

                                </div>

                            </footer>

                        </div>

                    </div>

                </div>

            </div>

        </main>
    )
}


export default AdminSystemSettings