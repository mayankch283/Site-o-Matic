"use client";

import { useEffect, useState } from "react";
import { type Message } from "ai";
import { toast } from "sonner";

interface DetectedConfig {
    configObject: any;
    messageId: string;
    timestamp: Date;
}

/**
 * Hook to detect when AI generates a valid site configuration in chat messages
 */
export function useConfigDetection(messages: Message[]) {
    const [detectedConfigs, setDetectedConfigs] = useState<DetectedConfig[]>([]);
    const [latestConfig, setLatestConfig] = useState<DetectedConfig | null>(null);    // Function to extract config from message content
    const extractConfigFromMessage = (content: string): any | null => {
        try {
            // Enhanced patterns to detect various siteConfig formats
            const patterns = [
                // const siteConfig = { ... }
                /const\s+siteConfig\s*:\s*SiteConfig\s*=\s*(\{[\s\S]*?\});?\s*(?=export|$)/m,
                /const\s+siteConfig\s*=\s*(\{[\s\S]*?\});?\s*(?=export|$)/m,
                // export default { ... }
                /export\s+default\s+(\{[\s\S]*?\});?\s*$/m,
                // { site: { ... }, theme: { ... }, ... } - more flexible
                /(\{[\s\S]*?site\s*:\s*\{[\s\S]*?\}[\s\S]*?theme\s*:\s*\{[\s\S]*?\}[\s\S]*?\})/m,
                // Look for objects with required properties (site, theme, navigation)
                /(\{[\s\S]*?site\s*:\s*\{[\s\S]*?title[\s\S]*?\}[\s\S]*?theme\s*:\s*\{[\s\S]*?primaryColor[\s\S]*?\}[\s\S]*?navigation\s*:\s*\{[\s\S]*?\}[\s\S]*?\})/m,
                // Catch full siteConfig objects in code blocks
                /```(?:typescript|javascript|ts|js)?\s*(?:const\s+siteConfig\s*(?::\s*SiteConfig)?\s*=\s*)?(\{[\s\S]*?\})\s*;?\s*(?:export\s+default\s+siteConfig;?)?\s*```/m,
            ];

            for (const pattern of patterns) {
                const match = content.match(pattern);
                if (match) {
                    let configStr = match[1];

                    // Clean up the string more thoroughly
                    configStr = configStr
                        .replace(/const\s+siteConfig\s*(?::\s*SiteConfig)?\s*=\s*/, '')
                        .replace(/export\s+default\s+/, '')
                        .replace(/;?\s*$/, '')
                        .replace(/\{\{/g, '{')
                        .replace(/\}\}/g, '}')
                        .trim();

                    // Remove any trailing semicolons or exports
                    configStr = configStr.replace(/;\s*(?:export\s+default\s+siteConfig\s*;?)?\s*$/, '');

                    console.log('🔍 Extracted config string:', configStr.substring(0, 200) + '...');

                    // Try to parse as JavaScript first (more likely to work)
                    try {
                        // Use Function constructor to safely evaluate the object
                        const func = new Function(`
                            "use strict";
                            return (${configStr});
                        `);
                        const parsed = func();
                        console.log('✅ Successfully parsed config object:', parsed);
                        if (isValidConfig(parsed)) {
                            console.log('✅ Config validation passed');
                            return parsed;
                        } else {
                            console.log('❌ Config validation failed');
                        }
                    } catch (parseError) {
                        console.log('❌ JavaScript parsing failed:', parseError);
                        // If JavaScript parsing fails, try JSON parsing as fallback
                        try {
                            const parsed = JSON.parse(configStr);
                            console.log('✅ Successfully parsed as JSON:', parsed);
                            if (isValidConfig(parsed)) {
                                console.log('✅ JSON config validation passed');
                                return parsed;
                            }
                        } catch (jsonError) {
                            console.log('❌ JSON parsing also failed:', jsonError);
                            // Continue to next pattern
                        }
                    }
                }
            }
            console.log('❌ No valid config found in message');
            return null;
        } catch (error) {
            console.warn('Error extracting config from message:', error);
            return null;
        }
    };    // Function to validate if an object looks like a valid site config
    const isValidConfig = (obj: any): boolean => {
        console.log('🔍 Validating config object:', obj);

        if (!obj || typeof obj !== 'object') {
            console.log('❌ Config is not an object');
            return false;
        }

        // Check for required top-level properties
        const requiredProps = ['site', 'theme', 'navigation'];
        for (const prop of requiredProps) {
            if (!obj[prop] || typeof obj[prop] !== 'object') {
                console.log(`❌ Missing or invalid property: ${prop}`);
                return false;
            }
        }

        // Validate site object
        if (!obj.site.title || typeof obj.site.title !== 'string') {
            console.log('❌ Missing or invalid site.title');
            return false;
        }

        // Validate theme object
        if (!obj.theme.primaryColor || typeof obj.theme.primaryColor !== 'string') {
            console.log('❌ Missing or invalid theme.primaryColor');
            return false;
        }

        // Validate navigation object
        if (!obj.navigation.menu || !Array.isArray(obj.navigation.menu)) {
            console.log('❌ Missing or invalid navigation.menu');
            return false;
        }

        console.log('✅ Config validation passed');
        return true;
    };

    // Monitor messages for new configurations
    useEffect(() => {
        const assistantMessages = messages.filter(m => m.role === 'assistant');
        const newConfigs: DetectedConfig[] = [];

        for (const message of assistantMessages) {
            // Skip if we've already processed this message
            if (detectedConfigs.some(config => config.messageId === message.id)) {
                continue;
            }

            const configObject = extractConfigFromMessage(message.content);
            if (configObject) {
                const detectedConfig: DetectedConfig = {
                    configObject,
                    messageId: message.id,
                    timestamp: new Date(),
                };
                newConfigs.push(detectedConfig);
            }
        }

        if (newConfigs.length > 0) {
            const allConfigs = [...detectedConfigs, ...newConfigs];
            setDetectedConfigs(allConfigs);
            setLatestConfig(newConfigs[newConfigs.length - 1]);
        }
    }, [messages, detectedConfigs]);

    return {
        detectedConfigs,
        latestConfig,
        hasConfigs: detectedConfigs.length > 0,
        configCount: detectedConfigs.length,
    };
}

