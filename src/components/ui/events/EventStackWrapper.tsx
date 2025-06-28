

import { lazy, Suspense, memo } from "react";

const EventStack_Final = lazy(() => import("@/components/ui/events/EventStack_1"));

const EventStackSkeleton = memo(() => (
  <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
));

export const EventStackWrapper = memo(() => (
  <Suspense fallback={<EventStackSkeleton />}>
    <EventStack_Final />
  </Suspense>
));
