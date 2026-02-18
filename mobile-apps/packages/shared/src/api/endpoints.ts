import { API_ENDPOINTS } from '../constants/api';

// Helper function to replace parameters in URL paths
export const buildUrl = (template: string, params: Record<string, string | number>): string => {
  return Object.entries(params).reduce(
    (url, [key, value]) => url.replace(`:${key}`, String(value)),
    template
  );
};

// Authentication Endpoints
export const authEndpoints = {
  login: () => API_ENDPOINTS.AUTH.LOGIN,
  register: () => API_ENDPOINTS.AUTH.REGISTER,
  logout: () => API_ENDPOINTS.AUTH.LOGOUT,
  refresh: () => API_ENDPOINTS.AUTH.REFRESH,
  forgotPassword: () => API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
  resetPassword: () => API_ENDPOINTS.AUTH.RESET_PASSWORD,
  verifyEmail: () => API_ENDPOINTS.AUTH.VERIFY_EMAIL,
  changePassword: () => API_ENDPOINTS.AUTH.CHANGE_PASSWORD,
  profile: () => API_ENDPOINTS.AUTH.PROFILE,
  updateProfile: () => API_ENDPOINTS.AUTH.UPDATE_PROFILE,
};

// User Endpoints
export const userEndpoints = {
  profile: () => API_ENDPOINTS.USER.PROFILE,
  updateProfile: () => API_ENDPOINTS.USER.UPDATE_PROFILE,
  addresses: () => API_ENDPOINTS.USER.ADDRESSES,
  addAddress: () => API_ENDPOINTS.USER.ADD_ADDRESS,
  updateAddress: (id: string) => buildUrl(API_ENDPOINTS.USER.UPDATE_ADDRESS, { id }),
  deleteAddress: (id: string) => buildUrl(API_ENDPOINTS.USER.DELETE_ADDRESS, { id }),
  setDefaultAddress: (id: string) => buildUrl(API_ENDPOINTS.USER.SET_DEFAULT_ADDRESS, { id }),
  notifications: () => API_ENDPOINTS.USER.NOTIFICATIONS,
  notificationPreferences: () => API_ENDPOINTS.USER.NOTIFICATION_PREFERENCES,
  deleteAccount: () => API_ENDPOINTS.USER.DELETE_ACCOUNT,
};

