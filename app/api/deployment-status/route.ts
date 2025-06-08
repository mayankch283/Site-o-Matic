import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface DeploymentStatusResponse {
  status: 'pending' | 'building' | 'ready' | 'error';
  url?: string;
  deploymentId?: string;
  timestamp: string;
  error?: string;
}

/**
 * API endpoint to check deployment status
 * Usage: GET /api/deployment-status?commitSha=abc123&projectId=project123
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const commitSha = searchParams.get('commitSha');
    const projectId = searchParams.get('projectId');

    if (!commitSha) {
      return NextResponse.json(
        { error: 'Missing commitSha parameter' }, 
        { status: 400 }
      );
    }

    // Check if we have Vercel API access
    const vercelToken = process.env.VERCEL_TOKEN;
    const vercelProjectId = process.env.VERCEL_PROJECT_ID || projectId;

    if (!vercelToken || !vercelProjectId) {
      // Fallback: Return basic status based on repository check
      return NextResponse.json({
        status: 'pending',
        timestamp: new Date().toISOString(),
        message: 'Deployment initiated - check Vercel dashboard for real-time status'
      } as DeploymentStatusResponse);
    }

    // Query Vercel API for deployment status
    const deploymentsResponse = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${vercelProjectId}&limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${vercelToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!deploymentsResponse.ok) {
      throw new Error(`Vercel API error: ${deploymentsResponse.status}`);
    }

    const deploymentsData = await deploymentsResponse.json();
    
    // Find deployment matching our commit
    const matchingDeployment = deploymentsData.deployments?.find((deployment: any) => 
      deployment.meta?.githubCommitSha === commitSha ||
      deployment.meta?.githubCommitSha?.startsWith(commitSha.substring(0, 8))
    );

    if (!matchingDeployment) {
      return NextResponse.json({
        status: 'pending',
        timestamp: new Date().toISOString(),
        message: 'Deployment not found - may still be initializing'
      } as DeploymentStatusResponse);
    }

    // Map Vercel status to our status
    const status = mapVercelStatus(matchingDeployment.state);
    const response: DeploymentStatusResponse = {
      status,
      deploymentId: matchingDeployment.uid,
      timestamp: new Date(matchingDeployment.createdAt).toISOString(),
    };

    // Add URL if deployment is ready
    if (status === 'ready' && matchingDeployment.url) {
      response.url = `https://${matchingDeployment.url}`;
    }

    // Add error message if deployment failed
    if (status === 'error') {
      response.error = 'Deployment failed - check Vercel dashboard for details';
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Deployment status check error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check deployment status',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

function mapVercelStatus(vercelState: string): 'pending' | 'building' | 'ready' | 'error' {
  switch (vercelState) {
    case 'BUILDING':
    case 'INITIALIZING':
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

/**
 * POST endpoint to manually trigger deployment status refresh
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { commitSha, repositoryUrl } = body;

    if (!commitSha) {
      return NextResponse.json(
        { error: 'Missing commitSha in request body' }, 
        { status: 400 }
      );
    }

    // Trigger a fresh deployment status check
    const statusUrl = new URL('/api/deployment-status', req.url);
    statusUrl.searchParams.set('commitSha', commitSha);
    
    const statusResponse = await fetch(statusUrl.toString());
    const statusData = await statusResponse.json();

    // Log the manual refresh
    console.log('Manual deployment status refresh:', {
      commitSha: commitSha.substring(0, 8),
      status: statusData.status,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      ...statusData,
      refreshedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Manual deployment refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh deployment status' }, 
      { status: 500 }
    );
  }
}
