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
    <div className="container py-20">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        <form action={logoutAction}>
          <Button variant="outline" type="submit">
            Sign Out
          </Button>
        </form>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
      <div className="mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="uploaded">Uploaded</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Submissions List */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-light">
            <tr>
              <th className="px-4 py-3 text-left">Business Name</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Created</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr key={submission.id} className="border-t">
                <td className="px-4 py-3">{submission.businessName}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      submission.status === "uploaded"
                        ? "bg-green-100 text-green-800"
                        : submission.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : submission.status === "duplicate"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {submission.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {new Date(submission.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
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
                      className="ml-2 text-primary hover:underline text-sm"
                    >
                      OSM
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

