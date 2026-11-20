import AdminSidebar from '../../components/sidebar/AdminSidebar'
import { useState } from 'react'
import {
    Bell,
    CircleHelp,
    Search,
    ShieldCheck as ShieldIcon,
    CheckCircle2,
    Circle,
    Eye,
    EyeOff,
    Lightbulb,
    Monitor,
    Smartphone,
} from 'lucide-react'

function AdminChangePassword() {
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const [currentPassword, setCurrentPassword] =
        useState('AdminPassword123')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const [logoutOtherDevices, setLogoutOtherDevices] = useState(false)
    const [emailConfirmation, setEmailConfirmation] = useState(true)

    /*
    =========================================================
    PASSWORD STRENGTH
    =========================================================
    */

    const getPasswordStrength = () => {
        if (!newPassword) {
            return {
                label: '',
                score: 0,
            }
        }

        let score = 0

        if (newPassword.length >= 8) score++
        if (/[A-Z]/.test(newPassword)) score++
        if (/[a-z]/.test(newPassword)) score++
        if (/[0-9]/.test(newPassword)) score++
        if (/[^A-Za-z0-9]/.test(newPassword)) score++

        if (score <= 2) {
            return {
                label: 'WEAK',
                score,
            }
        }

        if (score === 3) {
            return {
                label: 'MEDIUM',
                score,
            }
        }

        return {
            label: 'STRONG',
            score,
        }
    }

    const passwordStrength = getPasswordStrength()

    /*
    =========================================================
    PASSWORD REQUIREMENTS
    =========================================================
    */

    const requirements = [
        {
            label: 'At least 8 characters long',
            valid: newPassword.length >= 8,
        },
        {
            label: 'Include both upper and lowercase',
            valid:
                /[A-Z]/.test(newPassword) &&
                /[a-z]/.test(newPassword),
        },
        {
            label: 'Include at least one number',
            valid: /[0-9]/.test(newPassword),
        },
        {
            label: 'Include a special character (#?!@$%^&*)',
            valid: /[^A-Za-z0-9]/.test(newPassword),
        },
    ]

    /*
    =========================================================
    FORM ACTIONS
    =========================================================
    */

    const handleSaveChanges = () => {
        console.log('Password changes:', {
            currentPassword,
            newPassword,
            confirmPassword,
            logoutOtherDevices,
            emailConfirmation,
        })

        alert('Password changes saved successfully.')
    }

    const handleUpdatePassword = () => {
        if (!currentPassword) {
            alert('Please enter your current password.')
            return
        }

        if (!newPassword) {
            alert('Please enter a new password.')
            return
        }

        if (newPassword !== confirmPassword) {
            alert('New password and confirmation password do not match.')
            return
        }

        if (passwordStrength.score < 4) {
            alert('Please create a stronger password.')
            return
        }

        alert('Password updated successfully.')
    }

    const handleClearForm = () => {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
    }

    const handleCancel = () => {
        setCurrentPassword('AdminPassword123')
        setNewPassword('')
        setConfirmPassword('')
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

                            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">

                                <div>

                                    <div className="flex items-center gap-2 text-xs">

                                        <span className="text-[#343A47]">
                                            Home
                                        </span>

                                        <span className="text-[#A1A6B0]">
                                            ›
                                        </span>

                                        <span className="text-[#343A47]">
                                            Profile
                                        </span>

                                        <span className="text-[#A1A6B0]">
                                            ›
                                        </span>

                                        <span className="font-medium text-[#0757C9]">
                                            Change Password
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
                                        Change Password
                                    </h2>

                                    <p className="mt-1 text-sm text-[#69707D]">
                                        Update your account password to keep your account secure.
                                    </p>

                                </div>

                                <div className="flex items-center gap-2">

                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="
                                            h-9
                                            rounded-md
                                            border
                                            border-[#C9CEDA]
                                            bg-white
                                            px-5
                                            text-xs
                                            font-semibold
                                            text-[#343A47]
                                            transition
                                            hover:bg-[#F7F8FC]
                                        "
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleSaveChanges}
                                        className="
                                            h-9
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
                                        Save Changes
                                    </button>

                                </div>

                            </div>

                            {/* =================================================
                                MAIN GRID
                            ================================================== */}

                            <div
                                className="
                                    mt-6
                                    grid
                                    grid-cols-1
                                    gap-4
                                    xl:grid-cols-[275px_minmax(0,1fr)]
                                "
                            >

                                {/* =================================================
                                    LEFT COLUMN
                                ================================================== */}

                                <div className="space-y-4">

                                    {/* SECURITY OVERVIEW */}

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

                                        <div className="flex items-center gap-3">

                                            <div
                                                className="
                                                    flex
                                                    h-9
                                                    w-9
                                                    items-center
                                                    justify-center
                                                    rounded-full
                                                    bg-[#EEF3FF]
                                                    text-[#315A9E]
                                                "
                                            >
                                                <ShieldIcon
                                                    size={18}
                                                    strokeWidth={1.7}
                                                />
                                            </div>

                                            <h3 className="text-sm font-medium text-[#343A47]">
                                                Security Overview
                                            </h3>

                                        </div>

                                        <div className="mt-5 space-y-4">

                                            <div className="flex items-center justify-between">

                                                <span className="text-xs text-[#59606E]">
                                                    Status
                                                </span>

                                                <span
                                                    className="
                                                        rounded-full
                                                        bg-[#DDF8E8]
                                                        px-3
                                                        py-1
                                                        text-[9px]
                                                        font-semibold
                                                        text-[#168C4B]
                                                    "
                                                >
                                                    STRONG PASSWORD
                                                </span>

                                            </div>

                                            <div className="flex items-center justify-between">

                                                <span className="text-xs text-[#59606E]">
                                                    Last Changed
                                                </span>

                                                <span className="text-xs font-medium text-[#343A47]">
                                                    90 Days Ago
                                                </span>

                                            </div>

                                            <div className="flex items-center justify-between">

                                                <span className="text-xs text-[#59606E]">
                                                    2FA
                                                </span>

                                                <span className="flex items-center gap-1 text-xs font-semibold text-[#18A957]">
                                                    <CheckCircle2 size={13} />
                                                    Enabled
                                                </span>

                                            </div>

                                        </div>

                                        <div className="mt-5 border-t border-[#ECEEF2] pt-4">

                                            <p className="text-[9px] font-semibold text-[#343A47]">
                                                Recommendation:
                                            </p>

                                            <p className="mt-2 text-[10px] italic leading-5 text-[#315A9E]">
                                                "It is recommended to change your password every 180 days to maintain optimal account security."
                                            </p>

                                        </div>

                                    </section>

                                    {/* PASSWORD REQUIREMENTS */}

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

                                        <h3 className="text-sm font-medium text-[#343A47]">
                                            Password Requirements
                                        </h3>

                                        <div className="mt-4 space-y-3">

                                            {requirements.map((requirement) => (

                                                <div
                                                    key={requirement.label}
                                                    className="flex items-center gap-2"
                                                >

                                                    {requirement.valid ? (
                                                        <CheckCircle2
                                                            size={13}
                                                            className="shrink-0 text-[#18A957]"
                                                        />
                                                    ) : (
                                                        <Circle
                                                            size={13}
                                                            className="shrink-0 text-[#BFC5D1]"
                                                        />
                                                    )}

                                                    <span
                                                        className={`
                                                            text-[10px]
                                                            ${requirement.valid
                                                                ? 'text-[#343A47]'
                                                                : 'text-[#59606E]'
                                                            }
                                                        `}
                                                    >
                                                        {requirement.label}
                                                    </span>

                                                </div>

                                            ))}

                                        </div>

                                    </section>

                                    {/* SECURITY TIPS */}

                                    <section
                                        className="
                                            rounded-lg
                                            border
                                            border-[#C9DAF8]
                                            bg-[#F2F6FF]
                                            p-4
                                        "
                                    >

                                        <div className="flex items-center gap-2">

                                            <Lightbulb
                                                size={15}
                                                className="text-[#0757C9]"
                                            />

                                            <p className="text-xs font-medium text-[#0757C9]">
                                                Security Tips
                                            </p>

                                        </div>

                                        <div className="mt-3 space-y-3">

                                            <div
                                                className="
                                                    rounded-md
                                                    border
                                                    border-[#DCE6FA]
                                                    bg-white/60
                                                    p-3
                                                "
                                            >

                                                <p className="text-[9px] font-bold uppercase tracking-wide text-[#0757C9]">
                                                    UNIQUE PASSWORDS
                                                </p>

                                                <p className="mt-1 text-[10px] leading-4 text-[#59606E]">
                                                    Avoid using the same password for multiple internal services.
                                                </p>

                                            </div>

                                            <div
                                                className="
                                                    rounded-md
                                                    border
                                                    border-[#DCE6FA]
                                                    bg-white/60
                                                    p-3
                                                "
                                            >

                                                <p className="text-[9px] font-bold uppercase tracking-wide text-[#0757C9]">
                                                    MULTI-FACTOR AUTH
                                                </p>

                                                <p className="mt-1 text-[10px] leading-4 text-[#59606E]">
                                                    Always keep 2FA enabled to add an extra layer of defense.
                                                </p>

                                            </div>

                                        </div>

                                    </section>

                                </div>

                                {/* =================================================
                                    RIGHT COLUMN
                                ================================================== */}

                                <div className="space-y-4">

                                    {/* PASSWORD FORM */}

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

                                        {/* Current Password */}

                                        <div>

                                            <div className="flex items-center justify-between">

                                                <label className="text-xs font-medium text-[#343A47]">
                                                    Current Password
                                                </label>

                                                <button
                                                    type="button"
                                                    className="text-[10px] font-medium text-[#0757C9] hover:underline"
                                                >
                                                    Forgot password?
                                                </button>

                                            </div>

                                            <div className="relative mt-2">

                                                <input
                                                    type={
                                                        showCurrentPassword
                                                            ? 'text'
                                                            : 'password'
                                                    }
                                                    value={currentPassword}
                                                    onChange={(e) =>
                                                        setCurrentPassword(
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="
                                                        h-10
                                                        w-full
                                                        rounded-md
                                                        border
                                                        border-[#D9DDE7]
                                                        bg-[#F3F3FD]
                                                        px-3
                                                        pr-10
                                                        text-xs
                                                        text-[#343A47]
                                                        outline-none
                                                        transition
                                                        focus:border-[#9DB7E8]
                                                        focus:bg-white
                                                    "
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowCurrentPassword(
                                                            !showCurrentPassword,
                                                        )
                                                    }
                                                    className="
                                                        absolute
                                                        right-3
                                                        top-1/2
                                                        -translate-y-1/2
                                                        text-[#737A87]
                                                    "
                                                >
                                                    {showCurrentPassword ? (
                                                        <EyeOff size={15} />
                                                    ) : (
                                                        <Eye size={15} />
                                                    )}
                                                </button>

                                            </div>

                                        </div>

                                        {/* New Password */}

                                        <div className="mt-5">

                                            <label className="text-xs font-medium text-[#343A47]">
                                                New Password
                                            </label>

                                            <div className="relative mt-2">

                                                <input
                                                    type={
                                                        showNewPassword
                                                            ? 'text'
                                                            : 'password'
                                                    }
                                                    value={newPassword}
                                                    onChange={(e) =>
                                                        setNewPassword(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Enter new password"
                                                    className="
                                                        h-10
                                                        w-full
                                                        rounded-md
                                                        border
                                                        border-[#D9DDE7]
                                                        bg-[#F3F3FD]
                                                        px-3
                                                        pr-10
                                                        text-xs
                                                        text-[#343A47]
                                                        outline-none
                                                        transition
                                                        placeholder:text-[#969CAA]
                                                        focus:border-[#9DB7E8]
                                                        focus:bg-white
                                                    "
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowNewPassword(
                                                            !showNewPassword,
                                                        )
                                                    }
                                                    className="
                                                        absolute
                                                        right-3
                                                        top-1/2
                                                        -translate-y-1/2
                                                        text-[#737A87]
                                                    "
                                                >
                                                    {showNewPassword ? (
                                                        <EyeOff size={15} />
                                                    ) : (
                                                        <Eye size={15} />
                                                    )}
                                                </button>

                                            </div>

                                            {/* Strength */}

                                            <div className="mt-3">

                                                <div className="flex items-center justify-between">

                                                    <span className="text-[8px] font-bold uppercase text-[#59606E]">
                                                        Password Strength
                                                    </span>

                                                    <span
                                                        className={`
                                                            text-[8px]
                                                            font-bold
                                                            ${passwordStrength.label === 'STRONG'
                                                                ? 'text-[#18A957]'
                                                                : passwordStrength.label === 'MEDIUM'
                                                                    ? 'text-[#F06B28]'
                                                                    : 'text-[#D64545]'
                                                            }
                                                        `}
                                                    >
                                                        {passwordStrength.label || 'MEDIUM'}
                                                    </span>

                                                </div>

                                                <div className="mt-2 flex gap-1">

                                                    {[1, 2, 3, 4].map((bar) => (

                                                        <div
                                                            key={bar}
                                                            className={`
                                                                h-1
                                                                flex-1
                                                                rounded-full
                                                                ${bar <= passwordStrength.score
                                                                    ? passwordStrength.score >= 4
                                                                        ? 'bg-[#18A957]'
                                                                        : 'bg-[#F06B28]'
                                                                    : 'bg-[#E2E5ED]'
                                                                }
                                                            `}
                                                        />

                                                    ))}

                                                </div>

                                            </div>

                                        </div>

                                        {/* Confirm Password */}

                                        <div className="mt-5">

                                            <label className="text-xs font-medium text-[#343A47]">
                                                Confirm New Password
                                            </label>

                                            <div className="relative mt-2">

                                                <input
                                                    type={
                                                        showConfirmPassword
                                                            ? 'text'
                                                            : 'password'
                                                    }
                                                    value={confirmPassword}
                                                    onChange={(e) =>
                                                        setConfirmPassword(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Repeat new password"
                                                    className="
                                                        h-10
                                                        w-full
                                                        rounded-md
                                                        border
                                                        border-[#D9DDE7]
                                                        bg-[#F3F3FD]
                                                        px-3
                                                        pr-10
                                                        text-xs
                                                        text-[#343A47]
                                                        outline-none
                                                        transition
                                                        placeholder:text-[#969CAA]
                                                        focus:border-[#9DB7E8]
                                                        focus:bg-white
                                                    "
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowConfirmPassword(
                                                            !showConfirmPassword,
                                                        )
                                                    }
                                                    className="
                                                        absolute
                                                        right-3
                                                        top-1/2
                                                        -translate-y-1/2
                                                        text-[#737A87]
                                                    "
                                                >
                                                    {showConfirmPassword ? (
                                                        <EyeOff size={15} />
                                                    ) : (
                                                        <Eye size={15} />
                                                    )}
                                                </button>

                                            </div>

                                            {confirmPassword &&
                                                newPassword !==
                                                confirmPassword && (
                                                    <p className="mt-1 text-[9px] text-[#D64545]">
                                                        Passwords do not match.
                                                    </p>
                                                )}

                                        </div>

                                        {/* Toggles */}

                                        <div className="mt-6 space-y-4 border-b border-[#ECEEF2] pb-5">

                                            {/* Logout devices */}

                                            <div className="flex items-center justify-between gap-4">

                                                <div>

                                                    <p className="text-[10px] font-medium text-[#343A47]">
                                                        Sign out from all other devices
                                                    </p>

                                                    <p className="text-[9px] text-[#59606E]">
                                                        Ensures your session is unique after password change
                                                    </p>

                                                </div>

                                                <Toggle
                                                    enabled={logoutOtherDevices}
                                                    onClick={() =>
                                                        setLogoutOtherDevices(
                                                            !logoutOtherDevices,
                                                        )
                                                    }
                                                />

                                            </div>

                                            {/* Email confirmation */}

                                            <div className="flex items-center justify-between gap-4">

                                                <div>

                                                    <p className="text-[10px] font-medium text-[#343A47]">
                                                        Email confirmation
                                                    </p>

                                                    <p className="text-[9px] text-[#59606E]">
                                                        Send a security alert to my primary email address
                                                    </p>

                                                </div>

                                                <Toggle
                                                    enabled={emailConfirmation}
                                                    onClick={() =>
                                                        setEmailConfirmation(
                                                            !emailConfirmation,
                                                        )
                                                    }
                                                />

                                            </div>

                                        </div>

                                        {/* Form Actions */}

                                        <div className="mt-5 flex items-center justify-end gap-6">

                                            <button
                                                type="button"
                                                onClick={handleCancel}
                                                className="
                                                    text-[10px]
                                                    font-semibold
                                                    text-[#59606E]
                                                    hover:text-[#0757C9]
                                                "
                                            >
                                                Cancel
                                            </button>

                                            <button
                                                type="button"
                                                onClick={handleClearForm}
                                                className="
                                                    text-[10px]
                                                    font-semibold
                                                    text-[#59606E]
                                                    hover:text-[#0757C9]
                                                "
                                            >
                                                Clear Form
                                            </button>

                                            <button
                                                type="button"
                                                onClick={handleUpdatePassword}
                                                className="
                                                    h-9
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
                                                Update Password
                                            </button>

                                        </div>

                                    </section>

                                    {/* =================================================
                                        CURRENT LOGIN SESSIONS
                                    ================================================== */}

                                    <section
                                        className="
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
                                                border-[#E5E8EF]
                                                px-5
                                                py-4
                                            "
                                        >

                                            <h3 className="text-sm font-medium text-[#343A47]">
                                                Current Login Sessions
                                            </h3>

                                            <button
                                                type="button"
                                                className="
                                                    text-[9px]
                                                    font-semibold
                                                    text-[#0757C9]
                                                    hover:underline
                                                "
                                            >
                                                Log out all devices
                                            </button>

                                        </div>

                                        {/* Table Header */}

                                        <div
                                            className="
                                                grid
                                                grid-cols-[1.3fr_1fr_1fr_0.8fr]
                                                bg-[#F8F8FF]
                                                px-5
                                                py-4
                                            "
                                        >

                                            <span className="text-[9px] font-bold uppercase text-[#59606E]">
                                                Device & Browser
                                            </span>

                                            <span className="text-[9px] font-bold uppercase text-[#59606E]">
                                                IP Address
                                            </span>

                                            <span className="text-[9px] font-bold uppercase text-[#59606E]">
                                                Location
                                            </span>

                                            <span className="text-[9px] font-bold uppercase text-[#59606E]">
                                                Status
                                            </span>

                                        </div>

                                        {/* Windows Session */}

                                        <div
                                            className="
                                                grid
                                                grid-cols-[1.3fr_1fr_1fr_0.8fr]
                                                items-center
                                                border-t
                                                border-[#ECEEF2]
                                                px-5
                                                py-4
                                            "
                                        >

                                            <div className="flex items-center gap-3">

                                                <Monitor
                                                    size={16}
                                                    strokeWidth={1.7}
                                                    className="text-[#59606E]"
                                                />

                                                <div>

                                                    <p className="text-[10px] font-semibold text-[#343A47]">
                                                        Windows PC
                                                    </p>

                                                    <p className="text-[8px] text-[#59606E]">
                                                        Chrome Browser
                                                    </p>

                                                </div>

                                            </div>

                                            <span className="text-[9px] text-[#59606E]">
                                                192.168.1.1
                                            </span>

                                            <span className="text-[9px] text-[#59606E]">
                                                New York, USA
                                            </span>

                                            <span className="flex items-center gap-1 text-[8px] font-bold text-[#0757C9]">
                                                <span className="h-1.5 w-1.5 rounded-full bg-[#0757C9]" />
                                                CURRENT DEVICE
                                            </span>

                                        </div>

                                        {/* Android Session */}

                                        <div
                                            className="
                                                grid
                                                grid-cols-[1.3fr_1fr_1fr_0.8fr]
                                                items-center
                                                border-t
                                                border-[#ECEEF2]
                                                px-5
                                                py-4
                                            "
                                        >

                                            <div className="flex items-center gap-3">

                                                <Smartphone
                                                    size={16}
                                                    strokeWidth={1.7}
                                                    className="text-[#59606E]"
                                                />

                                                <div>

                                                    <p className="text-[10px] font-semibold text-[#343A47]">
                                                        Android Phone
                                                    </p>

                                                    <p className="text-[8px] text-[#59606E]">
                                                        Mobile App v2.4
                                                    </p>

                                                </div>

                                            </div>

                                            <span className="text-[9px] text-[#59606E]">
                                                104.28.12.98
                                            </span>

                                            <span className="text-[9px] text-[#59606E]">
                                                London, UK
                                            </span>

                                            <span className="text-[8px] font-semibold text-[#343A47]">
                                                ACTIVE
                                            </span>

                                        </div>

                                    </section>

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
   TOGGLE COMPONENT
========================================================= */

function Toggle({ enabled, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label="Toggle setting"
            className={`
                relative
                h-4
                w-8
                shrink-0
                rounded-full
                transition
                ${enabled
                    ? 'bg-[#0757C9]'
                    : 'bg-[#D9DDE7]'
                }
            `}
        >
            <span
                className={`
                    absolute
                    top-0.5
                    h-3
                    w-3
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
    )
}

export default AdminChangePassword