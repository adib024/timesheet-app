
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const emailsToDelete = [
        'anshul@loveimagefoundry.com',
        'artist@loveimagefoundry.com'
    ]

    console.log('--- Deleting Users ---')

    const result = await prisma.user.deleteMany({
        where: {
            email: {
                in: emailsToDelete
            }
        }
    })

    console.log(`Deleted ${result.count} users.`)

    const remainingUsers = await prisma.user.findMany({
        select: { name: true, email: true, role: true }
    })

    console.log('--- Remaining Users ---')
    remainingUsers.forEach(u => {
        console.log(`${u.name} (${u.email}) - ${u.role}`)
    })
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
