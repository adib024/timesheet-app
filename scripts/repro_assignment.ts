
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting reproduction script...')

    // 1. Create Artist User
    const artistEmail = `artist_${Date.now()}@test.com`
    const artist = await prisma.user.create({
        data: {
            name: 'Test Artist',
            email: artistEmail,
            role: 'USER',
            isActive: true,
        }
    })
    console.log(`Created Artist: ${artist.email} (${artist.id})`)

    // 2. Create Project (as Admin would)
    const project = await prisma.project.create({
        data: {
            name: `Project_${Date.now()}`,
            totalHours: 100,
            status: 'ACTIVE'
        }
    })
    console.log(`Created Project: ${project.name} (${project.id})`)

    // 3. Assign Project to Artist
    await prisma.assignment.create({
        data: {
            userId: artist.id,
            projectId: project.id
        }
    })
    console.log('Assigned Project to Artist')

    // 4. Simulate Dashboard Query (logic from api/dashboard/route.ts)
    // Get assigned projects
    const assignments = await prisma.assignment.findMany({
        where: { userId: artist.id },
        include: {
            project: true
        },
    })

    const projects = assignments
        .filter(a => a.project.status === 'ACTIVE')
        .map(a => a.project)

    console.log('--- Dashboard Query Result ---')
    if (projects.some(p => p.id === project.id)) {
        console.log('SUCCESS: Project found in dashboard query for Artist.')
    } else {
        console.error('FAILURE: Project NOT found in dashboard query.')
    }

    // Cleanup
    await prisma.assignment.deleteMany({ where: { userId: artist.id } })
    await prisma.project.delete({ where: { id: project.id } })
    await prisma.user.delete({ where: { id: artist.id } })
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
