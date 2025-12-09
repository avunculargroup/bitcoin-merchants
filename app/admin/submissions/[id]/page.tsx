"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, AlertTriangle } from "lucide-react";

interface DuplicateMatch {
  osmId: number;
  osmType: "node" | "way";
  name?: string;
  category?: string;
  tags: Record<string, string>;
  matchReason: "bitcoin_tagged" | "similar_name";
  coordinates?: { lat: number; lon: number };
  changesetId?: number;
  lastUpdated?: string;
}

interface Submission {
  id: string;
  status: string;
  businessName: string;
  description: string | null;
  category: string | null;
  street: string | null;
  housenumber: string | null;
  suburb: string | null;
  postcode: string | null;
  state: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  facebook: string | null;
  instagram: string | null;
  bitcoinDetails: any;
  openingHours: string | null;
  wheelchair: string | null;
  notes: string | null;
  userEmail: string | null;
  duplicateOsmId: string | null;
  duplicateOsmType: "node" | "way" | null;
  duplicateMatches: DuplicateMatch[] | null;
  createdAt: string;
  osmNodes: Array<{ osmId: string; changesetId: string | null }>;
}

function deriveDefaultDuplicateSelection(
  data: Submission
): { osmId: string; osmType: "node" | "way" } | null {
  if (data.duplicateMatches && data.duplicateMatches.length > 0) {
    const existingMatch = data.duplicateMatches.find(
      (match) =>
        data.duplicateOsmId &&
        match.osmId.toString() === data.duplicateOsmId &&
        match.osmType === data.duplicateOsmType
    );
    const defaultMatch = existingMatch || data.duplicateMatches[0];

    if (defaultMatch) {
      return {
        osmId: defaultMatch.osmId.toString(),
        osmType: defaultMatch.osmType,
      };
    }
  }

  if (data.duplicateOsmId && data.duplicateOsmType) {
    return {
      osmId: data.duplicateOsmId,
      osmType: data.duplicateOsmType,
    };
  }

  return null;
}

function formatMatchCategory(match: DuplicateMatch): string {
  if (match.category) {
    const [key, value] = match.category.split("=");
    return value ? `${value} (${key})` : match.category;
  }
  return match.osmType === "way" ? "Way" : "Node";
}

function formatMatchReason(reason: DuplicateMatch["matchReason"]): string {
  return reason === "bitcoin_tagged"
    ? "Bitcoin payment tags present"
    : "Similar name near submitted location";
}

function formatMatchAddress(match: DuplicateMatch): string | null {
  const street = match.tags?.["addr:street"];
  const housenumber = match.tags?.["addr:housenumber"];
  const suburb = match.tags?.["addr:suburb"] || match.tags?.["addr:city"];

  const parts: string[] = [];
  if (street) {
    parts.push([housenumber, street].filter(Boolean).join(" ").trim());
  }
  if (suburb) {
    parts.push(suburb);
  }

  return parts.length > 0 ? parts.join(", ") : null;
}

