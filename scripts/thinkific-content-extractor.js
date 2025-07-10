// Thinkific Content Extractor
// This script should be run in the browser console while logged into Thinkific
// It will extract course content and structure for migration

(function() {
  'use strict';
  
  console.log("🚀 Dr. Golly Course Content Extractor Initialized");
  console.log("Navigate to: https://www.drgollylearninghub.com/courses/take/drgolly-8/texts/22333055-welcome");
  console.log("Then run: extractCourseContent()");
  
  // Function to extract course structure
  window.extractCourseContent = function() {
    console.log("🔍 Extracting course content...");
    
    const courseData = {
      title: "Preparation for Newborns",
      chapters: []
    };
    
    // Extract course navigation/structure
    const navElements = document.querySelectorAll('[data-course-nav], .course-nav, .curriculum-nav, .lesson-nav');
    if (navElements.length > 0) {
      console.log("📚 Found navigation elements:", navElements.length);
      navElements.forEach((nav, index) => {
        console.log(`Nav ${index}:`, nav.textContent.trim());
      });
    }
    
    // Extract chapter headings
    const chapterElements = document.querySelectorAll('h1, h2, h3, .chapter-title, .curriculum-chapter');
    chapterElements.forEach((element, index) => {
      const text = element.textContent.trim();
      if (text && text.length > 0) {
        console.log(`Chapter/Section ${index}: ${text}`);
      }
    });
    
    // Extract current page content
    const currentContent = extractCurrentPageContent();
    if (currentContent) {
      courseData.chapters.push(currentContent);
    }
    
    // Log the extracted data
    console.log("📊 Extracted Course Data:", courseData);
    
    // Create downloadable JSON
    const dataStr = JSON.stringify(courseData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'preparation-for-newborns-content.json';
    link.click();
    
    console.log("💾 Course content saved to downloads");
    return courseData;
  };
  
  // Function to extract current page content
  function extractCurrentPageContent() {
    const content = {
      title: "",
      content: "",
      images: [],
      videos: []
    };
    
    // Extract title
    const titleElement = document.querySelector('h1, .lesson-title, .chapter-title');
    if (titleElement) {
      content.title = titleElement.textContent.trim();
    }
    
    // Extract main content
    const contentElements = document.querySelectorAll('.lesson-content, .chapter-content, .course-content, main, article, .content');
    contentElements.forEach(element => {
      const text = element.innerHTML;
      if (text && text.length > content.content.length) {
        content.content = text;
      }
    });
    
    // Extract images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (img.src && !img.src.includes('data:image')) {
        content.images.push({
          src: img.src,
          alt: img.alt || '',
          title: img.title || ''
        });
      }
    });
    
    // Extract videos
    const videos = document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]');
    videos.forEach(video => {
      if (video.src) {
        content.videos.push({
          src: video.src,
          type: video.tagName.toLowerCase()
        });
      }
    });
    
    return content;
  }
  
  // Function to extract all course links
  window.extractCourseLinks = function() {
    console.log("🔗 Extracting course links...");
    
    const links = [];
    const linkElements = document.querySelectorAll('a[href*="/courses/take/"]');
    
    linkElements.forEach(link => {
      const href = link.href;
      const text = link.textContent.trim();
      if (href && text) {
        links.push({
          url: href,
          title: text
        });
      }
    });
    
    console.log("📋 Found course links:", links);
    return links;
  };
  
  // Function to navigate and extract all content
  window.extractAllCourseContent = async function() {
    console.log("🚀 Starting full course extraction...");
    
    const allContent = {
      course: "Preparation for Newborns",
      chapters: []
    };
    
    // First, get all course links
    const courseLinks = extractCourseLinks();
    
    if (courseLinks.length === 0) {
      console.log("❌ No course links found. Make sure you're on the course page.");
      return;
    }
    
    console.log(`📚 Found ${courseLinks.length} course sections to extract`);
    
    // Extract content from each link
    for (let i = 0; i < courseLinks.length; i++) {
      const link = courseLinks[i];
      console.log(`📖 Extracting content from: ${link.title}`);
      
      try {
        // Navigate to the link
        window.location.href = link.url;
        
        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Extract content
        const content = extractCurrentPageContent();
        content.url = link.url;
        allContent.chapters.push(content);
        
        console.log(`✅ Extracted: ${link.title}`);
        
      } catch (error) {
        console.error(`❌ Error extracting ${link.title}:`, error);
      }
    }
    
    // Save all extracted content
    const dataStr = JSON.stringify(allContent, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'preparation-for-newborns-full-content.json';
    link.click();
    
    console.log("💾 Full course content saved to downloads");
    return allContent;
  };
  
  // Function to extract images and save URLs
  window.extractImages = function() {
    console.log("🖼️ Extracting images...");
    
    const images = [];
    const imgElements = document.querySelectorAll('img');
    
    imgElements.forEach((img, index) => {
      if (img.src && !img.src.includes('data:image')) {
        images.push({
          index: index,
          src: img.src,
          alt: img.alt || '',
          title: img.title || '',
          width: img.width || 'auto',
          height: img.height || 'auto'
        });
      }
    });
    
    console.log("📊 Found images:", images);
    
    // Save images data
    const dataStr = JSON.stringify(images, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'course-images.json';
    link.click();
    
    return images;
  };
  
  // Helper function to clean HTML content
  window.cleanHTML = function(html) {
    // Remove scripts and styles
    html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // Remove Thinkific-specific elements
    html = html.replace(/class="[^"]*thinkific[^"]*"/gi, '');
    html = html.replace(/id="[^"]*thinkific[^"]*"/gi, '');
    
    // Clean up extra whitespace
    html = html.replace(/\s+/g, ' ');
    html = html.trim();
    
    return html;
  };
  
  console.log("✅ Thinkific Content Extractor Ready!");
  console.log("Available functions:");
  console.log("  - extractCourseContent() - Extract current page content");
  console.log("  - extractCourseLinks() - Get all course navigation links");
  console.log("  - extractAllCourseContent() - Extract all course content (takes time)");
  console.log("  - extractImages() - Extract all images from current page");
  console.log("  - cleanHTML(html) - Clean HTML content for migration");
  
})();