/**
 * Hook to automatically trigger site updates when new configs are detected
 */
export function useAutoSiteUpdate(
    latestConfig: DetectedConfig | null,
    enabled: boolean = true
) {
    const [isAutoUpdating, setIsAutoUpdating] = useState(false);
    const [autoUpdateResults, setAutoUpdateResults] = useState<any[]>([]); useEffect(() => {
        if (!enabled || !latestConfig || isAutoUpdating) {
            console.log('🔄 Auto-update skipped:', { enabled, hasLatestConfig: !!latestConfig, isAutoUpdating });
            return;
        }

        console.log('🚀 Triggering auto-update for config:', latestConfig.messageId);

        const triggerAutoUpdate = async () => {
            setIsAutoUpdating(true);
            try {
                console.log('📤 Sending config to updateSiteRepository...');
                const { updateSiteRepository } = await import('@/lib/siteUpdater');
                const result = await updateSiteRepository(latestConfig.configObject); console.log('✅ Auto-update successful:', result);
                console.log('🌐 Website URL:', result.websiteUrl || 'https://siteomatic.vercel.app/');

                // Show success toast with website link
                toast.success('Website deployed successfully!', {
                    description: `View your updated website at: ${result.websiteUrl || 'https://siteomatic.vercel.app/'}`,
                });

                setAutoUpdateResults(prev => [...prev, {
                    configId: latestConfig.messageId,
                    result,
                    timestamp: new Date(),
                }]);
            } catch (error) {
                console.error('❌ Auto-update failed:', error);
                setAutoUpdateResults(prev => [...prev, {
                    configId: latestConfig.messageId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    timestamp: new Date(),
                }]);
            } finally {
                setIsAutoUpdating(false);
            }
        };

        // Add a small delay to avoid rapid-fire updates
        const timeout = setTimeout(triggerAutoUpdate, 2000);
        return () => clearTimeout(timeout);
    }, [latestConfig, enabled, isAutoUpdating]);

    return {
        isAutoUpdating,
        autoUpdateResults,
        clearResults: () => setAutoUpdateResults([]),
    };
}
