// API Monitoring Script for Browser Console
// Copy and paste this into your browser console to monitor API calls

console.log('🔍 Starting API Call Monitoring...');
console.log('✅ Backend should be: http://localhost:8080/api');
console.log('❌ Supabase should NOT appear: https://*.supabase.co');

// Override fetch to monitor all API calls
const originalFetch = window.fetch;
window.fetch = function(...args) {
    const url = args[0];
    const method = args[1]?.method || 'GET';
    
    // Check if it's going to our backend
    if (url.includes('localhost:8080')) {
        console.log('✅ BACKEND API CALL:', method, url);
    } 
    // Check if it's going to Supabase (bad)
    else if (url.includes('supabase.co')) {
        console.log('❌ SUPABASE CALL (Should use backend):', method, url);
    }
    // Other calls
    else if (url.startsWith('http')) {
        console.log('ℹ️  OTHER API CALL:', method, url);
    }
    
    return originalFetch.apply(this, args);
};

console.log('🔍 Monitoring active! Check console for API calls.');