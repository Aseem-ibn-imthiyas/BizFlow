import { useState } from 'react'
import {
    createUserWithEmailAndPassword,
    deleteUser,
} from 'firebase/auth'

import { auth } from '../../config/firebase'
import { userCreationAuth } from '../../config/userCreationAuth'
import AdminSidebar from '../../components/sidebar/AdminSidebar'
import {
    Bell,
    CircleHelp,
    Search,
    Plus,
    UserRound,
    Mail,
    Phone,
    BriefcaseBusiness,
    CalendarDays,
    MapPin,
    LockKeyhole,
    Eye,
    EyeOff,
    ChevronDown,
    Shield,
    Info,
    Check,
} from 'lucide-react'

function AddUser() {

    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        phone: '',
        employeeId: '',
        department: '',
        dob: '',
        gender: '',
        address: '',
        role: 'Staff',
        password: '',
        confirmPassword: '',
    })

    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')
    const [submitSuccess, setSubmitSuccess] = useState('')

    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [accountActive, setAccountActive] = useState(true)
    const [requirePasswordChange, setRequirePasswordChange] = useState(false)

    const permissions = [
        {
            label: 'Dashboard Access',
            enabled: true,
        },
        {
            label: 'View Inventory',
            enabled: true,
        },
        {
            label: 'Create Sales Orders',
            enabled: true,
        },
        {
            label: 'Customer Directory',
            enabled: true,
        },
        {
            label: 'Admin Panel',
            enabled: false,
        },
        {
            label: 'System Logs',
            enabled: false,
        },
    ]

    const handleSubmit = async (event) => {
        event.preventDefault()

        if (submitting) return

        setSubmitError('')
        setSubmitSuccess('')

        const fullName = formData.fullName.trim()
        const email = formData.email.trim().toLowerCase()
        const phone = formData.phone.trim()
        const department = formData.department.trim()
        const password = formData.password
        const confirmPassword = formData.confirmPassword

        if (!fullName || !email || !password || !confirmPassword) {
            setSubmitError('Please complete all required fields.')
            return
        }

        if (password.length < 6) {
            setSubmitError('Password must contain at least 6 characters.')
            return
        }

        if (password !== confirmPassword) {
            setSubmitError('Passwords do not match.')
            return
        }

        if (!['Staff', 'Manager', 'Administrator'].includes(formData.role)) {
            setSubmitError('Please select a valid user role.')
            return
        }

        const adminUser = auth.currentUser

        if (!adminUser) {
            setSubmitError(
                'Your administrator session has expired. Please sign in again.'
            )
            return
        }

        let createdFirebaseUser // = null

        setSubmitting(true)

        try {
            // Get a fresh token for the signed-in administrator.
            const adminToken = await adminUser.getIdToken()

            // Create the account using a separate Firebase Auth instance.
            // This prevents the administrator session from being replaced.
            const credential = await createUserWithEmailAndPassword(
                userCreationAuth,
                email,
                password
            )

            createdFirebaseUser = credential.user

            // Save the user's profile to MongoDB through the protected API.
            const apiBaseUrl = (
                import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
            ).replace(/\/+$/, '')

            const response = await fetch(`${apiBaseUrl}/api/users`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${adminToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firebaseUid: createdFirebaseUser.uid,
                    fullName,
                    email,
                    role: formData.role,
                    phone,
                    department,
                }),
            })

            const result = await response.json().catch(() => ({}))

            if (!response.ok || !result.success) {
                // Roll back the Firebase account if MongoDB profile creation fails.
                try {
                    await deleteUser(createdFirebaseUser)
                    createdFirebaseUser = null
                } catch (rollbackError) {
                    console.error(
                        'Could not roll back the Firebase account:',
                        rollbackError
                    )

                    throw new Error(
                        `${result.message || 'The profile could not be saved.'} ` +
                        'The Firebase account may still exist. Check Firebase Authentication before retrying.', { cause: rollbackError }
                    )
                }

                throw new Error(
                    result.message || 'Failed to create the user profile.'
                )
            }

            setSubmitSuccess(
                `${fullName} was created successfully.`
            )

            setFormData({
                fullName: '',
                username: '',
                email: '',
                phone: '',
                employeeId: '',
                department: '',
                dob: '',
                gender: '',
                address: '',
                role: 'Staff',
                password: '',
                confirmPassword: '',
            })

            setAccountActive(true)
            setRequirePasswordChange(false)
            setShowPassword(false)
            setShowConfirmPassword(false)
        } catch (error) {
            console.error('Create user error:', error)

            let message = error.message || 'Unable to create the user.'

            if (error.code === 'auth/email-already-in-use') {
                message = 'This email address already has a Firebase account.'
            } else if (error.code === 'auth/invalid-email') {
                message = 'Please enter a valid email address.'
            } else if (error.code === 'auth/weak-password') {
                message = 'Please choose a stronger password.'
            } else if (error.code === 'auth/operation-not-allowed') {
                message = 'Email and password sign-in is not enabled in Firebase.'
            }

            setSubmitError(message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleInputChange = (event) => {
        const { name, value } = event.target

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }))
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

                    {/* Header */}
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
                                    outline-none
                                    placeholder:text-[#8B919D]
                                    focus:border-[#D4DCF0]
                                    focus:bg-white
                                "
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
                    <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">

                        <div className="px-6 py-6 lg:px-8">

                            {/* Page Heading */}
                            <div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-[#343A47]">
                                        Home
                                    </span>

                                    <span className="text-[#A1A6B0]">
                                        ›
                                    </span>

                                    <span className="font-medium text-[#0757C9]">
                                        Add New User
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
                                    Add New User
                                </h2>

                                <p className="mt-1 text-sm text-[#69707D]">
                                    Create a new user account and assign system access permissions.
                                </p>
                            </div>
                            

                            {/* =================================================
                                FORM + PROFILE PREVIEW
                            ================================================== */}
                            
                            {submitError && (
                                <div
                                    role="alert"
                                    className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                                >
                                    {submitError}
                                </div>
                            )}

                            {submitSuccess && (
                                <div
                                    role="status"
                                    className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700"
                                >
                                    {submitSuccess}
                                </div>
                            )}


                            <form
                                id="add-user-form"
                                onSubmit={handleSubmit}
                                className="
                                    mt-6
                                    grid
                                    grid-cols-1
                                    gap-5
                                    xl:grid-cols-[minmax(0,1fr)_300px]
                                "
                            >

                                {/* =================================================
                                    LEFT FORM
                                ================================================== */}
                                <div className="space-y-5">

                                    {/* Personal Information */}
                                    <section
                                        className="
                                            rounded-lg
                                            border
                                            border-[#E6E8ED]
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
                                                border-[#ECEEF2]
                                                px-5
                                                py-4
                                            "
                                        >
                                            <h3 className="text-sm font-semibold text-[#242936]">
                                                Personal Information
                                            </h3>

                                            <span className="text-[9px] font-medium uppercase text-[#8A909B]">
                                                Section 01
                                            </span>
                                        </div>

                                        <div className="p-5">

                                            {/* Profile */}
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="
                                                        relative
                                                        flex
                                                        h-14
                                                        w-14
                                                        shrink-0
                                                        items-center
                                                        justify-center
                                                        rounded-full
                                                        bg-[#EEF0FA]
                                                        text-[#8C93A4]
                                                    "
                                                >
                                                    <UserRound size={25} />

                                                    <span
                                                        className="
                                                            absolute
                                                            bottom-0
                                                            right-0
                                                            flex
                                                            h-5
                                                            w-5
                                                            items-center
                                                            justify-center
                                                            rounded-full
                                                            border-2
                                                            border-white
                                                            bg-[#0757C9]
                                                            text-white
                                                        "
                                                    >
                                                        <Plus size={10} />
                                                    </span>
                                                </div>

                                                <div>
                                                    <p className="text-xs font-semibold text-[#343A47]">
                                                        Profile Picture
                                                    </p>

                                                    <p className="mt-1 text-[10px] text-[#7A808C]">
                                                        Upload a clear photo of the user (JPG, PNG, max 2MB).
                                                    </p>

                                                    <button
                                                        type="button"
                                                        className="mt-1 text-[10px] font-medium text-[#0757C9]"
                                                    >
                                                        Upload Photo
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Form Grid */}
                                            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">

                                                {/* Full Name */}
                                                <div>
                                                    <label
                                                        htmlFor="fullName"
                                                        className="mb-1.5 block text-[10px] font-medium text-[#343A47]"
                                                    >
                                                        Full Name*
                                                    </label>

                                                    <div className="relative">
                                                        <UserRound
                                                            size={14}
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
                                                            id="fullName"
                                                            name="fullName"
                                                            type="text"
                                                            required
                                                            value={formData.fullName}
                                                            onChange={handleInputChange}
                                                            placeholder="John Doe"
                                                            className="h-10 w-full rounded-md border border-[#D7DBE4] pl-9 pr-3 text-xs outline-none focus:border-[#0757C9]"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Username */}
                                                <div>
                                                    <label
                                                        htmlFor="username"
                                                        className="mb-1.5 block text-[10px] font-medium text-[#343A47]"
                                                    >
                                                        Username*
                                                    </label>

                                                    <div className="relative">
                                                        <span
                                                            className="
                                                                pointer-events-none
                                                                absolute
                                                                left-3
                                                                top-1/2
                                                                -translate-y-1/2
                                                                text-xs
                                                                text-[#7D8491]
                                                            "
                                                        >
                                                            @
                                                        </span>

                                                        <input
                                                            id="username"
                                                            name="username"
                                                            value={formData.username}
                                                            onChange={handleInputChange}
                                                            type="text"
                                                            placeholder="johndoe88"
                                                            className="
                                                                h-10
                                                                w-full
                                                                rounded-md
                                                                border
                                                                border-[#D7DBE4]
                                                                pl-8
                                                                pr-10
                                                                text-xs
                                                                outline-none
                                                                placeholder:text-[#A0A6B2]
                                                                focus:border-[#0757C9]
                                                            "
                                                        />

                                                        <Check
                                                            size={14}
                                                            className="
                                                                absolute
                                                                right-3
                                                                top-1/2
                                                                -translate-y-1/2
                                                                text-[#18A957]
                                                            "
                                                        />
                                                    </div>
                                                </div>

                                                {/* Email */}
                                                <div>
                                                    <label
                                                        htmlFor="email"
                                                        className="mb-1.5 block text-[10px] font-medium text-[#343A47]"
                                                    >
                                                        Email Address*
                                                    </label>

                                                    <div className="relative">
                                                        <Mail
                                                            size={14}
                                                            className="
                                                                absolute
                                                                left-3
                                                                top-1/2
                                                                -translate-y-1/2
                                                                text-[#7D8491]
                                                            "
                                                        />

                                                        <input
                                                            id="email"
                                                            name="email"
                                                            type="email"
                                                            required
                                                            value={formData.email}
                                                            onChange={handleInputChange}
                                                            placeholder="john@example.com"
                                                            className="
                                                                h-10
                                                                w-full
                                                                rounded-md
                                                                border
                                                                border-[#D7DBE4]
                                                                pl-9
                                                                pr-3
                                                                text-xs
                                                                outline-none
                                                                placeholder:text-[#A0A6B2]
                                                                focus:border-[#0757C9]
                                                            "
                                                        />
                                                    </div>
                                                </div>

                                                {/* Phone */}
                                                <div>
                                                    <label
                                                        htmlFor="phone"
                                                        className="mb-1.5 block text-[10px] font-medium text-[#343A47]"
                                                    >
                                                        Phone Number
                                                    </label>

                                                    <div className="relative">
                                                        <Phone
                                                            size={14}
                                                            className="
                                                                absolute
                                                                left-3
                                                                top-1/2
                                                                -translate-y-1/2
                                                                text-[#7D8491]
                                                            "
                                                        />

                                                        <input
                                                            id="phone"
                                                            name="phone"
                                                            type="tel"
                                                            value={formData.phone}
                                                            onChange={handleInputChange}
                                                            placeholder="Enter phone number"
                                                            className="
                                                                h-10
                                                                w-full
                                                                rounded-md
                                                                border
                                                                border-[#D7DBE4]
                                                                pl-9
                                                                pr-3
                                                                text-xs
                                                                outline-none
                                                                placeholder:text-[#A0A6B2]
                                                                focus:border-[#0757C9]
                                                            "
                                                        />
                                                    </div>
                                                </div>

                                                {/* Employee ID */}
                                                <div>
                                                    <label
                                                        htmlFor="employeeId"
                                                        className="mb-1.5 block text-[10px] font-medium text-[#343A47]"
                                                    >
                                                        NIC / Employee ID
                                                    </label>

                                                    <div className="relative">
                                                        <BriefcaseBusiness
                                                            size={14}
                                                            className="
                                                                absolute
                                                                left-3
                                                                top-1/2
                                                                -translate-y-1/2
                                                                text-[#7D8491]
                                                            "
                                                        />

                                                        <input
                                                            id="employeeId"
                                                            type="text"
                                                            name="employeeId"
                                                            value={formData.employeeId}
                                                            onChange={handleInputChange}
                                                            placeholder="EMP-2024-001"
                                                            className="
                                                                h-10
                                                                w-full
                                                                rounded-md
                                                                border
                                                                border-[#D7DBE4]
                                                                pl-9
                                                                pr-3
                                                                text-xs
                                                                outline-none
                                                                placeholder:text-[#A0A6B2]
                                                                focus:border-[#0757C9]
                                                            "
                                                        />
                                                    </div>
                                                </div>

                                                {/* Department */}
                                                <div>
                                                    <label
                                                        htmlFor="department"
                                                        className="mb-1.5 block text-[10px] font-medium text-[#343A47]"
                                                    >
                                                        Department
                                                    </label>

                                                    <div className="relative">
                                                        <BriefcaseBusiness
                                                            size={14}
                                                            className="
                                                                absolute
                                                                left-3
                                                                top-1/2
                                                                -translate-y-1/2
                                                                text-[#7D8491]
                                                            "
                                                        />

                                                        <select
                                                            id="department"
                                                            name="department"
                                                            value={formData.department}
                                                            onChange={handleInputChange}
                                                            className="
                                                                h-10
                                                                w-full
                                                                appearance-none
                                                                rounded-md
                                                                border
                                                                border-[#D7DBE4]
                                                                bg-white
                                                                pl-9
                                                                pr-9
                                                                text-xs
                                                                text-[#4B5260]
                                                                outline-none
                                                                focus:border-[#0757C9]
                                                            "
                                                            defaultValue=""
                                                        >
                                                            <option value="">Select Department</option>
                                                            <option value="IT">IT</option>
                                                            <option value="Human Resources">Human Resources</option>
                                                            <option value="Finance">Finance</option>
                                                            <option value="Sales">Sales</option>
                                                            <option value="Marketing">Marketing</option>
                                                            <option value="Operations">Operations</option>
                                                        </select>

                                                        <ChevronDown
                                                            size={14}
                                                            className="
                                                                pointer-events-none
                                                                absolute
                                                                right-3
                                                                top-1/2
                                                                -translate-y-1/2
                                                                text-[#707784]
                                                            "
                                                        />
                                                    </div>
                                                </div>

                                                {/* Date of Birth */}
                                                <div>
                                                    <label
                                                        htmlFor="dob"
                                                        className="mb-1.5 block text-[10px] font-medium text-[#343A47]"
                                                    >
                                                        Date of Birth
                                                    </label>

                                                    <div className="relative">
                                                        <CalendarDays
                                                            size={14}
                                                            className="
                                                                absolute
                                                                left-3
                                                                top-1/2
                                                                -translate-y-1/2
                                                                text-[#7D8491]
                                                            "
                                                        />

                                                        <input
                                                            id="dob"
                                                            type="date"
                                                            name="dob"
                                                            value={formData.dob}
                                                            onChange={handleInputChange}
                                                            className="
                                                                h-10
                                                                w-full
                                                                rounded-md
                                                                border
                                                                border-[#D7DBE4]
                                                                bg-white
                                                                pl-9
                                                                pr-3
                                                                text-xs
                                                                text-[#69707D]
                                                                outline-none
                                                                focus:border-[#0757C9]
                                                            "
                                                        />
                                                    </div>
                                                </div>

                                                {/* Gender */}
                                                <div>
                                                    <label
                                                        htmlFor="gender"
                                                        className="mb-1.5 block text-[10px] font-medium text-[#343A47]"
                                                    >
                                                        Gender
                                                    </label>

                                                    <div className="relative">
                                                        <UserRound
                                                            size={14}
                                                            className="
                                                                absolute
                                                                left-3
                                                                top-1/2
                                                                -translate-y-1/2
                                                                text-[#7D8491]
                                                            "
                                                        />

                                                        <select
                                                            id="gender"
                                                            name="gender"
                                                            value={formData.gender}
                                                            onChange={handleInputChange}
                                                            className="
                                                                h-10
                                                                w-full
                                                                appearance-none
                                                                rounded-md
                                                                border
                                                                border-[#D7DBE4]
                                                                bg-white
                                                                pl-9
                                                                pr-9
                                                                text-xs
                                                                text-[#4B5260]
                                                                outline-none
                                                                focus:border-[#0757C9]
                                                            "
                                                            defaultValue="prefer"
                                                        >
                                                            <option value="">Select Gender</option>
                                                            <option value="Male">Male</option>
                                                            <option value="Female">Female</option>
                                                            <option value="Other">Other</option>
                                                        </select>

                                                        <ChevronDown
                                                            size={14}
                                                            className="
                                                                pointer-events-none
                                                                absolute
                                                                right-3
                                                                top-1/2
                                                                -translate-y-1/2
                                                                text-[#707784]
                                                            "
                                                        />
                                                    </div>
                                                </div>

                                                {/* Address */}
                                                <div className="md:col-span-2">
                                                    <label
                                                        htmlFor="address"
                                                        className="mb-1.5 block text-[10px] font-medium text-[#343A47]"
                                                    >
                                                        Address
                                                    </label>

                                                    <div className="relative">
                                                        <MapPin
                                                            size={14}
                                                            className="
                                                                absolute
                                                                left-3
                                                                top-3
                                                                text-[#7D8491]
                                                            "
                                                        />

                                                        <input
                                                            id="address"
                                                            type="text"
                                                            name="address"
                                                            value={formData.address}
                                                            onChange={handleInputChange}
                                                            placeholder="Street name, City, Zip Code"
                                                            className="
                                                                h-10
                                                                w-full
                                                                rounded-md
                                                                border
                                                                border-[#D7DBE4]
                                                                pl-9
                                                                pr-3
                                                                text-xs
                                                                outline-none
                                                                placeholder:text-[#A0A6B2]
                                                                focus:border-[#0757C9]
                                                            "
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Account Information */}
                                    <section
                                        className="
                                            rounded-lg
                                            border
                                            border-[#E6E8ED]
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
                                                border-[#ECEEF2]
                                                px-5
                                                py-4
                                            "
                                        >
                                            <h3 className="text-sm font-semibold text-[#242936]">
                                                Account Information
                                            </h3>

                                            <span className="text-[9px] font-medium uppercase text-[#8A909B]">
                                                Section 02
                                            </span>
                                        </div>

                                        <div className="p-5">

                                            {/* Role */}
                                            <div>
                                                <label
                                                    htmlFor="role"
                                                    className="mb-1.5 block text-[10px] font-medium text-[#343A47]"
                                                >
                                                    Role*
                                                </label>

                                                <div className="relative">
                                                    <Shield
                                                        size={14}
                                                        className="
                                                            absolute
                                                            left-3
                                                            top-1/2
                                                            -translate-y-1/2
                                                            text-[#7D8491]
                                                        "
                                                    />

                                                    <select
                                                        id="role"
                                                        name="role"
                                                        required
                                                        value={formData.role}
                                                        onChange={handleInputChange}
                                                        className="
                                                            h-10
                                                            w-full
                                                            appearance-none
                                                            rounded-md
                                                            border
                                                            border-[#D7DBE4]
                                                            bg-white
                                                            pl-9
                                                            pr-9
                                                            text-xs
                                                            text-[#4B5260]
                                                            outline-none
                                                            focus:border-[#0757C9]
                                                        "
                                                        defaultValue="staff"
                                                    >
                                                        <option value="Staff">Staff</option>
                                                        <option value="Manager">Manager</option>
                                                        <option value="Administrator">Administrator</option>
                                                    </select>

                                                    <ChevronDown
                                                        size={14}
                                                        className="
                                                            pointer-events-none
                                                            absolute
                                                            right-3
                                                            top-1/2
                                                            -translate-y-1/2
                                                            text-[#707784]
                                                        "
                                                    />
                                                </div>
                                            </div>

                                            {/* Passwords */}
                                            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">

                                                <div>
                                                    <label
                                                        htmlFor="password"
                                                        className="mb-1.5 block text-[10px] font-medium text-[#343A47]"
                                                    >
                                                        Password*
                                                    </label>

                                                    <div className="relative">
                                                        <LockKeyhole
                                                            size={14}
                                                            className="
                                                                absolute
                                                                left-3
                                                                top-1/2
                                                                -translate-y-1/2
                                                                text-[#7D8491]
                                                            "
                                                        />

                                                        <input
                                                            id="password"
                                                            name="password"
                                                            type={showPassword ? 'text' : 'password'}
                                                            required
                                                            minLength={6}
                                                            value={formData.password}
                                                            onChange={handleInputChange}
                                                            placeholder="Enter password"
                                                            className="
                                                                h-10
                                                                w-full
                                                                rounded-md
                                                                border
                                                                border-[#D7DBE4]
                                                                pl-9
                                                                pr-10
                                                                text-xs
                                                                outline-none
                                                                focus:border-[#0757C9]
                                                            "
                                                        />

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setShowPassword(
                                                                    (value) => !value
                                                                )
                                                            }
                                                            className="
                                                                absolute
                                                                right-3
                                                                top-1/2
                                                                -translate-y-1/2
                                                                text-[#7D8491]
                                                                hover:text-[#0757C9]
                                                            "
                                                            aria-label={
                                                                showPassword
                                                                    ? 'Hide password'
                                                                    : 'Show password'
                                                            }
                                                        >
                                                            {showPassword ? (
                                                                <EyeOff size={14} />
                                                            ) : (
                                                                <Eye size={14} />
                                                            )}
                                                        </button>
                                                    </div>

                                                    <div className="mt-2 flex gap-1">
                                                        <span className="h-1 flex-1 rounded-full bg-[#0757C9]" />
                                                        <span className="h-1 flex-1 rounded-full bg-[#0757C9]" />
                                                        <span className="h-1 flex-1 rounded-full bg-[#D7DBE4]" />
                                                        <span className="h-1 flex-1 rounded-full bg-[#D7DBE4]" />
                                                    </div>

                                                    <p className="mt-1 text-[8px] text-[#7A808C]">
                                                        Moderate Strength
                                                    </p>
                                                </div>

                                                <div>
                                                    <label
                                                        htmlFor="confirmPassword"
                                                        className="mb-1.5 block text-[10px] font-medium text-[#343A47]"
                                                    >
                                                        Confirm Password*
                                                    </label>

                                                    <div className="relative">
                                                        <LockKeyhole
                                                            size={14}
                                                            className="
                                                                absolute
                                                                left-3
                                                                top-1/2
                                                                -translate-y-1/2
                                                                text-[#7D8491]
                                                            "
                                                        />

                                                        <input
                                                            id="confirmPassword"
                                                            name="confirmPassword"
                                                            type={showConfirmPassword ? 'text' : 'password'}
                                                            required
                                                            minLength={6}
                                                            value={formData.confirmPassword}
                                                            onChange={handleInputChange}
                                                            placeholder="Confirm password"
                                                            className="
                                                                h-10
                                                                w-full
                                                                rounded-md
                                                                border
                                                                border-[#D7DBE4]
                                                                pl-9
                                                                pr-10
                                                                text-xs
                                                                outline-none
                                                                focus:border-[#0757C9]
                                                            "
                                                        />

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setShowConfirmPassword(
                                                                    (value) => !value
                                                                )
                                                            }
                                                            className="
                                                                absolute
                                                                right-3
                                                                top-1/2
                                                                -translate-y-1/2
                                                                text-[#7D8491]
                                                                hover:text-[#0757C9]
                                                            "
                                                            aria-label={
                                                                showConfirmPassword
                                                                    ? 'Hide password'
                                                                    : 'Show password'
                                                            }
                                                        >
                                                            {showConfirmPassword ? (
                                                                <EyeOff size={14} />
                                                            ) : (
                                                                <Eye size={14} />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Account Status */}
                                            <div className="mt-5 overflow-hidden rounded-md">

                                                <div className="flex items-center justify-between bg-[#F7F5FC] px-3 py-3">
                                                    <div>
                                                        <p className="text-[10px] font-semibold text-[#343A47]">
                                                            Account Status
                                                        </p>

                                                        <p className="mt-0.5 text-[9px] text-[#7A808C]">
                                                            {accountActive
                                                                ? 'Active'
                                                                : 'Inactive'}
                                                        </p>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setAccountActive(
                                                                (value) => !value
                                                            )
                                                        }
                                                        className={`
                                                            relative
                                                            h-5
                                                            w-9
                                                            rounded-full
                                                            transition
                                                            ${accountActive
                                                                ? 'bg-[#0757C9]'
                                                                : 'bg-[#D7DBE4]'
                                                            }
                                                        `}
                                                        aria-label="Toggle account status"
                                                    >
                                                        <span
                                                            className={`
                                                                absolute
                                                                top-0.5
                                                                h-4
                                                                w-4
                                                                rounded-full
                                                                bg-white
                                                                shadow
                                                                transition
                                                                ${accountActive
                                                                    ? 'right-0.5'
                                                                    : 'left-0.5'
                                                                }
                                                            `}
                                                        />
                                                    </button>
                                                </div>

                                                <div className="flex items-center justify-between bg-[#F7F5FC] px-3 py-3">
                                                    <div>
                                                        <p className="text-[10px] font-semibold text-[#343A47]">
                                                            Require Password Change
                                                        </p>

                                                        <p className="mt-0.5 text-[9px] text-[#7A808C]">
                                                            Force change on first login
                                                        </p>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setRequirePasswordChange(
                                                                (value) => !value
                                                            )
                                                        }
                                                        className={`
                                                            relative
                                                            h-5
                                                            w-9
                                                            rounded-full
                                                            transition
                                                            ${requirePasswordChange
                                                                ? 'bg-[#0757C9]'
                                                                : 'bg-[#D7DBE4]'
                                                            }
                                                        `}
                                                        aria-label="Toggle password change requirement"
                                                    >
                                                        <span
                                                            className={`
                                                                absolute
                                                                top-0.5
                                                                h-4
                                                                w-4
                                                                rounded-full
                                                                bg-white
                                                                shadow
                                                                transition
                                                                ${requirePasswordChange
                                                                    ? 'right-0.5'
                                                                    : 'left-0.5'
                                                                }
                                                            `}
                                                        />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Permission Summary */}
                                    <section
                                        className="
                                            rounded-lg
                                            border
                                            border-[#E6E8ED]
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
                                                border-[#ECEEF2]
                                                px-5
                                                py-4
                                            "
                                        >
                                            <h3 className="text-sm font-semibold text-[#242936]">
                                                Permission Summary
                                            </h3>

                                            <span className="text-[9px] font-medium uppercase text-[#8A909B]">
                                                Preview Only
                                            </span>
                                        </div>

                                        <div className="p-5">
                                            <p className="text-[10px] text-[#69707D]">
                                                Selected role{' '}
                                                <span className="font-semibold text-[#0757C9]">
                                                    "Staff"
                                                </span>{' '}
                                                includes the following permissions:
                                            </p>

                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {permissions.map((permission) => (
                                                    <span
                                                        key={permission.label}
                                                        className={`
                                                            rounded-full
                                                            px-2.5
                                                            py-1
                                                            text-[9px]
                                                            font-medium
                                                            ${permission.enabled
                                                                ? 'bg-[#EEF3FF] text-[#315A9E]'
                                                                : 'bg-[#F5F6F8] text-[#A0A6B2]'
                                                            }
                                                        `}
                                                    >
                                                        {permission.label}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                {/* =================================================
                                    PROFILE PREVIEW
                                ================================================== */}
                                <aside className="space-y-4">

                                    <section
                                        className="
                                            overflow-hidden
                                            rounded-lg
                                            border
                                            border-[#E6E8ED]
                                            bg-white
                                            shadow-[0_2px_8px_rgba(15,23,42,0.07)]
                                        "
                                    >
                                        {/* Preview header */}
                                        <div className="border-b border-[#242936] px-5 pb-3 pt-5 text-center">
                                            <p className="font-serif text-2xl tracking-[0.08em] text-[#49372F]">
                                                BIZFLOW
                                            </p>

                                            <p className="text-[8px] font-semibold tracking-[0.22em] text-[#8A6B4A]">
                                                ENTERPRISE PLATFORM
                                            </p>
                                        </div>

                                        {/* Profile */}
                                        <div className="px-5 py-5 text-center">

                                            <div
                                                className="
                                                    mx-auto
                                                    flex
                                                    h-16
                                                    w-16
                                                    items-center
                                                    justify-center
                                                    rounded-full
                                                    border-4
                                                    border-white
                                                    bg-[#E5EAF2]
                                                    shadow
                                                "
                                            >
                                                <UserRound
                                                    size={30}
                                                    className="text-[#7C8493]"
                                                />
                                            </div>

                                            <h3 className="mt-3 text-lg font-bold text-[#242936]">
                                                Sarah Jenkins
                                            </h3>

                                            <p className="text-[10px] text-[#69707D]">
                                                @sarahjenkins
                                            </p>

                                            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#E8F8EF] px-3 py-1 text-[9px] font-semibold text-[#168C4B]">
                                                <span className="h-1.5 w-1.5 rounded-full bg-[#18A957]" />
                                                ACTIVE
                                            </span>
                                        </div>

                                        {/* Preview details */}
                                        <div className="border-t border-[#ECEEF2] px-5 py-4">

                                            <div className="space-y-4">

                                                <div className="flex items-start gap-3">
                                                    <Mail
                                                        size={14}
                                                        className="mt-0.5 text-[#0757C9]"
                                                    />

                                                    <div>
                                                        <p className="text-[8px] font-semibold uppercase text-[#737A87]">
                                                            Email
                                                        </p>

                                                        <p className="mt-0.5 text-[10px] text-[#343A47]">
                                                            pending email...
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-3">
                                                    <Shield
                                                        size={14}
                                                        className="mt-0.5 text-[#0757C9]"
                                                    />

                                                    <div>
                                                        <p className="text-[8px] font-semibold uppercase text-[#737A87]">
                                                            System Role
                                                        </p>

                                                        <p className="mt-0.5 text-[10px] text-[#343A47]">
                                                            Staff Member
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-3">
                                                    <BriefcaseBusiness
                                                        size={14}
                                                        className="mt-0.5 text-[#0757C9]"
                                                    />

                                                    <div>
                                                        <p className="text-[8px] font-semibold uppercase text-[#737A87]">
                                                            Department
                                                        </p>

                                                        <p className="mt-0.5 text-[10px] text-[#343A47]">
                                                            Not Assigned
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Pro Tip */}
                                    <div
                                        className="
                                            flex
                                            gap-3
                                            rounded-md
                                            border
                                            border-[#C8D8F7]
                                            bg-[#EEF4FF]
                                            p-4
                                        "
                                    >
                                        <Info
                                            size={16}
                                            className="mt-0.5 shrink-0 text-[#0757C9]"
                                        />

                                        <div>
                                            <p className="text-[10px] font-semibold text-[#0757C9]">
                                                Pro Tip
                                            </p>

                                            <p className="mt-1 text-[9px] leading-4 text-[#536A91]">
                                                New users will receive an
                                                email with a link that
                                                expires in 24 hours.
                                            </p>
                                        </div>
                                    </div>
                                </aside>
                            </form>

                            {/* =================================================
                                ACTION BAR
                            ================================================== */}
                            <div
                                className="
                                    mt-5
                                    flex
                                    flex-col
                                    gap-3
                                    border-t
                                    border-[#E1E4EA]
                                    pt-4
                                    sm:flex-row
                                    sm:items-center
                                    sm:justify-end
                                "
                            >
                                <button
                                    type="button"
                                    className="
                                        h-9
                                        rounded-md
                                        border
                                        border-[#D7DBE4]
                                        bg-white
                                        px-5
                                        text-xs
                                        font-medium
                                        text-[#454B58]
                                        hover:bg-[#F8FAFC]
                                    "
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    className="
                                        h-9
                                        rounded-md
                                        border
                                        border-[#D7DBE4]
                                        bg-white
                                        px-5
                                        text-xs
                                        font-medium
                                        text-[#0757C9]
                                        hover:bg-[#F4F7FF]
                                    "
                                >
                                    Reset Form
                                </button>
                                

                                <button
                                    type="submit"
                                    form="add-user-form"
                                    disabled={submitting}
                                    className="
                                        h-9
                                        rounded-md
                                        bg-[#0757C9]
                                        px-5
                                        text-xs
                                        font-semibold
                                        text-white
                                        shadow-sm
                                        hover:bg-[#0045AD]
                                    "
                                    
                                >
                                    {submitting ? 'Creating User...' : 'Create User'}
                                    
                                </button>
                            </div>

                            

                            {/* Footer */}
                            <footer className="mt-8 border-t border-[#E1E4EA] py-5">
                                <div className="flex flex-col gap-3 text-[10px] text-[#59606E] sm:flex-row sm:items-center sm:justify-between">
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

export default AddUser