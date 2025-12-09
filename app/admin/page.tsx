"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Submission {
  id: string;
  status: string;
  businessName: string;
  createdAt: string;
  osmNodes: Array<{ osmId: bigint }>;
}

function getStatusBadgeStyles(status: string) {
  switch (status) {
    case "uploaded":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "duplicate":
      return "bg-red-100 text-red-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function AdminDashboard() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(`/api/admin/submissions?filter=${filter}`);
      if (response.status === 401) {
        setAuthenticated(false);
        router.push("/admin/login");
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
        setAuthenticated(true);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || authenticated === null) {
    return (
      <div className="container py-20">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (authenticated === false) {
    return null;
  }

  const stats = {
    pending: submissions.filter((s) => s.status === "pending").length,
    uploaded: submissions.filter((s) => s.status === "uploaded").length,
    rejected: submissions.filter((s) => s.status === "rejected").length,
  };

  return (
    <div className="container py-12 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-neutral-600">
            Monitor submissions and take action even on the go.
          </p>
        </div>
        <form action={logoutAction} className="w-full md:w-auto flex md:justify-end">
          <Button variant="outline" type="submit" className="w-full md:w-auto">
            Sign Out
          </Button>
        </form>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm text-neutral-dark">Pending</p>
          <p className="text-2xl font-bold">{stats.pending}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-neutral-dark">Uploaded</p>
          <p className="text-2xl font-bold">{stats.uploaded}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-neutral-dark">Rejected</p>
          <p className="text-2xl font-bold">{stats.rejected}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="text-sm font-medium text-neutral-600" htmlFor="submission-filter">
          Filter submissions
        </label>
        <select
          id="submission-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border rounded-md w-full sm:w-60"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="uploaded">Uploaded</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Submissions List */}
      <div className="bg-white border rounded-lg shadow-sm">
        {submissions.length === 0 ? (
          <div className="p-6 text-center text-sm text-neutral-500">
            No submissions found for this filter.
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-neutral-light">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Business Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Created</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="border-t">
                      <td className="px-4 py-3">{submission.businessName}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-sm font-medium ${getStatusBadgeStyles(
                            submission.status
                          )}`}
                        >
                          {submission.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {new Date(submission.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/submissions/${submission.id}`)}
                          >
                            View
                          </Button>
                          {submission.osmNodes.length > 0 && (
                            <a
                              href={`https://www.openstreetmap.org/node/${submission.osmNodes[0].osmId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-sm font-medium"
                            >
                              OSM
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y">
              {submissions.map((submission) => (
                <div key={submission.id} className="p-4 space-y-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col">
                      <p className="text-base font-semibold">{submission.businessName}</p>
                      <span
                        className={`mt-1 w-fit px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeStyles(
                          submission.status
                        )}`}
                      >
                        {submission.status}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500">
                      Created {new Date(submission.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push(`/admin/submissions/${submission.id}`)}
                    >
                      View Details
                    </Button>
                    {submission.osmNodes.length > 0 && (
                      <a
                        href={`https://www.openstreetmap.org/node/${submission.osmNodes[0].osmId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary underline text-center"
                      >
                        View on OSM
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

