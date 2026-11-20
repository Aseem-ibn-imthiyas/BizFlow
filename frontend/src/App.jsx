
import ProtectedRoute from './components/ProtectedRoute'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// ============================================================
// ADMIN
// ============================================================
import AdminDashboard from './pages/admin/AdminDashboard'
import UserManagement from './pages/admin/UserManagement'
import AddUser from './pages/admin/AddUser'
import EditUser from './pages/admin/EditUser'
import ViewUser from './pages/admin/ViewUser'
//import UserDetails from './pages/admin/UserDetails'
import RolePermissionManagement from './pages/admin/RolePermissionManagement'
import AdminAutomationLogs from './pages/admin/AdminAutomationLogs'
import AdminSystemHealth from './pages/admin/AdminSystemHealth'
import AdminProfile from './pages/admin/AdminProfile'
import AdminChangePassword from './pages/admin/AdminChangePassword'
import AdminSystemSettings from './pages/admin/AdminSystemSettings'
import WorkflowHome from './pages/admin/WorkflowHome'
import CreateWorkflow from './pages/admin/CreateWorkflow'
import SupportCenter from './pages/admin/SupportCenter'

// ============================================================
// MANAGER
// ============================================================
import ManagerDashboard from './pages/manager/ManagerDashboard'
import InventoryManagement from './pages/manager/InventoryManagement'
import AddInventoryItem from './pages/manager/AddInventoryItem'
import EditInventoryItem from './pages/manager/EditInventoryItem'
import SalesManagement from './pages/manager/SalesManagement'
import AddSalesRecord from './pages/manager/AddSalesRecord'
import ReportsAnalytics from './pages/manager/ReportsAnalytics'
import Notifications from './pages/manager/Notifications'
import Settings from './pages/manager/Settings'
import CreateAutomation from './pages/manager/CreateAutomation'
import ViewInventoryItem from './pages/manager/ViewInventoryItem';
import TaskManagement from './pages/manager/TaskManagement'
import AddTask from './pages/manager/AddTask'
import TaskDetails from './pages/manager/TaskDetails'
import WorkflowHomes from './pages/manager/WorkflowHome'

// ============================================================
// STAFF
// ============================================================
import StaffDashboard from './pages/staff/StaffDashboard'
import StaffInventoryManagement from './pages/staff/StaffInventoryManagement'
import StaffSalesManagement from './pages/staff/StaffSalesManagement'
import StaffTasks from './pages/staff/StaffTasks'
import StaffNotifications from './pages/staff/Notifications'
import StaffSettings from './pages/staff/Settings'
import StaffEditInventoryItem from './pages/staff/StaffEditInventoryItem'
import StaffAddSalesRecord from './pages/staff/StaffAddSalesRecord'

// ============================================================
// AUTH
// ============================================================
import AdminLogin from './pages/auth/AdminLogin'
import ManagerLogin from './pages/auth/ManagerLogin'
import StaffLogin from './pages/auth/StaffLogin'


