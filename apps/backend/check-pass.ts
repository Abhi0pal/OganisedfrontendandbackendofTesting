import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.users.findFirst({ where: { email: 'dept.labour@example.com' } });
    if (user && user.password_hash) {
        const isMatch = await bcrypt.compare('user@123', user.password_hash);
        console.log("Password matches user@123:", isMatch);
    } else {
        console.log("User not found or password hash is null");
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
