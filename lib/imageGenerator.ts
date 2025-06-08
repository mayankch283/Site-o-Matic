import OpenAI from "openai";
import fs from "fs-extra";
import * as path from "path";

/**
 * Extract image paths from siteConfig
 */
export const extractImagePaths = (config: any) => {
  const imagePaths = new Set<string>();
  
  // Function to recursively traverse the object and find image paths
  const findImages = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;
    
    Object.entries(obj).forEach(([key, value]) => {
      // Check if the key indicates an image and value is a string path
      if ((key.includes('image') || key.includes('Image') || key === 'logoUrl' || key === 'faviconUrl') && 
          typeof value === 'string' && value.toString().startsWith('/')) {
        imagePaths.add(value as string);
      }
      
      // Check for arrays of images
      if (key === 'images' && Array.isArray(value)) {
        value.forEach(imgPath => {
          if (typeof imgPath === 'string' && imgPath.startsWith('/')) {
            imagePaths.add(imgPath);
          }
        });
      }
      
      // Recursively check nested objects
      if (typeof value === 'object' && value !== null) {
        findImages(value);
      }
    });
  };
  
  findImages(config);
  return Array.from(imagePaths);
};

/**
 * Generate image description based on path and business context
 */
export const generateImagePrompt = (imagePath: string, config: any) => {
  // Extract business context
  const businessName = config.site?.title || 'Online Store';
  const businessDescription = config.site?.description || '';
  const primaryColor = config.theme?.primaryColor || '#000000';
  
  // Determine image type from path
  if (imagePath.includes('logo') || imagePath.includes('favicon')) {
    return `Create a modern, professional logo for "${businessName}". The logo should be simple, memorable, and work well at small sizes. Use ${primaryColor} as the primary color. The logo should represent: ${businessDescription}. Create on transparent background, professional quality.`;
  } 
  else if (imagePath.includes('hero') || imagePath.includes('banner')) {
    return `Create a high-quality hero banner image for "${businessName}" website. The image should be eye-catching and represent: ${businessDescription}. Use ${primaryColor} as an accent color. Wide format, professional e-commerce quality.`;
  }
  else if (imagePath.includes('seo')) {
    return `Create a social media sharing image for "${businessName}". The image should work well when shared on social platforms and represent: ${businessDescription}. Include the business name prominently. Use ${primaryColor} as an accent color.`;
  }
  else if (imagePath.includes('product') || imagePath.match(/\/([\w-]+)-\d+\.jpg$/)) {
    // Extract product info from path
    const productMatch = imagePath.match(/\/([\w-]+)-\d+\.jpg$/);
    const productName = productMatch ? productMatch[1].replace(/-/g, ' ') : 'product';
    
    // Find matching product in config
    let productDescription = '';
    if (config.products) {
      const product = config.products.find((p: any) => p.image === imagePath || (p.images && p.images.includes(imagePath)));
      if (product) {
        productDescription = `${product.name}: ${product.description}`;
      }
    }
    
    return `Create a professional product photo of a ${productName} for an e-commerce website named "${businessName}". ${productDescription} Clean background, well-lit, professional product photography style.`;
  }
  
  // Default prompt for other images
  return `Create a professional image for "${businessName}" website. The image should match the theme of: ${businessDescription}. Use ${primaryColor} as an accent color. Professional e-commerce quality.`;
};

/**
 * Generate and save images for a site configuration
 */
export const generateImages = async (config: any, tempDir: string) => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  const imagePaths = extractImagePaths(config);
  console.log(`Found ${imagePaths.length} images to generate`);
  
  const generatedImages: Record<string, string> = {};
  
  for (const imagePath of imagePaths) {
    try {
      const prompt = generateImagePrompt(imagePath, config);
      console.log(`Generating image for: ${imagePath}`);
      
      const size = imagePath.includes('logo') || imagePath.includes('favicon') ? 
        "1024x1024" : 
        imagePath.includes('banner') || imagePath.includes('hero') ? 
        "1792x1024" : "1024x1024";
      
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: size as "1024x1024" | "1792x1024" | "1024x1792",
      });
      
      // Check if response and data exist before accessing
      if (!response.data || response.data.length === 0 || !response.data[0].url) {
        console.error(`No image URL returned for ${imagePath}`);
        continue;
      }
      
      const imageUrl = response.data[0].url;
      generatedImages[imagePath] = imageUrl;
      
      // Save image to temp directory
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      
      // Create directory structure if needed
      const fullPath = path.join(tempDir, imagePath);
      await fs.ensureDir(path.dirname(fullPath));
      
      // Write image file - convert ArrayBuffer to Uint8Array for proper typing
      await fs.writeFile(fullPath, new Uint8Array(imageBuffer));
      console.log(`✅ Saved image to ${fullPath}`);
      
    } catch (error) {
      console.error(`Error generating image for ${imagePath}:`, error);
    }
  }
  
  return generatedImages;
};

/**
 * Update the repository with config and images
 */
export const updateRepositoryWithImages = async (configObject: any, tempDir: string) => {
  try {
    // Send API request to update config endpoint
    const commitMessage = `Update site configuration and images for ${configObject.site?.title || 'new site'}`;
    
    const response = await fetch('/api/update-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        configObject,
        commitMessage,
        imagesDir: tempDir
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.details || result.error || 'Failed to update repository');
    }

    return result;
  } catch (error) {
    console.error('Failed to update site repository:', error);
    throw error;
  }
}; 