function App() {

  const protectAdmin = (page) => (
    <ProtectedRoute allowedRoles={['Administrator']}>
      {page}
    </ProtectedRoute>
  )

  const protectManager = (page) => (
    <ProtectedRoute allowedRoles={['Manager']}>
      {page}
    </ProtectedRoute>
  )

  const protectStaff = (page) => (
    <ProtectedRoute allowedRoles={['Staff']}>{page}</ProtectedRoute>
  )

  return (
    <BrowserRouter>
      <Routes>

        {/* ==================================================
                    ADMIN
                ================================================== */}

        <Route
          path="/admin/dashboard"
          element={protectAdmin(<AdminDashboard />)}
        />

        <Route
          path="/admin/users"
          element={protectAdmin(<UserManagement />)}
        />

        <Route
          path="/admin/users/add"
          element={protectAdmin(<AddUser />)}
        />

        <Route
          path="/admin/users/edit/:id"
          element={protectAdmin(<EditUser />)}
        />

        <Route
          path="/admin/users/view/:id"
          element={protectAdmin(<ViewUser />)}
        />

        <Route
          path="/admin/roles"
          element={protectAdmin(<RolePermissionManagement />)}
        />

        <Route
          path="/admin/logs"
          element={protectAdmin(<AdminAutomationLogs />)}
        />

        <Route
          path="/admin/health"
          element={protectAdmin(<AdminSystemHealth />)}
        />

        <Route
          path="/admin/workflows"
          element={protectAdmin(<WorkflowHome />)}
        />

        <Route
          path="/admin/workflow"
          element={protectAdmin(<CreateWorkflow />)}
        />

        <Route
          path="/admin/profile"
          element={protectAdmin(<AdminProfile />)}
        />

        <Route
          path="/admin/change-password"
          element={protectAdmin(<AdminChangePassword />)}
        />

        <Route
          path="/admin/settings"
          element={protectAdmin(<AdminSystemSettings />)}
        />

        <Route
          path="/admin/support"
          element={protectAdmin(<SupportCenter />)}
        />


        {/* ==================================================
                    MANAGER
                ================================================== */}

        <Route
          path="/manager/dashboard"
          element={protectManager(<ManagerDashboard />)}
        />

        <Route
          path="/manager/inventory"
          element={protectManager(<InventoryManagement />)}
        />

        <Route
          path="/manager/inventory/add"
          element={protectManager(<AddInventoryItem />)}
        />

        <Route
          path="/manager/inventory/edit/:id"
          element={protectManager(<EditInventoryItem />)}
        />

        <Route
          path="/manager/inventory/details/:id"
          element={<ViewInventoryItem />}
        />

        <Route
          path="/manager/sales/"
          element={protectManager(<SalesManagement />)}
        />

        <Route
          path="/manager/sales/add"
          element={protectManager(<AddSalesRecord />)}
        />

        <Route
          path="/manager/tasks"
          element={protectManager(<TaskManagement />)}
        />

        <Route
          path="/manager/tasks/add"
          element={protectManager(<AddTask />)}
        />

        <Route
          path="/manager/tasks/details/:id"
          element={protectManager(<TaskDetails />)}
        />

        <Route
          path="/manager/tasks/details"
          element={protectManager(<TaskDetails />)}
        />

        <Route
          path="/manager/reports/"
          element={protectManager(<ReportsAnalytics />)}
        />

        <Route
          path="/manager/notifications/"
          element={protectManager(<Notifications />)}
        />

        <Route
          path="/manager/workflows"
          element={protectManager(<WorkflowHomes />)}
        />

        <Route
          path="/manager/automation"
          element={protectManager(<CreateAutomation />)}
        />

        <Route
          path="/manager/settings/"
          element={protectManager(<Settings />)}
        />



        {/* ==================================================
                    Staff
        ================================================== */}

        <Route
          path="/staff/Dashboard"
          element={protectStaff(<StaffDashboard />)}
        />

        <Route
          path="/staff/inventory"
          element={protectStaff(<StaffInventoryManagement />)}
        />

        <Route
          path="/staff/inventory/edit/:id"
          element={protectStaff(<StaffEditInventoryItem />)}
        />

        <Route
          path="/staff/sales"
          element={protectStaff(<StaffSalesManagement />)}
        />

        <Route
          path="/staff/sales/add"
          element={protectStaff(<StaffAddSalesRecord />)}
        />

        <Route
          path="/staff/tasks"
          element={protectStaff(<StaffTasks />)}
        />

        <Route
          path="/staff/notifications"
          element={protectStaff(<StaffNotifications />)}
        />
        <Route
          path="/staff/settings"
          element={protectStaff(<StaffSettings />)}
        />



        {/* ==================================================
                    AUTH
        ================================================== */}

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        <Route
          path="/manager/login"
          element={<ManagerLogin />}
        />

        <Route
          path="/staff/login"
          element={<StaffLogin />}
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App