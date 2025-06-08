"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateSiteRepository, validateSiteConfig, generateCommitMessage } from "@/lib/siteUpdater";

interface SiteUpdaterProps {
    configObject?: any;
    onUpdateStart?: () => void;
    onUpdateComplete?: (result: any) => void;
    autoUpdate?: boolean;
}

export function SiteUpdater({
    configObject,
    onUpdateStart,
    onUpdateComplete,
    autoUpdate = false
}: SiteUpdaterProps) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<any>(null);

    const handleUpdate = async () => {
        if (!configObject) {
            console.error('No configuration object provided');
            return;
        }

        // Validate configuration before updating
        const validation = validateSiteConfig(configObject);
        if (!validation.isValid) {
            console.error('Configuration validation failed:', validation.errors);
            if (onUpdateComplete) {
                onUpdateComplete({
                    success: false,
                    error: 'Invalid configuration',
                    details: validation.errors.join(', ')
                });
            }
            return;
        }

        setIsUpdating(true);
        if (onUpdateStart) onUpdateStart();

        try {
            const commitMessage = generateCommitMessage(configObject);
            console.log('🚀 Updating site repository...');

            const result = await updateSiteRepository(configObject, commitMessage);

            setLastUpdate(result);
            if (onUpdateComplete) onUpdateComplete(result);

            if (result.success) {
                console.log('✅ Site repository updated successfully');
            } else {
                console.error('❌ Site repository update failed:', result.error);
            }
        } catch (error) {
            console.error('❌ Update failed:', error);
            const failureResult = {
                success: false,
                error: 'Update failed',
                message: error instanceof Error ? error.message : 'Unknown error'
            };
            setLastUpdate(failureResult);
            if (onUpdateComplete) onUpdateComplete(failureResult);
        } finally {
            setIsUpdating(false);
        }
    };

    // Auto-update when configObject changes (if enabled)
    useState(() => {
        if (autoUpdate && configObject && !isUpdating) {
            handleUpdate();
        }
    });

    return (
        <div className="flex flex-col gap-4 p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Site Deployment</h3>
                <Button
                    onClick={handleUpdate}
                    disabled={isUpdating || !configObject}
                    variant={lastUpdate?.success ? "default" : "outline"}
                >
                    {isUpdating ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Updating...
                        </>
                    ) : (
                        <>
                            🚀 Deploy to GitHub
                        </>
                    )}
                </Button>
            </div>

            {lastUpdate && (
                <div className={`p-3 rounded ${lastUpdate.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    <div className="flex items-center gap-2">
                        <span>{lastUpdate.success ? '✅' : '❌'}</span>
                        <span className="font-medium">{lastUpdate.message}</span>
                    </div>

                    {lastUpdate.success && lastUpdate.commitMessage && (
                        <div className="text-sm mt-1 opacity-80">
                            Commit: {lastUpdate.commitMessage}
                        </div>
                    )}

                    {lastUpdate.success && lastUpdate.timestamp && (
                        <div className="text-sm mt-1 opacity-80">
                            Updated: {new Date(lastUpdate.timestamp).toLocaleString()}
                        </div>
                    )}

                    {!lastUpdate.success && lastUpdate.details && (
                        <div className="text-sm mt-1 opacity-80">
                            Details: {lastUpdate.details}
                        </div>
                    )}

                    {lastUpdate.noChanges && (
                        <div className="text-sm mt-1 opacity-80">
                            No changes detected in configuration
                        </div>
                    )}
                </div>
            )}

            <div className="text-sm text-gray-600">
                <p>This will update the <code>siteConfig.ts</code> file in your template repository and trigger a Vercel deployment.</p>
                {!configObject && (
                    <p className="text-orange-600 mt-1">⚠️ No configuration object available to deploy</p>
                )}
            </div>
        </div>
    );
}
