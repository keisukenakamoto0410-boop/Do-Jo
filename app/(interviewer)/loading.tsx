import { SkeletonDashboard } from "@/components/ui/Skeleton";

export default function InterviewerLoading() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <SkeletonDashboard />
      </div>
    </div>
  );
}
