"use client";

import { useState, useRef, useEffect } from "react";
import { Download, ChevronDown } from "lucide-react";

const EXPORT_FORMATS = [
  { value: "csv", label: "CSV (Spreadsheet)", description: "Excel, Google Sheets" },
  { value: "pdf", label: "PDF (Document)", description: "Print-ready" },
  { value: "qif", label: "QIF (Quicken)", description: "Quicken, Money" },
  { value: "ofx", label: "OFX (GnuCash/MoneyDance)", description: "GnuCash, MoneyDance" },
] as const;

export default function ExportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleExport(format: string) {
    setIsExporting(true);
    setIsOpen(false);

    try {
      const response = await fetch(`/api/export?format=${format}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Export failed");
      }

      // Get filename from Content-Disposition header
      const disposition = response.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] ?? `export.${format}`;

      // Download the file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="inline-flex items-center gap-2 rounded-lg border border-[#C4A265]/30 bg-[#F5F0E8] px-4 py-2 text-sm font-medium text-[#2D5016] transition-colors hover:bg-[#E8EDE2] disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        {isExporting ? "Exporting..." : "Export"}
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-[#C4A265]/20 bg-white shadow-lg">
          <div className="p-1">
            {EXPORT_FORMATS.map((format) => (
              <button
                key={format.value}
                onClick={() => handleExport(format.value)}
                className="flex w-full flex-col rounded-md px-3 py-2 text-left transition-colors hover:bg-[#F5F0E8]"
              >
                <span className="text-sm font-medium text-[#2D5016]">
                  {format.label}
                </span>
                <span className="text-xs text-[#2D5016]/60">
                  {format.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
