"use client";

import { motion } from "framer-motion";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "📭",
  title,
  description,
  action,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-slate-200 bg-white p-12 text-center"
    >
      <div className="mb-4 text-6xl">{icon}</div>
      <h3 className="text-2xl font-semibold text-slate-950">{title}</h3>
      {description && <p className="mt-2 text-slate-600">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition hover:bg-blue-700"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
};

export const ProfileEmptyState: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => (
  <EmptyState
    icon="👤"
    title="Complete your profile"
    description="Help us match you with the right teammates. Add your skills, goals, and experience level."
    action={{
      label: "Complete Profile",
      onClick: onComplete || (() => {}),
    }}
  />
);

export const NoMatchesEmptyState: React.FC<{ onExplore?: () => void }> = ({ onExplore }) => (
  <EmptyState
    icon="🔍"
    title="No matches yet"
    description="Keep exploring profiles to find your perfect teammate. When someone you like also likes you, it's a match!"
    action={{
      label: "Explore Now",
      onClick: onExplore || (() => {}),
    }}
  />
);

export const NoConnectionsEmptyState: React.FC = () => (
  <EmptyState
    icon="💫"
    title="No connections yet"
    description="Start by sending connection requests to people you'd like to work with!"
  />
);

export const NoNotificationsEmptyState: React.FC = () => (
  <EmptyState icon="🔔" title="No notifications" description="You're all caught up!" />
);
