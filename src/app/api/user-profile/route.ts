import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Questions to ask users gradually over time
const PROFILE_QUESTIONS = [
  {
    id: 'city',
    question: 'Which city or town do you live in?',
    type: 'select_with_input',
    field: 'city',
    options: [
      'Johannesburg', 'Pretoria', 'Cape Town', 'Durban', 'Port Elizabeth',
      'Bloemfontein', 'East London', 'Polokwane', 'Nelspruit', 'Kimberley',
      'Rustenburg', 'Pietermaritzburg', 'Benoni', 'Boksburg', 'Brakpan',
      'Springs', 'Kempton Park', 'Sandton', 'Randburg', 'Roodepoort',
      'Soweto', 'Centurion', 'Midrand', 'Germiston', 'Alberton',
    ],
    placeholder: 'Or type your city/town...',
  },
  {
    id: 'province',
    question: 'Which province do you live in?',
    type: 'select',
    field: 'province',
    options: [
      'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
      'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape',
    ],
  },
  {
    id: 'homeowner',
    question: 'Do you own or rent your home?',
    type: 'select',
    field: 'homeowner',
    options: ['Own', 'Rent', 'Living with family'],
    mapValue: (val: string) => val === 'Own',
  },
  {
    id: 'hasVehicle',
    question: 'Do you have a car or vehicle?',
    type: 'select',
    field: 'hasVehicle',
    options: ['Yes', 'No'],
    mapValue: (val: string) => val === 'Yes',
  },
  {
    id: 'ageRange',
    question: 'What is your age range?',
    type: 'select',
    field: 'ageRange',
    options: ['18-24', '25-34', '35-44', '45-54', '55+'],
  },
]

// Days between questions
const QUESTION_INTERVAL_DAYS = 5

/**
 * GET /api/user-profile
 * Get user profile and next question to ask
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('deviceId')

    if (!deviceId) {
      return NextResponse.json(
        { success: false, error: 'Device ID required' },
        { status: 400 }
      )
    }

    // Find or create profile
    let profile = await prisma.userProfile.findUnique({
      where: { deviceId },
    })

    if (!profile) {
      profile = await prisma.userProfile.create({
        data: {
          deviceId,
          nextQuestionAt: new Date(), // Ask first question immediately
        },
      })
    }

    // Check if it's time to ask a question
    const shouldAskQuestion = profile.nextQuestionAt
      ? new Date() >= profile.nextQuestionAt
      : true

    // Find the next unanswered question
    let nextQuestion = null
    if (shouldAskQuestion) {
      for (const q of PROFILE_QUESTIONS) {
        const fieldValue = profile[q.field as keyof typeof profile]
        if (fieldValue === null || fieldValue === undefined) {
          nextQuestion = {
            id: q.id,
            question: q.question,
            type: q.type,
            options: q.options,
            placeholder: 'placeholder' in q ? q.placeholder : undefined,
          }
          break
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          city: profile.city,
          province: profile.province,
          country: profile.country,
        },
        nextQuestion,
        questionsAnswered: profile.questionsAsked,
        totalQuestions: PROFILE_QUESTIONS.length,
      },
    })
  } catch (error) {
    console.error('[User Profile GET] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get profile' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/user-profile
 * Save an answer to a profile question
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { deviceId, questionId, answer } = body

    if (!deviceId || !questionId || answer === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find the question
    const question = PROFILE_QUESTIONS.find((q) => q.id === questionId)
    if (!question) {
      return NextResponse.json(
        { success: false, error: 'Invalid question ID' },
        { status: 400 }
      )
    }

    // Map the value if needed
    let finalValue = answer
    if ('mapValue' in question && typeof question.mapValue === 'function') {
      finalValue = question.mapValue(answer)
    }

    // Calculate next question time
    const nextQuestionAt = new Date()
    nextQuestionAt.setDate(nextQuestionAt.getDate() + QUESTION_INTERVAL_DAYS)

    // Update or create profile
    const profile = await prisma.userProfile.upsert({
      where: { deviceId },
      update: {
        [question.field]: finalValue,
        questionsAsked: { increment: 1 },
        lastQuestionAt: new Date(),
        nextQuestionAt,
      },
      create: {
        deviceId,
        [question.field]: finalValue,
        questionsAsked: 1,
        lastQuestionAt: new Date(),
        nextQuestionAt,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        message: 'Thank you for your answer!',
        nextQuestionIn: QUESTION_INTERVAL_DAYS,
        profile: {
          city: profile.city,
          province: profile.province,
        },
      },
    })
  } catch (error) {
    console.error('[User Profile POST] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save answer' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/user-profile
 * Skip a question (mark as asked but don't save value)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { deviceId, action } = body

    if (!deviceId) {
      return NextResponse.json(
        { success: false, error: 'Device ID required' },
        { status: 400 }
      )
    }

    if (action === 'skip') {
      // Calculate next question time (shorter delay for skipped questions)
      const nextQuestionAt = new Date()
      nextQuestionAt.setDate(nextQuestionAt.getDate() + 3) // 3 days for skipped

      await prisma.userProfile.upsert({
        where: { deviceId },
        update: {
          lastQuestionAt: new Date(),
          nextQuestionAt,
        },
        create: {
          deviceId,
          lastQuestionAt: new Date(),
          nextQuestionAt,
        },
      })

      return NextResponse.json({
        success: true,
        data: { message: 'Question skipped' },
      })
    }

    if (action === 'dismiss') {
      // User dismissed permanently - much longer delay
      const nextQuestionAt = new Date()
      nextQuestionAt.setDate(nextQuestionAt.getDate() + 30) // 30 days

      await prisma.userProfile.upsert({
        where: { deviceId },
        update: {
          nextQuestionAt,
        },
        create: {
          deviceId,
          nextQuestionAt,
        },
      })

      return NextResponse.json({
        success: true,
        data: { message: 'Dismissed for 30 days' },
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[User Profile PUT] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
