"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  apiGetComments,
  apiCreateComment,
  apiDeleteComment,
} from "@/lib/api/social";
import { useTranslation } from "@/lib/i18n";
import { CommentItem } from "@/lib/api/social";

interface CommentSectionProps {
  targetType: "Resource" | "Post";
  targetId: string;
}

export default function CommentSection({
  targetType,
  targetId,
}: CommentSectionProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const data = await apiGetComments(targetType, targetId);
      setComments(data || data);
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, [targetType, targetId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const comment = await apiCreateComment(
        targetType,
        targetId,
        newComment.trim(),
      );
      setComments((prev) => [comment, ...prev]);
      setNewComment("");
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await apiDeleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch {}
  };

  return (
    <div className="mt-8 pt-6 border-t border-[var(--color-border-light)]">
      <h3 className="text-base font-semibold text-[var(--color-text)] mb-4">
        {t("comments.title")}{" "}
        {!isLoading && (
          <span className="text-[var(--color-text-muted)] font-normal text-sm">
            ({comments.length})
          </span>
        )}
      </h3>

      {user ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            id="new-comment"
            name="comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t("comments.placeholder")}
            rows={3}
            className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3.5 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/30 focus:border-[var(--color-brand)] resize-none"
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="px-4 py-1.5 bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40"
            >
              {isSubmitting ? t("comments.posting") : t("comments.postComment")}
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-[var(--color-text-muted)] mb-5">
          <a href="/login" className="text-[var(--color-brand)]">
            {t("comments.login")}
          </a>{" "}
          {t("comments.toLeaveComment")}
        </p>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg border border-[var(--color-border)] bg-white p-4"
            >
              <div className="h-3 bg-[var(--color-bg-hover)] rounded w-1/4 mb-2" />
              <div className="h-3 bg-[var(--color-bg-hover)] rounded w-full" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">
          {t("comments.noComments")}
        </p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment._id}
              className="rounded-lg border border-[var(--color-border)] bg-white p-4"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 rounded-full bg-[var(--color-bg-hover)] flex items-center justify-center text-xs text-[var(--color-text-secondary)] font-semibold">
                    {comment.author?.username?.toUpperCase() || "?"}
                  </div>
                  <span className="font-medium text-[var(--color-text)]">
                    {comment.author?.username || t("common.unknown")}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {new Date(comment.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {user &&
                  comment.author &&
                  (user as any)._id === comment.author._id && (
                    <button
                      onClick={() => handleDelete(comment._id)}
                      className="text-xs text-[var(--color-text-muted)] hover:text-red-500 transition-colors"
                    >
                      {t("comments.delete")}
                    </button>
                  )}
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
