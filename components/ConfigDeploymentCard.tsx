"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { updateSiteRepository } from "@/lib/siteUpdater";
import { CheckCircle, AlertCircle, Clock, Globe, GitBranch, Loader2, ExternalLink } from "lucide-react";

interface DeploymentStatus {
    step: 'idle' | 'validating' | 'committing' | 'pushing' | 'deploying' | 'complete' | 'error';
    message: string;
    error?: string;
}

interface ConfigDeploymentCardProps {
    configObject: any;
    messageId: string;
    onDeploymentStart?: () => void;
    onDeploymentComplete?: (result: any) => void;
    autoDeployEnabled?: boolean;
}

export function ConfigDeploymentCard({
    configObject,
    messageId,
    onDeploymentStart,
    onDeploymentComplete,
    autoDeployEnabled = false
}: ConfigDeploymentCardProps) {
    const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>({
        step: 'idle',
        message: 'Ready to deploy'
    });
    const [isDeploying, setIsDeploying] = useState(false);
    const [deploymentResult, setDeploymentResult] = useState<any>(null);

    // Auto-deploy effect
    useEffect(() => {
        if (autoDeployEnabled && deploymentStatus.step === 'idle' && !deploymentResult) {
            handleDeploy();
        }
    }, [autoDeployEnabled, configObject]);

    const updateStatus = (step: DeploymentStatus['step'], message: string, error?: string) => {
        setDeploymentStatus({ step, message, error });
    };

    const handleDeploy = async () => {
        if (isDeploying) return;

        setIsDeploying(true);
        onDeploymentStart?.();

        try {
            updateStatus('validating', 'Validating configuration...');
            await new Promise(resolve => setTimeout(resolve, 1000)); // Visual delay

            updateStatus('committing', 'Creating commit...');
            await new Promise(resolve => setTimeout(resolve, 1500));

            updateStatus('pushing', 'Pushing to GitHub...');

            const result = await updateSiteRepository(configObject);

            updateStatus('deploying', 'Triggering Vercel deployment...');
            await new Promise(resolve => setTimeout(resolve, 2000));

            updateStatus('complete', 'Deployment successful!');
            setDeploymentResult(result);
            onDeploymentComplete?.(result);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            updateStatus('error', 'Deployment failed', errorMessage);
            console.error('Deployment error:', error);
        } finally {
            setIsDeploying(false);
        }
    };

    const getStatusIcon = () => {
        switch (deploymentStatus.step) {
            case 'complete':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'error':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'idle':
                return <Clock className="w-5 h-5 text-gray-400" />;
            default:
                return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
        }
    };

    const getStatusColor = () => {
        switch (deploymentStatus.step) {
            case 'complete':
                return 'bg-green-50 border-green-200';
            case 'error':
                return 'bg-red-50 border-red-200';
            case 'idle':
                return 'bg-gray-50 border-gray-200';
            default:
                return 'bg-blue-50 border-blue-200';
        }
    };

    // Extract site title for display
    const siteTitle = configObject?.site?.title || 'Website Configuration';

    return (
        <Card className={`w-full max-w-md transition-all duration-300 ${getStatusColor()}`}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Globe className="w-5 h-5" />
                            {siteTitle}
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Website configuration ready for deployment
                        </CardDescription>
                    </div>
                    {getStatusIcon()}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Status Display */}
                <div className="flex items-center gap-3">
                    <Badge variant={deploymentStatus.step === 'complete' ? 'default' : 'secondary'}>
                        {deploymentStatus.step === 'idle' ? 'Ready' :
                            deploymentStatus.step === 'complete' ? 'Deployed' :
                                deploymentStatus.step === 'error' ? 'Failed' : 'Deploying'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                        {deploymentStatus.message}
                    </span>
                </div>

                {/* Error Alert */}
                {deploymentStatus.step === 'error' && deploymentStatus.error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{deploymentStatus.error}</AlertDescription>
                    </Alert>
                )}

                {/* Success Details */}
                {deploymentResult && deploymentStatus.step === 'complete' && (
                    <div className="space-y-2 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 text-sm text-green-700">
                            <GitBranch className="w-4 h-4" />
                            <span>Commit: {deploymentResult.commitHash?.substring(0, 8)}</span>
                        </div>
                        <div className="text-xs text-green-600">
                            {deploymentResult.commitMessage}
                        </div>
                        {deploymentResult.websiteUrl && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full mt-2"
                                onClick={() => window.open(deploymentResult.websiteUrl, '_blank')}
                            >
                                View Live Site
                            </Button>
                        )}
                    </div>)}

                {/* Success State with Website Link */}
                {deploymentStatus.step === 'complete' && deploymentResult && (
                    <div className="space-y-3">
                        <Alert className="border-green-200 bg-green-50">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                Website deployed successfully! Your changes are now live.
                            </AlertDescription>
                        </Alert>

                        {deploymentResult.websiteUrl && (
                            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center space-x-2">
                                    <ExternalLink className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-800">View Website:</span>
                                </div>
                                <a
                                    href={deploymentResult.websiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium underline decoration-2 underline-offset-2"
                                >
                                    {deploymentResult.websiteUrl}
                                </a>
                            </div>
                        )}
                    </div>
                )}

                {/* Deploy Button */}
                {deploymentStatus.step === 'idle' && (
                    <Button
                        onClick={handleDeploy}
                        disabled={isDeploying}
                        className="w-full"
                    >
                        {isDeploying ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Deploying...
                            </>
                        ) : (
                            <>
                                <GitBranch className="w-4 h-4 mr-2" />
                                Deploy to Website
                            </>
                        )}
                    </Button>
                )}

                {/* Retry Button for Errors */}
                {deploymentStatus.step === 'error' && (
                    <Button
                        onClick={handleDeploy}
                        disabled={isDeploying}
                        variant="outline"
                        className="w-full"
                    >
                        Retry Deployment
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

interface SiteUpdaterPanelProps {
    detectedConfigs: Array<{
        configObject: any;
        messageId: string;
        timestamp: Date;
    }>;
    autoDeployEnabled?: boolean;
    onToggleAutoDeploy?: (enabled: boolean) => void;
}

export function SiteUpdaterPanel({
    detectedConfigs,
    autoDeployEnabled = false,
    onToggleAutoDeploy
}: SiteUpdaterPanelProps) {
    if (detectedConfigs.length === 0) {
        return null;
    }

    // Show only the latest config for deployment
    const latestConfig = detectedConfigs[detectedConfigs.length - 1];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Website Deployment</h3>
                <Badge variant="outline">
                    {detectedConfigs.length} config{detectedConfigs.length !== 1 ? 's' : ''} detected
                </Badge>
            </div>

            <ConfigDeploymentCard
                configObject={latestConfig.configObject}
                messageId={latestConfig.messageId}
                autoDeployEnabled={autoDeployEnabled}
            />

            {detectedConfigs.length > 1 && (
                <div className="text-sm text-muted-foreground">
                    Showing latest configuration. {detectedConfigs.length - 1} previous config{detectedConfigs.length - 1 !== 1 ? 's' : ''} available.
                </div>
            )}
        </div>
    );
}
