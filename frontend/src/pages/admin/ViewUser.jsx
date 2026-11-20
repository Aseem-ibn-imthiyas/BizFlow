import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
    ArrowLeft,
    Bell,
    CircleHelp,
    Search,
    UserRound,
    Mail,
    Phone,
    BriefcaseBusiness,
    Shield,
    CalendarDays,
    MapPin,
    LoaderCircle,
    Check,
    Pencil,
} from 'lucide-react'
import { auth } from '../../config/firebase'
import AdminSidebar from '../../components/sidebar/AdminSidebar'

const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
).replace(/\/+$/, '')

// Keep Detail OUTSIDE ViewUser to prevent ESLint static-components errors.
function Detail({ label, value, icon: Icon }) {
    return (
        <div>
            <p className="mb-1.5 text-[10px] font-medium text-[#7A808C]">
                {label}
            </p>

            <div className="flex min-h-10 items-center gap-2 rounded-md border border-[#E6E8ED] bg-[#FAFBFD] px-3 py-2">
                {Icon && (
                    <Icon
                        size={14}
                        className="shrink-0 text-[#7D8491]"
                    />
                )}

                <p className="wrap-break-word text-xs text-[#343A47]">
                    {value || 'Not provided'}
                </p>
            </div>
        </div>
    )
}

