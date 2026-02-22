import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateTimesheetSchema } from '@/lib/validations'
import { isWithinBackdateLimit, roundToNearest15 } from '@/lib/utils'
import type { ApiResponse } from '@/types'

// PATCH /api/timesheets/[id] - Update timesheet entry
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()
        const validation = updateTimesheetSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json<ApiResponse>({
                success: false,
                error: validation.error.issues[0].message
            }, { status: 400 })
        }

        const existingEntry = await prisma.timesheet.findUnique({
            where: { id, isDeleted: false },
        })

        if (!existingEntry) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Entry not found' }, { status: 404 })
        }

        // Users can only edit their own entries
        if (existingEntry.userId !== session.user.id && session.user.role !== 'ADMIN') {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        const updateData: Record<string, unknown> = {}
        const { projectId, categoryId, date, hours, minutes, notes } = validation.data

        // Check date backdate limit
        if (date) {
            const entryDate = new Date(date)
            const backdateLimit = parseInt(process.env.BACKDATE_LIMIT_DAYS || '7')
            if (!isWithinBackdateLimit(entryDate, backdateLimit)) {
                return NextResponse.json<ApiResponse>({
                    success: false,
                    error: `Cannot log time for dates more than ${backdateLimit} days in the past`
                }, { status: 400 })
            }
            updateData.date = entryDate
        }

        if (projectId !== undefined) updateData.projectId = projectId
        if (categoryId !== undefined) updateData.categoryId = categoryId
        if (hours !== undefined) updateData.hours = hours
        if (minutes !== undefined) updateData.minutes = roundToNearest15(minutes)
        if (notes !== undefined) updateData.notes = notes

        // Calculate hours difference for project update
        const oldMinutes = existingEntry.hours * 60 + existingEntry.minutes
        const newHours = hours ?? existingEntry.hours
        const newMins = minutes !== undefined ? roundToNearest15(minutes) : existingEntry.minutes
        const newMinutes = newHours * 60 + newMins
        const diffMinutes = newMinutes - oldMinutes

        const updatedEntry = await prisma.timesheet.update({
            where: { id },
            data: updateData,
            include: {
                project: {
                    select: { id: true, name: true, color: true },
                },
                category: {
                    select: { id: true, name: true, color: true },
                },
            },
        })

        // Update project hours if changed
        if (diffMinutes !== 0 && existingEntry.projectId) {
            await prisma.project.update({
                where: { id: existingEntry.projectId },
                data: {
                    usedHours: {
                        increment: diffMinutes / 60,
                    },
                },
            })
        }

        return NextResponse.json<ApiResponse<typeof updatedEntry>>({
            success: true,
            data: updatedEntry,
            message: 'Entry updated successfully',
        })
    } catch (error) {
        console.error('PATCH /api/timesheets/[id] error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE /api/timesheets/[id] - Soft delete timesheet entry
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        const entry = await prisma.timesheet.findUnique({
            where: { id, isDeleted: false },
        })

        if (!entry) {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Entry not found' }, { status: 404 })
        }

        // Users can only delete their own entries
        if (entry.userId !== session.user.id && session.user.role !== 'ADMIN') {
            return NextResponse.json<ApiResponse>({ success: false, error: 'Forbidden' }, { status: 403 })
        }

        // Soft delete
        await prisma.timesheet.update({
            where: { id },
            data: { isDeleted: true },
        })

        // Decrement project hours
        if (entry.projectId) {
            const totalMinutes = entry.hours * 60 + entry.minutes
            await prisma.project.update({
                where: { id: entry.projectId },
                data: {
                    usedHours: {
                        decrement: totalMinutes / 60,
                    },
                },
            })
        }

        return NextResponse.json<ApiResponse>({
            success: true,
            message: 'Entry deleted successfully',
        })
    } catch (error) {
        console.error('DELETE /api/timesheets/[id] error:', error)
        return NextResponse.json<ApiResponse>({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
