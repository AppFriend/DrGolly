/**
 * Browser-side PaymentElement mounting test
 * Tests the actual browser environment for mounting errors
 */

const puppeteer = require('puppeteer');

async function testBrowserMounting() {
  console.log('🔍 BROWSER MOUNTING TEST - Testing PaymentElement in actual browser environment');
  console.log('=' .repeat(80));
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1280, height: 720 }
    });
    
    const page = await browser.newPage();
    
    // Listen for console logs
    const consoleMessages = [];
    const errors = [];
    
    page.on('console', (message) => {
      consoleMessages.push({
        type: message.type(),
        text: message.text(),
        timestamp: new Date().toISOString()
      });
    });
    
    page.on('pageerror', (error) => {
      errors.push({
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });
    
    // Navigate to the big baby public page
    console.log('🚀 Navigating to checkout page...');
    await page.goto('https://a92f89ea-09dc-4aa2-a5c5-39a24b33f402-00-2xd8b3j49zo47.kirk.replit.dev/big-baby-public', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    console.log('✅ Page loaded successfully');
    
    // Fill in customer details
    console.log('📝 Filling customer details...');
    await page.waitForSelector('#email', { timeout: 10000 });
    await page.type('#email', 'test.mounting@example.com');
    await page.type('#firstName', 'Test');
    
    // Wait for payment intent to be created
    console.log('⏳ Waiting for payment intent creation...');
    await page.waitForTimeout(3000);
    
    // Look for PaymentElement
    console.log('🔍 Checking for PaymentElement...');
    const paymentElementExists = await page.$('[data-testid="payment-element"]') !== null;
    
    if (paymentElementExists) {
      console.log('✅ PaymentElement found in DOM');
    } else {
      console.log('❌ PaymentElement not found in DOM');
    }
    
    // Wait for more logs
    await page.waitForTimeout(2000);
    
    // Try to click on the PaymentElement to trigger mounting
    console.log('🖱️  Interacting with PaymentElement...');
    try {
      await page.click('[data-testid="payment-element"]');
      console.log('✅ PaymentElement interaction successful');
    } catch (error) {
      console.log('❌ PaymentElement interaction failed:', error.message);
    }
    
    // Fill in billing details
    console.log('📝 Filling billing details...');
    await page.waitForSelector('#firstName', { timeout: 5000 });
    await page.type('#firstName', 'Test', { delay: 100 });
    await page.type('#lastName', 'User', { delay: 100 });
    
    // Wait for element to be ready
    await page.waitForTimeout(2000);
    
    // Try to click the place order button
    console.log('🛒 Testing place order button...');
    try {
      const placeOrderButton = await page.$('button:contains("Place order")');
      if (placeOrderButton) {
        await placeOrderButton.click();
        console.log('✅ Place order button clicked successfully');
      } else {
        console.log('❌ Place order button not found');
      }
    } catch (error) {
      console.log('❌ Place order button click failed:', error.message);
    }
    
    // Wait for any final logs
    await page.waitForTimeout(3000);
    
    console.log('\n📊 BROWSER TEST RESULTS');
    console.log('=' .repeat(80));
    
    // Analyze console messages
    const paymentElementErrors = consoleMessages.filter(msg => 
      msg.text.includes('PaymentElement') && msg.type === 'error'
    );
    
    const stripeErrors = consoleMessages.filter(msg => 
      msg.text.includes('stripe.confirmPayment') && msg.type === 'error'
    );
    
    const mountingErrors = consoleMessages.filter(msg => 
      msg.text.includes('mounted') && msg.type === 'error'
    );
    
    console.log(`Total Console Messages: ${consoleMessages.length}`);
    console.log(`PaymentElement Errors: ${paymentElementErrors.length}`);
    console.log(`Stripe Confirmation Errors: ${stripeErrors.length}`);
    console.log(`Mounting Errors: ${mountingErrors.length}`);
    console.log(`JavaScript Errors: ${errors.length}`);
    
    if (paymentElementErrors.length > 0) {
      console.log('\n❌ PaymentElement Errors Found:');
      paymentElementErrors.forEach(error => {
        console.log(`   - ${error.text}`);
      });
    }
    
    if (stripeErrors.length > 0) {
      console.log('\n❌ Stripe Confirmation Errors Found:');
      stripeErrors.forEach(error => {
        console.log(`   - ${error.text}`);
      });
    }
    
    if (mountingErrors.length > 0) {
      console.log('\n❌ Mounting Errors Found:');
      mountingErrors.forEach(error => {
        console.log(`   - ${error.text}`);
      });
    }
    
    if (errors.length > 0) {
      console.log('\n❌ JavaScript Errors Found:');
      errors.forEach(error => {
        console.log(`   - ${error.message}`);
      });
    }
    
    const allCriticalErrors = paymentElementErrors.length + stripeErrors.length + mountingErrors.length + errors.length;
    
    console.log('\n🎯 FINAL ASSESSMENT:');
    if (allCriticalErrors === 0) {
      console.log('✅ NO CRITICAL ERRORS FOUND - PaymentElement mounting is working correctly');
      console.log('✅ Browser environment is stable and ready for production');
    } else {
      console.log('❌ CRITICAL ERRORS DETECTED - PaymentElement mounting needs attention');
      console.log('❌ Browser environment has issues that need resolution');
    }
    
    return allCriticalErrors === 0;
    
  } catch (error) {
    console.error('Browser test failed:', error.message);
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testBrowserMounting().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});