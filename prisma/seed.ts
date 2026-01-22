import { PrismaClient } from '@prisma/client'
import { DEFAULT_CATEGORIES } from '../src/lib/categories'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create categories
  for (const category of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
      },
    })
    console.log(`Created category: ${category.name}`)
  }

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
