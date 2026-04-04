import { CampaignForm } from '@/components/goal-form';

export default function CreateGoalPage() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-2xl mx-auto">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Launch a New Campaign</h1>
            <p className="text-muted-foreground">
              Share your project with the campus and start raising funds in ALGO
            </p>
          </div>

          <CampaignForm />
        </div>
      </div>
    </div>
  );
}
