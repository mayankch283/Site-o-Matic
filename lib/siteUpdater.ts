/**
 * Utility functions for automatic repository updates
 */

export interface ConfigUpdateResult {
  success: boolean;
  message: string;
  commitMessage?: string;
  timestamp?: string;
  noChanges?: boolean;
  error?: string;
  details?: string;
  websiteUrl?: string;
}

/**
 * Update the siteomatic template repository with a new configuration
 * This function can be called from the chat interface or other parts of the app
 */
export async function updateSiteRepository(
  configObject: any, 
  commitMessage?: string
): Promise<ConfigUpdateResult> {
  try {
    const response = await fetch('/api/update-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        configObject,
        commitMessage: commitMessage || `Update site configuration - ${new Date().toISOString()}`
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.details || result.error || 'Failed to update repository');
    }

    return result;
  } catch (error: any) {
    console.error('Failed to update site repository:', error);
    return {
      success: false,
      error: 'Network or API error',
      message: error.message || 'Failed to communicate with update service'
    };
  }
}

/**
 * Validate a site configuration object before sending to repository
 */
export function validateSiteConfig(configObject: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!configObject || typeof configObject !== 'object') {
    errors.push('Configuration must be a valid object');
    return { isValid: false, errors };
  }

  // Check required top-level properties
  const requiredProps = ['site', 'theme', 'navigation'];
  for (const prop of requiredProps) {
    if (!configObject[prop]) {
      errors.push(`Missing required property: ${prop}`);
    }
  }

  // Validate site info
  if (configObject.site) {
    if (!configObject.site.title) errors.push('Site title is required');
    if (!configObject.site.description) errors.push('Site description is required');
  }

  // Validate theme
  if (configObject.theme) {
    if (!configObject.theme.primaryColor) errors.push('Primary color is required');
    if (configObject.theme.primaryColor && !configObject.theme.primaryColor.match(/^#[0-9A-Fa-f]{6}$/)) {
      errors.push('Primary color must be a valid hex color (e.g., #FF0000)');
    }
  }

  // Validate navigation
  if (configObject.navigation) {
    if (!Array.isArray(configObject.navigation.menu) || configObject.navigation.menu.length === 0) {
      errors.push('Navigation menu must be a non-empty array');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generate a commit message based on the configuration changes
 */
export function generateCommitMessage(configObject: any, previousConfig?: any): string {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  if (!previousConfig) {
    return `feat: Update site configuration (${timestamp})`;
  }

  const changes: string[] = [];
  
  // Check for major changes
  if (configObject.site?.title !== previousConfig.site?.title) {
    changes.push('site title');
  }
  if (configObject.theme?.primaryColor !== previousConfig.theme?.primaryColor) {
    changes.push('theme colors');
  }
  if (JSON.stringify(configObject.navigation?.menu) !== JSON.stringify(previousConfig.navigation?.menu)) {
    changes.push('navigation');
  }
  if (JSON.stringify(configObject.products) !== JSON.stringify(previousConfig.products)) {
    changes.push('products');
  }

  if (changes.length > 0) {
    return `feat: Update ${changes.join(', ')} (${timestamp})`;
  }

  return `chore: Minor configuration updates (${timestamp})`;
}
