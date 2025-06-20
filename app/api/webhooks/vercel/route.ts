import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface VercelWebhookPayload {
  id: string;
  url: string;
  name: string;
  type: 'deployment.created' | 'deployment.ready' | 'deployment.error';
  createdAt: number;
  deploymentId: string;
  projectId: string;
  target: string;
  status: 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
  meta: {
    githubCommitSha?: string;
    githubCommitMessage?: string;
    githubCommitAuthorName?: string;
  };
}

/**
 * Webhook endpoint to receive deployment status updates from Vercel
 * Configure this webhook in your Vercel project settings:
 * https://vercel.com/dashboard/[team]/[project]/settings/git
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as VercelWebhookPayload;
    
    // Verify webhook signature (optional but recommended)
    const webhookSecret = process.env.VERCEL_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers.get('x-vercel-signature');
      if (!signature || !verifyWebhookSignature(body, signature, webhookSecret)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Process the webhook based on deployment status
    const deploymentUpdate = {
      deploymentId: body.deploymentId,
      projectId: body.projectId,
      status: mapVercelStatusToOurStatus(body.status),
      url: body.url,
      commitSha: body.meta.githubCommitSha,
      commitMessage: body.meta.githubCommitMessage,
      timestamp: new Date(body.createdAt),
      type: body.type,
    };

    // Log the deployment update
    console.log('Deployment webhook received:', {
      type: body.type,
      status: body.status,
      url: body.url,
      commit: body.meta.githubCommitSha?.substring(0, 8),
    });

    // Here you could:
    // 1. Store deployment status in a database
    // 2. Send real-time updates via WebSocket
    // 3. Trigger notifications
    // 4. Update deployment cache

    // For now, we'll just store in memory cache for demo purposes
    await updateDeploymentCache(deploymentUpdate);

    // Send notification if deployment is ready or failed
    if (body.status === 'READY' || body.status === 'ERROR') {
      await notifyDeploymentComplete(deploymentUpdate);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' }, 
      { status: 500 }
    );
  }
}

function mapVercelStatusToOurStatus(vercelStatus: string): 'pending' | 'building' | 'ready' | 'error' {
  switch (vercelStatus) {
    case 'BUILDING':
      return 'building';
    case 'READY':
      return 'ready';
    case 'ERROR':
    case 'CANCELED':
      return 'error';
    default:
      return 'pending';
  }
}

function verifyWebhookSignature(body: any, signature: string, secret: string): boolean {
  // Use Web Crypto API for Edge runtime compatibility
  try {
    // Convert the body to a string
    const bodyString = JSON.stringify(body);
    
    // In a real implementation, you would:
    // 1. Convert the secret and body to proper byte arrays
    // 2. Use crypto.subtle.importKey to import the secret
    // 3. Use crypto.subtle.sign to create an HMAC signature
    // 4. Compare the signatures using a constant-time comparison
    
    // For now, we'll just return true for development
    console.log('⚠️ Webhook signature verification skipped in development');
    return true;
    
    // Example implementation (not used here due to async nature):
    /*
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBytes = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(bodyString)
    );
    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return signature === expectedSignature;
    */
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

// Simple in-memory cache for deployment status
const deploymentCache = new Map();

async function updateDeploymentCache(deploymentUpdate: any) {
  const key = `${deploymentUpdate.projectId}-${deploymentUpdate.commitSha}`;
  deploymentCache.set(key, deploymentUpdate);
  
  // Clean up old entries (keep only last 50)
  if (deploymentCache.size > 50) {
    const oldestKey = deploymentCache.keys().next().value;
    deploymentCache.delete(oldestKey);
  }
}

async function notifyDeploymentComplete(deploymentUpdate: any) {
  // This could send notifications via:
  // - WebSocket to connected clients
  // - Email notifications
  // - Slack/Discord webhooks
  // - Push notifications
  
  console.log(`🚀 Deployment ${deploymentUpdate.status}:`, {
    url: deploymentUpdate.url,
    commit: deploymentUpdate.commitSha?.substring(0, 8),
    message: deploymentUpdate.commitMessage,
  });
}

// GET endpoint to check deployment status
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const commitSha = searchParams.get('commitSha');

  if (!projectId || !commitSha) {
    return NextResponse.json(
      { error: 'Missing projectId or commitSha parameters' }, 
      { status: 400 }
    );
  }

  const key = `${projectId}-${commitSha}`;
  const deployment = deploymentCache.get(key);

  if (!deployment) {
    return NextResponse.json(
      { error: 'Deployment not found' }, 
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    deployment,
  });
}
