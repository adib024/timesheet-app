import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🗑️  Starting database cleanup...')

    // Delete in order to respect foreign key constraints
    const deletedTimesheets = await prisma.timesheet.deleteMany()
    console.log(`- Deleted ${deletedTimesheets.count} timesheets`)

    const deletedProjects = await prisma.project.deleteMany()
    console.log(`- Deleted ${deletedProjects.count} projects`)

    const deletedCategories = await prisma.category.deleteMany()
    console.log(`- Deleted ${deletedCategories.count} categories`)

    const deletedUsers = await prisma.user.deleteMany()
    console.log(`- Deleted ${deletedUsers.count} users`)

    console.log('✅ Database cleared successfully!')
    console.log('ℹ️  Demo users will be automatically recreated upon next login.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
