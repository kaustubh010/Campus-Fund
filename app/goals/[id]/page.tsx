'use client';

import { useGoal, useContributions } from '@/hooks/use-goals';
import { DepositForm as ContributionForm } from '@/components/contribution-form';
import { ProgressBar } from '@/components/progress-bar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import {
  Calendar,
  Target,
  TrendingUp,
  ArrowLeft,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { use } from 'react';

export default function CampaignDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { goal: campaign, isLoading, mutate } = useGoal(id);
  const { deposits: contributions } = useContributions(id);
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[50vh]">
        <Spinner className="w-8 h-8 text-[#6EE7B7] mb-4" />
        <p className="text-muted-foreground font-medium">Loading campaign details...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center space-y-4">
          <p className="text-lg text-muted-foreground">Campaign not found</p>
          <Link href="/">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isCompleted = campaign.deposited >= campaign.target;
  const progressPercent = campaign.target > 0
    ? Math.min(100, ((campaign.deposited / campaign.target) * 100))
    : 0;

  const daysRemaining = campaign.deadline
    ? Math.ceil(
        (new Date(campaign.deadline).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const formatDate = (date: string | Date) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const response = await fetch(`/api/goals/${campaign.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete campaign');

      toast.success('Campaign deleted successfully');
      router.push('/');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete campaign'
      );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      {/* Back Button */}
      <Link href="/" className="mb-6 inline-flex">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign Header */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{campaign.name}</h1>
                {campaign.description && (
                  <p className="text-muted-foreground">{campaign.description}</p>
                )}
              </div>
              {(isCompleted || campaign.isClaimed) && (
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  campaign.isClaimed
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100'
                    : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                }`}>
                  {campaign.isClaimed ? 'Funds Claimed' : 'Goal Met'}
                </span>
              )}
            </div>

            {/* Progress */}
            <ProgressBar
              current={campaign.deposited}
              target={campaign.target}
              showLabel
              size="lg"
            />

            {/* Meta Info */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4" />
                  Funding Goal
                </p>
                <p className="text-2xl font-bold">{campaign.target.toFixed(2)} ALGO</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  Raised
                </p>
                <p className="text-2xl font-bold">{campaign.deposited.toFixed(2)} ALGO</p>
              </div>

              {campaign.deadline && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4" />
                    Deadline
                  </p>
                  <p className="font-semibold">{formatDate(campaign.deadline)}</p>
                  {daysRemaining !== null && (
                    <p className="text-xs text-muted-foreground">
                      {daysRemaining > 0
                        ? `${daysRemaining} days left`
                        : 'Campaign Ended'}
                    </p>
                  )}
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-1">Progress</p>
                <p className="text-2xl font-bold">{progressPercent.toFixed(0)}%</p>
              </div>
            </div>
          </Card>

          {/* Contributions History */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Contribution History</h2>
            {contributions && contributions.length > 0 ? (
              <div className="space-y-3">
                {contributions.map((contribution: any) => (
                  <div
                    key={contribution.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <p className="font-semibold">
                        +{contribution.amount.toFixed(2)} ALGO
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(contribution.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        contribution.status === 'confirmed'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                      }`}>
                        {contribution.status}
                      </span>
                      {contribution.txnId && (
                        <a
                          href={`https://testnet.explorer.perawallet.app/tx/${contribution.txnId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-mono text-primary hover:underline"
                        >
                          {contribution.txnId.slice(0, 8)}…
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No contributions yet
              </p>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <ContributionForm
            goalId={campaign.id}
            targetAmount={campaign.target}
            currentAmount={campaign.deposited}
            onSuccess={() => mutate()}
          />

          {/* Delete Action */}
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Campaign
          </Button>
        </div>
      </div>
    </div>
  );
}