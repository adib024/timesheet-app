const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Force updating settings to 37.5 hours / 7.5 per day...')
    
    await prisma.settings.upsert({
        where: { key: 'workday_hours' },
        update: { value: '7.5' },
        create: { key: 'workday_hours', value: '7.5' }
    })
    
    await prisma.settings.upsert({
        where: { key: 'weeklyTarget' },
        update: { value: '37.5' },
        create: { key: 'weeklyTarget', value: '37.5' }
    })

    console.log('Done! Database settings updated.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
