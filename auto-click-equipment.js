// Auto-execute complete equipment setup
console.log('Starting equipment setup automation...');

// Wait for page to load, then execute complete setup
setTimeout(() => {
    console.log('Looking for Run Complete Setup button...');
    const buttons = document.querySelectorAll('button');
    const completeSetupButton = Array.from(buttons).find(btn => 
        btn.textContent.includes('Run Complete Setup') || btn.textContent.includes('🚀')
    );
    
    if (completeSetupButton) {
        console.log('Found Run Complete Setup button, clicking...');
        completeSetupButton.click();
    } else {
        console.log('Button not found, trying to execute runCompleteSetup function directly...');
        if (typeof runCompleteSetup === 'function') {
            runCompleteSetup();
        } else {
            console.error('runCompleteSetup function not available');
        }
    }
}, 3000);

// Fallback: try to execute the function directly after a longer delay
setTimeout(() => {
    if (typeof runCompleteSetup === 'function') {
        console.log('Executing runCompleteSetup function directly as fallback...');
        runCompleteSetup();
    }
}, 5000);
