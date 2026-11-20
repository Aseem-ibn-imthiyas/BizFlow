import { useState, useEffect } from 'react'
import {
    Search,
    Mail,
    Bell,
    Settings,
    HelpCircle,
    Edit3,
    X,
    Phone,
    CalendarDays,
    Clock3,
    Lock,
    Save,
    CheckCircle2,
    ChevronDown,
} from 'lucide-react'

import ManagerSidebar from '../../components/sidebar/ManagerSidebar'
import api from '../../services/api'


/* ============================================================
   INITIAL PROFILE DATA
============================================================ */

const initialProfile = {
    firstName: '',
    lastName: '',
    username: '',
    dateOfBirth: '',
    homeAddress: '',

    email: '',
    phone: '',
    role: '',
    department: '',
    createdAt: '',
    status: 'Unknown',
    profileImage: '',

    language: 'English (US)',
    timezone: 'Asia/Colombo',
    dateFormat: 'MMM DD, YYYY',
    theme: 'Light',
}

const mapUserToSettings = (user) => {
    const nameParts = (user.fullName || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)

    let formattedDate = ''

    if (user.dateOfBirth) {
        const date = new Date(user.dateOfBirth)

        if (!Number.isNaN(date.getTime())) {
            const month = String(date.getUTCMonth() + 1).padStart(2, '0')
            const day = String(date.getUTCDate()).padStart(2, '0')
            formattedDate = `${month}/${day}/${date.getUTCFullYear()}`
        }
    }

    return {
        profile: {
            ...initialProfile,
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' '),
            username: user.username || '',
            dateOfBirth: formattedDate,
            homeAddress: user.address || '',
            email: user.email || '',
            phone: user.phone || '',
            role: user.role || '',
            department: user.department || '',
            createdAt: user.createdAt || '',
            status: user.status || 'Unknown',
            profileImage: user.profileImage || '',
            language: user.preferences?.language || 'English (US)',
            timezone: user.preferences?.timezone || 'Asia/Colombo',
            dateFormat: user.preferences?.dateFormat || 'MMM DD, YYYY',
            theme: user.preferences?.theme || 'Light',
        },
        notifications: {
            email: user.notifications?.email ?? true,
            inApp: user.notifications?.inApp ?? true,
            sales: user.notifications?.sales ?? false,
        },
    }
}

const parseDateOfBirth = (value) => {
    if (!value?.trim()) return null

    const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)

    if (!match) {
        throw new Error('Date of birth must use MM/DD/YYYY format.')
    }

    const [, monthText, dayText, yearText] = match
    const month = Number(monthText)
    const day = Number(dayText)
    const year = Number(yearText)
    const date = new Date(Date.UTC(year, month - 1, day))

    if (
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        throw new Error('Please enter a valid date of birth.')
    }

    if (date.getTime() > Date.now()) {
        throw new Error('Date of birth cannot be in the future.')
    }

    return date.toISOString()
}

/* ============================================================
   RECENT ACTIVITY
============================================================ */


/* ============================================================
   REUSABLE PROFILE INFO
============================================================ */

