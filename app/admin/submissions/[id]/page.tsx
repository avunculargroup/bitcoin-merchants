"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Submission {
  id: string;
  status: string;
  businessName: string;
  description: string | null;
  category: string | null;
  street: string | null;
  suburb: string | null;
  postcode: string | null;
  state: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  bitcoinDetails: any;
  openingHours: string | null;
  wheelchair: string | null;
  notes: string | null;
  createdAt: string;
  osmNodes: Array<{ osmId: string; changesetId: string | null }>;
}

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchSubmission();
    }
  }, [params.id]);

  const fetchSubmission = async () => {
    try {
      const response = await fetch(`/api/admin/submissions/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setSubmission(data);
      }
    } catch (error) {
      console.error("Error fetching submission:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-20">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="container py-20">
        <p>Submission not found</p>
      </div>
    );
  }

  return (
    <div className="container py-20">
      <div className="mb-8">
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      <h1 className="text-4xl font-bold mb-8">{submission.businessName}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Business Information</h2>
          <div className="space-y-2">
            <p><strong>Status:</strong> {submission.status}</p>
            <p><strong>Category:</strong> {submission.category || "N/A"}</p>
            <p><strong>Description:</strong> {submission.description || "N/A"}</p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Address</h2>
          <div className="space-y-2">
            <p>{submission.street || ""}</p>
            <p>{submission.suburb || ""} {submission.postcode || ""}</p>
            <p>{submission.state || ""}</p>
            {submission.latitude && submission.longitude && (
              <p>
                <strong>Coordinates:</strong> {submission.latitude}, {submission.longitude}
              </p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Contact</h2>
          <div className="space-y-2">
            <p><strong>Phone:</strong> {submission.phone || "N/A"}</p>
            <p><strong>Website:</strong> {submission.website || "N/A"}</p>
            <p><strong>Email:</strong> {submission.email || "N/A"}</p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Bitcoin Details</h2>
          <div className="space-y-2">
            {submission.bitcoinDetails && (
              <>
                <p><strong>On-chain:</strong> {submission.bitcoinDetails.onChain ? "Yes" : "No"}</p>
                <p><strong>Lightning:</strong> {submission.bitcoinDetails.lightning ? "Yes" : "No"}</p>
                <p><strong>In-store:</strong> {submission.bitcoinDetails.inStore ? "Yes" : "No"}</p>
                <p><strong>Online:</strong> {submission.bitcoinDetails.online ? "Yes" : "No"}</p>
              </>
            )}
          </div>
        </div>
      </div>

      {submission.osmNodes.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">OpenStreetMap</h2>
          {submission.osmNodes.map((node, index) => (
            <div key={index} className="mb-2">
              <a
                href={`https://www.openstreetmap.org/node/${node.osmId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                View on OpenStreetMap (Node {node.osmId})
              </a>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <p className="text-sm text-neutral-dark">
          <strong>Created:</strong> {new Date(submission.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

