import { NextRequest, NextResponse } from 'next/server';
import { algodClient } from '@/lib/algorand';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const approvalSource = fs.readFileSync(path.join(process.cwd(), 'lib/contracts/crowdfund_approval.teal'), 'utf8');
    const clearSource = fs.readFileSync(path.join(process.cwd(), 'lib/contracts/crowdfund_clear.teal'), 'utf8');

    const approvalCompile = await algodClient.compile(approvalSource).do();
    const clearCompile = await algodClient.compile(clearSource).do();

    return NextResponse.json({
      approvalProgram: approvalCompile.result, // base64
      clearProgram: clearCompile.result, // base64
    });
  } catch (error: any) {
    console.error('Error fetching deploy params:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
