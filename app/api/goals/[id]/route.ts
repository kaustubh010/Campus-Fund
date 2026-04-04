import { prisma } from '@/lib/prisma';
import { goalSchema } from '@/lib/validators';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/goals/[id] - Get a specific goal
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const goal = await prisma.goal.findUnique({
      where: { id },
      include: { deposits: true },
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Never send the private key to the client
    const { depositMnemonic: _omit, ...safeGoal } = goal;

    return NextResponse.json({ goal: safeGoal });
  } catch (error) {
    console.error('Error fetching goal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goal' },
      { status: 500 }
    );
  }
}

// PUT /api/goals/[id] - Update a goal
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // ✅ unwrap first
  try {
    const body = await request.json();
    const validation = goalSchema.partial().safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const goal = await prisma.goal.update({
      where: { id: id },
      data: validation.data,
      include: { deposits: true },
    });

    return NextResponse.json({ goal });
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    );
  }
}

// DELETE /api/goals/[id] - Delete a goal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // ✅ unwrap first
  try {
    await prisma.goal.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json(
      { error: 'Failed to delete goal' },
      { status: 500 }
    );
  }
}
