// Authentication Module for PluggedIn Web App

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isSignUpMode = false;
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
                    // Fallback to sign up mode in auth modal
                    this.isSignUpMode = true;
                    this.showAuthModal();
                    this.updateAuthForm();
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

        // Switch between sign in and sign up
        const switchAuthBtn = document.getElementById('switchAuthBtn');
        const switchToSignUp = document.getElementById('switchToSignUp');
        
        if (switchAuthBtn) {
            switchAuthBtn.addEventListener('click', () => this.toggleAuthMode());
        }
        if (switchToSignUp) {
            switchToSignUp.addEventListener('click', () => {
                this.hideAuthModal();
                if (typeof window.showRegisterModal === 'function') {
                    window.showRegisterModal();
                } else {
                    this.toggleAuthMode();
                }
            });
        }

        // Google Sign In
        const googleSignInBtn = document.getElementById('googleSignInBtn');
        if (googleSignInBtn) {
            googleSignInBtn.addEventListener('click', () => this.signInWithGoogle());
        }

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
            this.resetAuthForm();
            this.hideForgotView();
        }
    }

    hideAuthModal() {
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.classList.add('hidden');
            // Reset to Sign In mode for next time
            this.isSignUpMode = false;
            this.hideForgotView();
        }
    }

    toggleAuthMode() {
        this.isSignUpMode = !this.isSignUpMode;
        this.updateAuthForm();
    }

    updateAuthForm() {
        const title = document.querySelector('#authModal h3');
        const submitBtnText = document.getElementById('submitBtnText');
        const switchBtn = document.getElementById('switchToSignUp') || document.getElementById('switchAuthBtn');
        const switchText = document.getElementById('switchText') || document.getElementById('switchViewText');
        const signUpFields = document.getElementById('signUpFields');
        const confirmPasswordField = document.getElementById('confirmPasswordField');
        const userTypeField = document.getElementById('userTypeField');
        const signInOptions = document.getElementById('signInOptions');
        const signUpOptions = document.getElementById('signUpOptions');
        
        // Inputs to toggle required status
        const firstNameInput = document.getElementById('firstName');
        const lastNameInput = document.getElementById('lastName');
        const addressInput = document.getElementById('address');
        const cityInput = document.getElementById('regCity');
        const stateInput = document.getElementById('regState');
        const zipInput = document.getElementById('regZip');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const agreeTermsInput = document.getElementById('agreeTerms');

            if (this.isSignUpMode) {
                if (title) title.textContent = 'Join PluggedIn.studio';
                if (submitBtnText) submitBtnText.textContent = 'Create Account';
                if (switchText) switchText.textContent = 'Already have an account? ';
                if (switchBtn) switchBtn.textContent = 'Sign in';
                if (passwordInput) passwordInput.setAttribute('autocomplete', 'new-password');
                
                signUpFields?.classList.remove('hidden');
                confirmPasswordField?.classList.remove('hidden');
                userTypeField?.classList.remove('hidden');
                signUpOptions?.classList.remove('hidden');
                signInOptions?.classList.add('hidden');
                
                if (firstNameInput) firstNameInput.required = true;
                if (lastNameInput) lastNameInput.required = true;
                if (addressInput) addressInput.required = true;
                if (cityInput) cityInput.required = true;
                if (stateInput) stateInput.required = true;
            if (zipInput) zipInput.required = true;
            if (confirmPasswordInput) confirmPasswordInput.required = true;
            if (agreeTermsInput) agreeTermsInput.required = true;
            } else {
                if (title) title.textContent = 'Welcome Back';
                if (submitBtnText) submitBtnText.textContent = 'Sign In';
                if (switchText) switchText.textContent = "Don't have an account? ";
                if (switchBtn) switchBtn.textContent = 'Sign up';
                if (passwordInput) passwordInput.setAttribute('autocomplete', 'current-password');
                
                signUpFields?.classList.add('hidden');
                confirmPasswordField?.classList.add('hidden');
                userTypeField?.classList.add('hidden');
                signUpOptions?.classList.add('hidden');
                signInOptions?.classList.remove('hidden');
                
                if (firstNameInput) firstNameInput.required = false;
                if (lastNameInput) lastNameInput.required = false;
                if (addressInput) addressInput.required = false;
                if (cityInput) cityInput.required = false;
                if (stateInput) stateInput.required = false;
            if (zipInput) zipInput.required = false;
            if (confirmPasswordInput) confirmPasswordInput.required = false;
            if (agreeTermsInput) agreeTermsInput.required = false;
        }
    }

    resetAuthForm() {
        const form = document.getElementById('authForm');
        form?.reset();
        this.isSignUpMode = false;
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
            errorMsg.textContent = '';
        }

        if (!email || !password) {
            this.showAuthError('Please fill in all fields');
            return;
        }

        const originalText = submitBtnText.textContent;
        if (submitBtnText) submitBtnText.textContent = 'Loading...';
        if (submitBtnSpinner) submitBtnSpinner.classList.remove('hidden');
        submitBtn.disabled = true;

        try {
            if (this.isSignUpMode) {
                await this.signUp(email, password);
            } else {
                await this.signIn(email, password);
            }
        } catch (error) {
            console.error('Auth error:', error);
            // Show explicit error in modal
            this.showAuthError(error.message || 'Authentication failed. Please check your credentials.');
            window.utils?.showNotification(error.message, 'error');
        } finally {
            if (submitBtnText) submitBtnText.textContent = originalText;
            if (submitBtnSpinner) submitBtnSpinner.classList.add('hidden');
            submitBtn.disabled = false;
        }
    }

    showAuthError(message) {
        const errorMsg = document.getElementById('authErrorMsg');
        if (errorMsg) {
            errorMsg.textContent = message;
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

    async signUp(email, password) {
        const firstName = document.getElementById('firstName')?.value || '';
        const lastName = document.getElementById('lastName')?.value || '';
        const fullName = `${firstName} ${lastName}`.trim();
        const address = document.getElementById('address')?.value || '';
        const address2 = document.getElementById('address2')?.value || '';
        const city = document.getElementById('regCity')?.value || '';
        const state = document.getElementById('regState')?.value || '';
        const zip = document.getElementById('regZip')?.value || '';
        const userType = document.querySelector('input[name="userType"]:checked')?.value || 'client';
        const referral = document.getElementById('registerReferral')?.value || '';

        const { data, error } = await this.getClient().auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    full_name: fullName,
                    address: address,
                    address_line_2: address2,
                    city: city,
                    state: state,
                    zip: zip,
                    user_type: userType,
                    referral_source: referral
                }
            }
        });

        if (error) throw error;
        if (data.user) {
            await this.createUserProfile(data.user, firstName, lastName, fullName, userType, referral);
            window.utils?.showNotification('Account created! Please verify your email.', 'success');
        }
        this.hideAuthModal();
    }

    async createUserProfile(user, firstName, lastName, fullName, userType, referral) {
        try {
            const client = this.getClient();
            // Try to find correct users table (might be users or profiles)
            const tableName = (window.db && window.db.tableNames && window.db.tableNames.users) || 'users';
            
            await client.from(tableName).insert([{
                id: user.id,
                email: user.email,
                first_name: firstName,
                last_name: lastName,
                name: fullName,
                user_type: userType,
                referral_source: referral,
                created_at: new Date().toISOString()
            }]);
        } catch (error) {
            console.error('Profile creation error:', error);
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
        const newType = currentType === 'client' ? 'studio' : 'client';
        
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
            window.utils?.showNotification(`Switched to ${newType === 'studio' ? 'Studio' : 'Client'} Mode`, 'success');

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

        if (userMenu) userMenu.classList.remove('hidden');
        if (authButtons) authButtons.classList.add('hidden');

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
                } else {
                    modeToggle.parentElement.classList.remove('toggle-active');
                    if (modeLabel) modeLabel.textContent = 'Client Mode';
                    document.body.classList.remove('studio-mode-active');
                }
            }
        }
    }

    updateUIForUnauthenticatedUser() {
        const userMenu = document.getElementById('userMenu');
        const authButtons = document.getElementById('authButtons');
        if (userMenu) userMenu.classList.add('hidden');
        if (authButtons) authButtons.classList.remove('hidden');
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
    async signInWithGoogle() {
        try {
            const { error } = await this.getClient().auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin + '/app.html' }
            });
            if (error) throw error;
        } catch (error) {
            window.utils?.showNotification(error.message, 'error');
        }
    }

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
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) {
            setTimeout(() => this.showCookieBanner(), 2000);
        }
    }

    showCookieBanner() {
        const banner = document.createElement('div');
        banner.id = 'cookieBanner';
        banner.className = 'cookie-banner';
        banner.style.display = 'block';
        banner.innerHTML = `
            <div class="flex flex-col gap-4">
                <div class="flex items-start gap-4">
                    <div class="p-4 bg-blue-100 dark:bg-blue-900/40 rounded-2xl text-blue-600 dark:text-blue-400">
                        <i class="fas fa-cookie-bite text-2xl"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-gray-900 dark:text-white">Cookie Preferences</h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">We use cookies to enhance your experience and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.</p>
                    </div>
                </div>
                <div class="flex gap-3 pt-2">
                    <button id="acceptCookiesBtn" class="flex-1 bg-black dark:bg-white text-white dark:text-black font-bold py-3 rounded-xl hover:opacity-90 transition-opacity">Accept All</button>
                    <a href="privacy.html" class="flex-1 text-center bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Privacy Policy</a>
                </div>
            </div>
        `;
        
        document.body.appendChild(banner);
        
        const acceptBtn = document.getElementById('acceptCookiesBtn');
        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => {
                localStorage.setItem('cookie_consent', 'accepted');
                banner.style.transform = 'translateY(120%)';
                banner.style.opacity = '0';
                setTimeout(() => banner.remove(), 500);
            });
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});
