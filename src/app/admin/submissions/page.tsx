"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Submission = {
  id: string;
  imageUrl: string;
  sourceUrl: string;
  creatorName: string;
  creatorUrl: string | null;
  title: string | null;
  description: string | null;
  submitterNote: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
};

export default function AdminSubmissionsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Review state
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewCategory, setReviewCategory] = useState("");
  const [reviewDescription, setReviewDescription] = useState("");
  const [reviewTags, setReviewTags] = useState("");
  const [reviewYear, setReviewYear] = useState("");
  const [reviewYearApproximate, setReviewYearApproximate] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // Confirm dialog state
  const [confirmRejectId, setConfirmRejectId] = useState<string | null>(null);

  // Check localStorage for saved password on mount
  useEffect(() => {
    const savedPassword = localStorage.getItem("admin-password");
    if (savedPassword) {
      setPassword(savedPassword);
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch submissions when authenticated
  useEffect(() => {
    if (isAuthenticated && password) {
      fetchSubmissions();
    }
  }, [isAuthenticated, password]);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/submissions?status=PENDING", {
        headers: {
          "x-admin-password": password,
        },
      });

      if (response.status === 401) {
        setIsAuthenticated(false);
        localStorage.removeItem("admin-password");
        return;
      }

      const data = await response.json();
      setSubmissions(data.submissions || []);
      setPendingCount(data.pendingCount || 0);
    } catch (err) {
      setError("Failed to load submissions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    try {
      const response = await fetch("/api/submissions", {
        headers: {
          "x-admin-password": password,
        },
      });

      if (response.status === 401) {
        setAuthError("Incorrect password");
        return;
      }

      localStorage.setItem("admin-password", password);
      setIsAuthenticated(true);
    } catch {
      localStorage.setItem("admin-password", password);
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin-password");
    setIsAuthenticated(false);
    setPassword("");
  };

  const startReview = (submission: Submission) => {
    setReviewingId(submission.id);
    setReviewTitle(submission.title || "");
    setReviewDescription(submission.description || "");
    setReviewCategory("");
    setReviewTags("");
    setReviewYear("");
    setReviewYearApproximate(false);
    setReviewError("");
  };

  const cancelReview = () => {
    setReviewingId(null);
    setReviewTitle("");
    setReviewCategory("");
    setReviewDescription("");
    setReviewTags("");
    setReviewYear("");
    setReviewYearApproximate(false);
    setReviewError("");
  };

  const handleApprove = async () => {
    if (!reviewingId) return;

    if (!reviewTitle.trim()) {
      setReviewError("Title is required");
      return;
    }
    if (!reviewCategory) {
      setReviewError("Category is required");
      return;
    }
    if (!reviewDescription.trim()) {
      setReviewError("Description is required");
      return;
    }

    setIsApproving(true);
    setReviewError("");

    try {
      const response = await fetch(`/api/submissions/${reviewingId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify({
          title: reviewTitle.trim(),
          category: reviewCategory,
          description: reviewDescription.trim(),
          tags: reviewTags.trim(),
          year: reviewYear ? parseInt(reviewYear, 10) : null,
          yearApproximate: reviewYearApproximate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setReviewError(data.error || "Failed to approve");
        return;
      }

      // Refresh list
      await fetchSubmissions();
      cancelReview();
    } catch (err) {
      setReviewError("Failed to approve submission");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (id: string) => {
    setIsRejecting(true);

    try {
      const response = await fetch(`/api/submissions/${id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Failed to reject");
        return;
      }

      // Refresh list
      await fetchSubmissions();
      setConfirmRejectId(null);
    } catch (err) {
      alert("Failed to reject submission");
    } finally {
      setIsRejecting(false);
    }
  };

  // Password gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="font-logo text-2xl uppercase tracking-tight">Museum Moments</h1>
            <p className="font-display text-[11px] text-foreground-muted mt-2">ADMIN / SUBMISSIONS</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 font-body text-[13px] border border-border rounded-sm focus:outline-none focus:border-foreground"
                autoFocus
              />
            </div>
            {authError && (
              <p className="font-body text-[12px] text-red-600">{authError}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 font-display text-[12px] uppercase bg-foreground text-background hover:bg-foreground/90 transition-colors"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  const reviewingSubmission = submissions.find((s) => s.id === reviewingId);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="border-b border-border bg-white px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-logo text-xl uppercase tracking-tight">
              Museum Moments
            </Link>
            <span className="font-display text-[11px] text-foreground-muted">/ ADMIN /</span>
            <Link href="/admin" className="font-display text-[11px] text-foreground-muted hover:text-foreground">
              ADD
            </Link>
            <span className="font-display text-[11px] text-foreground-muted">/</span>
            <span className="font-display text-[11px] font-medium">SUBMISSIONS</span>
          </div>
          <button
            onClick={handleLogout}
            className="font-display text-[11px] text-foreground-muted hover:text-foreground"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-[12px] font-semibold">
            PENDING SUBMISSIONS ({pendingCount})
          </h2>
          <button
            onClick={fetchSubmissions}
            className="font-display text-[11px] text-foreground-muted hover:text-foreground"
          >
            Refresh
          </button>
        </div>

        {isLoading && (
          <p className="font-body text-[13px] text-foreground-muted">Loading...</p>
        )}

        {error && (
          <p className="font-body text-[13px] text-red-600">{error}</p>
        )}

        {!isLoading && submissions.length === 0 && (
          <p className="font-body text-[13px] text-foreground-muted">
            No pending submissions.
          </p>
        )}

        {/* Submissions List */}
        <div className="space-y-4">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="bg-white border border-border p-4 flex gap-4"
            >
              {/* Thumbnail */}
              <div className="relative w-24 h-32 flex-shrink-0 border border-border overflow-hidden">
                <Image
                  src={submission.imageUrl}
                  alt="Submission"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="font-body text-[13px]">
                  <a
                    href={submission.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground hover:underline"
                  >
                    {submission.sourceUrl.length > 50
                      ? submission.sourceUrl.substring(0, 50) + "..."
                      : submission.sourceUrl}
                  </a>
                </div>
                <div className="font-body text-[12px] text-foreground-muted mt-1">
                  Creator: {submission.creatorName}
                </div>
                <div className="font-body text-[11px] text-foreground-muted mt-1">
                  {new Date(submission.createdAt).toLocaleDateString()}
                </div>
                {submission.submitterNote && (
                  <div className="font-body text-[11px] text-foreground-muted mt-2 italic">
                    &quot;{submission.submitterNote}&quot;
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => startReview(submission)}
                  className="px-3 py-2 font-display text-[11px] uppercase border border-border hover:border-foreground transition-colors"
                >
                  Review
                </button>
                <button
                  onClick={() => setConfirmRejectId(submission.id)}
                  className="px-3 py-2 font-display text-[11px] uppercase text-red-600 border border-red-200 hover:border-red-600 transition-colors"
                >
                  Quick Reject
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Review Panel */}
        {reviewingSubmission && (
          <div className="fixed inset-0 bg-black/20 z-40" onClick={cancelReview}>
            <div
              className="fixed right-0 top-0 h-full w-full max-w-xl bg-white border-l border-border z-50 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between">
                <h3 className="font-display text-[12px] font-semibold uppercase">
                  Review Submission
                </h3>
                <button
                  onClick={cancelReview}
                  className="font-display text-[11px] text-foreground-muted hover:text-foreground"
                >
                  Close
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Large Image Preview */}
                <div className="relative aspect-[3/4] max-w-full border border-border overflow-hidden">
                  <Image
                    src={reviewingSubmission.imageUrl}
                    alt="Submission"
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Submitted Info */}
                <div className="bg-gray-50 p-4 border border-border">
                  <h4 className="font-display text-[11px] text-foreground-muted mb-2">
                    SUBMITTED INFO
                  </h4>
                  <dl className="space-y-1 font-body text-[12px]">
                    <div>
                      <dt className="inline text-foreground-muted">Source: </dt>
                      <dd className="inline">
                        <a
                          href={reviewingSubmission.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {reviewingSubmission.sourceUrl}
                        </a>
                      </dd>
                    </div>
                    <div>
                      <dt className="inline text-foreground-muted">Creator: </dt>
                      <dd className="inline">{reviewingSubmission.creatorName}</dd>
                    </div>
                    {reviewingSubmission.title && (
                      <div>
                        <dt className="inline text-foreground-muted">Suggested Title: </dt>
                        <dd className="inline">{reviewingSubmission.title}</dd>
                      </div>
                    )}
                    {reviewingSubmission.submitterNote && (
                      <div className="mt-2 italic text-foreground-muted">
                        &quot;{reviewingSubmission.submitterNote}&quot;
                      </div>
                    )}
                  </dl>
                </div>

                {/* Editorial Form */}
                <div className="space-y-4">
                  <h4 className="font-display text-[11px] text-foreground-muted">
                    YOUR EDITORIAL
                  </h4>

                  <div>
                    <label htmlFor="review-title" className="block font-display text-[11px] text-foreground-muted mb-2">
                      Title *
                    </label>
                    <input
                      id="review-title"
                      type="text"
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      className="w-full px-4 py-3 font-body text-[13px] border border-border rounded-sm focus:outline-none focus:border-foreground bg-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="review-year" className="block font-display text-[11px] text-foreground-muted mb-2">
                      Year Created
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        id="review-year"
                        type="number"
                        value={reviewYear}
                        onChange={(e) => setReviewYear(e.target.value)}
                        className="w-32 px-4 py-3 font-body text-[13px] border border-border rounded-sm focus:outline-none focus:border-foreground bg-white"
                        placeholder="2024"
                        min="1000"
                        max={new Date().getFullYear() + 1}
                      />
                      <label className="flex items-center gap-2 font-body text-[13px] text-foreground-muted cursor-pointer">
                        <input
                          type="checkbox"
                          checked={reviewYearApproximate}
                          onChange={(e) => setReviewYearApproximate(e.target.checked)}
                          className="rounded-sm"
                        />
                        Approximate (decade)
                      </label>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="review-category" className="block font-display text-[11px] text-foreground-muted mb-2">
                      Category *
                    </label>
                    <select
                      id="review-category"
                      value={reviewCategory}
                      onChange={(e) => setReviewCategory(e.target.value)}
                      className="w-full px-4 py-3 font-body text-[13px] border border-border rounded-sm focus:outline-none focus:border-foreground bg-white"
                    >
                      <option value="">Select category...</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="review-description" className="block font-display text-[11px] text-foreground-muted mb-2">
                      Description * (your editorial voice)
                    </label>
                    <textarea
                      id="review-description"
                      value={reviewDescription}
                      onChange={(e) => setReviewDescription(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 font-body text-[13px] border border-border rounded-sm focus:outline-none focus:border-foreground bg-white resize-y"
                    />
                  </div>

                  <div>
                    <label htmlFor="review-tags" className="block font-display text-[11px] text-foreground-muted mb-2">
                      Tags (comma-separated)
                    </label>
                    <input
                      id="review-tags"
                      type="text"
                      value={reviewTags}
                      onChange={(e) => setReviewTags(e.target.value)}
                      className="w-full px-4 py-3 font-body text-[13px] border border-border rounded-sm focus:outline-none focus:border-foreground bg-white"
                      placeholder="web, ui, product"
                    />
                  </div>

                  {reviewError && (
                    <p className="font-body text-[13px] text-red-600">{reviewError}</p>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleApprove}
                      disabled={isApproving}
                      className="flex-1 py-3 font-display text-[12px] uppercase bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
                    >
                      {isApproving ? "Approving..." : "Approve & Publish"}
                    </button>
                    <button
                      onClick={() => setConfirmRejectId(reviewingSubmission.id)}
                      disabled={isRejecting}
                      className="px-6 py-3 font-display text-[12px] uppercase text-red-600 border border-red-200 hover:border-red-600 transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Reject Dialog */}
        <ConfirmDialog
          isOpen={confirmRejectId !== null}
          title="Reject Submission"
          message="Delete this submission? This cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="danger"
          isLoading={isRejecting}
          onConfirm={() => confirmRejectId && handleReject(confirmRejectId)}
          onCancel={() => setConfirmRejectId(null)}
        />
      </main>
    </div>
  );
}
