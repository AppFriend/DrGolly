// Debug script to check why checkout components aren't rendering

console.log('=== CHECKOUT DEBUG SCRIPT ===');

// Test if React is loaded
setTimeout(() => {
  console.log('React Router Debug:');
  console.log('Current location:', window.location.href);
  console.log('React DevTools available:', !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
  
  // Check if root element exists
  const root = document.getElementById('root');
  console.log('Root element exists:', !!root);
  console.log('Root innerHTML length:', root?.innerHTML?.length || 0);
  
  // Check for any React rendering
  console.log('Root has React children:', root?.children?.length || 0);
  
  // Check for errors in console
  console.log('=== END DEBUG ===');
}, 2000);