// Service Endpoints
export const serviceEndpoints = {
  list: (params?: { page?: number; limit?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.search) query.append('search', params.search);
    const queryString = query.toString();
    return `${API_ENDPOINTS.SERVICES.LIST}${queryString ? `?${queryString}` : ''}`;
  },
  detail: (id: string) => buildUrl(API_ENDPOINTS.SERVICES.DETAIL, { id }),
  search: (query: string, filters?: Record<string, any>) => {
    const searchParams = new URLSearchParams({ q: query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }
    return `${API_ENDPOINTS.SERVICES.SEARCH}?${searchParams.toString()}`;
  },
  featured: () => API_ENDPOINTS.SERVICES.FEATURED,
  byCategory: (categoryId: string) => buildUrl(API_ENDPOINTS.SERVICES.BY_CATEGORY, { categoryId }),
  bySubcategory: (subcategoryId: string) => buildUrl(API_ENDPOINTS.SERVICES.BY_SUBCATEGORY, { subcategoryId }),
  nearby: (latitude: number, longitude: number, radius: number = 10) => {
    const params = new URLSearchParams({
      lat: String(latitude),
      lng: String(longitude),
      radius: String(radius),
    });
    return `${API_ENDPOINTS.SERVICES.NEARBY}?${params.toString()}`;
  },
};

// Category Endpoints
export const categoryEndpoints = {
  list: () => API_ENDPOINTS.CATEGORIES.LIST,
  detail: (id: string) => buildUrl(API_ENDPOINTS.CATEGORIES.DETAIL, { id }),
  services: (id: string) => buildUrl(API_ENDPOINTS.CATEGORIES.SERVICES, { id }),
};

// Subcategory Endpoints
export const subcategoryEndpoints = {
  list: () => API_ENDPOINTS.SUBCATEGORIES.LIST,
  detail: (id: string) => buildUrl(API_ENDPOINTS.SUBCATEGORIES.DETAIL, { id }),
  byCategory: (categoryId: string) => buildUrl(API_ENDPOINTS.SUBCATEGORIES.BY_CATEGORY, { categoryId }),
  services: (id: string) => buildUrl(API_ENDPOINTS.SUBCATEGORIES.SERVICES, { id }),
};

// Cart Endpoints
export const cartEndpoints = {
  get: () => API_ENDPOINTS.CART.GET,
  addItem: () => API_ENDPOINTS.CART.ADD_ITEM,
  updateItem: (itemId: string) => buildUrl(API_ENDPOINTS.CART.UPDATE_ITEM, { itemId }),
  removeItem: (itemId: string) => buildUrl(API_ENDPOINTS.CART.REMOVE_ITEM, { itemId }),
  clear: () => API_ENDPOINTS.CART.CLEAR,
  applyCoupon: () => API_ENDPOINTS.CART.APPLY_COUPON,
  removeCoupon: () => API_ENDPOINTS.CART.REMOVE_COUPON,
};

// Booking Endpoints
export const bookingEndpoints = {
  list: (params?: { status?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    const queryString = query.toString();
    return `${API_ENDPOINTS.BOOKINGS.LIST}${queryString ? `?${queryString}` : ''}`;
  },
  create: () => API_ENDPOINTS.BOOKINGS.CREATE,
  detail: (id: string) => buildUrl(API_ENDPOINTS.BOOKINGS.DETAIL, { id }),
  update: (id: string) => buildUrl(API_ENDPOINTS.BOOKINGS.UPDATE, { id }),
  cancel: (id: string) => buildUrl(API_ENDPOINTS.BOOKINGS.CANCEL, { id }),
  reschedule: (id: string) => buildUrl(API_ENDPOINTS.BOOKINGS.RESCHEDULE, { id }),
  rate: (id: string) => buildUrl(API_ENDPOINTS.BOOKINGS.RATE, { id }),
  history: () => API_ENDPOINTS.BOOKINGS.HISTORY,
};

// Order Endpoints
export const orderEndpoints = {
  list: (params?: { status?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    const queryString = query.toString();
    return `${API_ENDPOINTS.ORDERS.LIST}${queryString ? `?${queryString}` : ''}`;
  },
  create: () => API_ENDPOINTS.ORDERS.CREATE,
  detail: (id: string) => buildUrl(API_ENDPOINTS.ORDERS.DETAIL, { id }),
  updateStatus: (id: string) => buildUrl(API_ENDPOINTS.ORDERS.UPDATE_STATUS, { id }),
  cancel: (id: string) => buildUrl(API_ENDPOINTS.ORDERS.CANCEL, { id }),
  history: () => API_ENDPOINTS.ORDERS.HISTORY,
};

// Payment Endpoints
export const paymentEndpoints = {
  methods: () => API_ENDPOINTS.PAYMENTS.METHODS,
  create: () => API_ENDPOINTS.PAYMENTS.CREATE,
  verify: (id: string) => buildUrl(API_ENDPOINTS.PAYMENTS.VERIFY, { id }),
  refund: (id: string) => buildUrl(API_ENDPOINTS.PAYMENTS.REFUND, { id }),
  history: () => API_ENDPOINTS.PAYMENTS.HISTORY,
  webhooks: () => API_ENDPOINTS.PAYMENTS.WEBHOOKS,
};

// Engineer Endpoints (for Engineer App)
export const engineerEndpoints = {
  profile: () => API_ENDPOINTS.ENGINEERS.PROFILE,
  updateProfile: () => API_ENDPOINTS.ENGINEERS.UPDATE_PROFILE,
  jobs: (params?: { status?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    const queryString = query.toString();
    return `${API_ENDPOINTS.ENGINEERS.JOBS}${queryString ? `?${queryString}` : ''}`;
  },
  jobDetail: (id: string) => buildUrl(API_ENDPOINTS.ENGINEERS.JOB_DETAIL, { id }),
  acceptJob: (id: string) => buildUrl(API_ENDPOINTS.ENGINEERS.ACCEPT_JOB, { id }),
  startJob: (id: string) => buildUrl(API_ENDPOINTS.ENGINEERS.START_JOB, { id }),
  completeJob: (id: string) => buildUrl(API_ENDPOINTS.ENGINEERS.COMPLETE_JOB, { id }),
  updateLocation: () => API_ENDPOINTS.ENGINEERS.UPDATE_LOCATION,
  availability: () => API_ENDPOINTS.ENGINEERS.AVAILABILITY,
  earnings: (params?: { period?: 'daily' | 'weekly' | 'monthly' }) => {
    const query = params?.period ? `?period=${params.period}` : '';
    return `${API_ENDPOINTS.ENGINEERS.EARNINGS}${query}`;
  },
  documents: () => API_ENDPOINTS.ENGINEERS.DOCUMENTS,
  uploadDocument: () => API_ENDPOINTS.ENGINEERS.UPLOAD_DOCUMENT,
};

// Review Endpoints
export const reviewEndpoints = {
  list: (params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    const queryString = query.toString();
    return `${API_ENDPOINTS.REVIEWS.LIST}${queryString ? `?${queryString}` : ''}`;
  },
  create: () => API_ENDPOINTS.REVIEWS.CREATE,
  detail: (id: string) => buildUrl(API_ENDPOINTS.REVIEWS.DETAIL, { id }),
  byService: (serviceId: string) => buildUrl(API_ENDPOINTS.REVIEWS.BY_SERVICE, { serviceId }),
  byEngineer: (engineerId: string) => buildUrl(API_ENDPOINTS.REVIEWS.BY_ENGINEER, { engineerId }),
  update: (id: string) => buildUrl(API_ENDPOINTS.REVIEWS.UPDATE, { id }),
  delete: (id: string) => buildUrl(API_ENDPOINTS.REVIEWS.DELETE, { id }),
};

// Coupon Endpoints
export const couponEndpoints = {
  list: () => API_ENDPOINTS.COUPONS.LIST,
  detail: (id: string) => buildUrl(API_ENDPOINTS.COUPONS.DETAIL, { id }),
  validate: (code: string) => `${API_ENDPOINTS.COUPONS.VALIDATE}?code=${code}`,
  apply: () => API_ENDPOINTS.COUPONS.APPLY,
};

// Analytics Endpoints
export const analyticsEndpoints = {
  dashboard: () => API_ENDPOINTS.ANALYTICS.DASHBOARD,
  bookings: (params?: { period?: string; start?: string; end?: string }) => {
    const query = new URLSearchParams();
    if (params?.period) query.append('period', params.period);
    if (params?.start) query.append('start', params.start);
    if (params?.end) query.append('end', params.end);
    const queryString = query.toString();
    return `${API_ENDPOINTS.ANALYTICS.BOOKINGS}${queryString ? `?${queryString}` : ''}`;
  },
  revenue: (params?: { period?: string; start?: string; end?: string }) => {
    const query = new URLSearchParams();
    if (params?.period) query.append('period', params.period);
    if (params?.start) query.append('start', params.start);
    if (params?.end) query.append('end', params.end);
    const queryString = query.toString();
    return `${API_ENDPOINTS.ANALYTICS.REVENUE}${queryString ? `?${queryString}` : ''}`;
  },
  engineers: () => API_ENDPOINTS.ANALYTICS.ENGINEERS,
  services: () => API_ENDPOINTS.ANALYTICS.SERVICES,
  customers: () => API_ENDPOINTS.ANALYTICS.CUSTOMERS,
};

// Notification Endpoints
export const notificationEndpoints = {
  list: (params?: { page?: number; limit?: number; read?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.read !== undefined) query.append('read', String(params.read));
    const queryString = query.toString();
    return `${API_ENDPOINTS.NOTIFICATIONS.LIST}${queryString ? `?${queryString}` : ''}`;
  },
  markRead: (id: string) => buildUrl(API_ENDPOINTS.NOTIFICATIONS.MARK_READ, { id }),
  markAllRead: () => API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ,
  delete: (id: string) => buildUrl(API_ENDPOINTS.NOTIFICATIONS.DELETE, { id }),
  preferences: () => API_ENDPOINTS.NOTIFICATIONS.PREFERENCES,
  registerDevice: () => API_ENDPOINTS.NOTIFICATIONS.REGISTER_DEVICE,
  unregisterDevice: () => API_ENDPOINTS.NOTIFICATIONS.UNREGISTER_DEVICE,
};

// Configuration Endpoints
export const configEndpoints = {
  app: () => API_ENDPOINTS.CONFIG.APP,
  banners: () => API_ENDPOINTS.CONFIG.BANNER,
  settings: () => API_ENDPOINTS.CONFIG.SETTINGS,
  contact: () => API_ENDPOINTS.CONFIG.CONTACT,
  terms: () => API_ENDPOINTS.CONFIG.TERMS,
  privacy: () => API_ENDPOINTS.CONFIG.PRIVACY,
};