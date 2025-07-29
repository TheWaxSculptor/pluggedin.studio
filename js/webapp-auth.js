// Authentication Module for PluggedIn Web App

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isSignUpMode = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthState();
    }

    setupEventListeners() {
        // Auth button click
        const authBtn = document.getElementById('authBtn');
        if (authBtn) {
            authBtn.addEventListener('click', () => this.showAuthModal());
        }

        // Auth modal close
        const closeAuthModal = document.getElementById('closeAuthModal');
        if (closeAuthModal) {
            closeAuthModal.addEventListener('click', () => this.hideAuthModal());
        }

        // Auth form submit
        const authForm = document.getElementById('authForm');
        if (authForm) {
            authForm.addEventListener('submit', (e) => this.handleAuthSubmit(e));
        }

        // Switch between sign in and sign up
        const switchToSignUp = document.getElementById('switchToSignUp');
        if (switchToSignUp) {
            switchToSignUp.addEventListener('click', () => this.toggleAuthMode());
        }
        // Accessibility: allow Enter/Space to toggle
        if (switchToSignUp) {
            switchToSignUp.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleAuthMode();
                }
            });
        }

        // Google Sign In
        const googleSignInBtn = document.getElementById('googleSignInBtn');
        if (googleSignInBtn) {
            googleSignInBtn.addEventListener('click', () => this.signInWithGoogle());
        }

        // Password confirmation validation
        const confirmPassword = document.getElementById('confirmPassword');
        if (confirmPassword) {
            confirmPassword.addEventListener('input', () => this.validatePasswordMatch());
        }
        // Accessibility: announce password mismatch
        if (confirmPassword) {
            confirmPassword.setAttribute('aria-describedby', 'passwordHelp');
        }

        // Password strength indicator
        const password = document.getElementById('password');
        if (password) {
            password.addEventListener('input', () => this.validatePasswordStrength());
        }
        // Accessibility: announce password requirements
        if (password) {
            password.setAttribute('aria-describedby', 'passwordHelp');
        }

        // Forgot password
        const forgotPasswordLink = document.getElementById('forgotPasswordLink');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showForgotPasswordModal();
            });
        }
        // Accessibility: allow keyboard for forgot password
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.showForgotPasswordModal();
                }
            });
        }

        // User Type radio accessibility
        const userTypeRadios = document.getElementsByName('userType');
        if (userTypeRadios) {
            userTypeRadios.forEach(radio => {
                radio.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        radio.checked = true;
                    }
                });
            });
        }
        // User menu interactions
        const userMenuBtn = document.getElementById('userMenuBtn');
        const userDropdown = document.getElementById('userDropdown');
        if (userMenuBtn && userDropdown) {
            userMenuBtn.addEventListener('click', () => {
                userDropdown.classList.toggle('hidden');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                    userDropdown.classList.add('hidden');
                }
            });
        }

        // Sign out
        const signOutBtn = document.getElementById('signOutBtn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.signOut();
            });
        }

        // Profile and bookings links
        const profileLink = document.getElementById('profileLink');
        const bookingsLink = document.getElementById('bookingsLink');
        
        if (profileLink) {
            profileLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showProfile();
            });
        }

        if (bookingsLink) {
            bookingsLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showBookings();
            });
        }
    }

    async checkAuthState() {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
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
        }
    }

    hideAuthModal() {
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    toggleAuthMode() {
        this.isSignUpMode = !this.isSignUpMode;
        this.updateAuthForm();
    }

    updateAuthForm() {
        const title = document.querySelector('#authModal h3');
        const submitBtnText = document.getElementById('submitBtnText');
        const switchBtn = document.getElementById('switchToSignUp');
        const switchText = document.getElementById('switchText');
        // Fields that are only shown for sign up
        const nameField = document.getElementById('nameField');
        const confirmPasswordField = document.getElementById('confirmPasswordField');
        const userTypeField = document.getElementById('userTypeField');
        const signInOptions = document.getElementById('signInOptions');
        const signUpOptions = document.getElementById('signUpOptions');
        const passwordHelp = document.getElementById('passwordHelp');
        const fullNameInput = document.getElementById('fullName');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const agreeTerms = document.getElementById('agreeTerms');
        if (this.isSignUpMode) {
            // Update text content
            if (title) title.textContent = 'Join PluggedIn.studio';
            if (submitBtnText) submitBtnText.textContent = 'Create Account';
            if (switchText) switchText.textContent = 'Already have an account? ';
            if (switchBtn) switchBtn.textContent = 'Sign in';
            
            // Show sign up specific fields
            if (nameField) nameField.classList.remove('hidden');
            if (confirmPasswordField) confirmPasswordField.classList.remove('hidden');
            if (userTypeField) userTypeField.classList.remove('hidden');
            if (signUpOptions) signUpOptions.classList.remove('hidden');
            if (passwordHelp) passwordHelp.classList.remove('hidden');
            
            // Hide sign in specific options
            if (signInOptions) signInOptions.classList.add('hidden');
            
            // Make additional fields required
            if (fullNameInput) fullNameInput.required = true;
            if (confirmPasswordInput) confirmPasswordInput.required = true;
        } else {
            // Update text content
            if (title) title.textContent = 'Welcome Back';
            if (submitBtnText) submitBtnText.textContent = 'Sign In';
            if (switchText) switchText.textContent = "Don't have an account? ";
            if (switchBtn) switchBtn.textContent = 'Sign up';
            
            // Hide sign up specific fields
            if (nameField) nameField.classList.add('hidden');
            if (confirmPasswordField) confirmPasswordField.classList.add('hidden');
            if (userTypeField) userTypeField.classList.add('hidden');
            if (signUpOptions) signUpOptions.classList.add('hidden');
            if (passwordHelp) passwordHelp.classList.add('hidden');
            
            // Show sign in specific options
            if (signInOptions) signInOptions.classList.remove('hidden');
            
            // Remove required from additional fields
            if (fullNameInput) fullNameInput.required = false;
            if (confirmPasswordInput) confirmPasswordInput.required = false;
        }
    }

    resetAuthForm() {
        const form = document.getElementById('authForm');
        if (form) {
            form.reset();
        }
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

        if (!email || !password) {
            utils.showNotification('Please fill in all fields', 'error');
            return;
        }

        // Additional validation for sign up
        if (this.isSignUpMode) {
            const fullName = document.getElementById('fullName').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            const agreeTerms = document.getElementById('agreeTerms').checked;

            if (!fullName.trim()) {
                utils.showNotification('Please enter your full name', 'error');
                return;
            }

            if (password.length < 6) {
                utils.showNotification('Password must be at least 6 characters long', 'error');
                return;
            }

            if (password !== confirmPassword) {
                utils.showNotification('Passwords do not match', 'error');
                return;
            }

            if (!agreeTerms) {
                utils.showNotification('Please agree to the Terms of Service and Privacy Policy', 'error');
                return;
            }
        }

        // Show loading state
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
            utils.showNotification(error.message, 'error');
        } finally {
            // Reset button state
            if (submitBtnText) submitBtnText.textContent = originalText;
            if (submitBtnSpinner) submitBtnSpinner.classList.add('hidden');
            submitBtn.disabled = false;
        }
    }

    async signIn(email, password) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        this.currentUser = data.user;
        this.updateUIForAuthenticatedUser();
        this.hideAuthModal();
        utils.showNotification('Welcome back!', 'success');
    }

    async signUp(email, password) {
        const fullName = document.getElementById('fullName').value;
        const userType = document.querySelector('input[name="userType"]:checked').value;

        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    user_type: userType
                }
            }
        });

        if (error) throw error;

        if (data.user) {
            // Create user profile with additional information
            await this.createUserProfile(data.user, fullName, userType);
            utils.showNotification('Account created successfully! Please check your email to verify your account.', 'success');
        }

        this.hideAuthModal();
    }

    async createUserProfile(user, fullName = null, userType = null) {
        try {
            const { error } = await supabaseClient
                .from('users')
                .insert([
                    {
                        id: user.id,
                        email: user.email,
                        name: fullName || user.user_metadata?.full_name || user.email.split('@')[0],
                        user_type: userType || user.user_metadata?.user_type || 'artist',
                        avatar_url: user.user_metadata?.avatar_url || null,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (error) throw error;
        } catch (error) {
            console.error('Error creating user profile:', error);
        }
    }

    async signOut() {
        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;

            this.currentUser = null;
            this.updateUIForUnauthenticatedUser();
            utils.showNotification('Signed out successfully', 'success');
        } catch (error) {
            console.error('Sign out error:', error);
            utils.showNotification('Error signing out', 'error');
        }
    }

    updateUIForAuthenticatedUser() {
        const authBtn = document.getElementById('authBtn');
        const userMenu = document.getElementById('userMenu');
        const userInitials = document.getElementById('userInitials');

        if (authBtn) authBtn.classList.add('hidden');
        if (userMenu) userMenu.classList.remove('hidden');

        if (userInitials && this.currentUser?.email) {
            const initials = this.currentUser.email.substring(0, 2).toUpperCase();
            userInitials.textContent = initials;
        }
    }

    updateUIForUnauthenticatedUser() {
        const authBtn = document.getElementById('authBtn');
        const userMenu = document.getElementById('userMenu');

        if (authBtn) authBtn.classList.remove('hidden');
        if (userMenu) userMenu.classList.add('hidden');
    }

    showProfile() {
        // TODO: Implement profile modal/page
        utils.showNotification('Profile feature coming soon!', 'info');
    }

    showBookings() {
        if (!this.currentUser) {
            this.showAuthModal();
            return;
        }
        
        // TODO: Implement bookings view
        utils.showNotification('Bookings feature coming soon!', 'info');
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Google Sign In
    async signInWithGoogle() {
        try {
            const { data, error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/app.html'
                }
            });

            if (error) throw error;

            // The redirect will handle the rest
        } catch (error) {
            console.error('Google sign in error:', error);
            utils.showNotification('Error signing in with Google: ' + error.message, 'error');
        }
    }

    // Password validation helpers
    validatePasswordStrength() {
        const password = document.getElementById('password').value;
        const passwordHelp = document.getElementById('passwordHelp');
        
        if (!passwordHelp) return;

        if (password.length === 0) {
            passwordHelp.classList.add('hidden');
            return;
        }

        passwordHelp.classList.remove('hidden');
        
        if (password.length < 6) {
            passwordHelp.textContent = 'Password must be at least 6 characters long';
            passwordHelp.className = 'mt-1 text-xs text-red-500';
        } else if (password.length < 8) {
            passwordHelp.textContent = 'Good password length';
            passwordHelp.className = 'mt-1 text-xs text-yellow-500';
        } else {
            passwordHelp.textContent = 'Strong password!';
            passwordHelp.className = 'mt-1 text-xs text-green-500';
        }
    }

    validatePasswordMatch() {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const confirmPasswordField = document.getElementById('confirmPasswordField');
        
        if (!confirmPasswordField) return;

        const existingHelp = confirmPasswordField.querySelector('.password-match-help');
        if (existingHelp) {
            existingHelp.remove();
        }

        if (confirmPassword.length === 0) return;

        const helpElement = document.createElement('p');
        helpElement.className = 'password-match-help mt-1 text-xs';
        
        if (password === confirmPassword) {
            helpElement.textContent = 'Passwords match!';
            helpElement.classList.add('text-green-500');
        } else {
            helpElement.textContent = 'Passwords do not match';
            helpElement.classList.add('text-red-500');
        }
        
        confirmPasswordField.appendChild(helpElement);
    }

    // Forgot password functionality
    async showForgotPasswordModal() {
        const email = document.getElementById('email').value;
        
        if (!email) {
            utils.showNotification('Please enter your email address first', 'error');
            return;
        }

        const confirmed = confirm(`Send password reset email to ${email}?`);
        if (!confirmed) return;

        try {
            const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/app.html'
            });

            if (error) throw error;

            utils.showNotification('Password reset email sent! Check your inbox.', 'success');
            this.hideAuthModal();
        } catch (error) {
            console.error('Password reset error:', error);
            utils.showNotification('Error sending password reset email: ' + error.message, 'error');
        }
    }

    // Enhanced user profile display
    updateUIForAuthenticatedUser() {
        const authBtn = document.getElementById('authBtn');
        const userMenu = document.getElementById('userMenu');
        const userInitials = document.getElementById('userInitials');
        const userAvatar = document.getElementById('userAvatar');

        if (authBtn) authBtn.classList.add('hidden');
        if (userMenu) userMenu.classList.remove('hidden');

        if (this.currentUser) {
            // Set user avatar or initials
            const avatarUrl = this.currentUser.user_metadata?.avatar_url;
            const fullName = this.currentUser.user_metadata?.full_name || this.currentUser.email;
            
            if (avatarUrl && userAvatar) {
                userAvatar.src = avatarUrl;
                userAvatar.classList.remove('hidden');
                if (userInitials) userInitials.classList.add('hidden');
            } else if (userInitials) {
                const initials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
                userInitials.textContent = initials;
                userInitials.classList.remove('hidden');
                if (userAvatar) userAvatar.classList.add('hidden');
            }
        }
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});
