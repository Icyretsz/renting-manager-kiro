// Temporary file to test Prisma types
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// This should compile without errors if types are correct
async function testRequestModel() {
  const request = await prisma.request.findFirst();
  const curfewRequest = await prisma.curfewRequest.findFirst();
  
  console.log('Types are working correctly!');
  console.log('Request:', request);
  console.log('CurfewRequest:', curfewRequest);
}

// Don't actually run this, just for type checking
export { testRequestModel };
