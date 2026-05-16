import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { lucia } from '@/lib/auth';
import { createCampaignInvoiceFromFile } from '@/lib/campaign-invoice-create';
import { toSafeJson } from '@/lib/json';

/** @deprecated Use POST /api/campaigns/[id]/invoices */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const sessionId = (await cookies()).get(lucia.sessionCookieName)?.value ?? null;
    if (!sessionId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { user, session } = await lucia.validateSession(sessionId);
    if (!session || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const campaignId = (await params).id;
    const formData = await req.formData();
    const file = formData.get('invoice');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Invoice file is required' }, { status: 400 });
    }

    const row = await createCampaignInvoiceFromFile(campaignId, user.id, file);
    return NextResponse.json(toSafeJson(row));
  } catch (error: any) {
    console.error('Invoice upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
