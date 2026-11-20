
import { auth } from '../config/firebase';

const configuredBaseUrl =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const normalizedBaseUrl = configuredBaseUrl.replace(/\/+$/, '');

const API_BASE_URL = normalizedBaseUrl.endsWith('/api')
    ? normalizedBaseUrl
    : `${normalizedBaseUrl}/api`;

// Reusable authenticated API request function.
const apiRequest = async (endpoint, options = {}) => {
    try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            throw new Error('Please sign in to continue.');
        }

        // Get the latest Firebase ID token.
        const token = await currentUser.getIdToken();

        const headers = {
            Authorization: `Bearer ${token}`,
            ...options.headers,
        };

        // Set JSON content type when sending a normal request body.
        if (
            options.body &&
            !(options.body instanceof FormData) &&
            !headers['Content-Type']
        ) {
            headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(
            `${API_BASE_URL}${endpoint}`,
            {
                ...options,
                headers,
            }
        );

        // Handle empty responses.
        if (response.status === 204) {
            return null;
        }

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || `Request failed (${response.status})`
            );
        }

        return result;
    } catch (error) {
        console.error('BizFlow API Error:', error);
        throw error;
    }
};

// Reusable HTTP methods.

// Reusable HTTP methods.
const api = {
    get: (endpoint) =>
        apiRequest(endpoint, { method: 'GET' }),

    post: (endpoint, data) =>
        apiRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    put: (endpoint, data) =>
        apiRequest(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    patch: (endpoint, data) =>
        apiRequest(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),

    postFormData: (endpoint, formData) =>
        apiRequest(endpoint, {
            method: 'POST',
            body: formData,
        }),

    delete: (endpoint) =>
        apiRequest(endpoint, { method: 'DELETE' }),
};

export default api;