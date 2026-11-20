import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { userCreationAuth } from '../../config/userCreationAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../config/firebase';
import AdminSidebar from '../../components/sidebar/AdminSidebar'
import {
    Bell,
    CircleHelp,
    Search,
    Users,
    Settings,
    Plus,
    Upload,
    RefreshCw,
    UserPlus,
    Shield,
    BarChart3,
    Eye,
    Pencil,
    Trash2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Power,
    X,
    AlertTriangle,
    // UserRound,
} from 'lucide-react'

function UserManagement() {

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedDeleteUser, setSelectedDeleteUser] = useState(null);
    const [deletingUserId, setDeletingUserId] = useState(null);

    const [showStatusConfirm, setShowStatusConfirm] = useState(false);
    const [selectedStatusUser, setSelectedStatusUser] = useState(null);

    const [updatingUserId, setUpdatingUserId] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [statusError, setStatusError] = useState('');

    const [showAddUser, setShowAddUser] = useState(false);
    const [creatingUser, setCreatingUser] = useState(false);
    const [createUserError, setCreateUserError] = useState('');

    const [newUser, setNewUser] = useState({
        fullName: '',
        email: '',
        password: '',
        role: 'Staff',
        phone: '',
        department: '',
    });

    const navigate = useNavigate();

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [appliedFilters, setAppliedFilters] = useState({
        search: '',
        role: 'all',
        status: 'all',
    });

    const [apiUsers, setApiUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');




    const handleDeleteUser = (user) => {
        if (!user.mongoId || user.mongoId === 'undefined') {
            setStatusError('Unable to delete this user: MongoDB ID is missing.');
            setStatusMessage('');
            return;
        }

        setStatusError('');
        setStatusMessage('');
        setSelectedDeleteUser(user);
        setShowDeleteConfirm(true);
    };

    const cancelDeleteUser = () => {
        if (deletingUserId) return;

        setShowDeleteConfirm(false);
        setSelectedDeleteUser(null);
    };

    const confirmDeleteUser = async () => {
        if (!selectedDeleteUser || deletingUserId) return;

        const user = selectedDeleteUser;
        const mongoId = user.mongoId;

        if (!mongoId || mongoId === 'undefined') {
            setStatusError('Unable to delete this user: MongoDB ID is missing.');
            setShowDeleteConfirm(false);
            setSelectedDeleteUser(null);
            return;
        }

        setDeletingUserId(mongoId);
        setStatusError('');
        setStatusMessage('');

        try {
            const firebaseUser = auth.currentUser;

            if (!firebaseUser) {
                throw new Error('Please sign in again to continue.');
            }

            const token = await firebaseUser.getIdToken();

            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/users/${encodeURIComponent(mongoId)}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const responseText = await response.text();
            let result = {};

            if (responseText) {
                try {
                    result = JSON.parse(responseText);
                } catch {
                    result = {};
                }
            }

            if (!response.ok || result.success === false) {
                throw new Error(
                    result.message ||
                    result.error ||
                    'Failed to delete the user.'
                );
            }

            setApiUsers((previousUsers) =>
                previousUsers.filter(
                    (record) => String(record._id) !== String(mongoId)
                )
            );

            setCurrentPage((page) => Math.max(1, page));

            setStatusMessage(
                `${user.name} was deleted successfully.`
            );

            setShowDeleteConfirm(false);
            setSelectedDeleteUser(null);
        } catch (err) {
            setStatusError(
                err.message || 'Unable to delete the user.'
            );
        } finally {
            setDeletingUserId(null);
        }
    };




    const handleToggleUserStatus = async (user) => {
        const currentStatus = user.status;

        // Avoid accidentally reactivating suspended accounts.
        if (currentStatus === 'Suspended') {
            setStatusError(
                'Suspended accounts must be reviewed separately. No changes were made.'
            );
            setStatusMessage('');
            return;
        }

        setSelectedStatusUser(user);
        setShowStatusConfirm(true);
        setStatusError('');
        setStatusMessage('');
    };

    const confirmStatusChange = async () => {
        if (!selectedStatusUser) return;

        const user = selectedStatusUser;
        const mongoId = user.mongoId;
        const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';

        if (!mongoId || mongoId === 'undefined') {
            setStatusError('Unable to update this user: MongoDB ID is missing.');
            setShowStatusConfirm(false);
            setSelectedStatusUser(null);
            return;
        }

        setUpdatingUserId(mongoId);
        setStatusError('');
        setStatusMessage('');

        try {
            const firebaseUser = auth.currentUser;

            if (!firebaseUser) {
                throw new Error('Please sign in again to continue.');
            }

            const token = await firebaseUser.getIdToken();

            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/users/${encodeURIComponent(mongoId)}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ status: nextStatus }),
                }
            );

            const result = await response.json();

            if (!response.ok || result.success === false) {
                throw new Error(
                    result.message ||
                    result.error ||
                    'Failed to update account status.'
                );
            }

            setApiUsers((previousUsers) =>
                previousUsers.map((record) =>
                    String(record._id) === String(mongoId)
                        ? { ...record, status: nextStatus }
                        : record
                )
            );

            setStatusMessage(
                `${user.name}'s account is now ${nextStatus.toLowerCase()}.`
            );
        } catch (err) {
            setStatusError(
                err.message || 'Unable to update the account status.'
            );
        } finally {
            setUpdatingUserId(null);
            setShowStatusConfirm(false);
            setSelectedStatusUser(null);
        }
    };

    const cancelStatusChange = () => {
        setShowStatusConfirm(false);
        setSelectedStatusUser(null);
    };



    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!firebaseUser) {
                setApiUsers([]);
                setError('Please sign in to view users.');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError('');

            try {
                const token = await firebaseUser.getIdToken();

                const response = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/users`,
                    {
                        method: 'GET',
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message || 'Failed to load users.'
                    );
                }

                const records = Array.isArray(result.data)
                    ? result.data
                    : Array.isArray(result.users)
                        ? result.users
                        : [];

                setApiUsers(records);
            } catch (err) {
                setError(err.message || 'Unable to connect to the server.');
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const users = apiUsers.map((user) => {
        const name = user.fullName || 'Unnamed User';
        const role = user.role || 'Staff';
        const status = user.status || 'Active';

        const roleClasses = {
            Administrator: 'bg-blue-50 text-blue-600',
            Manager: 'bg-indigo-50 text-indigo-600',
            Staff: 'bg-slate-100 text-slate-600',
        };

        return {
            mongoId: user._id,
            initials: name
                .trim()
                .split(/\s+/)
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase(),
            name,
            id: `#${String(user._id).slice(-6).toUpperCase()}`,
            email: user.email || '',
            role: role.toUpperCase(),
            roleValue: role,
            roleClass: roleClasses[role] || 'bg-slate-100 text-slate-600',
            status,
            active: status === 'Active',
            date: user.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : '—',
        };
    });

    const totalUsers = apiUsers.length;

    const adminCount = apiUsers.filter(
        (user) => user.role === 'Administrator'
    ).length;

    const managerCount = apiUsers.filter(
        (user) => user.role === 'Manager'
    ).length;

    const staffCount = apiUsers.filter(
        (user) => user.role === 'Staff'
    ).length;

    const activeCount = apiUsers.filter(
        (user) => user.status === 'Active'
    ).length;




    const filteredUsers = users.filter((user) => {
        const search = appliedFilters.search.trim().toLowerCase();

        const matchesSearch =
            !search ||
            user.name.toLowerCase().includes(search) ||
            user.email.toLowerCase().includes(search) ||
            user.id.toLowerCase().includes(search);

        const matchesRole =
            appliedFilters.role === 'all' ||
            user.roleValue.toLowerCase() === appliedFilters.role;

        const matchesStatus =
            appliedFilters.status === 'all' ||
            user.status.toLowerCase() === appliedFilters.status;

        return matchesSearch && matchesRole && matchesStatus;
    });


    const totalFilteredUsers = filteredUsers.length;

    const totalPages = Math.max(
        1,
        Math.ceil(totalFilteredUsers / rowsPerPage)
    );

    const startIndex = (currentPage - 1) * rowsPerPage;

    const paginatedUsers = filteredUsers.slice(
        startIndex,
        startIndex + rowsPerPage
    );

    const firstVisibleUser =
        totalFilteredUsers === 0 ? 0 : startIndex + 1;

    const lastVisibleUser = Math.min(
        startIndex + rowsPerPage,
        totalFilteredUsers
    );





    const handleCreateUser = async (event) => {
        event.preventDefault();

        if (creatingUser) return;

        const fullName = newUser.fullName.trim();
        const email = newUser.email.trim().toLowerCase();
        const password = newUser.password;

        if (!fullName || !email || !password) {
            setCreateUserError('Name, email and password are required.');
            return;
        }

        const adminUser = auth.currentUser;

        if (!adminUser) {
            setCreateUserError('Please sign in again as Administrator.');
            return;
        }

        setCreatingUser(true);
        setCreateUserError('');

        let createdFirebaseUser = null;

        try {
            // Get the Administrator token before creating another account.
            const adminToken = await adminUser.getIdToken();

            // Create the Firebase Authentication account separately.
            const credential = await createUserWithEmailAndPassword(
                userCreationAuth,
                email,
                password
            );

            createdFirebaseUser = credential.user;

            // Create the matching MongoDB profile.
            const response = await fetch(
                `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/users`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${adminToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        firebaseUid: credential.user.uid,
                        fullName,
                        email,
                        role: newUser.role,
                        phone: newUser.phone.trim(),
                        department: newUser.department.trim(),
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || 'Failed to create the user profile.'
                );
            }

            // Update the table without reloading the page.
            setApiUsers((currentUsers) => [
                ...currentUsers,
                result.data,
            ]);

            setCurrentPage(1);
            setSearchTerm('');
            setRoleFilter('all');
            setStatusFilter('all');

            setAppliedFilters({
                search: '',
                role: 'all',
                status: 'all',
            });

            setNewUser({
                fullName: '',
                email: '',
                password: '',
                role: 'Staff',
                phone: '',
                department: '',
            });

            setShowAddUser(false);
        } catch (error) {
            // Avoid leaving an orphaned Firebase account if profile creation fails.
            if (createdFirebaseUser) {
                try {
                    await deleteUser(createdFirebaseUser);
                } catch (cleanupError) {
                    console.error(
                        'Firebase account cleanup failed:',
                        cleanupError.message
                    );

                    setCreateUserError(
                        `${error.message} The Firebase account could not be removed automatically. Check Firebase Authentication before retrying.`
                    );

                    return;
                }
            }

            setCreateUserError(
                error.code === 'auth/email-already-in-use'
                    ? 'This email is already registered in Firebase Authentication.'
                    : error.code === 'auth/weak-password'
                        ? 'The password does not meet Firebase password requirements.'
                        : error.message || 'Unable to create the user.'
            );
        } finally {
            setCreatingUser(false);
        }
    };



    const recentUsers = [
        {
            initials: 'SJ',
            name: 'Sarah Jenkins',
            role: 'Staff',
            time: '2h ago',
            avatar: 'bg-blue-50 text-blue-600',
        },
        {
            initials: 'MV',
            name: 'Michael Vance',
            role: 'Manager',
            time: '5h ago',
            avatar: 'bg-indigo-50 text-indigo-600',
        },
        {
            initials: 'ER',
            name: 'Elena Rodriguez',
            role: 'Staff',
            time: '1d ago',
            avatar: 'bg-slate-100 text-slate-500',
        },
        {
            initials: 'ER',
            name: 'Elena Rodriguez',
            role: 'Staff',
            time: '1d ago',
            avatar: 'bg-slate-100 text-slate-500',
        },
    ]

    const quickActions = [
        {
            title: 'Add User',
            description: 'Register new system members',
            icon: UserPlus,
        },
        {
            title: 'Manage Roles',
            description: 'Edit access control lists',
            icon: Shield,
        },
        {
            title: 'View Reports',
            description: 'System performance metrics',
            icon: BarChart3,
        },
        {
            title: 'System Settings',
            description: 'Global platform configurations',
            icon: Settings,
        },
    ]

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
                    <div
                        className="
                            min-h-0
                            flex-1
                            overflow-x-hidden
                            overflow-y-auto
                        "
                    >
                        <div className="px-6 py-7 lg:px-8">

                            {/* Page Header */}
                            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">

                                <div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-[#343A47]">
                                            Home
                                        </span>

                                        <span className="text-[#A1A6B0]">
                                            ›
                                        </span>

                                        <span className="font-medium text-[#0757C9]">
                                            User Management
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
                                        User Management
                                    </h2>

                                    <p className="mt-1 text-sm text-[#69707D]">
                                        Manage system users, roles, and account information.
                                    </p>
                                </div>

                                {/* Header Actions */}
                                <div className="flex flex-wrap items-center gap-3">
                                    <button
                                        type="button"
                                        className="
                                            flex
                                            h-10
                                            items-center
                                            gap-2
                                            rounded-md
                                            border
                                            border-[#D5D9E2]
                                            bg-white
                                            px-4
                                            text-xs
                                            font-medium
                                            text-[#343A47]
                                            hover:bg-[#F8FAFC]
                                        "
                                    >
                                        <Upload size={14} />
                                        Export Users
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {navigate('/admin/users/add/')
                                            setCreateUserError('');
                                            setShowAddUser(true);
                                        }}
                                        className="
                                            flex
                                            h-10
                                            items-center
                                            gap-2
                                            rounded-md
                                            bg-[#0052CC]
                                            px-5
                                            text-xs
                                            font-semibold
                                            text-white
                                            shadow-sm
                                            hover:bg-[#0045AD]
                                        "
                                    >
                                        <Plus size={14} />
                                        Add New User
                                    </button>

                                    <button
                                        type="button"
                                        // onClick={() => navigate(`/admin/users/edit/`)}
                                        className="
                                            flex
                                            h-10
                                            items-center
                                            gap-2
                                            rounded-md
                                            border
                                            border-[#D5D9E2]
                                            bg-white
                                            px-4
                                            text-xs
                                            font-medium
                                            text-[#343A47]
                                            hover:bg-[#F8FAFC]
                                        "
                                    >
                                        <Pencil size={14} />
                                        Edit User
                                    </button>

                                    <button
                                        type="button"
                                        aria-label="Refresh users"
                                        className="
                                            flex
                                            h-10
                                            w-10
                                            items-center
                                            justify-center
                                            rounded-md
                                            text-[#59606E]
                                            hover:bg-white
                                        "
                                    >
                                        <RefreshCw size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* =================================================
                                MAIN GRID
                            ================================================== */}
                            <div className="mt-7 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">

                                {/* =================================================
                                    LEFT
                                ================================================== */}
                                <div className="min-w-0">

                                    {/* Filters */}
                                    <section
                                        className="
                                            rounded-lg
                                            border
                                            border-[#E6E8ED]
                                            bg-white
                                            p-4
                                            shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                        "
                                    >
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_160px_160px_auto_auto]">

                                            {/* Search */}
                                            <div>
                                                <label className="mb-1.5 block text-[10px] font-medium text-[#343A47]">
                                                    Search
                                                </label>

                                                <div className="relative">
                                                    <Search
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
                                                        type="text"
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                        placeholder="Name, email, user..."
                                                        className="
                                                        h-9
                                                        w-full
                                                        rounded-md
                                                        border
                                                        border-[#D7DBE4]
                                                        pl-9
                                                        pr-3
                                                        text-xs
                                                        outline-none
                                                        focus:border-[#0757C9]
                                                    "
                                                    />

                                                </div>
                                            </div>

                                            {/* Role */}
                                            <div>
                                                <label className="mb-1.5 block text-[10px] font-medium text-[#343A47]">
                                                    Role
                                                </label>

                                                <div className="relative">
                                                    <select
                                                        value={roleFilter}
                                                        onChange={(e) => setRoleFilter(e.target.value)}
                                                        className="
                                                            h-9
                                                            w-full
                                                            appearance-none
                                                            rounded-md
                                                            border
                                                            border-[#D7DBE4]
                                                            bg-white
                                                            px-3
                                                            pr-8
                                                            text-xs
                                                            text-[#4B5260]
                                                            outline-none
                                                            focus:border-[#0757C9]
                                                        "
                                                        defaultValue="all"
                                                    >
                                                        <option value="all">
                                                            All Roles
                                                        </option>
                                                        <option value="administrator">
                                                            Administrator
                                                        </option>
                                                        <option value="manager">
                                                            Manager
                                                        </option>
                                                        <option value="staff">
                                                            Staff
                                                        </option>
                                                    </select>

                                                    <ChevronDown
                                                        size={14}
                                                        className="
                                                            pointer-events-none
                                                            absolute
                                                            right-2.5
                                                            top-1/2
                                                            -translate-y-1/2
                                                            text-[#707784]
                                                        "
                                                    />
                                                </div>
                                            </div>

                                            {/* Status */}
                                            <div>
                                                <label className="mb-1.5 block text-[10px] font-medium text-[#343A47]">
                                                    Status
                                                </label>

                                                <div className="relative">
                                                    <select
                                                        value={statusFilter}
                                                        onChange={(e) => setStatusFilter(e.target.value)}
                                                        className="
                                                            h-9
                                                            w-full
                                                            appearance-none
                                                            rounded-md
                                                            border
                                                            border-[#D7DBE4]
                                                            bg-white
                                                            px-3
                                                            pr-8
                                                            text-xs
                                                            text-[#4B5260]
                                                            outline-none
                                                            focus:border-[#0757C9]
                                                        "
                                                        //defaultValue="all"
                                                    >
                                                        <option value="all">
                                                            All Status
                                                        </option>
                                                        <option value="active">
                                                            Active
                                                        </option>
                                                        <option value="inactive">
                                                            Inactive
                                                        </option>
                                                    </select>

                                                    <ChevronDown
                                                        size={14}
                                                        className="
                                                            pointer-events-none
                                                            absolute
                                                            right-2.5
                                                            top-1/2
                                                            -translate-y-1/2
                                                            text-[#707784]
                                                        "
                                                    />
                                                </div>
                                            </div>

                                            {/* Search button */}
                                            <button
                                                type="button"

                                                onClick={() => {
                                                    setAppliedFilters({
                                                        search: searchTerm.trim(),
                                                        role: roleFilter,
                                                        status: statusFilter,
                                                    });

                                                    setCurrentPage(1);
                                                }}

                                                
                                                className="
                                                    mt-auto
                                                    h-9
                                                    rounded-md
                                                    bg-[#2563EB]
                                                    px-5
                                                    text-xs
                                                    font-semibold
                                                    text-white
                                                    hover:bg-[#1D4ED8]
                                                "
                                            >
                                                Search
                                            </button>

                                            {/* Reset */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSearchTerm('');
                                                    setRoleFilter('all');
                                                    setStatusFilter('all');
                                                    setAppliedFilters({
                                                        search: '',
                                                        role: 'all',
                                                        status: 'all',
                                                    });

                                                    setCurrentPage(1);
                                                
                                                }}
                                                className="
                                                    mt-auto
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
                                                Reset
                                            </button>
                                        </div>
                                    </section>


                                    {statusMessage && (
                                        <div
                                            role="status"
                                            className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                                        >
                                            {statusMessage}
                                        </div>
                                    )}

                                    {statusError && (
                                        <div
                                            role="alert"
                                            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                                        >
                                            {statusError}
                                        </div>
                                    )}


                                    {showStatusConfirm && selectedStatusUser && (
                                        <div
                                            className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-[2px]"
                                            onClick={cancelStatusChange}
                                        >
                                            <div
                                                role="dialog"
                                                aria-modal="true"
                                                aria-labelledby="status-confirm-title"
                                                aria-describedby="status-confirm-description"
                                                className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
                                                onClick={(event) => event.stopPropagation()}
                                            >
                                                <div className="mb-5 flex items-start justify-between">
                                                    <div className="flex items-start gap-3">
                                                        <div
                                                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${selectedStatusUser.status === 'Active'
                                                                    ? 'bg-amber-50 text-amber-600'
                                                                    : 'bg-blue-50 text-blue-600'
                                                                }`}
                                                        >
                                                            {selectedStatusUser.status === 'Active' ? (
                                                                <AlertTriangle size={22} />
                                                            ) : (
                                                                <Power size={22} />
                                                            )}
                                                        </div>

                                                        <div>
                                                            <h2
                                                                id="status-confirm-title"
                                                                className="text-lg font-semibold text-slate-900"
                                                            >
                                                                {selectedStatusUser.status === 'Active'
                                                                    ? 'Deactivate User?'
                                                                    : 'Activate User?'}
                                                            </h2>

                                                            <p className="mt-1 text-sm text-slate-500">
                                                                Confirm this account status change.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        aria-label="Close confirmation"
                                                        onClick={cancelStatusChange}
                                                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>

                                                <p
                                                    id="status-confirm-description"
                                                    className="text-sm leading-6 text-slate-600"
                                                >
                                                    Are you sure you want to change{' '}
                                                    <span className="font-semibold text-slate-900">
                                                        {selectedStatusUser.name}
                                                    </span>
                                                    's status from{' '}
                                                    <span className="font-medium">
                                                        {selectedStatusUser.status}
                                                    </span>{' '}
                                                    to{' '}
                                                    <span
                                                        className={`font-semibold ${selectedStatusUser.status === 'Active'
                                                                ? 'text-amber-600'
                                                                : 'text-emerald-600'
                                                            }`}
                                                    >
                                                        {selectedStatusUser.status === 'Active'
                                                            ? 'Inactive'
                                                            : 'Active'}
                                                    </span>
                                                    ?
                                                </p>

                                                <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                                                    <button
                                                        type="button"
                                                        onClick={cancelStatusChange}
                                                        className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                                    >
                                                        Cancel
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={confirmStatusChange}
                                                        className={`rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition ${selectedStatusUser.status === 'Active'
                                                                ? 'bg-amber-600 hover:bg-amber-700'
                                                                : 'bg-[#2563EB] hover:bg-blue-700'
                                                            }`}
                                                    >
                                                        Confirm
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}



                                    {showDeleteConfirm && selectedDeleteUser && (
                                        <div
                                            className="fixed inset-0 z-110 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-[2px]"
                                            onClick={cancelDeleteUser}
                                        >
                                            <div
                                                role="alertdialog"
                                                aria-modal="true"
                                                aria-labelledby="delete-user-title"
                                                aria-describedby="delete-user-description"
                                                className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
                                                onClick={(event) => event.stopPropagation()}
                                            >
                                                <div className="mb-5 flex items-start gap-3">
                                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                                                        <Trash2 size={22} />
                                                    </div>

                                                    <div>
                                                        <h2
                                                            id="delete-user-title"
                                                            className="text-lg font-semibold text-slate-900"
                                                        >
                                                            Delete User?
                                                        </h2>

                                                        <p className="mt-1 text-sm text-slate-500">
                                                            This action cannot be undone from this page.
                                                        </p>
                                                    </div>
                                                </div>

                                                <p
                                                    id="delete-user-description"
                                                    className="text-sm leading-6 text-slate-600"
                                                >
                                                    Are you sure you want to delete{' '}
                                                    <span className="font-semibold text-slate-900">
                                                        {selectedDeleteUser.name}
                                                    </span>
                                                    ? Their user profile will be removed from BizFlow.
                                                </p>

                                                <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                                                    <button
                                                        type="button"
                                                        onClick={cancelDeleteUser}
                                                        disabled={Boolean(deletingUserId)}
                                                        className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                                                    >
                                                        Cancel
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={confirmDeleteUser}
                                                        disabled={Boolean(deletingUserId)}
                                                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        <Trash2 size={15} />
                                                        {deletingUserId ? 'Deleting...' : 'Delete User'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}




                                    {/* User Table */}
                                    <section
                                        className="
                                            mt-4
                                            overflow-hidden
                                            rounded-lg
                                            border
                                            border-[#E6E8ED]
                                            bg-white
                                            shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                        "
                                    >
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-212.5 border-collapse">
                                                <thead>
                                                    <tr className="bg-[#F4F4FC]">
                                                        <th className="px-4 py-4 text-left text-[11px] font-semibold text-[#4B5260]">
                                                            Profile
                                                        </th>

                                                        <th className="px-3 py-4 text-left text-[11px] font-semibold text-[#4B5260]">
                                                            User ID
                                                        </th>

                                                        <th className="px-3 py-4 text-left text-[11px] font-semibold text-[#4B5260]">
                                                            Email
                                                        </th>

                                                        <th className="px-3 py-4 text-left text-[11px] font-semibold text-[#4B5260]">
                                                            Role
                                                        </th>

                                                        <th className="px-3 py-4 text-left text-[11px] font-semibold text-[#4B5260]">
                                                            Status
                                                        </th>

                                                        <th className="px-3 py-4 text-left text-[11px] font-semibold text-[#4B5260]">
                                                            Created Date
                                                        </th>

                                                        <th className="px-3 py-4 text-left text-[11px] font-semibold text-[#4B5260]">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {loading ? (
                                                        <tr>
                                                            <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#69707D]">
                                                                Loading users...
                                                            </td>
                                                        </tr>
                                                    ) : error ? (
                                                        <tr>
                                                            <td colSpan={7} className="px-4 py-8 text-center text-sm text-red-600">
                                                                {error}
                                                            </td>
                                                        </tr>
                                                        ) : filteredUsers.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={7} className="px-4 py-8 text-center text-sm text-[#69707D]">
                                                                No users found.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        paginatedUsers.map((user) => (
                                                            <tr
                                                                key={user.mongoId}
                                                                className="border-t border-[#ECEEF2] transition hover:bg-[#FBFCFF]"
                                                            >
                                                                <td className="px-4 py-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8EEF9] text-[9px] font-semibold text-[#315A9E]">
                                                                            {user.initials}
                                                                        </div>
                                                                        <span className="whitespace-nowrap text-xs font-semibold text-[#343A47]">
                                                                            {user.name}
                                                                        </span>
                                                                    </div>
                                                                </td>

                                                                <td className="px-3 py-4 text-[11px] text-[#69707D]">
                                                                    {user.id}
                                                                </td>

                                                                <td className="px-3 py-4 text-[11px] text-[#59606E]">
                                                                    {user.email}
                                                                </td>

                                                                <td className="px-3 py-4">
                                                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-semibold ${user.roleClass}`}>
                                                                        {user.role}
                                                                    </span>
                                                                </td>

                                                                <td className="px-3 py-4">
                                                                    <span className={`flex items-center gap-2 text-[11px] font-medium ${user.active ? 'text-[#18A957]' : 'text-[#69707D]'}`}>
                                                                        <span className={`h-1.5 w-1.5 rounded-full ${user.active ? 'bg-[#18A957]' : 'bg-[#B9C0D0]'}`} />
                                                                        {user.status}
                                                                    </span>
                                                                </td>

                                                                <td className="px-3 py-4 text-[11px] text-[#69707D]">
                                                                    {user.date}
                                                                </td>

                                                                <td className="px-3 py-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <button
                                                                            type="button"
                                                                            aria-label={`View ${user.name}`}
                                                                            className="text-[#59606E] hover:text-[#0757C9]"
                                                                            onClick={(event) => {
                                                                                event.stopPropagation()
                                                                                navigate(`/admin/users/view/${user.mongoId}`)
                                                                            }}
                                                                        >
                                                                            <Eye size={14} />
                                                                        </button>


                                                                        <button
                                                                            type="button"
                                                                            aria-label={`Edit ${user.name}`}
                                                                            className="relative z-10 cursor-pointer text-[#59606E] hover:text-[#0757C9]"
                                                                            onClick={(event) => {
                                                                                event.stopPropagation();
                                                                                navigate(`/admin/users/edit/${user.mongoId}`);
                                                                            }}
                                                                        >
                                                                            <Pencil size={14} />
                                                                        </button>



                                                                        <button
                                                                            type="button"
                                                                            aria-label={`${user.status === 'Active' ? 'Deactivate' : 'Activate'} ${user.name}`}
                                                                            title={user.status === 'Active' ? 'Deactivate user' : 'Activate user'}
                                                                            disabled={updatingUserId === user.mongoId}
                                                                            className={`cursor-pointer transition disabled:cursor-not-allowed disabled:opacity-50 ${user.status === 'Active'
                                                                                    ? 'text-[#59606E] hover:text-amber-600'
                                                                                    : 'text-[#18A957] hover:text-green-700'
                                                                                }`}
                                                                            onClick={(event) => {
                                                                                event.stopPropagation();
                                                                                handleToggleUserStatus(user);
                                                                            }}
                                                                        >
                                                                            <Power size={14} />
                                                                        </button>


                                                                        <button
                                                                            type="button"
                                                                            aria-label={`Delete ${user.name}`}
                                                                            title="Delete user"
                                                                            disabled={deletingUserId === user.mongoId}
                                                                            className="cursor-pointer text-[#59606E] transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                                                            onClick={(event) => {
                                                                                event.stopPropagation();
                                                                                handleDeleteUser(user);
                                                                            }}
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Pagination */}
                                        <div
                                            className="
                                                flex
                                                flex-col
                                                gap-3
                                                border-t
                                                border-[#ECEEF2]
                                                px-4
                                                py-4
                                                sm:flex-row
                                                sm:items-center
                                                sm:justify-between
                                            "
                                        >
                                            <p className="text-[10px] text-[#59606E]">
                                                Showing {firstVisibleUser}–{lastVisibleUser} of {totalFilteredUsers} Users
                                            </p>

                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2 text-[10px] text-[#59606E]">
                                                    <span>Rows per page:</span>

                                                    <select
                                                        value={rowsPerPage}
                                                        onChange={(e) => {
                                                            setRowsPerPage(Number(e.target.value));
                                                            setCurrentPage(1);
                                                        }}
                                                        className="rounded border border-[#D7DBE4] bg-white px-2 py-1 text-[10px] text-[#343A47]"
                                                        aria-label="Rows per page"
                                                    >
                                                        <option value={5}>5</option>
                                                        <option value={10}>10</option>
                                                        <option value={25}>25</option>
                                                        <option value={50}>50</option>
                                                    </select>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        disabled={currentPage === 1}
                                                        onClick={() =>
                                                            setCurrentPage((page) => Math.max(1, page - 1))
                                                        }
                                                        className="flex h-7 w-7 items-center justify-center text-[#59606E] disabled:cursor-not-allowed disabled:opacity-40"
                                                        aria-label="Previous page"
                                                    >
                                                        <ChevronLeft size={14} />
                                                    </button>

                                                    {Array.from({ length: totalPages }, (_, index) => index + 1)
                                                        .filter((page) =>
                                                            page === 1 ||
                                                            page === totalPages ||
                                                            Math.abs(page - currentPage) <= 1
                                                        )
                                                        .reduce((items, page, index, pages) => {
                                                            if (index > 0 && page - pages[index - 1] > 1) {
                                                                items.push('ellipsis-' + page);
                                                            }

                                                            items.push(page);
                                                            return items;
                                                        }, [])
                                                        .map((page) =>
                                                            typeof page === 'string' ? (
                                                                <span
                                                                    key={page}
                                                                    className="px-1 text-xs text-[#59606E]"
                                                                >
                                                                    …
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    key={page}
                                                                    type="button"
                                                                    onClick={() => setCurrentPage(page)}
                                                                    aria-current={currentPage === page ? 'page' : undefined}
                                                                    className={`h-7 w-7 rounded text-xs ${currentPage === page
                                                                            ? 'bg-[#0757C9] font-semibold text-white'
                                                                            : 'text-[#59606E] hover:bg-[#F1F3FA]'
                                                                        }`}
                                                                >
                                                                    {page}
                                                                </button>
                                                            )
                                                        )}

                                                    <button
                                                        type="button"
                                                        disabled={currentPage >= totalPages}
                                                        onClick={() =>
                                                            setCurrentPage((page) => Math.min(totalPages, page + 1))
                                                        }
                                                        className="flex h-7 w-7 items-center justify-center text-[#59606E] disabled:cursor-not-allowed disabled:opacity-40"
                                                        aria-label="Next page"
                                                    >
                                                        <ChevronRight size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                {/* =================================================
                                    RIGHT SIDEBAR
                                ================================================== */}
                                <div className="space-y-4">

                                    {/* User Summary */}
                                    <section
                                        className="
                                            rounded-lg
                                            border
                                            border-[#E6E8ED]
                                            bg-white
                                            p-5
                                            shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                        "
                                    >
                                        <h3 className="text-sm font-semibold text-[#242936]">
                                            User Summary
                                        </h3>

                                        <div className="mt-5 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className="
                                                        flex
                                                        h-8
                                                        w-8
                                                        items-center
                                                        justify-center
                                                        rounded-md
                                                        bg-[#EEF3FF]
                                                        text-[#0757C9]
                                                    "
                                                >
                                                    <Users size={16} />
                                                </span>

                                                <span className="text-xs text-[#59606E]">
                                                    Total Users
                                                </span>
                                            </div>

                                            <span className="text-lg font-bold text-[#242936]">
                                                {loading ? '—' : totalUsers}
                                            </span>
                                        </div>

                                        <div className="mt-5 grid grid-cols-2 gap-2">
                                            <div className="rounded-md bg-[#F0F1FA] p-3">
                                                <p className="text-[9px] uppercase text-[#59606E]">
                                                    Admins
                                                </p>

                                                <p className="mt-1 text-sm font-bold text-[#242936]">
                                                    {loading ? '—' : adminCount}
                                                </p>
                                            </div>

                                            <div className="rounded-md bg-[#F0F1FA] p-3">
                                                <p className="text-[9px] uppercase text-[#59606E]">
                                                    Managers
                                                </p>

                                                <p className="mt-1 text-sm font-bold text-[#242936]">
                                                    {loading ? '—' : managerCount}
                                                </p>
                                            </div>

                                            <div className="rounded-md bg-[#F0F1FA] p-3">
                                                <p className="text-[9px] uppercase text-[#59606E]">
                                                    Staff
                                                </p>

                                                <p className="mt-1 text-sm font-bold text-[#242936]">
                                                    {loading ? '—' : staffCount}
                                                </p>
                                            </div>

                                            <div className="rounded-md border border-[#A9E4C5] bg-[#F1FBF6] p-3">
                                                <p className="text-[9px] uppercase text-[#18A957]">
                                                    Active
                                                </p>

                                                <p className="mt-1 text-sm font-bold text-[#168C4B]">
                                                    {loading ? '—' : activeCount}
                                                </p>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Recently Added */}
                                    <section
                                        className="
                                            rounded-lg
                                            border
                                            border-[#E6E8ED]
                                            bg-white
                                            p-5
                                            shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                        "
                                    >
                                        <h3 className="text-sm font-semibold text-[#242936]">
                                            Recently Added
                                        </h3>

                                        <div className="mt-5 space-y-4">
                                            {recentUsers.map((user, index) => (
                                                <div
                                                    key={`${user.name}-${index}`}
                                                    className="flex items-center justify-between"
                                                >
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <div
                                                            className={`
                                                                flex
                                                                h-8
                                                                w-8
                                                                shrink-0
                                                                items-center
                                                                justify-center
                                                                rounded-full
                                                                text-[9px]
                                                                font-semibold
                                                                ${user.avatar}
                                                            `}
                                                        >
                                                            {user.initials}
                                                        </div>

                                                        <div className="min-w-0">
                                                            <p className="truncate text-xs font-semibold text-[#343A47]">
                                                                {user.name}
                                                            </p>

                                                            <span
                                                                className="
                                                                    mt-0.5
                                                                    inline-block
                                                                    rounded
                                                                    bg-[#EEF3FF]
                                                                    px-1.5
                                                                    py-0.5
                                                                    text-[8px]
                                                                    font-medium
                                                                    text-[#315A9E]
                                                                "
                                                            >
                                                                {user.role}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <span className="shrink-0 text-[9px] text-[#59606E]">
                                                        {user.time}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            type="button"
                                            className="
                                                mt-6
                                                w-full
                                                text-center
                                                text-[10px]
                                                font-semibold
                                                text-[#0757C9]
                                            "
                                        >
                                            View All Activity
                                        </button>
                                    </section>
                                </div>
                            </div>

                            {/* =================================================
                                QUICK ACTIONS
                            ================================================== */}
                            <section className="mt-7">
                                <h3 className="text-sm font-semibold text-[#242936]">
                                    Quick Actions
                                </h3>

                                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                    {quickActions.map((action) => {
                                        const Icon = action.icon

                                        return (
                                            <button
                                                key={action.title}
                                                type="button"
                                                className="
                                                    flex
                                                    min-h-20
                                                    items-center
                                                    gap-4
                                                    rounded-lg
                                                    border
                                                    border-[#E6E8ED]
                                                    bg-white
                                                    px-5
                                                    text-left
                                                    shadow-[0_2px_8px_rgba(15,23,42,0.04)]
                                                    transition
                                                    hover:border-[#C8D5F2]
                                                    hover:shadow-[0_4px_12px_rgba(15,23,42,0.07)]
                                                "
                                            >
                                                <span
                                                    className="
                                                        flex
                                                        h-10
                                                        w-10
                                                        shrink-0
                                                        items-center
                                                        justify-center
                                                        rounded-md
                                                        bg-[#EEF3FF]
                                                        text-[#0757C9]
                                                    "
                                                >
                                                    <Icon size={19} />
                                                </span>

                                                <span>
                                                    <span className="block text-xs font-semibold text-[#343A47]">
                                                        {action.title}
                                                    </span>

                                                    <span className="mt-1 block text-[10px] leading-4 text-[#7A808C]">
                                                        {action.description}
                                                    </span>
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </section>

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

            {showAddUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
                    <form
                        onSubmit={handleCreateUser}
                        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
                    >
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-[#171B25]">
                                    Add New User
                                </h2>
                                <p className="mt-1 text-xs text-[#69707D]">
                                    Create a new BizFlow account.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    if (!creatingUser) {
                                        setShowAddUser(false);
                                        setCreateUserError('');
                                    }
                                }}
                                disabled={creatingUser}
                                className="text-sm text-[#69707D] hover:text-[#171B25]"
                                aria-label="Close form"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <label className="text-xs font-medium text-[#343A47] sm:col-span-2">
                                Full name *
                                <input
                                    required
                                    value={newUser.fullName}
                                    onChange={(e) =>
                                        setNewUser({
                                            ...newUser,
                                            fullName: e.target.value,
                                        })
                                    }
                                    className="mt-1.5 h-10 w-full rounded-md border border-[#D7DBE4] px-3 text-sm outline-none focus:border-[#0757C9]"
                                />
                            </label>

                            <label className="text-xs font-medium text-[#343A47] sm:col-span-2">
                                Email address *
                                <input
                                    required
                                    type="email"
                                    autoComplete="off"
                                    value={newUser.email}
                                    onChange={(e) =>
                                        setNewUser({
                                            ...newUser,
                                            email: e.target.value,
                                        })
                                    }
                                    className="mt-1.5 h-10 w-full rounded-md border border-[#D7DBE4] px-3 text-sm outline-none focus:border-[#0757C9]"
                                />
                            </label>

                            <label className="text-xs font-medium text-[#343A47] sm:col-span-2">
                                Temporary password *
                                <input
                                    required
                                    type="password"
                                    autoComplete="new-password"
                                    minLength={6}
                                    value={newUser.password}
                                    onChange={(e) =>
                                        setNewUser({
                                            ...newUser,
                                            password: e.target.value,
                                        })
                                    }
                                    className="mt-1.5 h-10 w-full rounded-md border border-[#D7DBE4] px-3 text-sm outline-none focus:border-[#0757C9]"
                                />
                            </label>

                            <label className="text-xs font-medium text-[#343A47]">
                                Role *
                                <select
                                    value={newUser.role}
                                    onChange={(e) =>
                                        setNewUser({
                                            ...newUser,
                                            role: e.target.value,
                                        })
                                    }
                                    className="mt-1.5 h-10 w-full rounded-md border border-[#D7DBE4] bg-white px-3 text-sm"
                                >
                                    <option value="Staff">Staff</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Administrator">Administrator</option>
                                </select>
                            </label>

                            <label className="text-xs font-medium text-[#343A47]">
                                Phone
                                <input
                                    type="tel"
                                    value={newUser.phone}
                                    onChange={(e) =>
                                        setNewUser({
                                            ...newUser,
                                            phone: e.target.value,
                                        })
                                    }
                                    className="mt-1.5 h-10 w-full rounded-md border border-[#D7DBE4] px-3 text-sm"
                                />
                            </label>

                            <label className="text-xs font-medium text-[#343A47] sm:col-span-2">
                                Department
                                <input
                                    value={newUser.department}
                                    onChange={(e) =>
                                        setNewUser({
                                            ...newUser,
                                            department: e.target.value,
                                        })
                                    }
                                    className="mt-1.5 h-10 w-full rounded-md border border-[#D7DBE4] px-3 text-sm"
                                />
                            </label>
                        </div>

                        {createUserError && (
                            <p role="alert" className="mt-4 text-sm text-red-600">
                                {createUserError}
                            </p>
                        )}

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                disabled={creatingUser}
                                onClick={() => setShowAddUser(false)}
                                className="h-10 rounded-md border border-[#D7DBE4] px-4 text-xs font-medium text-[#343A47] disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={creatingUser}
                                className="h-10 rounded-md bg-[#0052CC] px-5 text-xs font-semibold text-white hover:bg-[#0045AD] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {creatingUser ? 'Creating...' : 'Create User'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

        </main>
    )
}

export default UserManagement