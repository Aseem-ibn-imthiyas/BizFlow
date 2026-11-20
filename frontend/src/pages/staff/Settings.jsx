import { useEffect, useState } from 'react'

import {
    User,
    Pencil,
    CalendarDays,
    Mail,
    Phone,
    Clock3,
    Globe2,
    BellRing,
    Package,
    CheckCircle2,
    Save,
    RotateCcw,
    Share2,

    ChevronDown,
} from 'lucide-react'

import StaffSidebar from '../../components/sidebar/StaffSidebar'
import StaffHeader from '../../components/header/StaffHeader'
import api from '../../services/api'

function Settings() {

    /* ============================================================
       STATE & API MAPPING
    ============================================================ */

    const emptyForm = {
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        address: '',
        language: 'English (US)',
        timezone: 'Asia/Colombo',
        dateFormat: 'MMM DD, YYYY',
    }

    const emptyNotifications = {
        email: true,
        inApp: true,
        sales: false,
    }

    const [formData, setFormData] = useState(emptyForm)
    const [savedFormData, setSavedFormData] = useState(emptyForm)
    const [notifications, setNotifications] = useState(emptyNotifications)
    const [savedNotifications, setSavedNotifications] = useState(emptyNotifications)
    const [saved, setSaved] = useState(false)
    const [loadingProfile, setLoadingProfile] = useState(true)
    const [savingProfile, setSavingProfile] = useState(false)
    const [profileError, setProfileError] = useState('')
    const [saveError, setSaveError] = useState('')
    const [accountProfile, setAccountProfile] = useState(null)

    const formatDateOfBirth = (value) => {
        if (!value) return ''
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return ''
        const month = String(date.getUTCMonth() + 1).padStart(2, '0')
        const day = String(date.getUTCDate()).padStart(2, '0')
        return `${month}/${day}/${date.getUTCFullYear()}`
    }

    const formatJoinedDate = (value) => {
        if (!value) return 'Not available'
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return 'Not available'
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    }

    const parseDateOfBirth = (value) => {
        if (!value?.trim()) return null
        const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
        if (!match) throw new Error('Date of birth must use MM/DD/YYYY format.')
        const [, monthText, dayText, yearText] = match
        const month = Number(monthText)
        const day = Number(dayText)
        const year = Number(yearText)
        const date = new Date(Date.UTC(year, month - 1, day))
        if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
            throw new Error('Please enter a valid date of birth.')
        }
        if (date.getTime() > Date.now()) throw new Error('Date of birth cannot be in the future.')
        return date.toISOString()
    }

    const mapUserToSettings = (user = {}) => {
        const nameParts = (user.fullName || '').trim().split(/\s+/).filter(Boolean)
        return {
            form: {
                ...emptyForm,
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' '),
                username: user.username || '',
                email: user.email || '',
                phone: user.phone || '',
                dateOfBirth: formatDateOfBirth(user.dateOfBirth),
                address: user.address || '',
                language: user.preferences?.language || 'English (US)',
                timezone: user.preferences?.timezone || 'Asia/Colombo',
                dateFormat: user.preferences?.dateFormat || 'MMM DD, YYYY',
            },
            notifications: {
                email: user.notifications?.email ?? true,
                inApp: user.notifications?.inApp ?? true,
                sales: user.notifications?.sales ?? false,
            },
        }
    }

    useEffect(() => {
        let active = true
        const loadProfile = async () => {
            try {
                setLoadingProfile(true)
                setProfileError('')
                const response = await api.get('/users/me')
                const user = response?.data ?? response?.user ?? response
                const mapped = mapUserToSettings(user)
                if (!active) return
                setAccountProfile(user)
                setFormData(mapped.form)
                setSavedFormData(mapped.form)
                setNotifications(mapped.notifications)
                setSavedNotifications(mapped.notifications)
            } catch (error) {
                if (active) setProfileError(error.message || 'Failed to load your profile.')
            } finally {
                if (active) setLoadingProfile(false)
            }
        }
        loadProfile()
        return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    /* ============================================================
       HANDLERS
    ============================================================ */

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
        setSaved(false)
        setSaveError('')
    }

    const handleNotificationChange = (field) => {
        setNotifications((prev) => ({ ...prev, [field]: !prev[field] }))
        setSaved(false)
        setSaveError('')
    }

    const handleReset = () => {
        setFormData(savedFormData)
        setNotifications(savedNotifications)
        setSaved(false)
        setSaveError('')
    }

    const handleSave = async () => {
        try {
            setSavingProfile(true)
            setSaveError('')
            setSaved(false)
            const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim()
            if (!formData.firstName.trim() || !formData.lastName.trim()) {
                throw new Error('First name and last name are required.')
            }
            const payload = {
                fullName,
                username: formData.username.trim(),
                phone: formData.phone.trim(),
                dateOfBirth: parseDateOfBirth(formData.dateOfBirth),
                address: formData.address.trim(),
                preferences: {
                    language: formData.language,
                    timezone: formData.timezone,
                    dateFormat: formData.dateFormat,
                },
                notifications: {
                    email: notifications.email,
                    inApp: notifications.inApp,
                    sales: notifications.sales,
                },
            }
            const response = await api.patch('/users/me', payload)
            const user = response?.data ?? response?.user ?? response
            const mapped = mapUserToSettings(user)
            setAccountProfile(user)
            setFormData(mapped.form)
            setSavedFormData(mapped.form)
            setNotifications(mapped.notifications)
            setSavedNotifications(mapped.notifications)
            setSaved(true)
        } catch (error) {
            setSaveError(error.message || 'Failed to save your settings.')
        } finally {
            setSavingProfile(false)
        }
    }

    /* ============================================================
       REUSABLE INPUT
    ============================================================ */

    const inputClass = `
        mt-1
        h-9
        w-full
        rounded-md
        border
        border-[#E2E5EC]
        bg-[#F9FAFD]
        px-3
        text-[10px]
        text-[#343A47]
        outline-none
        transition
        placeholder:text-[#9AA0AA]
        focus:border-[#AFC4ED]
        focus:bg-white
        focus:ring-1
        focus:ring-[#DCE7FA]
    `

    const labelClass = `
        text-[9px]
        font-medium
        text-[#59606E]
    `

    return (
        <main className="h-screen w-full overflow-hidden bg-[#FBFCFE] text-[#171B25]">

            <div className="h-screen w-full">

                {/* =====================================================
                    FIXED SIDEBAR
                ====================================================== */}

                <aside
                    className="
                        fixed
                        inset-y-0
                        left-0
                        z-40
                        hidden
                        h-screen
                        w-60
                        overflow-hidden
                        lg:block
                        xl:w-64
                    "
                >
                    <StaffSidebar />
                </aside>

                {/* =====================================================
                    RIGHT SIDE
                ====================================================== */}

                <div
                    className="
                        flex
                        h-screen
                        min-w-0
                        flex-col
                        overflow-hidden
                        lg:ml-60
                        xl:ml-64
                    "
                >

                    {profileError && (
                        <div role="alert" className="mx-4 mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 lg:mx-6">
                            {profileError}
                        </div>
                    )}
                    {saveError && (
                        <div role="alert" className="mx-4 mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 lg:mx-6">
                            {saveError}
                        </div>
                    )}
                    {loadingProfile && (
                        <div role="status" className="mx-4 mt-3 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700 lg:mx-6">
                            Loading your account settings...
                        </div>
                    )}

                    {/* =================================================
                        HEADER
                    ================================================== */}

                    <div className="sticky top-0 z-30 shrink-0">
                        <StaffHeader />
                    </div>

                    {/* =================================================
                        SCROLLABLE MAIN CONTENT
                    ================================================== */}

                    <div
                        className="
                            min-h-0
                            flex-1
                            overflow-x-hidden
                            overflow-y-auto
                        "
                    >

                        <div className="px-4 py-6 sm:px-6 lg:px-8">

                            {/* =================================================
                                PAGE HEADER
                            ================================================== */}

                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">

                                <div>

                                    <div className="flex items-center gap-2 text-[9px]">

                                        <span className="text-[#59606E]">
                                            Home
                                        </span>

                                        <span className="text-[#A1A6B0]">
                                            /
                                        </span>

                                        <span className="font-medium text-[#0757C9]">
                                            My Profile
                                        </span>

                                    </div>

                                    <h1
                                        className="
                                            mt-2
                                            text-2xl
                                            font-bold
                                            tracking-tight
                                            text-[#171B25]
                                        "
                                    >
                                        My Profile
                                    </h1>

                                    <p className="mt-1 text-xs text-[#69707D]">
                                        View and manage your personal information,
                                        work details, and account preferences.
                                    </p>

                                </div>

                                <div className="flex items-center gap-2">

                                </div>

                            </div>

                            {/* =================================================
                                PROFILE SUMMARY
                            ================================================== */}

                            <section
                                className="
                                    mt-5
                                    rounded-lg
                                    border
                                    border-[#E6E8ED]
                                    bg-white
                                    p-4
                                    shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                    sm:p-5
                                "
                            >

                                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                                    <div className="flex items-center gap-4">

                                        {/* Profile Image */}

                                        <div className="relative shrink-0">

                                            <div
                                                className="
                                                    flex
                                                    h-16
                                                    w-16
                                                    items-center
                                                    justify-center
                                                    overflow-hidden
                                                    rounded-full
                                                    border
                                                    border-[#DDE3EF]
                                                    bg-[#E4EBFF]
                                                    text-xl
                                                    font-semibold
                                                    text-[#315A9E]
                                                    sm:h-20
                                                    sm:w-20
                                                "
                                            >
                                                <User
                                                    size={34}
                                                    strokeWidth={1.5}
                                                />
                                            </div>

                                            <button
                                                type="button"
                                                aria-label="Edit profile photo"
                                                className="
                                                    absolute
                                                    bottom-0
                                                    right-0
                                                    flex
                                                    h-6
                                                    w-6
                                                    items-center
                                                    justify-center
                                                    rounded-full
                                                    border-2
                                                    border-white
                                                    bg-[#0052CC]
                                                    text-white
                                                "
                                            >
                                                <Pencil size={10} />
                                            </button>

                                        </div>

                                        <div>

                                            <div className="flex flex-wrap items-center gap-2">

                                                <h2 className="text-sm font-bold text-[#242936]">
                                                    {accountProfile?.fullName || 'Your Name'}
                                                </h2>

                                                <span
                                                    className="
                                                        rounded
                                                        bg-[#EEF3FF]
                                                        px-2
                                                        py-1
                                                        text-[8px]
                                                        font-semibold
                                                        text-[#315A9E]
                                                    "
                                                >
                                                    {accountProfile?.role || 'Staff'}
                                                </span>

                                                <span
                                                    className={`
                                                        rounded
                                                        px-2
                                                        py-1
                                                        text-[8px]
                                                        font-semibold
                                                        ${accountProfile?.status === 'Active'
                                                            ? 'bg-emerald-50 text-emerald-600'
                                                            : accountProfile?.status === 'Suspended'
                                                                ? 'bg-red-50 text-red-600'
                                                                : 'bg-amber-50 text-amber-600'}
                                                    `}
                                                >
                                                    ● {accountProfile?.status || 'Unknown'}
                                                </span>

                                            </div>

                                            <p className="mt-1 text-[9px] text-[#7A808C]">
                                                {accountProfile?.email || 'Email not available'}
                                            </p>

                                        </div>

                                    </div>

                                    <div className="grid grid-cols-2 gap-5 sm:grid-cols-4 lg:min-w-155">

                                        <div>
                                            <p className="text-[8px] font-medium uppercase tracking-wide text-[#8B919D]">
                                                Department
                                            </p>
                                            <p className="mt-1 text-[10px] font-medium text-[#343A47]">
                                                {accountProfile?.department || 'Not assigned'}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[8px] font-medium uppercase tracking-wide text-[#8B919D]">
                                                Address
                                            </p>
                                            <p className="mt-1 text-[10px] font-medium text-[#343A47]">
                                                {accountProfile?.address || 'Not provided'}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-[8px] font-medium uppercase tracking-wide text-[#8B919D]">
                                                Joined Date
                                            </p>
                                            <p className="mt-1 text-[10px] font-medium text-[#343A47]">
                                                {formatJoinedDate(accountProfile?.createdAt)}
                                            </p>
                                        </div>

                                        <div className="flex items-end">

                                            <div className="flex gap-2">

                                                <button
                                                    type="button"
                                                    className="
                                                        flex
                                                        h-8
                                                        items-center
                                                        gap-1.5
                                                        rounded-md
                                                        border
                                                        border-[#DDE1E8]
                                                        bg-white
                                                        px-3
                                                        text-[9px]
                                                        font-medium
                                                        text-[#59606E]
                                                        transition
                                                        hover:bg-[#F8F9FC]
                                                    "
                                                >
                                                    <Share2 size={11} />
                                                    Share
                                                </button>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </section>

                            {/* =================================================
                                MAIN GRID
                            ================================================== */}

                            <div className="mt-4 flex w-full flex-col gap-4">

                                {/* =================================================
                                    LEFT COLUMN
                                ================================================== */}

                                <div className="min-w-0 space-y-4">

                                    {/* =============================================
                                        PERSONAL INFORMATION
                                    ============================================== */}

                                    <section
                                        className="
                                            rounded-lg
                                            border
                                            border-[#E6E8ED]
                                            bg-white
                                            shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                        "
                                    >

                                        <div className="flex items-center justify-between border-b border-[#ECEEF2] px-4 py-3">

                                            <h3 className="text-xs font-semibold text-[#242936]">
                                                Personal Information
                                            </h3>

                                            <button
                                                type="button"
                                                className="text-[#0757C9]"
                                            >
                                                <Pencil size={13} />
                                            </button>

                                        </div>

                                        <div className="p-4">

                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                                {/* First Name */}

                                                <div>

                                                    <label className={labelClass}>
                                                        First Name
                                                    </label>

                                                    <input
                                                        type="text"
                                                        value={formData.firstName}
                                                        onChange={(e) =>
                                                            handleChange(
                                                                'firstName',
                                                                e.target.value
                                                            )
                                                        }
                                                        className={inputClass}
                                                    />

                                                </div>

                                                {/* Last Name */}

                                                <div>

                                                    <label className={labelClass}>
                                                        Last Name
                                                    </label>

                                                    <input
                                                        type="text"
                                                        value={formData.lastName}
                                                        onChange={(e) =>
                                                            handleChange(
                                                                'lastName',
                                                                e.target.value
                                                            )
                                                        }
                                                        className={inputClass}
                                                    />

                                                </div>

                                                {/* Username */}

                                                <div>

                                                    <label className={labelClass}>
                                                        Username
                                                    </label>

                                                    <div className="relative">

                                                        <User
                                                            size={12}
                                                            className="
                                                                pointer-events-none
                                                                absolute
                                                                left-3
                                                                top-1/2
                                                                -translate-y-1/2
                                                                text-[#8B919D]
                                                            "
                                                        />

                                                        <input
                                                            type="text"
                                                            value={formData.username}
                                                            onChange={(e) =>
                                                                handleChange(
                                                                    'username',
                                                                    e.target.value
                                                                )
                                                            }
                                                            className={`${inputClass} pl-8`}
                                                        />

                                                    </div>

                                                </div>

                                                {/* Email */}

                                                <div>

                                                    <label className={labelClass}>
                                                        Email Address
                                                    </label>

                                                    <div className="relative">

                                                        <Mail
                                                            size={12}
                                                            className="
                                                                pointer-events-none
                                                                absolute
                                                                left-3
                                                                top-1/2
                                                                -translate-y-1/2
                                                                text-[#8B919D]
                                                            "
                                                        />

                                                        <input
                                                            type="email"
                                                            value={formData.email}
                                                            readOnly
                                                            aria-readonly="true"
                                                            className={`${inputClass} pl-8 cursor-not-allowed opacity-70`}
                                                        />

                                                    </div>

                                                </div>

                                                {/* Phone */}

                                                <div>

                                                    <label className={labelClass}>
                                                        Phone Number
                                                    </label>

                                                    <div className="relative">

                                                        <Phone
                                                            size={12}
                                                            className="
                                                                pointer-events-none
                                                                absolute
                                                                left-3
                                                                top-1/2
                                                                -translate-y-1/2
                                                                text-[#8B919D]
                                                            "
                                                        />

                                                        <input
                                                            type="text"
                                                            value={formData.phone}
                                                            onChange={(e) =>
                                                                handleChange(
                                                                    'phone',
                                                                    e.target.value
                                                                )
                                                            }
                                                            className={`${inputClass} pl-8`}
                                                        />

                                                    </div>

                                                </div>

                                                {/* DOB */}

                                                <div>

                                                    <label className={labelClass}>
                                                        Date of Birth
                                                    </label>

                                                    <div className="relative">

                                                        <CalendarDays
                                                            size={12}
                                                            className="
                                                                pointer-events-none
                                                                absolute
                                                                left-3
                                                                top-1/2
                                                                -translate-y-1/2
                                                                text-[#8B919D]
                                                            "
                                                        />

                                                        <input
                                                            type="text"
                                                            value={formData.dateOfBirth}
                                                            onChange={(e) =>
                                                                handleChange(
                                                                    'dateOfBirth',
                                                                    e.target.value
                                                                )
                                                            }
                                                            className={`${inputClass} pl-8`}
                                                        />

                                                    </div>

                                                </div>

                                                {/* Address */}

                                                <div className="sm:col-span-2">

                                                    <label className={labelClass}>
                                                        Home Address
                                                    </label>

                                                    <textarea
                                                        rows="2"
                                                        value={formData.address}
                                                        onChange={(e) =>
                                                            handleChange(
                                                                'address',
                                                                e.target.value
                                                            )
                                                        }
                                                        className="
                                                            mt-1
                                                            min-h-14.5
                                                            w-full
                                                            resize-none
                                                            rounded-md
                                                            border
                                                            border-[#E2E5EC]
                                                            bg-[#F9FAFD]
                                                            px-3
                                                            py-2
                                                            text-[10px]
                                                            text-[#343A47]
                                                            outline-none
                                                            transition
                                                            focus:border-[#AFC4ED]
                                                            focus:bg-white
                                                            focus:ring-1
                                                            focus:ring-[#DCE7FA]
                                                        "
                                                    />

                                                </div>

                                            </div>

                                        </div>

                                    </section>
                                    {/* =============================================
                                        ACCOUNT PREFERENCES
                                    ============================================== */}

                                    <section
                                        className="
                                            rounded-lg
                                            border
                                            border-[#E6E8ED]
                                            bg-white
                                            shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                        "
                                    >

                                        <div className="border-b border-[#ECEEF2] px-4 py-3">

                                            <h3 className="text-xs font-semibold text-[#242936]">
                                                Account Preferences
                                            </h3>

                                        </div>

                                        <div className="p-4">

                                            {/* Preferences */}

                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                                                {/* Language */}

                                                <div>

                                                    <label className={labelClass}>
                                                        Language
                                                    </label>

                                                    <div className="relative">

                                                        <Globe2
                                                            size={12}
                                                            className="
                                                                pointer-events-none
                                                                absolute
                                                                left-3
                                                                top-1/2
                                                                -translate-y-1/2
                                                                text-[#8B919D]
                                                            "
                                                        />

                                                        <select
                                                            value={formData.language}
                                                            onChange={(e) =>
                                                                handleChange(
                                                                    'language',
                                                                    e.target.value
                                                                )
                                                            }
                                                            className={`${inputClass} appearance-none pl-8 pr-8`}
                                                        >
                                                            <option value="English (US)">English (US)</option>
                                                            <option value="Tamil">Tamil</option>
                                                            <option value="Sinhala">Sinhala</option>
                                                        </select>

                                                        <ChevronDown
                                                            size={12}
                                                            className="
                                                                pointer-events-none
                                                                absolute
                                                                right-3
                                                                top-1/2
                                                                -translate-y-1/2
                                                                text-[#8B919D]
                                                            "
                                                        />

                                                    </div>

                                                </div>

                                                {/* Timezone */}

                                                <div>

                                                    <label className={labelClass}>
                                                        Time Zone
                                                    </label>

                                                    <div className="relative">

                                                        <Clock3
                                                            size={12}
                                                            className="
                                                                pointer-events-none
                                                                absolute
                                                                left-3
                                                                top-1/2
                                                                -translate-y-1/2
                                                                text-[#8B919D]
                                                            "
                                                        />

                                                        <select
                                                            value={formData.timezone}
                                                            onChange={(e) =>
                                                                handleChange(
                                                                    'timezone',
                                                                    e.target.value
                                                                )
                                                            }
                                                            className={`${inputClass} appearance-none pl-8 pr-8`}
                                                        >
                                                            <option value="Asia/Colombo">(GMT+05:30) Sri Lanka Time</option>
                                                            <option value="America/Los_Angeles">(GMT-08:00) Pacific Time</option>
                                                            <option value="Asia/Kolkata">(GMT+05:30) India Standard Time</option>
                                                            <option value="UTC">(GMT+00:00) UTC</option>
                                                        </select>

                                                        <ChevronDown
                                                            size={12}
                                                            className="
                                                                pointer-events-none
                                                                absolute
                                                                right-3
                                                                top-1/2
                                                                -translate-y-1/2
                                                                text-[#8B919D]
                                                            "
                                                        />

                                                    </div>

                                                </div>

                                                {/* Date Format */}

                                                <div>

                                                    <label className={labelClass}>
                                                        Date Format
                                                    </label>

                                                    <select
                                                        value={formData.dateFormat}
                                                        onChange={(e) =>
                                                            handleChange(
                                                                'dateFormat',
                                                                e.target.value
                                                            )
                                                        }
                                                        className={`${inputClass} appearance-none`}
                                                    >
                                                        <option value="MMM DD, YYYY">MMM DD, YYYY</option>
                                                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                                    </select>

                                                </div>

                                            </div>

                                            {/* Notifications */}

                                            <div className="mt-5 border-t border-[#ECEEF2] pt-4">

                                                <p className="text-[9px] font-semibold uppercase tracking-wide text-[#59606E]">
                                                    Notifications
                                                </p>

                                                <div className="mt-3 space-y-3">

                                                    {/* Email */}

                                                    <div className="flex items-center justify-between">

                                                        <div className="flex items-center gap-2">

                                                            <Mail
                                                                size={13}
                                                                className="text-[#59606E]"
                                                            />

                                                            <div>

                                                                <p className="text-[9px] font-medium text-[#343A47]">
                                                                    Email Notifications
                                                                </p>

                                                                <p className="text-[8px] text-[#8B919D]">
                                                                    Receive work updates and important updates via email.
                                                                </p>

                                                            </div>

                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleNotificationChange('email')}
                                                            className={`
                                                                relative
                                                                h-5
                                                                w-9
                                                                rounded-full
                                                                transition
                                                                ${notifications.email
                                                                    ? 'bg-[#0757C9]'
                                                                    : 'bg-[#DDE1E8]'
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
                                                                    ${notifications.email
                                                                        ? 'left-4.5'
                                                                        : 'left-0.5'
                                                                    }
                                                                `}
                                                            />

                                                        </button>

                                                    </div>

                                                    {/* Inventory */}

                                                    <div className="flex items-center justify-between">

                                                        <div className="flex items-center gap-2">

                                                            <Package
                                                                size={13}
                                                                className="text-[#59606E]"
                                                            />

                                                            <div>

                                                                <p className="text-[9px] font-medium text-[#343A47]">
                                                                    In-App Notifications
                                                                </p>

                                                                <p className="text-[8px] text-[#8B919D]">
                                                                    Receive notifications inside your BizFlow account.
                                                                </p>

                                                            </div>

                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleNotificationChange('inApp')}
                                                            className={`
                                                                relative
                                                                h-5
                                                                w-9
                                                                rounded-full
                                                                transition
                                                                ${notifications.inApp
                                                                    ? 'bg-[#0757C9]'
                                                                    : 'bg-[#DDE1E8]'
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
                                                                    ${notifications.inApp
                                                                        ? 'left-4.5'
                                                                        : 'left-0.5'
                                                                    }
                                                                `}
                                                            />

                                                        </button>

                                                    </div>

                                                    {/* Sales */}

                                                    <div className="flex items-center justify-between">

                                                        <div className="flex items-center gap-2">

                                                            <BellRing
                                                                size={13}
                                                                className="text-[#59606E]"
                                                            />

                                                            <div>

                                                                <p className="text-[9px] font-medium text-[#343A47]">
                                                                    Sales Notifications
                                                                </p>

                                                                <p className="text-[8px] text-[#8B919D]">
                                                                    Receive alerts for confirmed sales recordings.
                                                                </p>

                                                            </div>

                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleNotificationChange('sales')}
                                                            className={`
                                                                relative
                                                                h-5
                                                                w-9
                                                                rounded-full
                                                                transition
                                                                ${notifications.sales
                                                                    ? 'bg-[#0757C9]'
                                                                    : 'bg-[#DDE1E8]'
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
                                                                    ${notifications.sales
                                                                        ? 'left-4.5'
                                                                        : 'left-0.5'
                                                                    }
                                                                `}
                                                            />

                                                        </button>

                                                    </div>

                                                </div>

                                            </div>

                                        </div>

                                    </section>

                                </div>
                            </div>

                            {/* =================================================
                                SAVE BAR
                            ================================================== */}

                            <section
                                className="
                                    mt-5
                                    rounded-lg
                                    border
                                    border-[#E6E8ED]
                                    bg-white
                                    px-4
                                    py-3
                                    shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                "
                            >

                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                                    <div className="flex items-center gap-2">

                                        {loadingProfile ? (
                                            <span className="text-[8px] text-[#8B919D]">Loading account settings...</span>
                                        ) : saved ? (
                                            <>
                                                <CheckCircle2
                                                    size={13}
                                                    className="text-emerald-500"
                                                />

                                                <span className="text-[9px] text-emerald-600">
                                                    Changes saved successfully.
                                                </span>
                                            </>
                                        ) : (
                                            <span className="text-[8px] text-[#8B919D]">
                                                Unsaved changes will be lost if you leave without saving.
                                            </span>
                                        )}

                                    </div>

                                    <div className="flex items-center justify-end gap-2">

                                        <button
                                            type="button"
                                            onClick={handleReset}
                                            disabled={loadingProfile || savingProfile}
                                            className="
                                                flex
                                                h-8
                                                items-center
                                                gap-1.5
                                                rounded-md
                                                border
                                                border-[#DDE1E8]
                                                bg-white
                                                px-3
                                                text-[9px]
                                                font-medium
                                                text-[#59606E]
                                                transition
                                                hover:bg-[#F8F9FC]
                                            "
                                        >
                                            <RotateCcw size={11} />
                                            Reset Changes
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleSave}
                                            disabled={loadingProfile || savingProfile}
                                            className="
                                                flex
                                                h-8
                                                items-center
                                                gap-1.5
                                                rounded-md
                                                bg-[#0052CC]
                                                px-4
                                                text-[9px]
                                                font-medium
                                                text-white
                                                shadow-sm
                                                transition
                                                hover:bg-[#0045AD]
                                            "
                                        >
                                            <Save size={11} />
                                            {savingProfile ? 'Saving...' : 'Save Changes'}
                                        </button>

                                    </div>

                                </div>

                            </section>

                            {/* =================================================
                                FOOTER
                            ================================================== */}

                            <footer className="mt-7 border-t border-[#E1E4EA] py-5">

                                <div
                                    className="
                                        flex
                                        flex-col
                                        gap-3
                                        text-[9px]
                                        text-[#59606E]
                                        sm:flex-row
                                        sm:items-center
                                        sm:justify-between
                                    "
                                >

                                    <p>
                                        © 2026 Business Process Automation System |
                                        Cloud-Based SaaS Platform
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

export default Settings
