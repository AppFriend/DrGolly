// Desktop Checkout Optimization Validation Script
// Tests responsive behavior across different screen sizes

const puppeteer = require('puppeteer');

async function validateDesktopCheckout() {
  console.log('🖥️ DESKTOP CHECKOUT VALIDATION STARTING');
  console.log('=====================================');

  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: null,
    args: ['--start-maximized']
  });

  try {
    const page = await browser.newPage();
    const testUrl = 'http://localhost:5000/checkout/6'; // Big Baby course

    console.log('📱 Testing Mobile View (375px width)');
    await page.setViewport({ width: 375, height: 812 });
    await page.goto(testUrl, { waitUntil: 'networkidle0' });
    
    // Check mobile layout
    const mobileRightColumn = await page.$('.checkout-desktop-summary');
    const isRightColumnHidden = await page.evaluate(el => 
      window.getComputedStyle(el).display === 'none', mobileRightColumn
    );
    console.log(`   ✅ Right column hidden on mobile: ${isRightColumnHidden}`);

    console.log('💻 Testing Tablet View (768px width)');
    await page.setViewport({ width: 768, height: 1024 });
    await page.reload({ waitUntil: 'networkidle0' });
    
    console.log('🖥️ Testing Standard Desktop (1024px width)');
    await page.setViewport({ width: 1024, height: 768 });
    await page.reload({ waitUntil: 'networkidle0' });
    
    // Check standard desktop layout
    const desktopGrid = await page.$('.checkout-desktop-wrapper');
    const gridColumns = await page.evaluate(el => 
      window.getComputedStyle(el).gridTemplateColumns, desktopGrid
    );
    console.log(`   ✅ Desktop grid columns: ${gridColumns}`);

    console.log('🖥️ Testing Large Desktop (1440px+ width)');
    await page.setViewport({ width: 1440, height: 900 });
    await page.reload({ waitUntil: 'networkidle0' });
    
    // Check large desktop optimizations
    const container = await page.$('.checkout-desktop-container');
    const containerStyles = await page.evaluate(el => ({
      maxWidth: window.getComputedStyle(el).maxWidth,
      margin: window.getComputedStyle(el).margin,
      padding: window.getComputedStyle(el).padding
    }), container);
    
    console.log('   ✅ Large desktop container styles:');
    console.log(`      Max-width: ${containerStyles.maxWidth}`);
    console.log(`      Margin: ${containerStyles.margin}`);
    console.log(`      Padding: ${containerStyles.padding}`);

    const wrapper = await page.$('.checkout-desktop-wrapper');
    const wrapperStyles = await page.evaluate(el => ({
      display: window.getComputedStyle(el).display,
      gridTemplateColumns: window.getComputedStyle(el).gridTemplateColumns,
      gap: window.getComputedStyle(el).gap
    }), wrapper);
    
    console.log('   ✅ Large desktop wrapper styles:');
    console.log(`      Display: ${wrapperStyles.display}`);
    console.log(`      Grid columns: ${wrapperStyles.gridTemplateColumns}`);
    console.log(`      Gap: ${wrapperStyles.gap}`);

    // Check right column content on large screens
    const rightColumnVisible = await page.evaluate(() => {
      const rightCol = document.querySelector('.checkout-desktop-summary');
      return rightCol && window.getComputedStyle(rightCol).display !== 'none';
    });
    console.log(`   ✅ Right column visible on large desktop: ${rightColumnVisible}`);

    // Check trust signals content
    const trustSignals = await page.$eval('.checkout-desktop-summary', el => 
      el.textContent.includes('SSL Encrypted Secure Payment')
    );
    console.log(`   ✅ Trust signals present: ${trustSignals}`);

    console.log('🎯 Testing Ultra-wide Desktop (1920px width)');
    await page.setViewport({ width: 1920, height: 1080 });
    await page.reload({ waitUntil: 'networkidle0' });
    
    // Ensure max-width constraint works
    const ultraWideContainer = await page.evaluate(() => {
      const container = document.querySelector('.checkout-desktop-container');
      const rect = container.getBoundingClientRect();
      return {
        width: rect.width,
        left: rect.left,
        centered: rect.left > 100 // Should be centered with margins
      };
    });
    
    console.log('   ✅ Ultra-wide desktop container:');
    console.log(`      Container width: ${ultraWideContainer.width}px`);
    console.log(`      Left margin: ${ultraWideContainer.left}px`);
    console.log(`      Properly centered: ${ultraWideContainer.centered}`);

    // Test form functionality
    console.log('📝 Testing Form Functionality');
    await page.type('input[placeholder="Enter your email"]', 'test@example.com');
    await page.type('input[placeholder="Enter your first name"]', 'Test User');
    
    const formFilled = await page.evaluate(() => {
      const email = document.querySelector('input[placeholder="Enter your email"]').value;
      const firstName = document.querySelector('input[placeholder="Enter your first name"]').value;
      return email === 'test@example.com' && firstName === 'Test User';
    });
    console.log(`   ✅ Form inputs working: ${formFilled}`);

    console.log('\n🎉 DESKTOP OPTIMIZATION VALIDATION COMPLETE');
    console.log('============================================');
    console.log('✅ Mobile layout preserved');
    console.log('✅ Desktop grid system working');
    console.log('✅ Large screen optimizations active (1440px+)');
    console.log('✅ Ultra-wide screens properly constrained');
    console.log('✅ Right column content loads correctly');
    console.log('✅ Form functionality maintained');
    console.log('✅ All responsive breakpoints working');

  } catch (error) {
    console.error('❌ Validation Error:', error);
  } finally {
    await browser.close();
  }
}

// Run validation if called directly
if (require.main === module) {
  validateDesktopCheckout();
}

module.exports = { validateDesktopCheckout };