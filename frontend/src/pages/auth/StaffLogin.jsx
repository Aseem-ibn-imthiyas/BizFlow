import { useState } from 'react'

import {
    signInWithEmailAndPassword,
    signOut,
    setPersistence,
    browserSessionPersistence,
} from 'firebase/auth';

import { auth } from '../../config/firebase'

import {
    Mail,
    Lock,
    Eye,
    EyeOff,
    Check,
    AlertCircle,
    Loader2,
    ShieldCheck,
} from 'lucide-react'

import illustration from '../../assets/illustrations/illustrate.png'
import logo from '../../assets/logos/logo.jpg'

function StaffLogin() {
    const [showPassword, setShowPassword] = useState(false)
    const [rememberDevice, setRememberDevice] = useState(false)
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    const handleSubmit = async (event) => {
        event.preventDefault()

        if (loading) return

        setLoading(true)
        setErrorMessage('')

        let credential

        try {
            const form = event.currentTarget
            const email = form.elements.email.value.trim()
            const password = form.elements.password.value

            // Configure Firebase authentication persistence.
            await setPersistence(auth, browserSessionPersistence);

            // Authenticate with Firebase.
            credential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            )

            // Retrieve Firebase ID token.
            const idToken = await credential.user.getIdToken()

            // Verify the BizFlow user profile.
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/users/me`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${idToken}`,
                    },
                }
            )

            const result = await response.json()

            if (!response.ok) {
                throw new Error(
                    result.message || 'Unable to verify your BizFlow profile.'
                )
            }

            const profile = result.data

            // Verify Firebase UID, role and account status.
            if (
                profile.firebaseUid !== credential.user.uid ||
                profile.role !== 'Staff' ||
                profile.status !== 'Active'
            ) {
                throw new Error(
                    'This account is not authorized to access the Staff portal.'
                )
            }

            // Navigate after successful verification.
            window.location.assign('/staff/Dashboard')

        } catch (error) {
            // Sign out if Firebase authentication succeeded
            // but BizFlow profile verification failed.
            if (credential) {
                try {
                    await signOut(auth)
                } catch (signOutError) {
                    console.error(
                        'Sign-out error:',
                        signOutError.message
                    )
                }
            }

            const messages = {
                'auth/invalid-credential': 'Invalid email or password.',
                'auth/invalid-email': 'Please enter a valid email address.',
                'auth/too-many-requests':
                    'Too many attempts. Please try again later.',
                'auth/network-request-failed':
                    'Network error. Check your internet connection.',
            }

            setErrorMessage(
                messages[error.code] ||
                error.message ||
                'Sign-in failed. Please try again.'
            )

        } finally {
            setLoading(false)
        }
    }

    return (
        <main
            className="
                min-h-screen
                w-full
                overflow-x-hidden
                bg-white
                text-slate-900
                md:h-screen
                md:overflow-hidden
            "
        >

            {/* =========================================================
                MAIN CONTAINER
                Desktop = exactly viewport height
            ========================================================= */}
            <div
                className="
                    grid
                    min-h-screen
                    w-full
                    md:h-screen
                    md:min-h-0
                    md:grid-cols-2
                "
            >

                {/* =====================================================
                                   LEFT SIDE - PRODUCT INTRODUCTION
                               ====================================================== */}

                <section
                    className="
                                       relative
                                       hidden
                                       min-h-screen
                                       overflow-hidden
                                       bg-[#F7FAFF]
                                       lg:flex
                                       lg:flex-col
                                       lg:justify-center
                                   "
                >

                    {/* Background decoration */}

                    <div
                        className="
                                           pointer-events-none
                                           absolute
                                           -left-24
                                           -top-24
                                           h-80
                                           w-80
                                           rounded-full
                                           bg-[#E7EFFF]
                                           blur-3xl
                                       "
                    />

                    <div
                        className="
                                           pointer-events-none
                                           absolute
                                           -bottom-32
                                           -left-10
                                           h-80
                                           w-80
                                           rounded-full
                                           bg-[#EEF4FF]
                                           blur-3xl
                                       "
                    />

                    <div className="relative z-10 mx-auto w-full max-w-140 px-10 xl:px-16">

                        {/* Illustration */}

                        <div
                            className="
                                               mx-auto
                                               w-full
                                               max-w-107.5
                                               overflow-hidden
                                               bg-white
                                               shadow-[0_16px_30px_rgba(15,23,42,0.15)]
                                           "
                        >
                            <img
                                src={illustration}
                                alt="BizFlow business process automation"
                                className="
                                                   block
                                                   h-auto
                                                   w-full
                                                   object-cover
                                               "
                            />
                        </div>


                        {/* Product Description */}

                        <div className="mt-7 max-w-110">

                            <h1
                                className="
                                                   text-2xl
                                                   font-bold
                                                   leading-tight
                                                   tracking-tight
                                                   text-[#171B25]
                                                   xl:text-[28px]
                                               "
                            >
                                Cloud-Based SaaS Business
                                <br />
                                Process Automation System
                            </h1>

                            <p
                                className="
                                                   mt-3
                                                   max-w-107.5
                                                   text-xs
                                                   leading-5
                                                   text-[#69707D]
                                               "
                            >
                                Manage your business operations efficiently
                                through a central cloud platform. Real-time
                                monitoring, automated workflows, and
                                comprehensive data analytics at your fingertips.
                            </p>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    RIGHT PANEL  (REFINED UI)
                ===================================================== */}
                <section
                    className="
                        relative
                        flex
                        min-h-screen
                        w-full
                        justify-center
                        overflow-x-hidden
                        overflow-y-auto
                        bg-[radial-gradient(ellipse_at_top,#F3F7FF_0%,#FFFFFF_55%)]
                        px-5
                        py-8
                        sm:px-8
                        md:h-screen
                        md:min-h-0
                        md:px-8
                        md:py-6
                        lg:px-12
                    "
                >

                    {/* -------------------------------------------------
                        RIGHT CONTENT WRAPPER
                    ------------------------------------------------- */}
                    <div
                        className="
                            my-auto
                            flex
                            w-full
                            max-w-107
                            flex-col
                            items-center
                        "
                    >

                        {/* =================================================
                            LOGIN CARD
                        ================================================= */}
                        <div
                            className="
                                w-full
                                rounded-2xl
                                border
                                border-[#E6EAF2]
                                bg-white
                                px-6
                                py-8
                                shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-8px_rgba(15,23,42,0.10)]
                                sm:px-10
                                sm:py-10
                            "
                        >

                            {/* =============================================
                                BRAND
                            ============================================= */}
                            <div className="flex items-center justify-center gap-3">

                                <img
                                    src={logo}
                                    alt="BizFlow"
                                    className="
                                        h-11
                                        w-11
                                        rounded-xl
                                        object-contain
                                        ring-1
                                        ring-[#E6EAF2]
                                    "
                                />

                                <span
                                    className="
                                        text-[20px]
                                        font-bold
                                        tracking-tight
                                        text-[#171B25]
                                    "
                                >
                                    BizFlow
                                </span>

                            </div>


                            {/* =============================================
                                WELCOME
                            ============================================= */}
                            <div className="mt-8 text-center">

                                <h3
                                    className="
                                        text-[26px]
                                        font-bold
                                        leading-8
                                        tracking-[-0.02em]
                                        text-[#171B25]
                                    "
                                >
                                    Welcome back
                                </h3>

                                <p
                                    className="
                                        mt-2
                                        text-[14px]
                                        leading-5
                                        text-[#5F6675]
                                    "
                                >
                                    Sign in to continue to your staff dashboard.
                                </p>

                            </div>


                            {/* =============================================
                                FORM
                            ============================================= */}
                            <form
                                onSubmit={handleSubmit}
                                className="mt-8"
                            >

                                {errorMessage && (
                                    <div
                                        role="alert"
                                        className="
                                            mb-5
                                            flex
                                            items-start
                                            gap-2.5
                                            rounded-lg
                                            border
                                            border-red-200
                                            bg-red-50
                                            px-3.5
                                            py-3
                                            text-[13px]
                                            leading-5
                                            text-red-700
                                        "
                                    >
                                        <AlertCircle
                                            size={16}
                                            strokeWidth={2}
                                            className="mt-0.5 shrink-0"
                                        />
                                        <span>{errorMessage}</span>
                                    </div>
                                )}

                                {/* =========================================
                                    EMAIL
                                ========================================= */}
                                <div>

                                    <label
                                        htmlFor="email"
                                        className="
                                            mb-2
                                            block
                                            text-[13px]
                                            font-semibold
                                            text-[#2B3140]
                                        "
                                    >
                                        Email address
                                    </label>


                                    <div className="group relative">

                                        <Mail
                                            size={18}
                                            strokeWidth={1.7}
                                            className="
                                                pointer-events-none
                                                absolute
                                                left-3.5
                                                top-1/2
                                                -translate-y-1/2
                                                text-[#8A91A0]
                                                transition-colors
                                                group-focus-within:text-[#004AC6]
                                            "
                                        />


                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            placeholder="you@company.com"
                                            className="
                                                h-12
                                                w-full
                                                rounded-lg
                                                border
                                                border-[#D5D9E3]
                                                bg-[#FBFCFE]
                                                pl-11
                                                pr-4
                                                text-[14px]
                                                text-[#171B25]
                                                outline-none
                                                transition
                                                placeholder:text-[#9AA1AF]
                                                hover:border-[#B4BBCA]
                                                focus:border-[#004AC6]
                                                focus:bg-white
                                                focus:ring-4
                                                focus:ring-[#004AC6]/10
                                            "
                                        />

                                    </div>

                                </div>


                                {/* =========================================
                                    PASSWORD
                                ========================================= */}
                                <div className="mt-5">

                                    <div
                                        className="
                                            mb-2
                                            flex
                                            items-center
                                            justify-between
                                        "
                                    >

                                        <label
                                            htmlFor="password"
                                            className="
                                                text-[13px]
                                                font-semibold
                                                text-[#2B3140]
                                            "
                                        >
                                            Password
                                        </label>

                                    </div>


                                    <div className="group relative">

                                        <Lock
                                            size={18}
                                            strokeWidth={1.7}
                                            className="
                                                pointer-events-none
                                                absolute
                                                left-3.5
                                                top-1/2
                                                -translate-y-1/2
                                                text-[#8A91A0]
                                                transition-colors
                                                group-focus-within:text-[#004AC6]
                                            "
                                        />


                                        <input
                                            id="password"
                                            name="password"
                                            type={
                                                showPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            autoComplete="current-password"
                                            placeholder="Enter your password"
                                            className="
                                                h-12
                                                w-full
                                                rounded-lg
                                                border
                                                border-[#D5D9E3]
                                                bg-[#FBFCFE]
                                                pl-11
                                                pr-12
                                                text-[14px]
                                                text-[#171B25]
                                                outline-none
                                                transition
                                                placeholder:text-[#9AA1AF]
                                                hover:border-[#B4BBCA]
                                                focus:border-[#004AC6]
                                                focus:bg-white
                                                focus:ring-4
                                                focus:ring-[#004AC6]/10
                                            "
                                        />


                                        {/* Show / Hide Password */}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(
                                                    (previous) => !previous
                                                )
                                            }
                                            aria-label={
                                                showPassword
                                                    ? 'Hide password'
                                                    : 'Show password'
                                            }
                                            className="
                                                absolute
                                                right-2
                                                top-1/2
                                                flex
                                                h-8
                                                w-8
                                                -translate-y-1/2
                                                items-center
                                                justify-center
                                                rounded-md
                                                text-[#8A91A0]
                                                transition
                                                hover:bg-[#F1F4F9]
                                                hover:text-[#004AC6]
                                                focus:outline-none
                                                focus-visible:ring-2
                                                focus-visible:ring-[#004AC6]/30
                                            "
                                        >
                                            {showPassword ? (
                                                <EyeOff
                                                    size={18}
                                                    strokeWidth={1.7}
                                                />
                                            ) : (
                                                <Eye
                                                    size={18}
                                                    strokeWidth={1.7}
                                                />
                                            )}
                                        </button>

                                    </div>

                                </div>


                                {/* =========================================
                                    REMEMBER DEVICE
                                ========================================= */}
                                <div className="mt-5">

                                    <label
                                        htmlFor="remember"
                                        className="
                                            inline-flex
                                            cursor-pointer
                                            select-none
                                            items-center
                                            gap-2.5
                                        "
                                    >

                                        <input
                                            id="remember"
                                            type="checkbox"
                                            checked={rememberDevice}
                                            onChange={(event) =>
                                                setRememberDevice(
                                                    event.target.checked
                                                )
                                            }
                                            className="peer sr-only"
                                        />


                                        <span
                                            className={`
                                                flex
                                                h-4.5
                                                w-4.5
                                                shrink-0
                                                items-center
                                                justify-center
                                                rounded-[5px]
                                                border
                                                transition
                                                peer-focus-visible:ring-4
                                                peer-focus-visible:ring-[#004AC6]/20
                                                ${rememberDevice
                                                    ? 'border-[#004AC6] bg-[#004AC6]'
                                                    : 'border-[#BFC5D2] bg-white hover:border-[#8A91A0]'
                                                }
                                            `}
                                        >
                                            {rememberDevice && (
                                                <Check
                                                    size={12}
                                                    strokeWidth={3}
                                                    className="text-white"
                                                />
                                            )}
                                        </span>


                                        <span
                                            className="
                                                text-[13px]
                                                text-[#4F5665]
                                            "
                                        >
                                            Remember this device
                                        </span>

                                    </label>

                                </div>


                                {/* =========================================
                                    SIGN IN
                                ========================================= */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="
                                        mt-6
                                        flex
                                        h-12
                                        w-full
                                        items-center
                                        justify-center
                                        gap-2
                                        rounded-lg
                                        bg-[#004AC6]
                                        text-[15px]
                                        font-semibold
                                        text-white
                                        shadow-[0_1px_2px_rgba(0,74,198,0.30),0_6px_14px_-4px_rgba(0,74,198,0.35)]
                                        transition
                                        duration-200
                                        hover:bg-[#003FA8]
                                        hover:shadow-[0_1px_2px_rgba(0,74,198,0.30),0_10px_20px_-6px_rgba(0,74,198,0.45)]
                                        active:scale-[0.99]
                                        focus:outline-none
                                        focus-visible:ring-4
                                        focus-visible:ring-[#004AC6]/25
                                        disabled:cursor-not-allowed
                                        disabled:opacity-70
                                    "
                                >
                                    {loading && (
                                        <Loader2
                                            size={18}
                                            strokeWidth={2.2}
                                            className="animate-spin"
                                        />
                                    )}
                                    {loading ? 'Signing in...' : 'Sign in'}
                                </button>


                                {/* =========================================
                                    CONTACT ADMINISTRATOR
                                ========================================= */}
                                <div className="mt-6 border-t border-[#EEF0F4] pt-5 text-center">

                                    <p
                                        className="
                                            text-[13px]
                                            leading-5
                                            text-[#626977]
                                        "
                                    >
                                        Don't have an account?{' '}

                                        <button
                                            type="button"
                                            className="
                                                rounded
                                                font-semibold
                                                text-[#004AC6]
                                                hover:text-[#003FA8]
                                                hover:underline
                                                focus:outline-none
                                                focus-visible:ring-2
                                                focus-visible:ring-[#004AC6]/30
                                            "
                                        >
                                            Contact your administrator
                                        </button>

                                    </p>

                                </div>

                            </form>

                        </div>


                        {/* =============================================
                            FOOTER
                        ============================================= */}
                        <div className="mt-6 flex flex-col items-center gap-2">

                            <p
                                className="
                                    flex
                                    items-center
                                    gap-1.5
                                    text-[12px]
                                    text-[#7B8292]
                                "
                            >
                                <ShieldCheck
                                    size={14}
                                    strokeWidth={1.8}
                                    className="text-[#7B8292]"
                                />
                                Secured staff access
                            </p>

                            <p
                                className="
                                    text-center
                                    text-[11px]
                                    leading-4
                                    text-[#A0A6B2]
                                "
                            >
                                © 2026 Business Process Automation System.
                                All rights reserved.
                            </p>

                        </div>

                    </div>

                </section>

            </div>

        </main>
    )
}

export default StaffLogin