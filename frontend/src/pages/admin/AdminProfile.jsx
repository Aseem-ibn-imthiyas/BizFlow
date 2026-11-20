import AdminSidebar from '../../components/sidebar/AdminSidebar'
import { useState } from 'react'
import {
    Bell,
    CircleHelp,
    Search,
    Camera,
    //Trash2,
    Pencil,
    KeyRound,
    Shield,
    MapPin,
    Download,
    Laptop,
    ExternalLink,
    Save,
    RotateCcw,
} from 'lucide-react'

function AdminProfile() {
    const [emailNotifications, setEmailNotifications] = useState(true)
    const [pushNotifications, setPushNotifications] = useState(false)
    const [saved, setSaved] = useState(false)

    const loginHistory = [
        {
            date: 'Oct 24, 2023 · 09:42 AM',
            device: 'MacBook Pro 16"',
            browser: 'Chrome 118.0.0',
            ip: '192.168.1.42',
            status: 'SUCCESS',
        },
        {
            date: 'Oct 24, 2023 · 09:42 AM',
            device: 'MacBook Pro 16"',
            browser: 'Chrome 118.0.0',
            ip: '192.168.1.42',
            status: 'SUCCESS',
        },
        {
            date: 'Oct 24, 2023 · 09:42 AM',
            device: 'MacBook Pro 16"',
            browser: 'Chrome 118.0.0',
            ip: '192.168.1.42',
            status: 'FAILED',
        },
    ]

    const handleSave = () => {
        setSaved(true)
        console.log('Profile changes saved')
    }

    const handleReset = () => {
        setEmailNotifications(true)
        setPushNotifications(false)
        setSaved(false)
        console.log('Profile settings reset')
    }

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
                                className="
                                    text-[#59606E]
                                    transition
                                    hover:text-[#0757C9]
                                "
                            >
                                <Bell
                                    size={18}
                                    strokeWidth={1.7}
                                />
                            </button>

                            <button
                                type="button"
                                aria-label="Help"
                                className="
                                    text-[#59606E]
                                    transition
                                    hover:text-[#0757C9]
                                "
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

                        <div className="px-6 py-7 lg:px-8">

                            {/* =================================================
                                PAGE HEADER
                            ================================================== */}

                            <div className="flex items-start justify-between">

                                <div>

                                    <div className="flex items-center gap-2 text-xs">

                                        <span className="font-medium text-[#343A47]">
                                            Home
                                        </span>

                                        <span className="text-[#A1A6B0]">
                                            ›
                                        </span>

                                        <span className="font-medium text-[#59606E]">
                                            Administrator Profile
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
                                        Administrator Profile
                                    </h2>

                                    <p className="mt-1 text-sm text-[#69707D]">
                                        View and manage your personal account information and preferences.
                                    </p>

                                </div>

                                <div className="flex items-center gap-2 pt-7">

                                    <button
                                        type="button"
                                        className="
                                            h-9
                                            rounded-md
                                            border
                                            border-[#D6DAE4]
                                            bg-white
                                            px-5
                                            text-xs
                                            font-semibold
                                            text-[#454B58]
                                            transition
                                            hover:bg-[#F7F8FC]
                                        "
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        className="
                                            flex
                                            h-9
                                            items-center
                                            gap-2
                                            rounded-md
                                            bg-[#0757C9]
                                            px-5
                                            text-xs
                                            font-semibold
                                            text-white
                                            shadow-sm
                                            transition
                                            hover:bg-[#0045AD]
                                        "
                                    >
                                        <Save size={13} />
                                        Save Changes
                                    </button>

                                </div>

                            </div>

                            {/* =================================================
                                PROFILE SUMMARY
                            ================================================== */}

                            <section
                                className="
                                    mt-7
                                    rounded-lg
                                    border
                                    border-[#E3E6EC]
                                    bg-white
                                    px-5
                                    py-5
                                    shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                "
                            >

                                <div className="flex items-center justify-between">

                                    {/* Profile */}

                                    <div className="flex items-center gap-5">

                                        <div className="relative">

                                            <div
                                                className="
                                                    flex
                                                    h-20
                                                    w-20
                                                    items-center
                                                    justify-center
                                                    overflow-hidden
                                                    rounded-full
                                                    border
                                                    border-[#DCE1EA]
                                                    bg-[#EEF3FF]
                                                    text-xl
                                                    font-bold
                                                    text-[#315A9E]
                                                "
                                            >
                                                AR
                                            </div>

                                            <button
                                                type="button"
                                                className="
                                                    absolute
                                                    bottom-0
                                                    right-0
                                                    flex
                                                    h-7
                                                    w-7
                                                    items-center
                                                    justify-center
                                                    rounded-full
                                                    border-2
                                                    border-white
                                                    bg-[#0757C9]
                                                    text-white
                                                    shadow-sm
                                                "
                                                aria-label="Change profile photo"
                                            >
                                                <Camera size={13} />
                                            </button>

                                        </div>

                                        <div>

                                            <div className="flex items-center gap-2">

                                                <h3 className="text-lg font-bold text-[#242936]">
                                                    Alex Rivera
                                                </h3>

                                                <span
                                                    className="
                                                        rounded-full
                                                        bg-[#E8F0FF]
                                                        px-2
                                                        py-1
                                                        text-[9px]
                                                        font-semibold
                                                        text-[#0757C9]
                                                    "
                                                >
                                                    Administrator
                                                </span>

                                                <span className="flex items-center gap-1 text-[9px] font-semibold text-[#18A957]">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-[#18A957]" />
                                                    Active
                                                </span>

                                            </div>

                                            <p className="mt-1 text-xs text-[#59606E]">
                                                Employee ID: #USR-8421
                                            </p>

                                            <div className="mt-3 flex items-center gap-2">

                                                <button
                                                    type="button"
                                                    className="
                                                        h-8
                                                        rounded-md
                                                        bg-[#0757C9]
                                                        px-4
                                                        text-[10px]
                                                        font-semibold
                                                        text-white
                                                        transition
                                                        hover:bg-[#0045AD]
                                                    "
                                                >
                                                    Change Photo
                                                </button>

                                                <button
                                                    type="button"
                                                    className="
                                                        h-8
                                                        rounded-md
                                                        border
                                                        border-[#D6DAE4]
                                                        bg-white
                                                        px-4
                                                        text-[10px]
                                                        font-semibold
                                                        text-[#454B58]
                                                        transition
                                                        hover:bg-[#F7F8FC]
                                                    "
                                                >
                                                    Delete
                                                </button>

                                            </div>

                                        </div>

                                    </div>

                                    {/* Statistics */}

                                    <div className="flex items-center">

                                        <ProfileStat
                                            value="142"
                                            label="Logins"
                                        />

                                        <ProfileStat
                                            value="12"
                                            label="Updates"
                                        />

                                        <ProfileStat
                                            value="2"
                                            label="Security"
                                        />

                                    </div>

                                </div>

                            </section>

                            {/* =================================================
                                MAIN PROFILE GRID
                            ================================================== */}

                            <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">

                                {/* =================================================
                                    LEFT COLUMN
                                ================================================== */}

                                <div className="space-y-5">

                                    {/* =================================================
                                        PERSONAL INFORMATION
                                    ================================================== */}

                                    <section
                                        className="
                                            rounded-lg
                                            border
                                            border-[#E3E6EC]
                                            bg-white
                                            p-5
                                            shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                        "
                                    >

                                        <div className="flex items-center justify-between">

                                            <h3 className="text-sm font-semibold text-[#242936]">
                                                Personal Information
                                            </h3>

                                            <button
                                                type="button"
                                                className="
                                                    flex
                                                    items-center
                                                    gap-1
                                                    text-[10px]
                                                    font-semibold
                                                    text-[#0757C9]
                                                "
                                            >
                                                <Pencil size={12} />
                                                Edit Details
                                            </button>

                                        </div>

                                        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">

                                            <ProfileInput
                                                label="First Name"
                                                value="Alex"
                                            />

                                            <ProfileInput
                                                label="Last Name"
                                                value="Rivera"
                                            />

                                            <ProfileInput
                                                label="Username"
                                                value="arivera_admin"
                                            />

                                            <ProfileInput
                                                label="Email Address"
                                                value="alex.rivera@bpacloud.com"
                                            />

                                            <ProfileInput
                                                label="Phone Number"
                                                value="+1 (206) 555-0128"
                                            />

                                            <ProfileInput
                                                label="Date of Birth"
                                                value="05/14/1988"
                                            />

                                            <div className="md:col-span-2">

                                                <ProfileInput
                                                    label="Residential Address"
                                                    value="2401 Utah Ave S, Seattle, WA 98134, United States"
                                                />

                                            </div>

                                        </div>

                                    </section>

                                    {/* =================================================
                                        ACCOUNT SETTINGS
                                    ================================================== */}

                                    <section
                                        className="
                                            rounded-lg
                                            border
                                            border-[#E3E6EC]
                                            bg-white
                                            p-5
                                            shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                        "
                                    >

                                        <h3 className="text-sm font-semibold text-[#242936]">
                                            Account Settings
                                        </h3>

                                        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">

                                            <SelectField
                                                label="Interface Language"
                                                value="English (US)"
                                            />

                                            <SelectField
                                                label="Time Zone"
                                                value="Pacific Time (PT) - UTC-8"
                                            />

                                            <SelectField
                                                label="Date Format"
                                                value="MM/DD/YYYY"
                                            />

                                            <SelectField
                                                label="Preferred Theme"
                                                value="Light Mode"
                                            />

                                        </div>

                                        <div className="mt-4 border-t border-[#ECEEF2] pt-4">

                                            <ToggleRow
                                                title="Email Notifications"
                                                description="Receive workflow reports and alerts via email"
                                                enabled={emailNotifications}
                                                onChange={() =>
                                                    setEmailNotifications(
                                                        !emailNotifications,
                                                    )
                                                }
                                            />

                                            <ToggleRow
                                                title="Push Notifications"
                                                description="Enable real-time browser notifications"
                                                enabled={pushNotifications}
                                                onChange={() =>
                                                    setPushNotifications(
                                                        !pushNotifications,
                                                    )
                                                }
                                            />

                                        </div>

                                    </section>

                                </div>

                                {/* =================================================
                                    RIGHT COLUMN
                                ================================================== */}

                                <div className="space-y-5">

                                    {/* =================================================
                                        WORK INFORMATION
                                    ================================================== */}

                                    <section
                                        className="
                                            rounded-lg
                                            border
                                            border-[#E3E6EC]
                                            bg-white
                                            p-5
                                            shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                        "
                                    >

                                        <h3 className="text-sm font-semibold text-[#242936]">
                                            Work Information
                                        </h3>

                                        <div className="mt-5 space-y-4">

                                            <InfoItem
                                                label="Role"
                                                value="Systems Administrator"
                                                badge
                                            />

                                            <InfoItem
                                                label="Department"
                                                value="Engineering"
                                                badge
                                            />

                                            <div>

                                                <p className="text-[9px] font-semibold text-[#59606E]">
                                                    Reporting Manager
                                                </p>

                                                <div className="mt-1 flex items-center gap-2">

                                                    <span
                                                        className="
                                                            flex
                                                            h-5
                                                            w-5
                                                            items-center
                                                            justify-center
                                                            rounded-full
                                                            bg-[#DCE7FF]
                                                            text-[7px]
                                                            font-bold
                                                            text-[#315A9E]
                                                        "
                                                    >
                                                        SJ
                                                    </span>

                                                    <span className="text-[10px] text-[#343A47]">
                                                        Sarah Jenkins (Director of Ops)
                                                    </span>

                                                </div>

                                            </div>

                                            <div>

                                                <p className="text-[9px] font-semibold text-[#59606E]">
                                                    Office Location
                                                </p>

                                                <p className="mt-1 flex items-center gap-1 text-[10px] text-[#343A47]">
                                                    <MapPin size={11} />
                                                    Seattle, WA - HQ
                                                </p>

                                            </div>

                                            <div>

                                                <p className="text-[9px] font-semibold text-[#59606E]">
                                                    Joining Date
                                                </p>

                                                <p className="mt-1 text-[10px] text-[#343A47]">
                                                    October 12, 2021
                                                </p>

                                            </div>

                                        </div>

                                    </section>

                                    {/* =================================================
                                        SECURITY OVERVIEW
                                    ================================================== */}

                                    <section
                                        className="
                                            rounded-lg
                                            border
                                            border-[#E3E6EC]
                                            bg-white
                                            p-5
                                            shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                        "
                                    >

                                        <h3 className="text-sm font-semibold text-[#242936]">
                                            Security Overview
                                        </h3>

                                        <div className="mt-5 space-y-5">

                                            <div className="flex items-center justify-between">

                                                <div className="flex items-center gap-3">

                                                    <span
                                                        className="
                                                            flex
                                                            h-9
                                                            w-9
                                                            items-center
                                                            justify-center
                                                            rounded-full
                                                            bg-[#EEF3FF]
                                                            text-[#0757C9]
                                                        "
                                                    >
                                                        <KeyRound size={16} />
                                                    </span>

                                                    <div>

                                                        <p className="text-[10px] font-semibold text-[#343A47]">
                                                            Password
                                                        </p>

                                                        <p className="text-[9px] text-[#69707D]">
                                                            Last changed 3 months ago
                                                        </p>

                                                    </div>

                                                </div>

                                                <button
                                                    type="button"
                                                    className="text-[9px] font-semibold text-[#0757C9]"
                                                >
                                                    Change
                                                </button>

                                            </div>

                                            <div className="flex items-center justify-between">

                                                <div className="flex items-center gap-3">

                                                    <span
                                                        className="
                                                            flex
                                                            h-9
                                                            w-9
                                                            items-center
                                                            justify-center
                                                            rounded-full
                                                            bg-[#E8F8EF]
                                                            text-[#18A957]
                                                        "
                                                    >
                                                        <Shield size={16} />
                                                    </span>

                                                    <div>

                                                        <p className="text-[10px] font-semibold text-[#343A47]">
                                                            2FA Security
                                                        </p>

                                                        <p className="text-[9px] font-medium text-[#18A957]">
                                                            Enabled
                                                        </p>

                                                        <p className="text-[9px] text-[#18A957]">
                                                            (Authenticator App)
                                                        </p>

                                                    </div>

                                                </div>

                                                <button
                                                    type="button"
                                                    className="text-[9px] font-semibold text-[#0757C9]"
                                                >
                                                    Manage
                                                </button>

                                            </div>

                                        </div>

                                    </section>

                                    {/* =================================================
                                        QUICK ACTIONS
                                    ================================================== */}

                                    <section>

                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8A909B]">
                                            Quick Actions
                                        </p>

                                        <div className="mt-3 space-y-2">

                                            <QuickAction
                                                icon={<Pencil size={15} />}
                                                title="Edit Profile"
                                                description="Update personal details"
                                            />

                                            <QuickAction
                                                icon={<Download size={15} />}
                                                title="Download Info"
                                                description="Export account data (PDF)"
                                            />

                                        </div>

                                    </section>

                                </div>

                            </div>

                            {/* =================================================
                                RECENT LOGIN HISTORY
                            ================================================== */}

                            <section
                                className="
                                    mt-5
                                    overflow-hidden
                                    rounded-lg
                                    border
                                    border-[#E3E6EC]
                                    bg-white
                                    shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                "
                            >

                                <div
                                    className="
                                        flex
                                        items-center
                                        justify-between
                                        border-b
                                        border-[#E6E8ED]
                                        px-5
                                        py-4
                                    "
                                >

                                    <h3 className="text-sm font-semibold text-[#242936]">
                                        Recent Login History
                                    </h3>

                                    <button
                                        type="button"
                                        className="
                                            flex
                                            items-center
                                            gap-1
                                            text-[10px]
                                            font-semibold
                                            text-[#59606E]
                                        "
                                    >
                                        View Full Log
                                        <ExternalLink size={11} />
                                    </button>

                                </div>

                                {/* Table Header */}

                                <div
                                    className="
                                        hidden
                                        grid-cols-[1.2fr_1fr_1fr_1fr_90px]
                                        bg-[#F3F4FD]
                                        px-5
                                        py-3
                                        md:grid
                                    "
                                >

                                    <span className="text-[9px] font-semibold text-[#59606E]">
                                        Date & Time
                                    </span>

                                    <span className="text-[9px] font-semibold text-[#59606E]">
                                        Device
                                    </span>

                                    <span className="text-[9px] font-semibold text-[#59606E]">
                                        Browser
                                    </span>

                                    <span className="text-[9px] font-semibold text-[#59606E]">
                                        IP Address
                                    </span>

                                    <span className="text-[9px] font-semibold text-[#59606E]">
                                        Status
                                    </span>

                                </div>

                                {/* Rows */}

                                {loginHistory.map((login, index) => (

                                    <div
                                        key={`${login.date}-${index}`}
                                        className="
                                            grid
                                            grid-cols-1
                                            gap-2
                                            border-t
                                            border-[#ECEEF2]
                                            px-5
                                            py-4
                                            md:grid-cols-[1.2fr_1fr_1fr_1fr_90px]
                                            md:items-center
                                            md:gap-0
                                        "
                                    >

                                        <span className="text-[10px] text-[#343A47]">
                                            {login.date}
                                        </span>

                                        <span className="flex items-center gap-2 text-[10px] text-[#343A47]">
                                            <Laptop size={13} />
                                            {login.device}
                                        </span>

                                        <span className="text-[10px] text-[#59606E]">
                                            {login.browser}
                                        </span>

                                        <span className="text-[10px] text-[#7A808C]">
                                            {login.ip}
                                        </span>

                                        <span
                                            className={`
                                                w-fit
                                                rounded-full
                                                px-2
                                                py-1
                                                text-[8px]
                                                font-semibold
                                                ${login.status === 'SUCCESS'
                                                    ? 'bg-[#DDF7E8] text-[#168C4B]'
                                                    : 'bg-[#FFE0DD] text-[#D94A43]'
                                                }
                                            `}
                                        >
                                            {login.status}
                                        </span>

                                    </div>

                                ))}

                            </section>

                            {/* =================================================
                                BOTTOM SAVE BAR
                            ================================================== */}

                            <div
                                className="
                                    mt-8
                                    border-t
                                    border-[#E1E4EA]
                                    pt-5
                                "
                            >

                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                                    <p className="text-[10px] text-[#59606E]">
                                        Last updated: 5 minutes ago
                                    </p>

                                    <div className="flex items-center justify-end gap-3">

                                        <button
                                            type="button"
                                            onClick={handleReset}
                                            className="
                                                flex
                                                h-9
                                                items-center
                                                gap-2
                                                rounded-md
                                                bg-[#E8E9F3]
                                                px-5
                                                text-[10px]
                                                font-semibold
                                                text-[#454B58]
                                                transition
                                                hover:bg-[#DFE1EC]
                                            "
                                        >
                                            <RotateCcw size={12} />
                                            Reset to Defaults
                                        </button>

                                        <button
                                            type="button"
                                            className="
                                                h-9
                                                rounded-md
                                                border
                                                border-[#D6DAE4]
                                                bg-white
                                                px-5
                                                text-[10px]
                                                font-semibold
                                                text-[#454B58]
                                                transition
                                                hover:bg-[#F7F8FC]
                                            "
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleSave}
                                            className="
                                                flex
                                                h-9
                                                items-center
                                                gap-2
                                                rounded-md
                                                bg-[#0757C9]
                                                px-5
                                                text-[10px]
                                                font-semibold
                                                text-white
                                                shadow-sm
                                                transition
                                                hover:bg-[#0045AD]
                                            "
                                        >
                                            <Save size={12} />
                                            {saved
                                                ? 'Profile Saved'
                                                : 'Save Profile Changes'}
                                        </button>

                                    </div>

                                </div>

                            </div>

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

/* =========================================================
   PROFILE STAT
========================================================= */

function ProfileStat({ value, label }) {
    return (
        <div
            className="
                min-w-20
                border-l
                border-[#EEF0F4]
                px-6
                text-center
            "
        >
            <p className="text-lg font-bold text-[#0757C9]">
                {value}
            </p>

            <p className="mt-1 text-[9px] text-[#69707D]">
                {label}
            </p>
        </div>
    )
}

/* =========================================================
   PROFILE INPUT
========================================================= */

function ProfileInput({ label, value }) {
    return (
        <div>

            <label className="block text-[9px] font-semibold text-[#59606E]">
                {label}
            </label>

            <input
                type="text"
                value={value}
                readOnly
                className="
                    mt-1
                    h-9
                    w-full
                    rounded-md
                    border
                    border-[#D5D9E5]
                    bg-[#F4F4FC]
                    px-3
                    text-[10px]
                    text-[#343A47]
                    outline-none
                "
            />

        </div>
    )
}

/* =========================================================
   SELECT FIELD
========================================================= */

function SelectField({ label, value }) {
    return (
        <div>

            <label className="block text-[9px] font-semibold text-[#59606E]">
                {label}
            </label>

            <div
                className="
                    mt-1
                    flex
                    h-9
                    items-center
                    justify-between
                    rounded-md
                    border
                    border-[#D5D9E5]
                    bg-[#F4F4FC]
                    px-3
                "
            >

                <span className="text-[10px] text-[#343A47]">
                    {value}
                </span>

                <span className="text-[#59606E]">
                    ▾
                </span>

            </div>

        </div>
    )
}

/* =========================================================
   INFO ITEM
========================================================= */

function InfoItem({ label, value, badge = false }) {
    return (
        <div>

            <p className="text-[9px] font-semibold text-[#59606E]">
                {label}
            </p>

            {badge ? (
                <span
                    className="
                        mt-1
                        inline-block
                        rounded-md
                        bg-[#EEEFFA]
                        px-2
                        py-1
                        text-[9px]
                        font-medium
                        text-[#454B58]
                    "
                >
                    {value}
                </span>
            ) : (
                <p className="mt-1 text-[10px] text-[#343A47]">
                    {value}
                </p>
            )}

        </div>
    )
}

/* =========================================================
   TOGGLE ROW
========================================================= */

function ToggleRow({
    title,
    description,
    enabled,
    onChange,
}) {
    return (
        <div className="flex items-center justify-between py-2">

            <div>

                <p className="text-[10px] font-semibold text-[#343A47]">
                    {title}
                </p>

                <p className="text-[9px] text-[#69707D]">
                    {description}
                </p>

            </div>

            <button
                type="button"
                onClick={onChange}
                aria-label={`Toggle ${title}`}
                className={`
                    relative
                    h-5
                    w-8
                    rounded-full
                    transition
                    ${enabled
                        ? 'bg-[#0757C9]'
                        : 'bg-[#DCE0EA]'
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
                            ? 'left-3.5'
                            : 'left-0.5'
                        }
                    `}
                />

            </button>

        </div>
    )
}

/* =========================================================
   QUICK ACTION
========================================================= */

function QuickAction({
    icon,
    title,
    description,
}) {
    return (
        <button
            type="button"
            className="
                flex
                min-h-16
                w-full
                items-center
                gap-3
                rounded-lg
                border
                border-[#E3E6EC]
                bg-white
                px-4
                text-left
                shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                transition
                hover:border-[#C8D5F2]
                hover:bg-[#FBFCFF]
            "
        >

            <span
                className="
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-md
                    bg-[#EEF3FF]
                    text-[#0757C9]
                "
            >
                {icon}
            </span>

            <span>

                <span className="block text-[10px] font-semibold text-[#343A47]">
                    {title}
                </span>

                <span className="mt-0.5 block text-[8px] text-[#7A808C]">
                    {description}
                </span>

            </span>

        </button>
    )
}

export default AdminProfile