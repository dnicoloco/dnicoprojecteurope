"use client";

import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import { MARTA } from "@/lib/metrics";

export default function HomePage() {
  return <StudentDashboard student={MARTA} />;
}
