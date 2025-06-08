import { NextRequest, NextResponse } from "next/server";
import { updateRepositoryConfig } from "../../../updateCentralJson";

export const runtime = "nodejs"; // Switch to nodejs runtime for git operations

interface UpdateConfigRequest {
  configObject: any;
  commitMessage?: string;
}

interface UpdateConfigResponse {
  success: boolean;
  message: string;
  commitMessage?: string;
  timestamp?: string;
  noChanges?: boolean;
  error?: string;
  details?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<UpdateConfigResponse>> {
  try {
    const body: UpdateConfigRequest = await req.json();
    const { configObject, commitMessage = "Update site configuration from AI generator" } = body;

    // Validate request body
    if (!configObject) {
      return NextResponse.json(
        { 
          success: false,
          error: "Configuration object is required",
          message: "Please provide a valid configuration object in the request body"
        },
        { status: 400 }
      );
    }

    // Validate that the config has required structure
    if (!configObject.site || !configObject.theme || !configObject.navigation) {
      return NextResponse.json(
        { 
          success: false,
          error: "Invalid configuration structure", 
          message: "Configuration must include site, theme, and navigation properties",
          details: `Missing properties: ${[
            !configObject.site && 'site',
            !configObject.theme && 'theme', 
            !configObject.navigation && 'navigation'
          ].filter(Boolean).join(', ')}`
        },
        { status: 400 }
      );
    }

    console.log('🚀 Starting repository update...');
    console.log(`📝 Commit message: "${commitMessage}"`);
    
    // Update the repository
    const result = await updateRepositoryConfig(configObject, commitMessage);
      console.log('✅ Repository update completed successfully');
    
    return NextResponse.json({
      success: true,
      message: result.message,
      commitMessage: result.commitMessage,
      timestamp: result.timestamp,
      noChanges: result.noChanges,
      websiteUrl: result.websiteUrl || process.env.WEBSITE_URL || 'https://siteomatic.vercel.app/'
    }, { status: 200 });
    
  } catch (error: any) {
    console.error('❌ Repository update failed:', error);
    
    // Determine if this is a client error or server error
    const isClientError = error.message.includes('Missing required property') || 
                         error.message.includes('Invalid configuration') ||
                         error.message.includes('Configuration object is required');
    
    const statusCode = isClientError ? 400 : 500;
    
    return NextResponse.json(
      { 
        success: false,
        error: "Repository update failed", 
        message: isClientError ? error.message : "An internal server error occurred while updating the repository",
        details: error.message
      },
      { status: statusCode }
    );
  }
}
