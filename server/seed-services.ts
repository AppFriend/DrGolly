import { storage } from './storage';
import { InsertService } from '@shared/schema';

const serviceData: InsertService[] = [
  {
    title: "Sleep Review",
    description: "Professional sleep assessment and personalized plan for your baby. Get expert guidance on sleep patterns, bedtime routines, and proven strategies for better rest.",
    serviceType: "sleep_review",
    price: 250.00,
    durationMinutes: 60,
    isActive: true
  },
  {
    title: "Lactation Consultant",
    description: "Expert breastfeeding support and guidance from certified lactation consultants. Comprehensive assessment, latch assistance, and troubleshooting for feeding challenges.",
    serviceType: "lactation",
    price: 150.00,
    durationMinutes: 45,
    isActive: true
  }
];

export async function seedServices() {
  console.log('Seeding services...');
  
  try {
    // Check if services already exist
    const existingServices = await storage.getServices();
    
    if (existingServices.length === 0) {
      // Create services
      for (const service of serviceData) {
        await storage.createService(service);
        console.log(`Created service: ${service.title}`);
      }
      
      console.log('Services seeded successfully!');
    } else {
      console.log('Services already exist, skipping seed.');
    }
  } catch (error) {
    console.error('Error seeding services:', error);
  }
}