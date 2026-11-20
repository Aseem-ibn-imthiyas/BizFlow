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
    ChevronDown,
    Save,
    LoaderCircle,
    Check,
} from 'lucide-react'

import { auth } from '../../config/firebase'
import AdminSidebar from '../../components/sidebar/AdminSidebar'

const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
).replace(/\/+$/, '')

const INITIAL_FORM = {
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
    status: 'Active',
}

function EditUser() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [formData, setFormData] = useState(INITIAL_FORM)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')
    const [submitSuccess, setSubmitSuccess] = useState('')

    useEffect(() => {
        let cancelled = false

        const loadUser = async () => {
            setLoading(true)
            setSubmitError('')

            try {
                if (!id) throw new Error('A user ID was not provided.')

                const currentUser = auth.currentUser
                if (!currentUser) {
                    throw new Error('Your administrator session has expired. Please sign in again.')
                }

                const token = await currentUser.getIdToken()
                const response = await fetch(
                    `${API_BASE_URL}/api/users/${encodeURIComponent(id)}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                )
                const result = await response.json().catch(() => ({}))

                if (!response.ok || result.success === false) {
                    throw new Error(result.message || 'Unable to load this user.')
                }

                const user =
                    result.user ||
                    result.data?.user ||
                    result.data ||
                    result

                if (!user || !(user._id || user.mongoId || user.id)) {
                    throw new Error('The API response did not contain a valid user profile.')
                }

                if (!cancelled) {
                    setFormData({
                        ...INITIAL_FORM,
                        fullName: user.fullName || user.name || '',
                        username: user.username || '',
                        email: user.email || '',
                        phone: user.phone || '',
                        employeeId: user.employeeId || '',
                        department: user.department || '',
                        dob: user.dob ? String(user.dob).slice(0, 10) : '',
                        gender: user.gender || '',
                        address: user.address || '',
                        role: user.role || 'Staff',
                        status: user.status || 'Active',
                    })
                }
            } catch (error) {
                if (!cancelled) setSubmitError(error.message || 'Unable to load this user.')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        loadUser()
        return () => { cancelled = true }
    }, [id])

    const handleInputChange = (event) => {
        const { name, value } = event.target
        setFormData((previous) => ({ ...previous, [name]: value }))
        setSubmitError('')
        setSubmitSuccess('')
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (submitting) return

        setSubmitError('')
        setSubmitSuccess('')

        const fullName = formData.fullName.trim()
        if (!fullName) {
            setSubmitError('Full name is required.')
            return
        }

        if (!['Staff', 'Manager', 'Administrator'].includes(formData.role)) {
            setSubmitError('Please select a valid user role.')
            return
        }

        if (!['Active', 'Inactive', 'Suspended'].includes(formData.status)) {
            setSubmitError('Please select a valid account status.')
            return
        }

        const currentUser = auth.currentUser
        if (!currentUser) {
            setSubmitError('Your administrator session has expired. Please sign in again.')
            return
        }

        setSubmitting(true)
        try {
            const token = await currentUser.getIdToken()
            const response = await fetch(
                `${API_BASE_URL}/api/users/${encodeURIComponent(id)}`,
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        fullName,
                        phone: formData.phone.trim(),
                        department: formData.department.trim(),
                        role: formData.role,
                        status: formData.status,
                        username: formData.username.trim(),
                        employeeId: formData.employeeId.trim(),
                        dob: formData.dob,
                        gender: formData.gender,
                        address: formData.address.trim(),
                    }),
                }
            )

            const result = await response.json().catch(() => ({}))
            if (!response.ok || result.success === false) {
                throw new Error(result.message || 'Unable to update the user.')
            }
            setSubmitSuccess('User profile updated successfully.')
        } catch (error) {
            setSubmitError(error.message || 'An error occurred while updating the user.')
        } finally {
            setSubmitting(false)
        }
    }

    const inputClass = 'h-10 w-full rounded-md border border-[#D7DBE4] bg-white px-3 text-xs text-[#343A47] outline-none placeholder:text-[#A0A6B2] focus:border-[#0757C9] disabled:bg-[#F1F3F7] disabled:text-[#7A808C]'
    const labelClass = 'mb-1.5 block text-[10px] font-medium text-[#343A47]'

    return (
        <main className="h-screen w-full overflow-hidden bg-[#FBFCFE] text-[#171B25]">
            <div className="flex h-screen w-full overflow-hidden">
                <AdminSidebar />

                <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
                    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-[#E1E4EA] bg-white px-6 lg:px-8">
                        <div className="relative w-72">
                            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7D8491]" />
                            <input
                                type="text"
                                placeholder="Search users, reports, settings..."
                                className="h-9 w-full rounded-md border border-transparent bg-[#F1F3FA] pl-10 pr-4 text-xs outline-none placeholder:text-[#8B919D] focus:border-[#D4DCF0] focus:bg-white"
                            />
                        </div>
                        <div className="flex items-center gap-5">
                            <button type="button" aria-label="Notifications" className="text-[#59606E] hover:text-[#0757C9]"><Bell size={18} /></button>
                            <button type="button" aria-label="Help" className="text-[#59606E] hover:text-[#0757C9]"><CircleHelp size={18} /></button>
                            <div className="h-7 w-px bg-[#E1E4EA]" />
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-xs font-semibold text-[#242936]">Admin User</p>
                                    <p className="text-[9px] font-medium tracking-wide text-[#737A87]">SYSTEM ADMIN</p>
                                </div>
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DDE5F5] text-xs font-semibold text-[#315A9E]">AU</div>
                            </div>
                        </div>
                    </header>

                    <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
                        <div className="px-6 py-6 lg:px-8">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-[#343A47]">Home</span>
                                        <span className="text-[#A1A6B0]">›</span>
                                        <button type="button" onClick={() => navigate('/admin/users')} className="text-[#343A47] hover:text-[#0757C9]">User Management</button>
                                        <span className="text-[#A1A6B0]">›</span>
                                        <span className="font-medium text-[#0757C9]">Edit User</span>
                                    </div>
                                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#171B25]">Edit User</h1>
                                    <p className="mt-1 text-sm text-[#69707D]">Update user details, account access, and permissions.</p>
                                </div>
                                <button type="button" onClick={() => navigate('/admin/users')} className="flex h-9 items-center gap-2 self-start rounded-md border border-[#D5D9E2] bg-white px-4 text-xs font-medium text-[#343A47] hover:bg-[#F8FAFC]">
                                    <ArrowLeft size={14} /> Back to Users
                                </button>
                            </div>

                            {submitError && <div role="alert" className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{submitError}</div>}
                            {submitSuccess && <div role="status" className="mt-5 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">{submitSuccess}</div>}

                            {loading ? (
                                <div className="mt-6 flex items-center justify-center gap-2 rounded-lg border border-[#E6E8ED] bg-white p-12 text-sm text-[#69707D]">
                                    <LoaderCircle size={18} className="animate-spin" /> Loading user profile...
                                </div>
                            ) : (
                                <form id="edit-user-form" onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
                                    <div className="space-y-5">
                                        <section className="rounded-lg border border-[#E6E8ED] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                                            <div className="flex items-center justify-between border-b border-[#ECEEF2] px-5 py-4">
                                                <h2 className="text-sm font-semibold text-[#242936]">Personal Information</h2>
                                                <span className="text-[9px] font-medium uppercase text-[#8A909B]">Section 01</span>
                                            </div>
                                            <div className="p-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#EEF0FA] text-[#8C93A4]"><UserRound size={25} /></div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-[#343A47]">Profile Picture</p>
                                                        <p className="mt-1 text-[10px] text-[#7A808C]">Profile picture editing is not connected yet.</p>
                                                    </div>
                                                </div>
                                                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                                                    <div>
                                                        <label htmlFor="fullName" className={labelClass}>Full Name*</label>
                                                        <div className="relative"><UserRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7D8491]" /><input id="fullName" name="fullName" required maxLength={100} value={formData.fullName} onChange={handleInputChange} placeholder="Full name" className={`${inputClass} pl-9`} /></div>
                                                    </div>
                                                    <div>
                                                        <label htmlFor="username" className={labelClass}>Username</label>
                                                        <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#7D8491]">@</span><input id="username" name="username" value={formData.username} onChange={handleInputChange} placeholder="Username" className={`${inputClass} pl-8`} /></div>
                                                    </div>
                                                    <div>
                                                        <label htmlFor="email" className={labelClass}>Email Address</label>
                                                        <div className="relative"><Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7D8491]" /><input id="email" type="email" value={formData.email} readOnly disabled className={`${inputClass} pl-9`} /></div>
                                                        <p className="mt-1 text-[9px] text-[#7A808C]">Email address cannot be changed here.</p>
                                                    </div>
                                                    <div>
                                                        <label htmlFor="phone" className={labelClass}>Phone Number</label>
                                                        <div className="relative"><Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7D8491]" /><input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="Enter phone number" className={`${inputClass} pl-9`} /></div>
                                                    </div>
                                                    <div>
                                                        <label htmlFor="employeeId" className={labelClass}>NIC / Employee ID</label>
                                                        <div className="relative"><BriefcaseBusiness size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7D8491]" /><input id="employeeId" name="employeeId" value={formData.employeeId} onChange={handleInputChange} placeholder="Employee ID" className={`${inputClass} pl-9`} /></div>
                                                    </div>
                                                    <div>
                                                        <label htmlFor="department" className={labelClass}>Department</label>
                                                        <div className="relative"><BriefcaseBusiness size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7D8491]" /><select id="department" name="department" value={formData.department} onChange={handleInputChange} className={`${inputClass} appearance-none pl-9 pr-9`}><option value="">Select Department</option><option value="IT">IT</option><option value="Human Resources">Human Resources</option><option value="Finance">Finance</option><option value="Sales">Sales</option><option value="Marketing">Marketing</option><option value="Operations">Operations</option></select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#707784]" /></div>
                                                    </div>
                                                    <div>
                                                        <label htmlFor="dob" className={labelClass}>Date of Birth</label>
                                                        <input id="dob" type="date" name="dob" value={formData.dob} onChange={handleInputChange} className={inputClass} />
                                                    </div>
                                                    <div>
                                                        <label htmlFor="gender" className={labelClass}>Gender</label>
                                                        <div className="relative"><select id="gender" name="gender" value={formData.gender} onChange={handleInputChange} className={`${inputClass} appearance-none pr-9`}><option value="">Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#707784]" /></div>
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <label htmlFor="address" className={labelClass}>Address</label>
                                                        <input id="address" name="address" value={formData.address} onChange={handleInputChange} placeholder="Street name, city, postal code" className={inputClass} />
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="rounded-lg border border-[#E6E8ED] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                                            <div className="flex items-center justify-between border-b border-[#ECEEF2] px-5 py-4">
                                                <h2 className="text-sm font-semibold text-[#242936]">Account Information</h2>
                                                <span className="text-[9px] font-medium uppercase text-[#8A909B]">Section 02</span>
                                            </div>
                                            <div className="p-5">
                                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                    <div>
                                                        <label htmlFor="role" className={labelClass}>Role*</label>
                                                        <div className="relative"><Shield size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7D8491]" /><select id="role" name="role" required value={formData.role} onChange={handleInputChange} className={`${inputClass} appearance-none pl-9 pr-9`}><option value="Staff">Staff</option><option value="Manager">Manager</option><option value="Administrator">Administrator</option></select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#707784]" /></div>
                                                    </div>
                                                    <div>
                                                        <label htmlFor="status" className={labelClass}>Account Status</label>
                                                        <div className="relative"><select id="status" name="status" value={formData.status} onChange={handleInputChange} className={`${inputClass} appearance-none pr-9`}><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Suspended">Suspended</option></select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#707784]" /></div>
                                                    </div>
                                                </div>
                                                <div className="mt-4 rounded-md bg-[#F7F5FC] p-3">
                                                    <p className="text-[10px] font-semibold text-[#343A47]">Account access</p>
                                                    <p className="mt-1 text-[9px] text-[#7A808C]">Role and status updates are submitted to the protected user API.</p>
                                                </div>
                                            </div>
                                        </section>

                                        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                            <button type="button" onClick={() => navigate('/admin/users')} disabled={submitting} className="h-9 rounded-md border border-[#D5D9E2] bg-white px-5 text-xs font-medium text-[#343A47] hover:bg-[#F4F7FF] disabled:opacity-60">Cancel</button>
                                            <button type="submit" disabled={submitting} className="flex h-9 items-center justify-center gap-2 rounded-md bg-[#0757C9] px-5 text-xs font-semibold text-white shadow-sm hover:bg-[#0045AD] disabled:cursor-not-allowed disabled:opacity-60">
                                                {submitting ? <LoaderCircle size={14} className="animate-spin" /> : <Save size={14} />}
                                                {submitting ? 'Saving Changes...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </div>

                                    <aside className="space-y-4">
                                        <section className="overflow-hidden rounded-lg border border-[#E6E8ED] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.07)]">
                                            <div className="bg-[#F7F8FC] px-5 py-5 text-center">
                                                <p className="font-serif text-2xl tracking-[0.08em] text-[#49372F]">BIZFLOW</p>
                                                <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.18em] text-[#7A808C]">User Profile</p>
                                                <div className="mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#DDE5F5] text-[#315A9E]"><UserRound size={30} /></div>
                                                <h2 className="mt-3 text-sm font-semibold text-[#242936]">{formData.fullName || 'User Name'}</h2>
                                                <p className="mt-1 break-all text-[10px] text-[#737A87]">{formData.email || 'user@example.com'}</p>
                                                <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-[#EAF7EF] px-2.5 py-1 text-[9px] font-medium text-[#168447]"><Check size={11} /> {formData.status}</span>
                                            </div>
                                            <div className="space-y-3 p-5">
                                                <div className="flex items-center justify-between gap-3 text-xs"><span className="text-[#7A808C]">Role</span><span className="font-medium text-[#343A47]">{formData.role}</span></div>
                                                <div className="flex items-center justify-between gap-3 text-xs"><span className="text-[#7A808C]">Department</span><span className="font-medium text-[#343A47]">{formData.department || 'Not set'}</span></div>
                                                <div className="flex items-center justify-between gap-3 text-xs"><span className="text-[#7A808C]">Phone</span><span className="font-medium text-[#343A47]">{formData.phone || 'Not set'}</span></div>
                                            </div>
                                        </section>
                                        <section className="rounded-lg border border-[#E6E8ED] bg-white p-5">
                                            <h3 className="text-xs font-semibold text-[#242936]">Before you save</h3>
                                            <p className="mt-2 text-[10px] leading-5 text-[#69707D]">Review the user's details and access role. Changes are saved when you select Save Changes.</p>
                                        </section>
                                    </aside>
                                </form>
                            )}

                            <footer className="mt-8 border-t border-[#E1E4EA] py-5">
                                <div className="flex flex-col gap-3 text-[10px] text-[#59606E] sm:flex-row sm:items-center sm:justify-between">
                                    <p>© 2026 Business Process Automation System | Cloud-Based SaaS Platform</p>
                                    <div className="flex gap-5 text-[#343A47]"><span>Privacy Policy</span><span>Terms of Service</span><span>Compliance</span></div>
                                </div>
                            </footer>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}

export default EditUser
