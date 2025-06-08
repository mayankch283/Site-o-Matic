const simpleGit = require('simple-git');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

// Environment validation
if (!process.env.GITHUB_TOKEN) {
  throw new Error('GITHUB_TOKEN environment variable is required. Please set it in .env file.');
}

const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'sujeethshingade';
const TEMPLATE_REPO_NAME = process.env.TEMPLATE_REPO_NAME || 'siteomatic-website-template';
const repoUrl = `https://${process.env.GITHUB_TOKEN}@github.com/${GITHUB_USERNAME}/${TEMPLATE_REPO_NAME}.git`;
const cloneDir = './temp-centralized-website';

/**
 * Convert a site config object to TypeScript file content
 */
function generateSiteConfigTS(configObject) {
  // Validate the config object before generating TypeScript
  if (!configObject || typeof configObject !== 'object') {
    throw new Error('Invalid configuration object provided');
  }

  // Ensure required properties exist
  const requiredProps = ['site', 'theme', 'navigation'];
  for (const prop of requiredProps) {
    if (!configObject[prop]) {
      throw new Error(`Missing required property '${prop}' in configuration object`);
    }
  }

  return `import { SiteConfig } from "@/types/siteConfig";

const siteConfig: SiteConfig = ${JSON.stringify(configObject, null, 2)};

export default siteConfig;
`;
}

/**
 * Update the siteomatic template repository with new configuration
 */
async function updateSiteConfig(configObject, commitMessage = 'Update site configuration from AI generator') {
  let tempDirCreated = false;
  
  try {
    console.log('🚀 Starting site configuration update...');
    
    // Validate inputs
    if (!configObject) {
      throw new Error('Configuration object is required');
    }
    
    if (!commitMessage || typeof commitMessage !== 'string') {
      commitMessage = 'Update site configuration from AI generator';
    }

    // Remove previous clone if exists
    if (await fs.pathExists(cloneDir)) {
      console.log('🧹 Cleaning up existing temp directory...');
      await fs.remove(cloneDir);
    }

    // Clone the repository
    const git = simpleGit();
    console.log('🔄 Cloning template repository...');
    console.log(`📍 Repository: ${GITHUB_USERNAME}/${TEMPLATE_REPO_NAME}`);
    
    await git.clone(repoUrl, cloneDir);
    tempDirCreated = true;
    console.log('✅ Repository cloned successfully');

    // Verify the cloned directory structure
    const configPath = path.join(cloneDir, 'src', 'config', 'siteConfig.ts');
    const configDir = path.dirname(configPath);
    
    if (!(await fs.pathExists(configDir))) {
      throw new Error(`Configuration directory not found: ${configDir}. Please check repository structure.`);
    }
    
    // Generate TypeScript file content
    console.log('📝 Generating configuration file...');
    const tsContent = generateSiteConfigTS(configObject);
    
    // Write the new configuration
    await fs.writeFile(configPath, tsContent, 'utf8');
    console.log('✅ Configuration file written successfully');

    // Commit and push changes
    const websiteGit = simpleGit(cloneDir);
    
    // Configure git user (needed for commits)
    await websiteGit.addConfig('user.name', 'sujeethshingade');
    await websiteGit.addConfig('user.email', 'sujeethshingade04@gmail.com');
    
    // Check if there are any changes to commit
    const status = await websiteGit.status();
    if (status.files.length === 0) {
      console.log('⚠️  No changes detected in configuration file');
      return { success: true, message: 'No changes to commit', noChanges: true };
    }
    
    console.log('📤 Staging and committing changes...');
    await websiteGit.add('./*');
    await websiteGit.commit(commitMessage);
    
    console.log('🚀 Pushing to GitHub...');
    await websiteGit.push('origin', 'main');    console.log('✅ siteConfig.ts updated and pushed successfully!');
    console.log('🌐 Vercel deployment should trigger automatically');
    console.log(`📝 Commit message: ${commitMessage}`);
    
    // Clean up
    await fs.remove(cloneDir);
    console.log('🧹 Cleanup completed');
    
    const websiteUrl = process.env.WEBSITE_URL || 'https://siteomatic.vercel.app/';
    console.log(`🌐 View website: ${websiteUrl}`);
    
    return { 
      success: true, 
      message: 'Configuration updated successfully',
      commitMessage: commitMessage,
      timestamp: new Date().toISOString(),
      websiteUrl: websiteUrl
    };
    
  } catch (error) {
    console.error('❌ Failed to update configuration:', error.message);
    
    // Clean up on error
    if (tempDirCreated) {
      try {
        await fs.remove(cloneDir);
        console.log('🧹 Cleanup completed after error');
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup temp directory:', cleanupError.message);
      }
    }
    
    // Re-throw with more context
    throw new Error(`Repository update failed: ${error.message}`);
  }
}

/**
 * Main function to be called from other modules
 */
async function updateRepositoryConfig(configObject, commitMessage) {
  return await updateSiteConfig(configObject, commitMessage);
}

// Export for use as module
module.exports = { updateRepositoryConfig };

// If run directly from command line
if (require.main === module) {
  (async () => {
    try {
      // Try to load generated.json if it exists
      let configObject;
      try {
        configObject = require('./generated.json');
      } catch (e) {
        console.error('No generated.json found. Please generate a configuration first.');
        process.exit(1);
      }
      
      await updateSiteConfig(configObject);
    } catch (error) {
      console.error('Script failed:', error);
      process.exit(1);
    }
  })();
}
