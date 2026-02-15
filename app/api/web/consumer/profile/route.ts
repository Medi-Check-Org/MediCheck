// /app/api/web/consumer/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: {
        clerkUserId: userId,
      },
      include: {
        consumer: true,
      },
    });

    if (!user || !user.consumer) {
      return NextResponse.json({ error: 'Consumer profile not found' }, { status: 404 });
    }

    const profile = {
      id: user.consumer.id,
      fullName: user.consumer.fullName,
      email: user.consumer.phoneNumber, // Using phoneNumber if email not explicitly in consumer
      phoneNumber: user.consumer.phoneNumber,
      dateOfBirth: user.consumer.dateOfBirth?.toISOString().split('T')[0] || '',
      address: user.consumer.address || '',
      state: user.consumer.state || '',
      country: user.consumer.country || '',
    };

    return NextResponse.json(profile);
  } catch (error: unknown) {
    console.error('Error fetching consumer profile:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch consumer profile';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, phoneNumber, dateOfBirth, address, state, country } = body;

    const user = await prisma.user.findUnique({
      where: {
        clerkUserId: userId,
      },
      include: {
        consumer: true,
      },
    });

    if (!user || !user.consumer) {
      return NextResponse.json({ error: 'Consumer profile not found' }, { status: 404 });
    }

    const updatedConsumer = await prisma.consumer.update({
      where: {
        id: user.consumer.id,
      },
      data: {
        fullName,
        phoneNumber,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address,
        state,
        country,
      },
    });

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      consumer: updatedConsumer 
    });
  } catch (error: unknown) {
    console.error('Error updating consumer profile:', error);
    const message = error instanceof Error ? error.message : 'Failed to update consumer profile';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}