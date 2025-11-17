const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding...');

    // Insert rooms data
    await prisma.room.createMany({
        data: [
            { id: 1, roomNumber: 1, floor: 1, baseRent: 2400000, maxTenants: 4 },
            { id: 2, roomNumber: 2, floor: 1, baseRent: 2200000, maxTenants: 4 },
            { id: 3, roomNumber: 3, floor: 1, baseRent: 2100000, maxTenants: 4 },
            { id: 4, roomNumber: 4, floor: 1, baseRent: 2200000, maxTenants: 4 },
            { id: 5, roomNumber: 5, floor: 1, baseRent: 2200000, maxTenants: 4 },
            { id: 6, roomNumber: 6, floor: 1, baseRent: 2100000, maxTenants: 4 },
            { id: 7, roomNumber: 7, floor: 1, baseRent: 2100000, maxTenants: 4 },
            { id: 8, roomNumber: 8, floor: 1, baseRent: 2200000, maxTenants: 4 },
            { id: 9, roomNumber: 9, floor: 1, baseRent: 2400000, maxTenants: 4 },
            { id: 10, roomNumber: 10, floor: 2, baseRent: 2400000, maxTenants: 4 },
            { id: 11, roomNumber: 11, floor: 2, baseRent: 2100000, maxTenants: 4 },
            { id: 12, roomNumber: 12, floor: 2, baseRent: 2000000, maxTenants: 4 },
            { id: 13, roomNumber: 13, floor: 2, baseRent: 2000000, maxTenants: 4 },
            { id: 14, roomNumber: 14, floor: 2, baseRent: 2100000, maxTenants: 4 },
            { id: 15, roomNumber: 15, floor: 2, baseRent: 2000000, maxTenants: 4 },
            { id: 16, roomNumber: 16, floor: 2, baseRent: 2000000, maxTenants: 4 },
            { id: 17, roomNumber: 17, floor: 2, baseRent: 2100000, maxTenants: 4 },
            { id: 18, roomNumber: 18, floor: 2, baseRent: 2400000, maxTenants: 4 },
        ],
    });

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });