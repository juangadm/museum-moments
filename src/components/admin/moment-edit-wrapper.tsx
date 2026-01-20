"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "./admin-auth-provider";
import { EditPanel } from "./edit-panel";
import type { Moment } from "@/lib/moments";

type MomentEditWrapperProps = {
  moment: Moment;
  children: React.ReactNode;
};

export function MomentEditWrapper({ moment, children }: MomentEditWrapperProps) {
  const { isAdmin, adminPassword, isLoading } = useAdminAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentMoment, setCurrentMoment] = useState(moment);
  const router = useRouter();

  const handleSave = (updatedMoment: Moment) => {
    setCurrentMoment(updatedMoment);
    // Refresh the page to get updated server-rendered content
    router.refresh();
  };

  const handleOpenEdit = () => {
    setIsEditOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
  };

  return (
    <>
      {/* Edit button - only show for authenticated admins */}
      {!isLoading && isAdmin && (
        <div className="fixed top-20 right-4 z-40">
          <button
            onClick={handleOpenEdit}
            className="px-3 py-2 font-display text-[11px] uppercase bg-white border border-border hover:border-foreground transition-colors shadow-sm"
            aria-label="Edit this moment"
          >
            Edit
          </button>
        </div>
      )}

      {/* Main content */}
      {children}

      {/* Edit panel */}
      {isAdmin && adminPassword && (
        <EditPanel
          moment={currentMoment}
          adminPassword={adminPassword}
          isOpen={isEditOpen}
          onClose={handleCloseEdit}
          onSave={handleSave}
        />
      )}
    </>
  );
}
