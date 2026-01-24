import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { CREDIT_PACKAGES, formatCredits } from '@/lib/credits'
import { validatePayFastITN } from '@/lib/payfast'

/**
 * POST /api/buyer/credits/payfast-notify
 *
 * PayFast ITN (Instant Transaction Notification) webhook
 * This is called by PayFast servers to confirm payment status
 */
export async function POST(request: NextRequest) {
  try {
    // Parse form data from PayFast
    const formData = await request.formData()
    const data: Record<string, string> = {}

    formData.forEach((value, key) => {
      data[key] = String(value)
    })

    console.log('[PayFast ITN] Received notification:', JSON.stringify(data, null, 2))

    // Validate the ITN
    const validation = await validatePayFastITN(data)

    console.log('[PayFast ITN] Validation result:', validation)

    if (!validation.valid) {
      console.error('[PayFast ITN] Invalid notification')
      return new NextResponse('INVALID', { status: 400 })
    }

    const { paymentId, buyerId, packageId, amount, status, pfPaymentId } = validation

    // Find the pending transaction
    const pendingTransaction = await prisma.creditTransaction.findFirst({
      where: {
        referenceId: paymentId,
        type: 'PURCHASE_PENDING',
      },
    })

    if (!pendingTransaction) {
      console.error(`[PayFast ITN] No pending transaction found for payment ${paymentId}`)
      // Still return OK to PayFast to prevent retries
      return new NextResponse('OK', { status: 200 })
    }

    // Check if already processed (idempotency)
    const existingComplete = await prisma.creditTransaction.findFirst({
      where: {
        referenceId: paymentId,
        type: 'PURCHASE',
      },
    })

    if (existingComplete) {
      console.log(`[PayFast ITN] Payment ${paymentId} already processed`)
      return new NextResponse('OK', { status: 200 })
    }

    // Get the credit package
    const creditPackage = CREDIT_PACKAGES.find(p => p.id === packageId)
    if (!creditPackage) {
      console.error(`[PayFast ITN] Unknown package ${packageId}`)
      return new NextResponse('OK', { status: 200 })
    }

    // Get buyer
    const buyer = await prisma.buyerAccount.findUnique({
      where: { id: buyerId },
    })

    if (!buyer) {
      console.error(`[PayFast ITN] Buyer ${buyerId} not found`)
      return new NextResponse('OK', { status: 200 })
    }

    if (status === 'COMPLETE') {
      // Payment successful - add credits
      const totalCredits = creditPackage.credits + creditPackage.bonus

      await prisma.$transaction([
        // Update buyer's credit balance
        prisma.buyerAccount.update({
          where: { id: buyerId },
          data: {
            creditBalance: { increment: totalCredits },
            totalSpent: { increment: amount },
          },
        }),
        // Create successful transaction record
        prisma.creditTransaction.create({
          data: {
            buyerId,
            type: 'PURCHASE',
            amount: totalCredits,
            balanceBefore: buyer.creditBalance,
            balanceAfter: buyer.creditBalance + totalCredits,
            referenceType: 'PAYFAST',
            referenceId: paymentId,
            description: `Purchased ${creditPackage.name} package via PayFast (${formatCredits(creditPackage.credits)} + ${formatCredits(creditPackage.bonus)} bonus) - PF#${pfPaymentId}`,
          },
        }),
        // Delete the pending transaction
        prisma.creditTransaction.delete({
          where: { id: pendingTransaction.id },
        }),
      ])

      console.log(`[PayFast ITN] Payment ${paymentId} COMPLETE - Added ${totalCredits} credits to buyer ${buyerId}`)
    } else if (status === 'FAILED') {
      // Payment failed - update pending transaction
      await prisma.creditTransaction.update({
        where: { id: pendingTransaction.id },
        data: {
          type: 'PURCHASE_FAILED',
          description: `Failed: ${creditPackage.name} package - PF#${pfPaymentId}`,
        },
      })

      console.log(`[PayFast ITN] Payment ${paymentId} FAILED`)
    } else {
      // Still pending
      console.log(`[PayFast ITN] Payment ${paymentId} still pending: ${status}`)
    }

    // PayFast expects a 200 OK response
    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('[PayFast ITN] Error:', error)
    // Return OK to prevent PayFast from retrying indefinitely
    return new NextResponse('OK', { status: 200 })
  }
}