function formatLastUpdated(lastUpdated?: string): string {
  if (!lastUpdated) return "Unknown";
  const date = new Date(lastUpdated);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
}

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [duplicateStrategy, setDuplicateStrategy] = useState<"update" | "create">("update");
  const [selectedDuplicate, setSelectedDuplicate] = useState<{ osmId: string; osmType: "node" | "way" } | null>(null);

  const { register, handleSubmit, reset, setValue, watch } = useForm();

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
        // Populate form with submission data
        reset({
          businessName: data.businessName,
          description: data.description || "",
          category: data.category || "",
          housenumber: data.housenumber || "",
          street: data.street || "",
          suburb: data.suburb || "",
          postcode: data.postcode || "",
          state: data.state || "",
          city: data.city || "",
          latitude: data.latitude,
          longitude: data.longitude,
          phone: data.phone || "",
          website: data.website || "",
          email: data.email || "",
          facebook: data.facebook || "",
          instagram: data.instagram || "",
          openingHours: data.openingHours || "",
          wheelchair: data.wheelchair || "",
          notes: data.notes || "",
          bitcoinDetails: data.bitcoinDetails || {},
        });
        const defaultSelection = deriveDefaultDuplicateSelection(data);
        setSelectedDuplicate(defaultSelection);
        setDuplicateStrategy(defaultSelection ? "update" : "create");
      }
    } catch (error) {
      console.error("Error fetching submission:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (data: any) => {
    if (!submission) return;
    const duplicateSelection = duplicateStrategy === "update" ? selectedDuplicate : null;
    if (duplicateStrategy === "update" && !duplicateSelection) {
      alert("Please select which existing OSM feature to update.");
      return;
    }
    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/submissions/${submission.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: {
            ...data,
            // Ensure latitude/longitude are numbers
            latitude: parseFloat(data.latitude),
            longitude: parseFloat(data.longitude),
          },
          strategy: duplicateStrategy,
          duplicateOsmId: duplicateSelection?.osmId ?? null,
          duplicateOsmType: duplicateSelection?.osmType ?? null,
        }),
      });

      if (response.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        const result = await response.json();
        alert(`Error approving submission: ${result.error}`);
      }
    } catch (error) {
      console.error("Error approving:", error);
      alert("An error occurred while approving the submission.");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!submission) return;
    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/submissions/${submission.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (response.ok) {
        setShowRejectDialog(false);
        router.push("/admin");
        router.refresh();
      } else {
        const result = await response.json();
        alert(`Error rejecting submission: ${result.error}`);
      }
    } catch (error) {
      console.error("Error rejecting:", error);
      alert("An error occurred while rejecting the submission.");
    } finally {
      setProcessing(false);
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

  const isPending = submission.status === "pending";
  const duplicateMatches = submission.duplicateMatches || [];
  const hasDuplicateMatches = duplicateMatches.length > 0;
  const selectedDuplicateKey = selectedDuplicate
    ? `${selectedDuplicate.osmType}-${selectedDuplicate.osmId}`
    : null;
  const fallbackDuplicateLink =
    submission.duplicateOsmId && submission.duplicateOsmType
      ? {
          osmId: submission.duplicateOsmId,
          osmType: submission.duplicateOsmType,
        }
      : null;
  const duplicateLinkTarget = selectedDuplicate || fallbackDuplicateLink;

  return (
    <div className="container py-12 px-4 sm:px-6 max-w-4xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
          Back to Dashboard
        </Button>
        {isPending && (
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="destructive"
              onClick={() => setShowRejectDialog(true)}
              disabled={processing}
              className="w-full sm:w-auto"
            >
              Reject
            </Button>
            <Button
              onClick={handleSubmit(handleApprove)}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Approve & Publish to OSM
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between mb-8">
        <h1 className="text-3xl font-bold text-center sm:text-left w-full">Review Submission</h1>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            submission.status === "pending"
              ? "bg-yellow-100 text-yellow-800"
              : submission.status === "uploaded"
              ? "bg-green-100 text-green-800"
              : submission.status === "rejected"
              ? "bg-red-100 text-red-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {submission.status.toUpperCase()}
        </span>
      </div>

      {/* Duplicate Warning */}
      {isPending && (hasDuplicateMatches || submission.duplicateOsmId) && (
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="w-full">
              <h3 className="font-semibold text-amber-900">Potential Duplicates Found</h3>
              {hasDuplicateMatches ? (
                <>
                  <p className="text-sm text-amber-800">
                    We found multiple OpenStreetMap features within 25m of this submission. Select
                    the correct feature to update or choose to create a new one.
                  </p>
                  <div className="mt-4 space-y-3">
                    {duplicateMatches.map((match) => {
                      const optionKey = `${match.osmType}-${match.osmId}`;
                      const isSelected = selectedDuplicateKey === optionKey;
                      const address = formatMatchAddress(match);
                      const link = `https://www.openstreetmap.org/${match.osmType}/${match.osmId}`;
                      return (
                        <label
                          key={optionKey}
                          className={`flex items-start gap-3 rounded-lg border p-3 transition ${
                            isSelected
                              ? "border-amber-500 bg-white shadow-sm"
                              : "border-amber-200 bg-amber-100/40"
                          }`}
                        >
                          <input
                            type="radio"
                            name="duplicate-match"
                            className="accent-amber-600 mt-1"
                            disabled={!isPending}
                            checked={isSelected}
                            onChange={() =>
                              setSelectedDuplicate({
                                osmId: match.osmId.toString(),
                                osmType: match.osmType,
                              })
                            }
                          />
                          <div className="w-full">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-semibold text-amber-900">
                                {match.name || "Unnamed location"}
                              </p>
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-amber-900 underline"
                              >
                                View on OSM
                              </a>
                            </div>
                            <p className="text-sm text-amber-900">
                              {formatMatchCategory(match)}
                            </p>
                            {address && (
                              <p className="text-xs text-amber-800">{address}</p>
                            )}
                            <p className="text-xs text-amber-700">
                              {formatMatchReason(match.matchReason)} · Last updated{" "}
                              {formatLastUpdated(match.lastUpdated)}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-sm text-amber-800 mb-3">
                  This submission matches an existing OpenStreetMap {duplicateLinkTarget?.osmType}:
                  {duplicateLinkTarget && (
                    <a
                      href={`https://www.openstreetmap.org/${duplicateLinkTarget.osmType}/${duplicateLinkTarget.osmId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium underline ml-1"
                    >
                      {duplicateLinkTarget.osmId}
                    </a>
                  )}
                </p>
              )}

              <div className="space-y-2 mt-4">
                <p className="text-sm font-medium text-amber-900">Action Strategy:</p>
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="strategy"
                      checked={duplicateStrategy === "update"}
                      onChange={() => setDuplicateStrategy("update")}
                      className="accent-amber-600"
                    />
                    <span className="text-sm text-amber-900">Update Selected Duplicate</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="strategy"
                      checked={duplicateStrategy === "create"}
                      onChange={() => setDuplicateStrategy("create")}
                      className="accent-amber-600"
                    />
                    <span className="text-sm text-amber-900">Create New Node (Ignore Duplicate)</span>
                  </label>
                </div>
                {duplicateStrategy === "update" && !selectedDuplicate && (
                  <p className="text-xs text-red-700">
                    Select a duplicate before publishing or choose to create a new node.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <form className="space-y-8">
        {/* Submission Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Basic Info</h2>
            <div>
              <Label>Business Name</Label>
              <Input {...register("businessName")} disabled={!isPending} />
            </div>
            <div>
              <Label>Category (OSM tag)</Label>
              <Input {...register("category")} disabled={!isPending} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea {...register("description")} disabled={!isPending} />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Address</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <Label>House Number</Label>
                <Input {...register("housenumber")} disabled={!isPending} />
              </div>
              <div>
                <Label>Street</Label>
                <Input {...register("street")} disabled={!isPending} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <Label>Suburb</Label>
                <Input {...register("suburb")} disabled={!isPending} />
              </div>
              <div>
                <Label>Postcode</Label>
                <Input {...register("postcode")} disabled={!isPending} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <Label>City</Label>
                <Input {...register("city")} disabled={!isPending} />
              </div>
              <div>
                <Label>State</Label>
                <Input {...register("state")} disabled={!isPending} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <Label>Latitude</Label>
                <Input {...register("latitude")} disabled={!isPending} />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input {...register("longitude")} disabled={!isPending} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Contact</h2>
            <div>
              <Label>Phone</Label>
              <Input {...register("phone")} disabled={!isPending} />
            </div>
            <div>
              <Label>Website</Label>
              <Input {...register("website")} disabled={!isPending} />
            </div>
            <div>
              <Label>Email (Public)</Label>
              <Input {...register("email")} disabled={!isPending} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <Label>Facebook</Label>
                <Input {...register("facebook")} disabled={!isPending} />
              </div>
              <div>
                <Label>Instagram</Label>
                <Input {...register("instagram")} disabled={!isPending} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Details</h2>
            <div>
              <Label>Opening Hours</Label>
              <Input {...register("openingHours")} disabled={!isPending} />
            </div>
            <div>
              <Label>Wheelchair Access</Label>
              <Input {...register("wheelchair")} disabled={!isPending} />
            </div>
            <div>
              <Label>Internal Notes</Label>
              <Textarea {...register("notes")} disabled={!isPending} />
            </div>
          </div>
        </div>

        {/* Bitcoin Details */}
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Bitcoin Acceptance</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                checked={watch("bitcoinDetails.onChain")}
                onCheckedChange={(c) => setValue("bitcoinDetails.onChain", c)}
                disabled={!isPending}
              />
              <Label>On-Chain</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                checked={watch("bitcoinDetails.lightning")}
                onCheckedChange={(c) => setValue("bitcoinDetails.lightning", c)}
                disabled={!isPending}
              />
              <Label>Lightning</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                checked={watch("bitcoinDetails.lightningContactless")}
                onCheckedChange={(c) => setValue("bitcoinDetails.lightningContactless", c)}
                disabled={!isPending}
              />
              <Label>NFC / Contactless</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                checked={watch("bitcoinDetails.inStore")}
                onCheckedChange={(c) => setValue("bitcoinDetails.inStore", c)}
                disabled={!isPending}
              />
              <Label>In-Store</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                checked={watch("bitcoinDetails.online")}
                onCheckedChange={(c) => setValue("bitcoinDetails.online", c)}
                disabled={!isPending}
              />
              <Label>Online</Label>
            </div>
          </div>
        </div>

        {/* OSM Links (if uploaded) */}
        {submission.osmNodes && submission.osmNodes.length > 0 && (
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Published OSM Nodes</h2>
            <div className="space-y-2">
              {submission.osmNodes.map((node, i) => (
                <div key={i}>
                  <a 
                    href={`https://www.openstreetmap.org/node/${node.osmId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View Node {node.osmId}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Reject Submission</h2>
            <p className="text-neutral-dark mb-4">
              Are you sure you want to reject this submission? This action cannot be undone.
            </p>
            <div className="mb-4">
              <Label htmlFor="rejectReason">Reason for rejection (sent to user)</Label>
              <Textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., Duplicate submission, Invalid business location..."
                rows={3}
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReject} disabled={processing}>
                {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
