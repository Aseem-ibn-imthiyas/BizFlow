
import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../config/firebase'

const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
).replace(/\/$/, '')

function ProtectedRoute({ children, allowedRoles = [] }) {
    const [loading, setLoading] = useState(true)
    const [authorized, setAuthorized] = useState(false)
    const [profile, setProfile] = useState(null)
    const location = useLocation()

    useEffect(() => {
        let active = true
        let profileRequest = null

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (profileRequest) {
                profileRequest.abort()
                profileRequest = null
            }

            if (!firebaseUser) {
                if (active) {
                    setAuthorized(false)
                    setProfile(null)
                    setLoading(false)
                }
                return
            }

            const controller = new AbortController()
            profileRequest = controller

            if (active) {
                setLoading(true)
                setAuthorized(false)
                setProfile(null)
            }

            try {
                const idToken = await firebaseUser.getIdToken()

                const response = await fetch(
                    `${API_BASE_URL}/api/users/me`,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${idToken}`,
                        },
                        signal: controller.signal,
                    }
                )

                const result = await response.json()

                if (!response.ok) {
                    throw new Error(
                        result.message || 'Unable to verify your account.'
                    )
                }

                const userProfile = result.data

                if (
                    !userProfile ||
                    userProfile.firebaseUid !== firebaseUser.uid ||
                    userProfile.status !== 'Active'
                ) {
                    throw new Error('Your account is not authorized.')
                }

                if (
                    allowedRoles.length > 0 &&
                    !allowedRoles.includes(userProfile.role)
                ) {
                    if (active) {
                        setProfile(userProfile)
                        setAuthorized(false)
                        setLoading(false)
                    }
                    return
                }

                if (active) {
                    setProfile(userProfile)
                    setAuthorized(true)
                    setLoading(false)
                }
            } catch (error) {
                if (error.name === 'AbortError') return

                console.error('Route authentication failed:', error.message)

                if (active) {
                    setAuthorized(false)
                    setProfile(null)
                    setLoading(false)
                }
            }
        })

        return () => {
            active = false
            unsubscribe()
            profileRequest?.abort()
        }
    }, [allowedRoles, location.pathname])

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
                <p className="text-sm text-[#656B78]">
                    Verifying your access...
                </p>
            </div>
        )
    }

    if (!authorized) {
        if (profile && profile.status === 'Active') {
            if (profile.role === 'Manager') {
                return <Navigate to="/manager/dashboard" replace />
            }

            if (profile.role === 'Staff') {
                return <Navigate to="/staff/Dashboard" replace />
            }
        }

        const loginPath = location.pathname.startsWith('/manager/')
            ? '/manager/login'
            : location.pathname.startsWith('/staff/')
                ? '/staff/login'
                : '/admin/login'

        return (
            <Navigate
                to={loginPath}
                replace
                state={{ from: location }}
            />
        )
    }

    return children
}

export default ProtectedRoute