function ViewUser() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // Load the selected user's details from the backend.
    useEffect(() => {
        let cancelled = false

        const loadUser = async () => {
            setLoading(true)
            setError('')

            try {
                if (!id) {
                    throw new Error('A user ID was not provided.')
                }

                const currentUser = auth.currentUser

                if (!currentUser) {
                    throw new Error(
                        'Your administrator session has expired. Please sign in again.'
                    )
                }

                const token = await currentUser.getIdToken()

                const response = await fetch(
                    `${API_BASE_URL}/api/users/${encodeURIComponent(id)}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                )

                const result = await response.json().catch(() => ({}))

                if (!response.ok || result.success === false) {
                    throw new Error(
                        result.message || 'Unable to load this user.'
                    )
                }

                const profile =
                    result.user ||
                    result.data?.user ||
                    result.data ||
                    result

                if (
                    !profile ||
                    !(profile._id || profile.mongoId || profile.id)
                ) {
                    throw new Error(
                        'The API response did not contain a valid user profile.'
                    )
                }

                if (!cancelled) {
                    setUser(profile)
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.message || 'Unable to load this user.'
                    )
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        loadUser()

        return () => {
            cancelled = true
        }
    }, [id])

    // User details.
    const fullName = user?.fullName || user?.name || 'Unnamed User'
    const email = user?.email || ''
    const role = user?.role || 'Staff'
    const status = user?.status || 'Active'
    const phone = user?.phone || ''
    const department = user?.department || ''
    const username = user?.username || ''
    const employeeId = user?.employeeId || ''
    const dob = user?.dob ? String(user.dob).slice(0, 10) : ''
    const gender = user?.gender || ''
    const address = user?.address || ''
    const profileImage = user?.profileImage || ''

    const statusClass =
        String(status).toLowerCase() === 'active'
            ? 'bg-[#EAF7EF] text-[#168447]'
            : String(status).toLowerCase() === 'suspended'
                ? 'bg-red-50 text-red-700'
                : 'bg-[#F1F3F7] text-[#59606E]'

    return (
        <main className="h-screen w-full overflow-hidden bg-[#FBFCFE] text-[#171B25]">
            <div className="flex h-screen w-full overflow-hidden">
                <AdminSidebar />

                <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
                    {/* Header */}
                    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-[#E1E4EA] bg-white px-6 lg:px-8">
                        <div className="relative w-72">
                            <Search
                                size={16}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7D8491]"
                            />

                            <input
                                type="text"
                                placeholder="Search users, reports, settings..."
                                className="h-9 w-full rounded-md border border-transparent bg-[#F1F3FA] pl-10 pr-4 text-xs outline-none placeholder:text-[#8B919D] focus:border-[#D4DCF0] focus:bg-white"
                            />
                        </div>

                        <div className="flex items-center gap-5">
                            <button
                                type="button"
                                aria-label="Notifications"
                                className="text-[#59606E] hover:text-[#0757C9]"
                            >
                                <Bell size={18} />
                            </button>

                            <button
                                type="button"
                                aria-label="Help"
                                className="text-[#59606E] hover:text-[#0757C9]"
                            >
                                <CircleHelp size={18} />
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

                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DDE5F5] text-xs font-semibold text-[#315A9E]">
                                    AU
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Main content */}
                    <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
                        <div className="px-6 py-6 lg:px-8">
                            {/* Page title and buttons */}
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-[#343A47]">
                                            Home
                                        </span>

                                        <span className="text-[#A1A6B0]">
                                            ›
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate('/admin/users')
                                            }
                                            className="text-[#343A47] hover:text-[#0757C9]"
                                        >
                                            User Management
                                        </button>

                                        <span className="text-[#A1A6B0]">
                                            ›
                                        </span>

                                        <span className="font-medium text-[#0757C9]">
                                            View User
                                        </span>
                                    </div>

                                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#171B25]">
                                        View User
                                    </h1>

                                    <p className="mt-1 text-sm text-[#69707D]">
                                        Review the user's profile and account
                                        access details.
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            navigate('/admin/users')
                                        }
                                        className="flex h-9 items-center gap-2 rounded-md border border-[#D5D9E2] bg-white px-4 text-xs font-medium text-[#343A47] hover:bg-[#F8FAFC]"
                                    >
                                        <ArrowLeft size={14} />
                                        Back to Users
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            navigate(
                                                `/admin/users/edit/${encodeURIComponent(id)}`
                                            )
                                        }
                                        disabled={!user}
                                        className="flex h-9 items-center gap-2 rounded-md bg-[#0757C9] px-4 text-xs font-semibold text-white hover:bg-[#0045AD] disabled:opacity-50"
                                    >
                                        <Pencil size={14} />
                                        Edit User
                                    </button>
                                </div>
                            </div>

                            {/* Error message */}
                            {error && (
                                <div
                                    role="alert"
                                    className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                                >
                                    {error}
                                </div>
                            )}

                            {/* Loading state */}
                            {loading ? (
                                <div className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-[#E6E8ED] bg-white p-12 text-sm text-[#69707D]">
                                    <LoaderCircle
                                        size={18}
                                        className="animate-spin"
                                    />
                                    Loading user profile...
                                </div>
                            ) : user ? (
                                <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
                                    <div className="space-y-5">
                                        {/* Personal Information */}
                                        <section className="rounded-lg border border-[#E6E8ED] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                                            <div className="flex items-center justify-between border-b border-[#ECEEF2] px-5 py-4">
                                                <h2 className="text-sm font-semibold text-[#242936]">
                                                    Personal Information
                                                </h2>

                                                <span className="text-[9px] font-medium uppercase text-[#8A909B]">
                                                    Section 01
                                                </span>
                                            </div>

                                            <div className="p-5">
                                                <div className="mb-6 flex items-center gap-4">
                                                    {profileImage ? (
                                                        <img
                                                            src={profileImage}
                                                            alt={`${fullName} profile`}
                                                            className="h-14 w-14 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#EEF0FA] text-[#8C93A4]">
                                                            <UserRound
                                                                size={25}
                                                            />
                                                        </div>
                                                    )}

                                                    <div>
                                                        <p className="text-xs font-semibold text-[#343A47]">
                                                            {fullName}
                                                        </p>

                                                        <p className="mt-1 text-[10px] text-[#7A808C]">
                                                            User profile details
                                                            (read-only)
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                    <Detail
                                                        label="Full Name"
                                                        value={fullName}
                                                        icon={UserRound}
                                                    />

                                                    <Detail
                                                        label="Username"
                                                        value={username}
                                                    />

                                                    <Detail
                                                        label="Email Address"
                                                        value={email}
                                                        icon={Mail}
                                                    />

                                                    <Detail
                                                        label="Phone Number"
                                                        value={phone}
                                                        icon={Phone}
                                                    />

                                                    <Detail
                                                        label="NIC / Employee ID"
                                                        value={employeeId}
                                                        icon={BriefcaseBusiness}
                                                    />

                                                    <Detail
                                                        label="Department"
                                                        value={department}
                                                        icon={BriefcaseBusiness}
                                                    />

                                                    <Detail
                                                        label="Date of Birth"
                                                        value={dob}
                                                        icon={CalendarDays}
                                                    />

                                                    <Detail
                                                        label="Gender"
                                                        value={gender}
                                                        icon={UserRound}
                                                    />

                                                    <div className="md:col-span-2">
                                                        <Detail
                                                            label="Address"
                                                            value={address}
                                                            icon={MapPin}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        {/* Account Information */}
                                        <section className="rounded-lg border border-[#E6E8ED] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                                            <div className="flex items-center justify-between border-b border-[#ECEEF2] px-5 py-4">
                                                <h2 className="text-sm font-semibold text-[#242936]">
                                                    Account Information
                                                </h2>

                                                <span className="text-[9px] font-medium uppercase text-[#8A909B]">
                                                    Section 02
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
                                                <Detail
                                                    label="User Role"
                                                    value={role}
                                                    icon={Shield}
                                                />

                                                <div>
                                                    <p className="mb-1.5 text-[10px] font-medium text-[#7A808C]">
                                                        Account Status
                                                    </p>

                                                    <div className="flex min-h-10 items-center rounded-md border border-[#E6E8ED] bg-[#FAFBFD] px-3 py-2">
                                                        <span
                                                            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusClass}`}
                                                        >
                                                            {status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    </div>

                                    {/* Profile sidebar */}
                                    <aside className="space-y-4">
                                        <section className="overflow-hidden rounded-lg border border-[#E6E8ED] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.07)]">
                                            <div className="border-b border-[#ECEEF2] bg-[#F7F8FC] px-5 py-5 text-center">
                                                <p className="font-serif text-2xl tracking-[0.08em] text-[#49372F]">
                                                    BIZFLOW
                                                </p>

                                                <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.18em] text-[#7A808C]">
                                                    User Profile
                                                </p>

                                                {profileImage ? (
                                                    <img
                                                        src={profileImage}
                                                        alt={`${fullName} profile`}
                                                        className="mx-auto mt-5 h-16 w-16 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#DDE5F5] text-[#315A9E]">
                                                        <UserRound size={30} />
                                                    </div>
                                                )}

                                                <h2 className="mt-3 wrap-break-word text-sm font-semibold text-[#242936]">
                                                    {fullName}
                                                </h2>

                                                <p className="mt-1 break-all text-[10px] text-[#737A87]">
                                                    {email || 'No email available'}
                                                </p>

                                                <span
                                                    className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[9px] font-semibold ${statusClass}`}
                                                >
                                                    {status}
                                                </span>
                                            </div>

                                            <div className="space-y-3 p-5">
                                                <div className="flex items-center justify-between gap-3 text-xs">
                                                    <span className="text-[#7A808C]">
                                                        Role
                                                    </span>

                                                    <span className="text-right font-medium text-[#343A47]">
                                                        {role}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between gap-3 text-xs">
                                                    <span className="text-[#7A808C]">
                                                        Department
                                                    </span>

                                                    <span className="text-right font-medium text-[#343A47]">
                                                        {department || 'Not set'}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between gap-3 text-xs">
                                                    <span className="text-[#7A808C]">
                                                        Phone
                                                    </span>

                                                    <span className="text-right font-medium text-[#343A47]">
                                                        {phone || 'Not set'}
                                                    </span>
                                                </div>
                                            </div>
                                        </section>

                                        {/* Account Summary */}
                                        <section className="rounded-lg border border-[#E6E8ED] bg-white p-5">
                                            <h3 className="text-xs font-semibold text-[#242936]">
                                                Account Summary
                                            </h3>

                                            <p className="mt-2 text-[10px] leading-5 text-[#69707D]">
                                                This page is read-only. To
                                                change the user's details,
                                                select Edit User.
                                            </p>

                                            <div className="mt-3 flex items-center gap-2 text-[10px] text-[#59606E]">
                                                <Check
                                                    size={13}
                                                    className="text-[#168447]"
                                                />
                                                Profile loaded from BizFlow API
                                            </div>
                                        </section>
                                    </aside>
                                </div>
                            ) : null}

                            {/* Footer */}
                            <footer className="mt-8 border-t border-[#E1E4EA] py-5">
                                <div className="flex flex-col gap-3 text-[10px] text-[#59606E] sm:flex-row sm:items-center sm:justify-between">
                                    <p>
                                        © 2026 Business Process Automation
                                        System | Cloud-Based SaaS Platform
                                    </p>

                                    <div className="flex gap-5 text-[#343A47]">
                                        <span>Privacy Policy</span>
                                        <span>Terms of Service</span>
                                        <span>Compliance</span>
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

export default ViewUser