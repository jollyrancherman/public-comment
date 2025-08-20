import { PrismaClient, Role, MeetingStatus } from '@prisma/client'
import { hash } from 'crypto'

const prisma = new PrismaClient()

async function main() {
  // Create test users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      role: Role.ADMIN,
      zipCode: '90210',
      district: 'District 1',
    },
  })

  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@example.com' },
    update: {},
    create: {
      email: 'staff@example.com',
      name: 'Staff Member',
      role: Role.STAFF,
      zipCode: '90210',
      district: 'District 1',
    },
  })

  const councilUser = await prisma.user.upsert({
    where: { email: 'council@example.com' },
    update: {},
    create: {
      email: 'council@example.com',
      name: 'Council Member',
      role: Role.COUNCIL_MEMBER,
      zipCode: '90210',
      district: 'District 1',
    },
  })

  const moderatorUser = await prisma.user.upsert({
    where: { email: 'moderator@example.com' },
    update: {},
    create: {
      email: 'moderator@example.com',
      name: 'Moderator User',
      role: Role.MODERATOR,
      zipCode: '90211',
      district: 'District 2',
    },
  })

  const residentUser = await prisma.user.upsert({
    where: { email: 'resident@example.com' },
    update: {},
    create: {
      email: 'resident@example.com',
      name: 'John Resident',
      role: Role.RESIDENT,
      address: '123 Main St',
      zipCode: '90212',
      district: 'District 3',
    },
  })

  // Create a sample meeting
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const upcomingMeeting = await prisma.meeting.create({
    data: {
      title: 'City Council Regular Meeting',
      description: 'Regular monthly meeting of the City Council',
      body: 'COUNCIL',
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000), // 3 hours later
      status: MeetingStatus.UPCOMING,
      location: 'City Hall, Council Chambers',
      videoUrl: 'https://example.com/live-stream',
      agendaItems: {
        create: [
          {
            code: 'A1',
            title: 'Call to Order',
            description: 'Opening of the meeting',
            orderIndex: 1,
            cutoffTime: tomorrow,
          },
          {
            code: 'A2',
            title: 'Public Comment',
            description: 'General public comment period',
            orderIndex: 2,
            cutoffTime: new Date(tomorrow.getTime() + 30 * 60 * 1000), // 30 min after start
          },
          {
            code: 'B1',
            title: 'Zoning Amendment - Downtown District',
            description: 'Proposal to amend zoning regulations for mixed-use development in downtown area',
            orderIndex: 3,
            cutoffTime: new Date(tomorrow.getTime() + 60 * 60 * 1000), // 1 hour after start
            supportingDocs: {
              files: [
                { name: 'zoning_proposal.pdf', url: '/docs/zoning_proposal.pdf' },
                { name: 'impact_study.pdf', url: '/docs/impact_study.pdf' },
              ],
            },
          },
          {
            code: 'B2',
            title: 'Budget Amendment - Parks Department',
            description: 'Request for additional funding for park maintenance and improvements',
            orderIndex: 4,
            cutoffTime: new Date(tomorrow.getTime() + 90 * 60 * 1000), // 1.5 hours after start
            supportingDocs: {
              files: [
                { name: 'budget_request.pdf', url: '/docs/budget_request.pdf' },
              ],
            },
          },
          {
            code: 'C1',
            title: 'Resolution - Climate Action Plan',
            description: 'Adoption of city-wide climate action plan and sustainability goals',
            orderIndex: 5,
            cutoffTime: new Date(tomorrow.getTime() + 120 * 60 * 1000), // 2 hours after start
          },
        ],
      },
    },
  })

  const pastMeeting = await prisma.meeting.create({
    data: {
      title: 'City Council Special Session',
      description: 'Special session to address emergency items',
      body: 'COUNCIL',
      startTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      endTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours
      status: MeetingStatus.ENDED,
      location: 'City Hall, Council Chambers',
      agendaItems: {
        create: [
          {
            code: 'A1',
            title: 'Emergency Budget Allocation',
            description: 'Emergency funding for infrastructure repairs',
            orderIndex: 1,
          },
        ],
      },
    },
  })

  // Create system configuration
  await prisma.systemConfig.upsert({
    where: { key: 'moderation_settings' },
    update: {},
    create: {
      key: 'moderation_settings',
      value: {
        autoModerate: true,
        profanityFilter: true,
        piiRedaction: true,
        riskThreshold: 0.7,
      },
    },
  })

  await prisma.systemConfig.upsert({
    where: { key: 'rate_limits' },
    update: {},
    create: {
      key: 'rate_limits',
      value: {
        otpRequestsPerHour: 5,
        commentsPerDay: 10,
        recommendationsPerWeek: 5,
      },
    },
  })

  console.log('Database seeded successfully!')
  console.log({
    users: {
      admin: adminUser.email,
      staff: staffUser.email,
      council: councilUser.email,
      moderator: moderatorUser.email,
      resident: residentUser.email,
    },
    meetings: {
      upcoming: upcomingMeeting.title,
      past: pastMeeting.title,
    },
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })