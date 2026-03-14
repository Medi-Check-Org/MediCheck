import React from "react"
import type { BatchStatus } from "@/lib/generated/prisma/client"
import { XCircle, CheckCircle, Clock } from "lucide-react"

export const getStatusColor = (status: BatchStatus) => {
  // use enum value instead of hardcoding
  switch (status) {
    case "DELIVERED":
      return "default";
    case "CREATED":
      return "secondary";
    case "IN_TRANSIT":
      return "outline";
    case "FLAGGED":
      return "destructive";
    case "EXPIRED":
      return "destructive";
    case "RECALLED":
      return "destructive";
    default:
      return "secondary";
  }
};

export const getStatusIcon = (status: BatchStatus): React.ReactNode => {
  // use enum value instead of hardcoding
  switch (status) {
    case "DELIVERED":
      return React.createElement(CheckCircle, { className: "h-4 w-4" });
    case "CREATED":
    case "IN_TRANSIT":
      return React.createElement(Clock, { className: "h-4 w-4" });
    case "EXPIRED":
    case "FLAGGED":
    case "RECALLED":
      return React.createElement(XCircle, { className: "h-4 w-4" });
    default:
      return React.createElement(Clock, { className: "h-4 w-4" });
  }
};


export const getStatusDisplay = (status: BatchStatus) => {
  // use enum value instead of hardcoding
  switch (status) {
    case "DELIVERED":
      return "Delivered";
    case "CREATED":
      return "Created";
    case "IN_TRANSIT":
      return "In Transit";
    case "FLAGGED":
      return "Flagged";
    case "EXPIRED":
      return "Expired";
    case "RECALLED":
      return "Recalled";
    default:
      return status;
  }
};