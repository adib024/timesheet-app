
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const count = await prisma.user.count()
    console.log(`Total Users: ${count}`)
    console.log(`Mock Active Calculation (0.8 * count): ${Math.round(count * 0.8)}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
