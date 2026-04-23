// Authentication Module for PluggedIn Web App

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.client = window.supabaseClient || window.supabase || (window.db && window.db.supabase);
        this.setupEventListeners();
        this.checkAuthState();
        this.checkCookieConsent();
        
        // Subscribe to auth changes
        if (this.client) {
            this.client.auth.onAuthStateChange((event, session) => {
                console.log('Auth state changed in AuthManager:', event);
                this.currentUser = session ? session.user : null;
                if (this.currentUser) {
                    this.updateUIForAuthenticatedUser();
                    
                    // --- Phase 5: Email Verification Check ---
                    if (!this.currentUser.email_confirmed_at) {
                        this.showVerificationBanner();
                    } else {
                        this.hideVerificationBanner();
                    }
                } else {
                    this.updateUIForUnauthenticatedUser();
                    this.hideVerificationBanner();
                }
            });
        }
    }

    getClient() {
        if (!this.client) {
            this.client = window.supabaseClient || window.supabase || (window.db && window.db.supabase);
        }
        return this.client;
    }

    setupEventListeners() {
        // Auth button click (Sign In)
        const authBtn = document.getElementById('authBtn');
        if (authBtn) {
            authBtn.addEventListener('click', () => {
                this.isSignUpMode = false;
                this.showAuthModal();
                this.updateAuthForm();
            });
        }

        // Register button click (Header)
        const registerBtnHeader = document.getElementById('registerBtnHeader');
        if (registerBtnHeader) {
            registerBtnHeader.addEventListener('click', () => {
                if (typeof window.showRegisterModal === 'function') {
                    window.showRegisterModal();
                } else {
                    console.error('showRegisterModal function not found');
                }
            });
        }

        // Auth modal close
        const closeAuthModal = document.getElementById('closeAuthModal');
        if (closeAuthModal) {
            closeAuthModal.addEventListener('click', () => {
                console.log('Close auth modal clicked');
                this.hideAuthModal();
            });
        }

        // ESC key listener for modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !document.getElementById('authModal').classList.contains('hidden')) {
                this.hideAuthModal();
            }
        });

        // Auth form submit
        const authForm = document.getElementById('authForm');
        if (authForm) {
            authForm.addEventListener('submit', (e) => this.handleAuthSubmit(e));
        }

        // Switch to sign up
        const switchToSignUp = document.getElementById('switchToSignUp');
        if (switchToSignUp) {
            switchToSignUp.addEventListener('click', () => {
                this.hideAuthModal();
                if (typeof window.showRegisterModal === 'function') {
                    window.showRegisterModal();
                }
            });
        }

        // Google Sign In - Temporarily disabled
        /*
        const googleSignInBtn = document.getElementById('googleSignInBtn');
        if (googleSignInBtn) {
            googleSignInBtn.addEventListener('click', () => this.signInWithGoogle());
        }
        */

        // Password validation
        const confirmPassword = document.getElementById('confirmPassword');
        if (confirmPassword) {
            confirmPassword.addEventListener('input', () => this.validatePasswordMatch());
        }
        const password = document.getElementById('password');
        if (password) {
            password.addEventListener('input', () => this.validatePasswordStrength());
        }

        // Forgot Password
        const forgotPasswordLink = document.getElementById('forgotPasswordLink');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showForgotView();
            });
        }

        const backToSignIn = document.getElementById('backToSignIn');
        if (backToSignIn) {
            backToSignIn.addEventListener('click', () => this.hideForgotView());
        }

        const resetPasswordBtn = document.getElementById('resetPasswordSubmit');
        if (resetPasswordBtn) {
            resetPasswordBtn.addEventListener('click', () => this.handleResetPassword());
        }

        // Password visibility toggle
        const toggleBtns = document.querySelectorAll('.password-toggle');
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', () => this.togglePasswordVisibility(btn));
        });

        // Sign out
        const signOutBtn = document.getElementById('signOutBtn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.signOut();
            });
        }
    }

    async checkAuthState() {
        try {
            const client = this.getClient();
            if (!client) return;
            const { data: { session } } = await client.auth.getSession();
            if (session) {
                this.currentUser = session.user;
                this.updateUIForAuthenticatedUser();
            }
        } catch (error) {
            console.error('Error checking auth state:', error);
        }
    }
    showAuthModal() {
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.classList.remove('hidden');
            document.body.classList.add('modal-open');
            this.resetAuthForm();
            this.hideForgotView();
        }
    }

    hideAuthModal() {
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.classList.remove('modal-open');
            // Reset to Sign In mode for next time
            this.isSignUpMode = false;
            this.hideForgotView();
        }
    }

    updateAuthForm() {
        const title = document.querySelector('#authModal h3');
        const submitBtnText = document.getElementById('submitBtnText');
        const switchBtn = document.getElementById('switchToSignUp');
        const switchText = document.getElementById('switchText');
        
        if (title) title.textContent = 'Welcome Back';
        if (submitBtnText) submitBtnText.textContent = 'Sign In';
        if (switchText) switchText.textContent = "Don't have an account? ";
        if (switchBtn) switchBtn.textContent = 'Sign up';
        
    }

    resetAuthForm() {
        const form = document.getElementById('authForm');
        form?.reset();
        this.updateAuthForm();
    }

    async handleAuthSubmit(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const submitBtn = document.getElementById('signInSubmit');
        const submitBtnText = document.getElementById('submitBtnText');
        const submitBtnSpinner = document.getElementById('submitBtnSpinner');
        const errorMsg = document.getElementById('authErrorMsg');

        // Reset error state
        if (errorMsg) {
            errorMsg.classList.add('hidden');
        }

        if (!email || !password) {
            this.showAuthError('Please fill in all fields');
            return;
        }

        const originalText = submitBtnText.textContent;
        if (submitBtnText) submitBtnText.textContent = 'Signing In...';
        if (submitBtnSpinner) submitBtnSpinner.classList.remove('hidden');
        submitBtn.disabled = true;

        try {
            await this.signIn(email, password);
        } catch (error) {
            console.error('Auth error:', error);
            this.showAuthError(error.message || 'Authentication failed. Please check your credentials.');
        } finally {
            if (submitBtnText) submitBtnText.textContent = originalText;
            if (submitBtnSpinner) submitBtnSpinner.classList.add('hidden');
            submitBtn.disabled = false;
        }
    }

    showAuthError(message) {
        const errorMsg = document.getElementById('authErrorMsg');
        const errorText = document.getElementById('authErrorText');
        if (errorMsg) {
            if (errorText) {
                errorText.textContent = message;
            } else {
                errorMsg.textContent = message;
            }
            errorMsg.classList.remove('hidden');
        } else {
            window.utils?.showNotification(message, 'error');
        }
    }

    async signIn(email, password) {
        const { data, error } = await this.getClient().auth.signInWithPassword({ email, password });
        if (error) throw error;
        this.currentUser = data.user;
        this.updateUIForAuthenticatedUser();
        this.hideAuthModal();
        window.utils?.showNotification('Welcome back!', 'success');
    }

    isAuthenticated() {
        return !!this.currentUser;
    }
    async createUserProfile(user, firstName, lastName, fullName, userType, referral) {
        try {
            const client = this.getClient();
            const tableName = (window.db && window.db.tableNames && window.db.tableNames.users) || 'users';
            
            const { error } = await client.from(tableName).insert([{
                id: user.id,
                email: user.email,
                first_name: firstName,
                last_name: lastName,
                name: fullName,
                user_type: userType,
                referral_source: referral,
                created_at: new Date().toISOString()
            }]);

            if (error) {
                // Profile may already exist (e.g. trigger-created) — not fatal
                console.warn('createUserProfile warning (may be non-fatal):', error.message);
            }
        } catch (error) {
            console.warn('createUserProfile exception (non-fatal):', error.message);
        }
    }

    async signOut() {
        const { error } = await this.getClient().auth.signOut();
        if (error) {
            window.utils?.showNotification('Error signing out', 'error');
            return;
        }
        this.currentUser = null;
        this.updateUIForUnauthenticatedUser();
        window.utils?.showNotification('Signed out successfully', 'success');
        window.location.reload(); // Refresh to clear state
    }

    // Role switching functionality
    async toggleUserType() {
        if (!this.currentUser) {
            window.utils?.showNotification('Please sign in to switch roles', 'info');
            return;
        }

        const currentType = this.currentUser.user_metadata?.user_type || 'client';
        let newType = 'client';
        
        if (currentType === 'client') newType = 'collector';
        else if (currentType === 'collector') newType = 'studio';
        else newType = 'client';
        
        try {
            const client = this.getClient();
            const { data, error } = await client.auth.updateUser({
                data: { user_type: newType }
            });

            if (error) throw error;

            this.currentUser = data.user;
            
            // Also update in the database if possible
            const tableName = (window.db && window.db.tableNames && window.db.tableNames.users) || 'users';
            const { error: dbError } = await client.from(tableName)
                .update({ user_type: newType })
                .eq('id', this.currentUser.id);

            if (dbError) {
                console.warn('Metadata updated but database record update failed:', dbError);
            }

            this.updateUIForAuthenticatedUser();
            const roleLabels = { 'client': 'Artist', 'collector': 'Audiophile', 'studio': 'Studio' };
            window.utils?.showNotification(`Switched to ${roleLabels[newType] || 'Artist'} Mode`, 'success');

            // Dispatch event for other components
            window.dispatchEvent(new CustomEvent('userRoleChanged', { detail: { userType: newType } }));
        } catch (error) {
            console.error('Switch mode error:', error);
            window.utils?.showNotification('Error switching mode: ' + error.message, 'error');
        }
    }

    updateUIForAuthenticatedUser() {
        const userMenu = document.getElementById('userMenu');
        const authButtons = document.getElementById('authButtons');
        const userInitials = document.getElementById('userInitials');
        const modeToggle = document.getElementById('modeToggle');
        const modeLabel = document.getElementById('modeLabel');
        const mobileNav = document.getElementById('mobileBottomNav');

        if (userMenu) userMenu.classList.remove('hidden');
        if (authButtons) authButtons.classList.add('hidden');
        if (mobileNav) mobileNav.classList.remove('hidden');

        if (this.currentUser) {
            const userMetadata = this.currentUser.user_metadata || {};
            const currentType = userMetadata.user_type || 'client';
            
            // Update Initials
            if (userInitials) {
                const name = userMetadata.first_name || userMetadata.full_name || this.currentUser.email;
                userInitials.textContent = name.substring(0, 2).toUpperCase();
            }

            // Update Toggle State
            if (modeToggle) {
                if (currentType === 'studio') {
                    modeToggle.parentElement.classList.add('toggle-active');
                    if (modeLabel) modeLabel.textContent = 'Studio Mode';
                    document.body.classList.add('studio-mode-active');
                    document.body.classList.remove('collector-mode-active');
                } else if (currentType === 'collector') {
                    modeToggle.parentElement.classList.add('toggle-active');
                    if (modeLabel) modeLabel.textContent = 'Audiophile Mode';
                    document.body.classList.add('collector-mode-active');
                    document.body.classList.remove('studio-mode-active');
                } else {
                    modeToggle.parentElement.classList.remove('toggle-active');
                    if (modeLabel) modeLabel.textContent = 'Artist Mode';
                    document.body.classList.remove('studio-mode-active', 'collector-mode-active');
                }
            }
        }
    }

    updateUIForUnauthenticatedUser() {
        const userMenu = document.getElementById('userMenu');
        const authButtons = document.getElementById('authButtons');
        const mobileNav = document.getElementById('mobileBottomNav');
        if (userMenu) userMenu.classList.add('hidden');
        if (authButtons) authButtons.classList.remove('hidden');
        if (mobileNav) mobileNav.classList.add('hidden');
        document.body.classList.remove('studio-mode-active');
    }

    // Forgot Password Flow
    showForgotView() {
        document.getElementById('authForm')?.classList.add('hidden');
        document.getElementById('forgotPasswordView')?.classList.remove('hidden');
        const title = document.getElementById('authTitle') || document.querySelector('#authModal h3');
        if (title) title.textContent = 'Reset Password';
    }

    hideForgotView() {
        document.getElementById('authForm')?.classList.remove('hidden');
        document.getElementById('forgotPasswordView')?.classList.add('hidden');
        const title = document.getElementById('authTitle') || document.querySelector('#authModal h3');
        this.updateAuthForm();
    }

    async handleResetPassword() {
        const email = document.getElementById('forgotEmail').value;
        const errorMsg = document.getElementById('authErrorMsg');
        if (errorMsg) errorMsg.classList.add('hidden');

        if (!email) {
            this.showAuthError('Please enter your email');
            return;
        }

        try {
            const { error } = await this.getClient().auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/app.html'
            });
            if (error) throw error;
            window.utils?.showNotification('Reset link sent! Check your email.', 'success');
            this.hideForgotView();
        } catch (error) {
            this.showAuthError(error.message);
        }
    }

    // Password visibility toggle
    togglePasswordVisibility(button) {
        const input = button.parentElement.querySelector('input');
        const eyeIcon = button.querySelector('.eye-icon');
        const eyeOffIcon = button.querySelector('.eye-off-icon');

        if (input.type === 'password') {
            input.type = 'text';
            eyeIcon?.classList.add('hidden');
            eyeOffIcon?.classList.remove('hidden');
        } else {
            input.type = 'password';
            eyeIcon?.classList.remove('hidden');
            eyeOffIcon?.classList.add('hidden');
        }
    }

    // Google Sign In
    /*
    async signInWithGoogle() {
        try {
            const { error } = await this.getClient().auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/profile.html'
                }
            });
            if (error) throw error;
        } catch (error) {
            console.error('Google sign in error:', error);
            this.showAuthError(error.message || 'Error signing in with Google');
        }
    }
    */

    // Validation Helpers
    validatePasswordStrength() {
        const password = document.getElementById('password').value;
        const help = document.getElementById('passwordHelp');
        if (!help) return;
        
        if (!password) {
            help.classList.add('hidden');
            return;
        }
        
        help.classList.remove('hidden');
        if (password.length >= 6) {
            help.innerHTML = `<span class="flex items-center"><svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg> Password meets requirements</span>`;
            help.className = 'mt-1 text-xs text-green-600 font-medium';
        } else {
            help.textContent = 'Keep typing... (Min 6 characters needed)';
            help.className = 'mt-1 text-xs text-red-500';
        }
    }

    validatePasswordMatch() {
        const p1 = document.getElementById('password').value;
        const p2 = document.getElementById('confirmPassword').value;
        const field = document.getElementById('confirmPasswordField');
        if (!field || !p2) return;
        let help = field.querySelector('.password-match-help') || document.createElement('p');
        help.className = 'password-match-help mt-1 text-xs ' + (p1 === p2 ? 'text-green-500' : 'text-red-500');
        help.textContent = p1 === p2 ? 'Passwords match!' : 'Passwords do not match';
        if (!help.parentElement) field.appendChild(help);
    }

    showVerificationBanner() {
        // Remove existing if any
        this.hideVerificationBanner();
        
        const banner = document.createElement('div');
        banner.id = 'verificationBanner';
        banner.className = 'verification-banner';
        banner.innerHTML = `
            <p>Your email is not verified. Please check your inbox.</p>
            <button id="resendVerificationBtn">Resend Verification Email</button>
        `;
        
        // Insert after navigation
        const nav = document.querySelector('nav');
        if (nav) {
            nav.insertAdjacentElement('afterend', banner);
        } else {
            document.body.prepend(banner);
        }
        
        const resendBtn = document.getElementById('resendVerificationBtn');
        if (resendBtn) {
            resendBtn.addEventListener('click', () => this.resendVerification());
        }
    }

    hideVerificationBanner() {
        const existing = document.getElementById('verificationBanner');
        if (existing) existing.remove();
    }

    async resendVerification() {
        if (!this.client || !this.currentUser) return;
        
        try {
            const { error } = await this.client.auth.resend({
                type: 'signup',
                email: this.currentUser.email
            });
            
            if (error) throw error;
            
            const resendBtn = document.getElementById('resendVerificationBtn');
            if (resendBtn) {
                resendBtn.textContent = 'Email Sent!';
                resendBtn.disabled = true;
                resendBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }
            console.log('Verification email resent successfully');
        } catch (e) {
            console.error('Error resending verification:', e.message);
            alert('Failed to resend email: ' + e.message);
        }
    }

    checkCookieConsent() {
        // Handled by inline script in app.html — no-op here to avoid race condition
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});
