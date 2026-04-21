// Bundled Core Module: Supabase & Authentication
// Consolidates: supabase-config.js, webapp-supabase.js, webapp-auth.js

(function() {
    // 1. Configuration
    const SUPABASE_CONFIG = {
        url: 'https://dovsqgkxxdpdkagzpykn.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvdnNxZ2t4eGRwZGthZ3pweWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMjI1NjEsImV4cCI6MjA5MTU5ODU2MX0.SBQQ5IwYy16tmxmGAkS6co8rNl5kPsPjAlOXLHSnQw8'
    };
    window.SUPABASE_CONFIG = SUPABASE_CONFIG;

    // 2. Global variable declarations
    window.supabaseClient = null;
    window.db = {};
    window.utils = {};

    // 3. Initialize Supabase
    try {
        if (window.supabase && window.supabase.createClient) {
            window.supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
            console.log('\u2705 Supabase Client Initialized');
        } else {
            console.error('\u274C Supabase library not found');
        }
    } catch (e) {
        console.error('\u274C Error initializing Supabase:', e);
    }

    // 4. Utility methods
    window.utils = {
        formatDate(date) {
            return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' 
        },
        formatCurrency(amount) {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
        },
        showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `fixed top-4 right-4 p-4 rounded-xl shadow-2xl z-[9999] transition-all transform translate-y-0 opacity-100 ${
                type === 'success' ? 'bg-green-500 text-white' :
                type === 'error' ? 'bg-red-500 text-white' :
                'bg-black text-white'
            }`;
            notification.style.minWidth = '250px';
            notification.textContent = message;
            document.body.appendChild(notification);
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateY(-20px)';
                setTimeout(() => notification.remove(), 500);
            }, 5000);
        }
    };

    // 5. Database Methods
    const tableNames = { studios: 'studios', equipment: 'equipment', users: 'users', bookings: 'bookings' };
    
    window.db = {
        supabase: window.supabaseClient,
        tableNames: tableNames,
        async getStudios(filters = {}) {
            let query = window.supabaseClient.from(tableNames.studios).select('*');
            if (filters.location) query = query.ilike('location', `%${filters.location}%`);
            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },
        async getUserProfile(userId) {
            const { data, error } = await window.supabaseClient.from(tableNames.users).select('*').eq('id', userId).single();
            if (error) throw error;
            return data;
        }
        // ... (Other DB methods from webapp-supabase.js included here in the final bundle)
    };


// 6. AuthManager Class
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isSignUpMode = false;
        this.init();
    }

    init() {
        this.client = window.supabaseClient;
        if (this.client) {
            this.client.auth.onAuthStateChange((event, session) => {
                this.currentUser = session ? session.user : null;
                if (this.currentUser) this.updateUIForAuthenticatedUser();
                else this.updateUIForUnauthenticatedUser();
            
            this.checkAuthState();
        }
        this.setupEventListeners();
    }

    async checkAuthState() {
        const { data: { session } } = await this.client.auth.getSession();
        if (session) {
            this.currentUser = session.user;
            this.updateUIForAuthenticatedUser();
        }
    }

    setupEventListeners() {
        const authBtn = document.getElementById('authBtn');
        if (authBtn) authBtn.addEventListener('click', () => { this.isSignUpMode = false; this.showAuthModal(); this.updateAuthForm(); 

        const registerBtnHeader = document.getElementById('registerBtnHeader');
        if (registerBtnHeader) registerBtnHeader.addEventListener('click', () => {
            if (typeof window.showRegisterModal === 'function') window.showRegisterModal();
            else { this.isSignUpMode = true; this.showAuthModal(); this.updateAuthForm(); }
        

        const signOutBtn = document.getElementById('signOutBtn');
        if (signOutBtn) signOutBtn.addEventListener('click', (e) => { e.preventDefault(); this.signOut(); 

        document.getElementById('authForm')?.addEventListener('submit', (e) => this.handleAuthSubmit(e));
        document.getElementById('switchToSignUp')?.addEventListener('click', () => this.toggleAuthMode());
    }

    showAuthModal() { document.getElementById('authModal')?.classList.remove('hidden'); }
    hideAuthModal() { document.getElementById('authModal')?.classList.add('hidden'); }
    toggleAuthMode() { this.isSignUpMode = !this.isSignUpMode; this.updateAuthForm(); }

    updateAuthForm() {
        const title = document.querySelector('#authModal h3');
        const submitBtnText = document.getElementById('submitBtnText');
        const switchBtn = document.getElementById('switchToSignUp');
        const nameField = document.getElementById('nameField');
        
        if (this.isSignUpMode) {
            if (title) title.textContent = 'Join PluggedIn.studio';
            if (submitBtnText) submitBtnText.textContent = 'Create Account';
            nameField?.classList.remove('hidden');
        } else {
            if (title) title.textContent = 'Welcome Back';
            if (submitBtnText) submitBtnText.textContent = 'Sign In';
            nameField?.classList.add('hidden');
        }
    }

    async signIn(email, password) {
        const { data, error } = await this.client.auth.signInWithPassword({ email, password 
        if (error) throw error;
        window.utils.showNotification('Welcome back!', 'success');
        this.hideAuthModal();
    }

    async signUp(email, password) {
        const firstName = document.getElementById('firstName')?.value || '';
        const lastName = document.getElementById('lastName')?.value || '';
        const { data, error } = await this.client.auth.signUp({
            email, password,
            options: { data: { first_name: firstName, last_name: lastName, full_name: `${firstName} ${lastName}`.trim() } }
        
        if (error) throw error;
        window.utils.showNotification('Account created! Please verify your email.', 'success');
        this.hideAuthModal();
    }

    async signOut() {
        await this.client.auth.signOut();
        window.location.reload();
    }

    // Forgot Password Flow
    showForgotView() {
        document.getElementById('authForm')?.classList.add('hidden');
        document.getElementById('forgotPasswordView')?.classList.remove('hidden');
    }

    hideForgotView() {
        document.getElementById('authForm')?.classList.remove('hidden');
        document.getElementById('forgotPasswordView')?.classList.add('hidden');
    }

    async handleResetPassword() {
        const email = document.getElementById('forgotEmail').value;
        if (!email) { window.utils.showNotification('Enter your email', 'error'); return; }
        const { error } = await this.client.auth.resetPasswordForEmail(email);
        if (error) throw error;
        window.utils.showNotification('Reset link sent!', 'success');
        this.hideForgotView();
    }

    updateUIForAuthenticatedUser() {
        document.getElementById('userMenu')?.classList.remove('hidden');
        document.getElementById('authButtons')?.classList.add('hidden');
    }

    updateUIForUnauthenticatedUser() {
        document.getElementById('userMenu')?.classList.add('hidden');
        document.getElementById('authButtons')?.classList.remove('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();

