import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressBar } from './progress-bar';
import { Goal } from '@prisma/client';
import { ArrowRight, Calendar, Target } from 'lucide-react';

interface GoalCardProps {
  goal: Goal;
}

export function GoalCard({ goal }: GoalCardProps) {
  const isCompleted = goal.deposited >= goal.target;
  const daysRemaining = goal.deadline
    ? Math.ceil(
        (goal.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-semibold text-foreground">{goal.name}</h3>
            {goal.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {goal.description}
              </p>
            )}
          </div>
          {isCompleted && (
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 text-xs font-semibold rounded-full">
              Completed
            </span>
          )}
        </div>

        {/* Progress */}
        <ProgressBar current={goal.deposited} target={goal.target} size="md" />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Target className="w-4 h-4" />
            <span>{goal.target.toFixed(2)} ALGO</span>
          </div>
          {goal.deadline && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                {daysRemaining !== null && daysRemaining >= 0
                  ? `${daysRemaining} days left`
                  : 'Overdue'}
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Link href={`/goals/${goal.id}`}>
          <Button className="w-full" variant="default">
            View Details
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
