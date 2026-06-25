"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Chip } from "./ui/chip";
import { Button } from "./ui/button";
import { Modal } from "./ui/modal";
import { Input } from "./ui/input";
import { Shield, Flag, Clock } from "lucide-react";

interface ReputationDisplayProps {
  score: number;
  badges?: { badge_name: string; badge_tier: number }[];
  hackathonReady?: boolean;
  hackathonTags?: string[];
}

/**
 * Reputation badge with icon and description
 */
export const BadgeDisplay: React.FC<{
  name: string;
  tier: number;
  size?: "sm" | "md" | "lg";
}> = ({ name, tier, size = "md" }) => {
  const badgeConfig: Record<
    string,
    { icon: string; color: string; description: string }
  > = {
    "Reliable Builder": {
      icon: "🏗️",
      color: "bg-blue-100 text-blue-700",
      description: "Reputation ≥ 50",
    },
    "Top Collaborator": {
      icon: "🌟",
      color: "bg-purple-100 text-purple-700",
      description: "5+ completed projects",
    },
    "Hackathon Veteran": {
      icon: "🚀",
      color: "bg-orange-100 text-orange-700",
      description: "3+ hackathons completed",
    },
  };

  const config = badgeConfig[name] || {
    icon: "⭐",
    color: "bg-slate-100 text-slate-700",
    description: name,
  };

  const sizeClass = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  }[size];

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`${config.color} rounded-full ${sizeClass} font-semibold inline-flex items-center gap-2`}
    >
      <span>{config.icon}</span>
      <span>{name}</span>
    </motion.div>
  );
};

/**
 * Reputation score card
 */
export const ReputationCard: React.FC<ReputationDisplayProps> = ({
  score,
  badges,
  hackathonReady,
  hackathonTags,
}) => {
  const highestBadge =
    badges && badges.length > 0
      ? badges.sort((a, b) => b.badge_tier - a.badge_tier)[0]
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-xl p-6 border border-blue-100"
    >
      {/* Score */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase">
            Reputation Score
          </p>
          <p className="text-4xl font-bold text-slate-900">{score}</p>
        </div>
        <div className="text-5xl">🏆</div>
      </div>

      {/* Highest Badge */}
      {highestBadge && (
        <div className="mb-4">
          <BadgeDisplay
            name={highestBadge.badge_name}
            tier={highestBadge.badge_tier}
            size="md"
          />
        </div>
      )}

      {/* Hackathon Ready Badge */}
      {hackathonReady && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold"
        >
          <Clock size={16} />
          <span>Hackathon Ready</span>
        </motion.div>
      )}

      {/* Tags */}
      {hackathonTags && hackathonTags.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-600">Tags</p>
          <div className="flex flex-wrap gap-2">
            {hackathonTags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                variant="default"
                className="text-xs"
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

/**
 * Block user button & management
 */
interface BlockButtonProps {
  userId: string;
  userName: string;
  isBlocked?: boolean;
  onBlock?: (blocked: boolean) => Promise<void>;
  size?: "sm" | "md" | "lg";
}

export const BlockButton: React.FC<BlockButtonProps> = ({
  userId,
  userName,
  isBlocked = false,
  onBlock,
  size = "md",
}) => {
  const [blocked, setBlocked] = useState(isBlocked);
  const [loading, setLoading] = useState(false);

  const handleToggleBlock = async () => {
    setLoading(true);
    try {
      await onBlock?.(!blocked);
      setBlocked(!blocked);
    } catch (error) {
      console.error("Error toggling block:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={blocked ? "danger" : "outline"}
      size={size}
      isLoading={loading}
      onClick={handleToggleBlock}
      className="gap-2"
    >
      <Shield size={16} />
      {blocked ? "Unblock" : "Block"}
    </Button>
  );
};

/**
 * Report user modal
 */
interface ReportModalProps {
  isOpen: boolean;
  reportedUserId: string;
  reportedUserName: string;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => Promise<void>;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  reportedUserId,
  reportedUserName,
  onClose,
  onSubmit,
}) => {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");

    if (!reason.trim()) {
      setError("Please select a reason");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(reason, details);
      setReason("");
      setDetails("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  const reportReasons = [
    "Inappropriate behavior",
    "Spam or scam",
    "Offensive content",
    "No-show or flaky",
    "Other",
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Report ${reportedUserName}`}
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Help us keep FindTeamo safe. Please describe the issue:
        </p>

        {/* Reason */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            Reason
          </label>
          <div className="space-y-2">
            {reportReasons.map((r) => (
              <label key={r} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="reason"
                  value={r}
                  checked={reason === r}
                  onChange={(e) => setReason(e.currentTarget.value)}
                  className="rounded"
                />
                <span className="text-sm text-slate-700">{r}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Details */}
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            Details (Optional)
          </label>
          <textarea
            placeholder="Provide any additional context..."
            value={details}
            onChange={(e) => setDetails(e.currentTarget.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 text-sm resize-none h-20"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={handleSubmit}
            isLoading={loading}
          >
            <Flag size={16} className="mr-1" />
            Submit Report
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ReputationCard;
