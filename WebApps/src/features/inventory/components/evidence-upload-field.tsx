"use client";

import * as React from "react";
import { FileText, ImageIcon, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/core/api/client";
import { useUploadAdjustmentEvidence } from "../api/operation-history-queries";
import {
  EVIDENCE_MAX_BYTES,
  EVIDENCE_MAX_FILES,
  EVIDENCE_MIME_TYPES,
  type UploadedEvidence,
} from "../api/operation-history-types";

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

interface EvidenceUploadFieldProps {
  /** Evidence is uploaded for one factory — nothing can be uploaded until one is chosen. */
  factoryId: string;
  value: UploadedEvidence[];
  onChange: (next: UploadedEvidence[]) => void;
  disabled?: boolean;
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

/**
 * Adjustment evidence (spec decision 4): each chosen file is uploaded straight
 * away via `POST /inventory/adjustments/evidence`, and only the returned ids
 * travel with the adjustment. Type/size/count are checked client-side first
 * (jpeg/png/webp/pdf, ≤ 10 MB, ≤ 5 files) so a bad file never costs a round
 * trip — the backend re-checks all three.
 *
 * `id`/`aria-*` (injected by `FormControl`) land on the native file input, so
 * the form label targets it.
 */
export const EvidenceUploadField = React.forwardRef<HTMLInputElement, EvidenceUploadFieldProps>(
  function EvidenceUploadField({ factoryId, value, onChange, disabled = false, ...inputProps }, ref) {
    const upload = useUploadAdjustmentEvidence();
    const inputRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    // Uploads resolve one after another; reading the latest value through a
    // ref keeps a removal made mid-upload from being overwritten.
    const valueRef = React.useRef(value);
    valueRef.current = value;

    const [uploading, setUploading] = React.useState<string[]>([]);
    const [problems, setProblems] = React.useState<string[]>([]);

    const full = value.length >= EVIDENCE_MAX_FILES;
    const inputDisabled = disabled || !factoryId || full;

    async function handleFiles(fileList: FileList | null) {
      const files = fileList ? Array.from(fileList) : [];
      if (inputRef.current) inputRef.current.value = "";
      if (files.length === 0) return;

      const rejected: string[] = [];
      const accepted: File[] = [];
      for (const file of files) {
        if (!(EVIDENCE_MIME_TYPES as readonly string[]).includes(file.type)) {
          rejected.push(`${file.name}: only JPEG, PNG or WebP photos and PDF files are accepted.`);
        } else if (file.size > EVIDENCE_MAX_BYTES) {
          rejected.push(`${file.name}: larger than the 10 MB limit.`);
        } else if (valueRef.current.length + accepted.length >= EVIDENCE_MAX_FILES) {
          rejected.push(`${file.name}: an adjustment can carry at most ${EVIDENCE_MAX_FILES} evidence files.`);
        } else {
          accepted.push(file);
        }
      }
      setProblems(rejected);

      for (const file of accepted) {
        setUploading((names) => [...names, file.name]);
        try {
          const uploaded = await upload.mutateAsync({ factoryId, file });
          const next = [...valueRef.current, uploaded];
          valueRef.current = next;
          onChange(next);
        } catch (err) {
          setProblems((current) => [
            ...current,
            `${file.name}: ${getApiErrorMessage(err, "upload failed. Please try again.")}`,
          ]);
        } finally {
          setUploading((names) => {
            const index = names.indexOf(file.name);
            return index === -1 ? names : [...names.slice(0, index), ...names.slice(index + 1)];
          });
        }
      }
    }

    function remove(id: string) {
      const next = valueRef.current.filter((item) => item.id !== id);
      valueRef.current = next;
      onChange(next);
    }

    return (
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={EVIDENCE_MIME_TYPES.join(",")}
          className="sr-only"
          disabled={inputDisabled}
          onChange={(event) => void handleFiles(event.target.files)}
          {...inputProps}
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={inputDisabled}
          >
            <Upload className="h-3.5 w-3.5" />
            Add Evidence
          </Button>
          <span className="text-xs text-slate-500">
            {!factoryId
              ? "Select a factory before uploading evidence."
              : `Photo (JPEG, PNG, WebP) or PDF, up to 10 MB each — ${value.length} of ${EVIDENCE_MAX_FILES} attached.`}
          </span>
        </div>

        {uploading.length > 0 && (
          <p className="text-xs text-slate-600" aria-live="polite">
            Uploading {uploading.join(", ")}…
          </p>
        )}

        {value.length > 0 && (
          <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
            {value.map((item) => {
              const Icon = item.mimeType === "application/pdf" ? FileText : ImageIcon;
              return (
                <li key={item.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                  <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-slate-800">{item.fileName}</span>
                  <span className="text-xs text-slate-500">{formatFileSize(item.fileSize)}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => remove(item.id)}
                    aria-label={`Remove ${item.fileName}`}
                    disabled={disabled}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

        {problems.map((problem) => (
          <p key={problem} role="alert" className="text-xs text-danger-600">
            {problem}
          </p>
        ))}
      </div>
    );
  },
);
