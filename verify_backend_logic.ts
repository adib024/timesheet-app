import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🚀 Starting Backend Logic Verification...')
    let hasError = false

    try {
        // 1. Verify Categories
        const catCount = await prisma.category.count()
        if (catCount === 0) throw new Error('No categories found! Seeding failed.')
        console.log('✅ Categories Verified')

        // 2. Admin Action: Create Project
        console.log('🔄 Simulating Admin: Creating Project...')
        const project = await prisma.project.create({
            data: {
                name: 'SYSTEM_CHECK_PROJECT',

                totalHours: 100,
                status: 'ACTIVE',
                color: '#00ff00'
            }
        })
        console.log('✅ Project Created:', project.name)

        // 3. User Action: Log Time
        console.log('🔄 Simulating User: Logging Time...')
        const artist = await prisma.user.findUnique({ where: { email: 'artist@demo.com' } })
        if (!artist) throw new Error('Artist user not found')

        const category = await prisma.category.findFirst() // Grab any category
        if (!category) throw new Error('No category found')

        const timesheet = await prisma.timesheet.create({
            data: {
                userId: artist.id,
                projectId: project.id,
                categoryId: category.id,
                date: new Date(),
                hours: 4,
                notes: 'Automated System Check'
            }
        })
        console.log('✅ Time Entry Created:', timesheet.hours + ' hours')

        // 4. Admin Verification: Read Data
        console.log('🔄 Simulating Admin: Reviewing Data...')
        const verifiedEntry = await prisma.timesheet.findFirst({
            where: {
                projectId: project.id,
                userId: artist.id
            },
            include: { user: true, project: true }
        })

        if (!verifiedEntry) throw new Error('Verification Failed: Entry not found in DB')
        if (verifiedEntry.hours !== 4) throw new Error('Verification Failed: Hours mismatch')
        console.log('✅ Admin Verification Successful: Found entry for', verifiedEntry.project?.name)

        // 5. Cleanup
        console.log('🧹 Cleaning up test data...')
        await prisma.timesheet.delete({ where: { id: timesheet.id } })
        await prisma.project.delete({ where: { id: project.id } })
        console.log('✅ Test Data Cleaned Up')

        console.log('\n✨ ALL SYSTEMS GO. Backend logic is flawless.')

    } catch (error) {
        console.error('\n❌ SYSTEM CHECK FAILED:', error)
        hasError = true
    } finally {
        await prisma.$disconnect()
        if (hasError) process.exit(1)
    }
}

main()
