"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    CheckCircle,
    AlertCircle,
    Clock,
    Globe,
    GitBranch,
    Loader2,
    ExternalLink,
    RefreshCw
} from "lucide-react";

interface DeploymentMonitorProps {
    repositoryUrl?: string;
    websiteUrl?: string;
    commitHash?: string;
    deploymentStatus?: 'pending' | 'building' | 'ready' | 'error';
    onRefresh?: () => void;
}

export function DeploymentMonitor({
    repositoryUrl,
    websiteUrl,
    commitHash,
    deploymentStatus = 'pending',
    onRefresh
}: DeploymentMonitorProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastChecked, setLastChecked] = useState<Date>(new Date());

    const handleRefresh = async () => {
        if (onRefresh) {
            setIsRefreshing(true);
            try {
                await onRefresh();
                setLastChecked(new Date());
            } catch (error) {
                console.error('Refresh failed:', error);
            } finally {
                setIsRefreshing(false);
            }
        }
    };

    const getStatusIcon = () => {
        switch (deploymentStatus) {
            case 'ready':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'error':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'building':
                return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
            default:
                return <Clock className="w-5 h-5 text-yellow-500" />;
        }
    };

    const getStatusMessage = () => {
        switch (deploymentStatus) {
            case 'ready':
                return 'Deployment completed successfully';
            case 'error':
                return 'Deployment failed';
            case 'building':
                return 'Building and deploying...';
            default:
                return 'Deployment initiated';
        }
    };

    const getStatusColor = () => {
        switch (deploymentStatus) {
            case 'ready':
                return 'bg-green-50 border-green-200';
            case 'error':
                return 'bg-red-50 border-red-200';
            case 'building':
                return 'bg-blue-50 border-blue-200';
            default:
                return 'bg-yellow-50 border-yellow-200';
        }
    };

    return (
        <Card className={`w-full transition-all duration-300 ${getStatusColor()}`}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Globe className="w-5 h-5" />
                            Deployment Status
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Monitor your website deployment progress
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {getStatusIcon()}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="p-1"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Status Display */}
                <div className="flex items-center gap-3">
                    <Badge variant={deploymentStatus === 'ready' ? 'default' : 'secondary'}>
                        {deploymentStatus === 'ready' ? 'Live' :
                            deploymentStatus === 'building' ? 'Building' :
                                deploymentStatus === 'error' ? 'Failed' : 'Pending'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                        {getStatusMessage()}
                    </span>
                </div>

                {/* Error Alert */}
                {deploymentStatus === 'error' && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Deployment failed. Check your GitHub repository and Vercel dashboard for details.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Deployment Details */}
                {commitHash && (
                    <div className="space-y-2 p-3 bg-background/50 rounded-lg border">
                        <div className="flex items-center gap-2 text-sm">
                            <GitBranch className="w-4 h-4" />
                            <span className="font-medium">Commit:</span>
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                {commitHash.substring(0, 8)}
                            </code>
                        </div>

                        <div className="text-xs text-muted-foreground">
                            Last checked: {lastChecked.toLocaleTimeString()}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                    {repositoryUrl && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => window.open(repositoryUrl, '_blank')}
                        >
                            <GitBranch className="w-4 h-4 mr-2" />
                            View Repository
                            <ExternalLink className="w-3 h-3 ml-auto" />
                        </Button>
                    )}

                    {websiteUrl && deploymentStatus === 'ready' && (
                        <Button
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => window.open(websiteUrl, '_blank')}
                        >
                            <Globe className="w-4 h-4 mr-2" />
                            View Live Site
                            <ExternalLink className="w-3 h-3 ml-auto" />
                        </Button>
                    )}
                </div>

                {/* Building Progress */}
                {deploymentStatus === 'building' && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Building...</span>
                            <span>~2-3 minutes</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

interface DeploymentDashboardProps {
    deployments: Array<{
        id: string;
        configTitle: string;
        status: 'pending' | 'building' | 'ready' | 'error';
        timestamp: Date;
        commitHash?: string;
        repositoryUrl?: string;
        websiteUrl?: string;
    }>;
    onRefreshDeployment?: (deploymentId: string) => Promise<void>;
}

export function DeploymentDashboard({ deployments, onRefreshDeployment }: DeploymentDashboardProps) {
    if (deployments.length === 0) {
        return (
            <Card className="w-full">
                <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center">
                        <Globe className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No deployments yet</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Generate a website configuration to start deploying
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Deployment Dashboard</h3>
            <div className="grid gap-4">
                {deployments.map((deployment) => (
                    <DeploymentMonitor
                        key={deployment.id}
                        repositoryUrl={deployment.repositoryUrl}
                        websiteUrl={deployment.websiteUrl}
                        commitHash={deployment.commitHash}
                        deploymentStatus={deployment.status}
                        onRefresh={() => onRefreshDeployment?.(deployment.id)}
                    />
                ))}
            </div>
        </div>
    );
}
