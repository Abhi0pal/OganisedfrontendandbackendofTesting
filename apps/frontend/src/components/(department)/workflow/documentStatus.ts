import { DocumentStatus } from "./types";

export const documentStatusOptions: { label: string; value: DocumentStatus }[] = [
  { label: "Unverified (U)", value: "U" },
  { label: "Verified (V)", value: "V" },
  { label: "Rejected (R)", value: "R" },
  { label: "Manual (M)", value: "M" },
];

export const documentStatusLabelMap: Record<DocumentStatus, string> = {
  U: "Unverified",
  V: "Verified",
  R: "Rejected",
  M: "Manual",
};

export const getDocumentStatusLabel = (status?: string): string | undefined => {
  if (!status) return undefined;
  const code = status.toUpperCase() as DocumentStatus;
  return documentStatusLabelMap[code];
};

export const formatDocumentStatusWithCode = (status?: string): string => {
  const code = status?.toUpperCase() || "";
  const friendly = getDocumentStatusLabel(code);
  return friendly ? `${friendly} (${code})` : code || "Unknown";
};