function ProfileInfo({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EEF4FF] text-[#0757C9]">
                <Icon size={15} strokeWidth={1.8} />
            </div>

            <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-wide text-[#8A91A0]">
                    {label}
                </p>

                <p className="mt-1 truncate text-xs font-medium text-[#3D4554]">
                    {value}
                </p>
            </div>
        </div>
    )
}


/* ============================================================
   FORM FIELD
============================================================ */

function FormField({
    label,
    value,
    disabled,
    onChange,
}) {
    return (
        <div>
            <label className="mb-2 block text-[9px] font-bold uppercase tracking-wide text-[#59606E]">
                {label}
            </label>

            <input
                type="text"
                value={value}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
                className={`
                    h-9
                    w-full
                    rounded-md
                    border
                    px-3
                    text-xs
                    outline-none
                    transition
                    ${disabled
                        ? 'cursor-default border-[#E1E4EA] bg-white text-[#59606E]'
                        : 'border-[#BFC6D4] bg-white text-[#171B25] focus:border-[#0757C9] focus:ring-2 focus:ring-[#0757C9]/10'
                    }
                `}
            />
        </div>
    )
}


/* ============================================================
   SELECT FIELD
============================================================ */

function SelectField({
    label,
    value,
    options,
    disabled,
    onChange,
}) {
    return (
        <div>
            <label className="mb-2 block text-[9px] font-bold uppercase tracking-wide text-[#59606E]">
                {label}
            </label>

            <div className="relative">
                <select
                    value={value}
                    disabled={disabled}
                    onChange={(event) => onChange(event.target.value)}
                    className={`
                        h-9
                        w-full
                        appearance-none
                        rounded-md
                        border
                        px-3
                        pr-8
                        text-xs
                        outline-none
                        transition
                        ${disabled
                            ? 'cursor-default border-[#E1E4EA] bg-white text-[#59606E]'
                            : 'border-[#BFC6D4] bg-white text-[#171B25] focus:border-[#0757C9] focus:ring-2 focus:ring-[#0757C9]/10'
                        }
                    `}
                >
                    {options.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>

                <ChevronDown
                    size={13}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#737B8C]"
                />
            </div>
        </div>
    )
}



/* ============================================================
   EMPLOYMENT ITEM
============================================================ */

function EmploymentItem({
    label,
    value,
    link = false,
}) {
    return (
        <div>
            <p className="text-[9px] font-bold uppercase tracking-wide text-[#737B8C]">
                {label}
            </p>

            <p
                className={`mt-2 text-xs font-medium ${link ? 'text-[#0757C9]' : 'text-[#3D4554]'
                    }`}
            >
                {value}
            </p>
        </div>
    )
}


/* ============================================================
   NOTIFICATION TOGGLE
============================================================ */

function NotificationToggle({
    title,
    description,
    enabled,
    onToggle,
}) {
    return (
        <div className="flex items-center justify-between gap-4 py-2">
            <div className="min-w-0">
                <p className="text-xs font-semibold text-[#3D4554]">
                    {title}
                </p>

                <p className="mt-1 text-[9px] text-[#8A91A0]">
                    {description}
                </p>
            </div>

            <button
                type="button"
                onClick={onToggle}
                aria-label={`Toggle ${title}`}
                className={`
                    relative
                    h-5
                    w-9
                    shrink-0
                    rounded-full
                    transition
                    ${enabled
                        ? 'bg-[#0757C9]'
                        : 'bg-[#D4D9E3]'
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
                        ${enabled
                            ? 'left-4.5'
                            : 'left-0.5'
                        }
                    `}
                />
            </button>
        </div>
    )
}


/* ============================================================
   PROFILE PAGE
============================================================ */

export default function Profile() {

    const [profile, setProfile] = useState(initialProfile)

    const [editing, setEditing] = useState(false)

    const [saved, setSaved] = useState(false)
    const [savingProfile, setSavingProfile] = useState(false)

    const [loadingProfile, setLoadingProfile] = useState(true)
    const [profileError, setProfileError] = useState('')
    const [saveError, setSaveError] = useState('')

    const [savedProfile, setSavedProfile] = useState(initialProfile)
    const [notifications, setNotifications] = useState({
        email: true,
        inApp: true,
        sales: false,
    })
    const [savedNotifications, setSavedNotifications] = useState({
        email: true,
        inApp: true,
        sales: false,
    })

    /* ========================================================
       LOAD AUTHENTICATED USER PROFILE & SETTINGS
    ======================================================== */

    useEffect(() => {
        let isMounted = true

        const loadProfile = async () => {
            try {
                setLoadingProfile(true)
                setProfileError('')

                const response = await api.get('/users/me')

                // Support both Axios-style responses and helpers that
                // return the parsed JSON response body directly.
                const payload = response?.data ?? response
                const user = payload?.data ?? payload?.user ?? payload

                if (!user || !user._id) {
                    throw new Error('Unable to retrieve user profile.')
                }

                if (!isMounted) return

                const mapped = mapUserToSettings(user)

                setProfile(mapped.profile)
                setSavedProfile(mapped.profile)
                setNotifications(mapped.notifications)
                setSavedNotifications(mapped.notifications)

            } catch (error) {
                console.error('Load profile error:', error)

                if (isMounted) {
                    setProfileError(
                        error.message || 'Failed to load your profile.'
                    )
                }
            } finally {
                if (isMounted) {
                    setLoadingProfile(false)
                }
            }
        }

        loadProfile()

        return () => {
            isMounted = false
        }
    }, [])


    /* ========================================================
       PROFILE CHANGE
    ======================================================== */

    const handleChange = (field, value) => {
        setProfile((previous) => ({
            ...previous,
            [field]: value,
        }))

        setSaved(false)
        setSaveError('')
    }


    /* ========================================================
       NOTIFICATION TOGGLE
    ======================================================== */

    const toggleNotification = (field) => {
        setNotifications((previous) => ({
            ...previous,
            [field]: !previous[field],
        }))

        setSaved(false)
        setSaveError('')
    }


    /* ========================================================
       SAVE
    ======================================================== */

    const handleSave = async () => {
        if (savingProfile) return

        try {
            setSavingProfile(true)
            setSaveError('')
            setSaved(false)

            const fullName = `${profile.firstName} ${profile.lastName}`.trim()

            if (!fullName) {
                throw new Error('Please enter your first name and last name.')
            }

            const payload = {
                fullName,
                username: profile.username.trim(),
                dateOfBirth: parseDateOfBirth(profile.dateOfBirth),
                address: profile.homeAddress.trim(),
                preferences: {
                    language: profile.language,
                    timezone: profile.timezone,
                    dateFormat: profile.dateFormat,
                    theme: profile.theme,
                },
                notifications: {
                    email: notifications.email,
                    inApp: notifications.inApp,
                    sales: notifications.sales,
                },
            }

            // The API helper returns the parsed response body.
            await api.patch('/users/me', payload)

            // Reload the saved record so the UI reflects MongoDB's actual data.
            const response = await api.get('/users/me')
            const responseBody = response?.data ?? response
            const user = responseBody?.data ?? responseBody?.user ?? responseBody

            if (!user?._id) {
                throw new Error('Changes were submitted, but the updated profile could not be retrieved.')
            }

            const mapped = mapUserToSettings(user)

            setProfile(mapped.profile)
            setSavedProfile(mapped.profile)
            setNotifications(mapped.notifications)
            setSavedNotifications(mapped.notifications)
            setEditing(false)
            setSaved(true)
        } catch (error) {
            console.error('Save profile error:', error)
            setSaveError(
                error?.response?.data?.message ||
                error?.message ||
                'Failed to save your profile. Please try again.'
            )
        } finally {
            setSavingProfile(false)
        }
    }


    /* ========================================================
       RESET TO LAST SAVED DATA
    ======================================================== */

    const handleReset = () => {
        setProfile(savedProfile)
        setNotifications(savedNotifications)
        setSaved(false)
        setSaveError('')
    }

    const handleCancelEdit = () => {
        setProfile(savedProfile)
        setNotifications(savedNotifications)
        setEditing(false)
        setSaved(false)
        setSaveError('')
    }


    return (
        <main className="h-screen w-full overflow-hidden bg-[#FBFCFE] text-[#171B25]">

            <div className="flex h-screen w-full overflow-hidden">

                {/* =====================================================
                    FIXED SIDEBAR
                ====================================================== */}

                <aside className="h-screen shrink-0">
                    <ManagerSidebar />
                </aside>


                {/* =====================================================
                    RIGHT SIDE
                ====================================================== */}

                <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">

                    {/* =================================================
                        FIXED HEADER
                    ================================================== */}

                    <header
                        className="
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

                        {/* SEARCH */}

                        <div
                            className="
                                flex
                                h-9
                                w-64
                                items-center
                                gap-2
                                rounded-lg
                                bg-[#F4F5FA]
                                px-3
                                text-xs
                                text-[#737B8C]
                            "
                        >
                            <Search
                                size={14}
                                strokeWidth={1.8}
                            />

                            <span>
                                Search users, reports, settings...
                            </span>
                        </div>


                        {/* HEADER ACTIONS */}

                        <div className="flex items-center gap-4">

                            <button
                                type="button"
                                className="text-[#59606E] transition hover:text-[#0757C9]"
                            >
                                <Mail
                                    size={17}
                                    strokeWidth={1.8}
                                />
                            </button>

                            <button
                                type="button"
                                className="text-[#59606E] transition hover:text-[#0757C9]"
                            >
                                <Bell
                                    size={17}
                                    strokeWidth={1.8}
                                />
                            </button>

                            <button
                                type="button"
                                className="text-[#59606E] transition hover:text-[#0757C9]"
                            >
                                <Settings
                                    size={17}
                                    strokeWidth={1.8}
                                />
                            </button>

                            <button
                                type="button"
                                className="text-[#59606E] transition hover:text-[#0757C9]"
                            >
                                <HelpCircle
                                    size={17}
                                    strokeWidth={1.8}
                                />
                            </button>

                            <div className="h-6 w-px bg-[#E1E4EA]" />

                            <div className="flex items-center gap-2">

                                <div className="hidden text-right sm:block">
                                    <p className="text-[10px] font-bold text-[#171B25]">
                                        {`${profile.firstName} ${profile.lastName}`.trim() || 'Manager'}
                                    </p>

                                    <p className="text-[8px] uppercase tracking-wide text-[#737B8C]">
                                        {profile.role || 'Manager'}
                                    </p>
                                </div>

                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F0FF] text-[10px] font-bold text-[#0757C9]">
                                    {`${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase() || 'M'}
                                </div>

                            </div>

                        </div>

                    </header>


                    {/* =================================================
                        ONLY THIS AREA SCROLLS
                    ================================================== */}

                    <div
                        className="
                            min-h-0
                            flex-1
                            overflow-x-hidden
                            overflow-y-auto
                        "
                    >

                        {/* =================================================
                            PAGE CONTENT
                        ================================================== */}

                        <div className="px-6 py-7 lg:px-8 xl:px-10">

                            {/* =================================================
                                PAGE TITLE
                            ================================================== */}

                            <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">

                                <div>

                                    <div className="mb-2 flex items-center gap-2 text-[10px] text-[#737B8C]">
                                        <span>Home</span>
                                        <span>›</span>
                                        <span>Profile</span>
                                    </div>

                                    <h1 className="text-[26px] font-bold tracking-tight text-[#171B25]">
                                        My Profile
                                    </h1>

                                    <p className="mt-1 text-xs text-[#737B8C]">
                                        View and manage your Profile Settings.
                                    </p>

                                </div>


                                {/* PAGE ACTIONS */}

                                <div className="flex items-center gap-2">

                                    <button
                                        type="button"
                                        disabled={loadingProfile || savingProfile}
                                        onClick={() => {
                                            if (editing) {
                                                handleCancelEdit()
                                            } else {
                                                setEditing(true)
                                                setSaved(false)
                                                setSaveError('')
                                            }
                                        }}
                                        className="
                                            flex
                                            h-9
                                            items-center
                                            gap-2
                                            rounded-lg
                                            bg-[#0757C9]
                                            px-3
                                            text-[10px]
                                            font-semibold
                                            text-white
                                            transition
                                            hover:bg-[#064EAE]
                                        "
                                    >
                                        {editing ? (
                                            <>
                                                <X size={13} />

                                                Cancel Edit
                                            </>
                                        ) : (
                                            <>
                                                <Edit3 size={13} />

                                                Edit Profile
                                            </>
                                        )}
                                    </button>

                                </div>

                            </div>

                            {loadingProfile && (
                                <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-[#0757C9]">
                                    Loading your profile and saved settings...
                                </div>
                            )}

                            {!loadingProfile && profileError && (
                                <div className="mb-4 flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 sm:flex-row sm:items-center sm:justify-between">
                                    <span>{profileError}</span>
                                    <button
                                        type="button"
                                        onClick={() => window.location.reload()}
                                        className="w-fit font-semibold underline underline-offset-2"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}

                            {/* =================================================
                                PROFILE HEADER
                            ================================================== */}

                            <section className="mt-4 rounded-xl border border-[#E1E4EA] bg-white">

                                {/* PROFILE CARD */}

                                <div
                                    className="
                                        rounded-xl
                                        border
                                        border-[#E1E4EA]
                                        bg-white
                                        p-5
                                        shadow-[0_2px_8px_rgba(20,35,60,0.04)]
                                    "
                                >

                                    <div className="flex flex-col gap-5 md:flex-row md:items-center">

                                        {/* PROFILE IMAGE */}

                                        <div className="shrink-0">

                                            <div className="relative h-24 w-24">

                                                <div
                                                    className="
                                                        flex
                                                        h-24
                                                        w-24
                                                        items-center
                                                        justify-center
                                                        overflow-hidden
                                                        rounded-full
                                                        border-4
                                                        border-[#E8F0FF]
                                                        bg-[#EEF4FF]
                                                        text-2xl
                                                        font-bold
                                                        text-[#0757C9]
                                                    "
                                                >

                                                    {profile.profileImage ? (
                                                        <img
                                                            src={profile.profileImage}
                                                            alt="Profile"
                                                            className="h-full w-full object-cover"
                                                            onError={(event) => {
                                                                event.currentTarget.style.display = 'none'
                                                            }}
                                                        />
                                                    ) : null}

                                                    <span className="absolute">
                                                        AS
                                                    </span>

                                                </div>


                                                <button
                                                    type="button"
                                                    aria-label="Edit profile picture"
                                                    className="
                                                        absolute
                                                        bottom-0
                                                        right-0
                                                        z-10
                                                        flex
                                                        h-7
                                                        w-7
                                                        translate-x-1
                                                        translate-y-1
                                                        items-center
                                                        justify-center
                                                        rounded-full
                                                        border-2
                                                        border-white
                                                        bg-[#0757C9]
                                                        text-white
                                                        shadow-sm
                                                        transition
                                                        hover:bg-[#064EAE]
                                                    "
                                                >
                                                    <Edit3
                                                        size={11}
                                                        strokeWidth={2}
                                                    />
                                                </button>

                                            </div>


                                            <div
                                                className="
                                                    mt-3
                                                    rounded-full
                                                    bg-[#EAF2FF]
                                                    px-3
                                                    py-1
                                                    text-center
                                                    text-[9px]
                                                    font-bold
                                                    uppercase
                                                    text-[#0757C9]
                                                "
                                            >
                                                Active Account
                                            </div>

                                        </div>


                                        {/* PROFILE DETAILS */}

                                        <div className="min-w-0 flex-1">

                                            <div className="flex flex-col justify-between gap-3 border-b border-[#EEF0F4] pb-4 md:flex-row">

                                                <div>

                                                    <h2 className="text-sm font-bold text-[#171B25]">
                                                        {profile.firstName} {profile.lastName}
                                                    </h2>

                                                    <p className="mt-1 text-[11px] text-[#59606E]">
                                                        {profile.role}
                                                        {profile.department ? ` • ${profile.department}` : ''}
                                                    </p>

                                                </div>


                                                <div className="text-left md:text-right">
                                                    <p className="text-[8px] uppercase tracking-wide text-[#8A91A0]">
                                                        Account Status
                                                    </p>
                                                    <p className="mt-1 text-[11px] font-bold text-[#171B25]">
                                                        {profile.status || 'Unknown'}
                                                    </p>
                                                </div>

                                            </div>


                                            <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">

                                                <ProfileInfo
                                                    icon={Mail}
                                                    label="Email"
                                                    value={profile.email}
                                                />

                                                <ProfileInfo
                                                    icon={Phone}
                                                    label="Phone"
                                                    value={profile.phone || 'Not provided'}
                                                />

                                                <ProfileInfo
                                                    icon={CalendarDays}
                                                    label="Joined Date"
                                                    value={
                                                        profile.createdAt
                                                            ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: '2-digit',
                                                                year: 'numeric',
                                                            })
                                                            : 'Not available'
                                                    }
                                                />

                                                <ProfileInfo
                                                    icon={Clock3}
                                                    label="Username"
                                                    value={profile.username || 'Not provided'}
                                                />

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </section>

                            {/* =================================================
                                PERSONAL INFORMATION
                            ================================================== */}

                            <section className="mt-4 rounded-xl border border-[#E1E4EA] bg-white">

                                {/* PERSONAL INFORMATION */}

                                <div className="flex items-center justify-between border-b border-[#EEF0F4] px-5 py-3">

                                    <h3 className="text-xs font-bold text-[#171B25]">
                                        Personal Information
                                    </h3>

                                    <button
                                        type="button"
                                        onClick={() => setEditing(true)}
                                        className="text-[9px] font-semibold text-[#0757C9] hover:underline"
                                    >
                                        Edit Fields
                                    </button>

                                </div>

                                <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">

                                    <FormField
                                        label="FIRST NAME"
                                        value={profile.firstName}
                                        disabled={!editing}
                                        onChange={(value) =>
                                            handleChange('firstName', value)
                                        }
                                    />

                                    <FormField
                                        label="LAST NAME"
                                        value={profile.lastName}
                                        disabled={!editing}
                                        onChange={(value) =>
                                            handleChange('lastName', value)
                                        }
                                    />

                                    <FormField
                                        label="USERNAME"
                                        value={profile.username}
                                        disabled={!editing}
                                        onChange={(value) =>
                                            handleChange('username', value)
                                        }
                                    />

                                    <FormField
                                        label="DATE OF BIRTH"
                                        value={profile.dateOfBirth}
                                        disabled={!editing}
                                        onChange={(value) =>
                                            handleChange('dateOfBirth', value)
                                        }
                                    />

                                    <div className="md:col-span-2">

                                        <FormField
                                            label="HOME ADDRESS"
                                            value={profile.homeAddress}
                                            disabled={!editing}
                                            onChange={(value) =>
                                                handleChange('homeAddress', value)
                                            }
                                        />

                                    </div>

                                </div>

                            </section>


                            {/* =================================================
                                EMPLOYMENT + ACTIVITY
                            ================================================== */}

                            <section className="mt-4 rounded-xl border border-[#E1E4EA] bg-white">

                                {/* HEADER */}
                                <div className="flex items-center justify-between border-b border-[#EEF0F4] px-5 py-3">

                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xs font-bold text-[#171B25]">
                                            Employment Information
                                        </h3>

                                        <Lock
                                            size={10}
                                            className="text-[#8A91A0]"
                                        />
                                    </div>

                                    <span className="rounded bg-[#F2F3F7] px-2 py-1 text-[8px] text-[#8A91A0]">
                                        Contact HR for changes
                                    </span>

                                </div>

                                {/* CONTENT */}
                                <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-2">

                                    <EmploymentItem
                                        label="ROLE"
                                        value={profile.role || 'Not assigned'}
                                        link
                                    />

                                    <EmploymentItem
                                        label="DEPARTMENT"
                                        value={profile.department || 'Not assigned'}
                                    />

                                </div>

                            </section>


                            {/* =================================================
                                ACCOUNT PREFERENCES
                            ================================================== */}

                            <section className="mt-4 rounded-xl border border-[#E1E4EA] bg-white">

                                <div className="border-b border-[#EEF0F4] px-5 py-3">

                                    <h3 className="text-xs font-bold text-[#171B25]">
                                        Account Preferences & Notifications
                                    </h3>

                                </div>


                                <div className="grid grid-cols-1 gap-8 p-5 lg:grid-cols-2">

                                    {/* LOCALIZATION */}

                                    <div>

                                        <h4 className="mb-4 text-[9px] font-bold uppercase tracking-wide text-[#59606E]">
                                            Localization
                                        </h4>


                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                            <SelectField
                                                label="Language"
                                                value={profile.language}
                                                options={[
                                                    'English (US)',
                                                    'Tamil',
                                                    'Sinhala',
                                                ]}
                                                disabled={!editing}
                                                onChange={(value) =>
                                                    handleChange(
                                                        'language',
                                                        value
                                                    )
                                                }
                                            />

                                            <SelectField
                                                label="Time Zone"
                                                value={profile.timezone}
                                                options={[
                                                    'Asia/Colombo',
                                                    '(GMT-08:00) Pacific Time',
                                                    '(GMT+05:30) Sri Lanka Time',
                                                    '(GMT+00:00) London Time',
                                                ]}
                                                disabled={!editing}
                                                onChange={(value) =>
                                                    handleChange(
                                                        'timezone',
                                                        value
                                                    )
                                                }
                                            />

                                            <SelectField
                                                label="Date Format"
                                                value={profile.dateFormat}
                                                options={[
                                                    'MMM DD, YYYY',
                                                    'DD/MM/YYYY',
                                                    'MM/DD/YYYY',
                                                ]}
                                                disabled={!editing}
                                                onChange={(value) =>
                                                    handleChange(
                                                        'dateFormat',
                                                        value
                                                    )
                                                }
                                            />


                                            {/* THEME */}

                                            <div>

                                                <label className="mb-2 block text-[9px] font-semibold uppercase text-[#59606E]">
                                                    Theme Preference
                                                </label>


                                                <div className="flex h-9 overflow-hidden rounded-lg bg-[#F1F3FA] p-1">

                                                    {[
                                                        'Light',
                                                        'Dark',
                                                        'Auto',
                                                    ].map((theme) => (

                                                        <button
                                                            key={theme}
                                                            type="button"
                                                            disabled={!editing}
                                                            onClick={() =>
                                                                handleChange(
                                                                    'theme',
                                                                    theme
                                                                )
                                                            }
                                                            className={`
                                                                flex-1
                                                                rounded-md
                                                                text-[9px]
                                                                font-medium
                                                                transition
                                                                ${profile.theme === theme
                                                                    ? 'bg-white text-[#0757C9] shadow-sm'
                                                                    : 'text-[#59606E]'
                                                                }
                                                            `}
                                                        >
                                                            {theme}
                                                        </button>

                                                    ))}

                                                </div>

                                            </div>

                                        </div>

                                    </div>


                                    {/* NOTIFICATIONS */}

                                    <div>

                                        <h4 className="mb-3 text-[9px] font-bold uppercase tracking-wide text-[#59606E]">
                                            Notification Settings
                                        </h4>


                                        <NotificationToggle
                                            title="Email Notifications"
                                            description="Receive weekly digest and critical alerts"
                                            enabled={notifications.email}
                                            onToggle={() =>
                                                toggleNotification('email')
                                            }
                                        />

                                        <NotificationToggle
                                            title="In-App Notifications"
                                            description="Popups for real-time task updates"
                                            enabled={notifications.inApp}
                                            onToggle={() =>
                                                toggleNotification('inApp')
                                            }
                                        />

                                        <NotificationToggle
                                            title="Sales & Inventory Alerts"
                                            description="Notifications for low stock or high volume sales"
                                            enabled={notifications.sales}
                                            onToggle={() =>
                                                toggleNotification('sales')
                                            }
                                        />

                                    </div>

                                </div>

                            </section>



                            {/* =================================================
                                ACTION BAR
                            ================================================== */}

                            <div className="mt-4 flex flex-col items-center justify-end gap-2 border-t border-[#E1E4EA] py-4 sm:flex-row">

                                {saved && (
                                    <div className="mr-auto flex items-center gap-2 text-[10px] font-medium text-[#18A957]">

                                        <CheckCircle2 size={13} />

                                        Changes saved successfully

                                    </div>
                                )}

                                {saveError && (
                                    <div role="alert" className="mr-auto text-[10px] font-medium text-red-600">
                                        {saveError}
                                    </div>
                                )}


                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="
                                        flex
                                        h-9
                                        items-center
                                        justify-center
                                        rounded-lg
                                        border
                                        border-[#D7DBE5]
                                        bg-white
                                        px-4
                                        text-[10px]
                                        font-semibold
                                        text-[#3D4554]
                                        transition
                                        hover:bg-[#F5F6F9]
                                    "
                                >
                                    Cancel
                                </button>


                                <button
                                    type="button"
                                    onClick={handleReset}
                                    disabled={savingProfile || loadingProfile}
                                    className="
                                        flex
                                        h-9
                                        items-center
                                        justify-center
                                        rounded-lg
                                        border
                                        border-[#0757C9]
                                        bg-white
                                        px-4
                                        text-[10px]
                                        font-semibold
                                        text-[#0757C9]
                                        transition
                                        hover:bg-[#EEF4FF]
                                    "
                                >
                                    Reset Changes
                                </button>


                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={savingProfile || loadingProfile}
                                    className="
                                        flex
                                        h-9
                                        items-center
                                        justify-center
                                        gap-2
                                        rounded-lg
                                        bg-[#0757C9]
                                        px-5
                                        text-[10px]
                                        font-semibold
                                        text-white
                                        transition
                                        hover:bg-[#064EAE]
                                    "
                                >
                                    <Save size={13} />

                                    {savingProfile ? 'Saving...' : 'Save Changes'}
                                </button>

                            </div>

                        </div>


                        {/* =================================================
                            FOOTER
                        ================================================== */}

                        <footer
                            className="
                                flex
                                min-h-11
                                items-center
                                justify-between
                                border-t
                                border-[#E1E4EA]
                                bg-white
                                px-6
                                text-[8px]
                                text-[#737B8C]
                                lg:px-8
                                xl:px-10
                            "
                        >

                            <p>
                                © 2026 Business Process Automation System |
                                Cloud-Based SaaS Platform
                            </p>


                            <div className="hidden items-center gap-5 sm:flex">

                                <button
                                    type="button"
                                    className="hover:text-[#0757C9]"
                                >
                                    Privacy Policy
                                </button>

                                <button
                                    type="button"
                                    className="hover:text-[#0757C9]"
                                >
                                    Terms of Service
                                </button>

                                <button
                                    type="button"
                                    className="hover:text-[#0757C9]"
                                >
                                    Compliance
                                </button>

                            </div>

                        </footer>

                    </div>

                </div>

            </div>

        </main>
    )
}
