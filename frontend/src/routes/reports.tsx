import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Topbar } from "@/components/layout/Topbar";
import { PageHeader } from "@/components/ui-kit/PageHeader";
import { FileText, Eye, Download, BrainCircuit, Pill, Calendar, BarChart3, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { searchStore } from "@/lib/store";
import { ReportModal } from "@/components/modals/ReportModal";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports · RK Health" }] }),
  component: ReportsPage,
});

const toneBg = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  ai: "bg-ai/10 text-ai",
  danger: "bg-danger/10 text-danger",
} as const;

// API Helpers
const API_BASE = typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
  ? "/api"
  : "http://localhost:5000/api";

async function apiFetch(path: string, method: "GET" | "POST" | "PUT" | "DELETE" = "GET", body?: any) {
  const token = localStorage.getItem("rk.token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const text = await response.text();
    let msg = "API Request Failed";
    try {
      const parsed = JSON.parse(text);
      msg = parsed.message || parsed.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return response.json();
}

async function downloadReportFile(id: string, format: "pdf" | "excel" | "csv") {
  const token = localStorage.getItem("rk.token");
  const url = `${API_BASE}/reports/${id}/${format}`;
  
  const response = await fetch(url, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Failed to download report");
  
  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  const ext = format === "excel" ? "xlsx" : format;
  a.download = `Health_Report_${id}.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function ReportsPage() {
  const highlightedId = searchStore.useHighlightedId();
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchReports = async () => {
    try {
      const res = await apiFetch("/reports");
      if (res.success) {
        setReportsList(res.data);
      }
    } catch (err: any) {
      console.error("Failed to load reports:", err.message);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (highlightedId) {
      const timer = setTimeout(() => {
        searchStore.setHighlightedId(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightedId]);

  const handleGenerate = () => {
    setModalOpen(true);
  };

  const handleGenerateSubmit = async (config: {
    title: string;
    reportType: string;
    fromDate: string;
    toDate: string;
    include: any;
    format: "PDF" | "Excel" | "CSV";
  }) => {
    setLoading(true);
    try {
      let finalTitle = config.title.trim();
      if (!finalTitle) {
        const today = new Date().toLocaleDateString("en-US", {
          day: "numeric",
          month: "long",
          year: "numeric"
        });
        if (config.reportType === "Health Summary") {
          finalTitle = `Health Report - ${today}`;
        } else if (config.reportType === "Medication Report") {
          const monthYear = new Date().toLocaleDateString("en-US", {
            month: "long",
            year: "numeric"
          });
          finalTitle = `Medication Report - ${monthYear}`;
        } else if (config.reportType === "Complete Health Report") {
          finalTitle = "Complete Health Report";
        } else {
          finalTitle = "Appointment Report";
        }
      }

      const res = await apiFetch("/reports/generate", "POST", {
        title: finalTitle,
        reportType: config.format,
      });

      if (res.success && res.data) {
        toast.success("Health report generated successfully!");
        setModalOpen(false);
        await fetchReports();
        
        // Trigger auto-download
        toast.info(`Starting download for ${config.format} format...`);
        await downloadReportFile(res.data.id, config.format.toLowerCase() as "pdf" | "excel" | "csv");
        toast.success("Download complete");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate health report.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/reports/${id}`, "DELETE");
      toast.success("Report deleted successfully");
      await fetchReports();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete report");
    }
  };

  const handleDownload = async (id: string, format: "pdf" | "excel" | "csv") => {
    try {
      toast.info(`Starting download for ${format.toUpperCase()} format...`);
      await downloadReportFile(id, format);
      toast.success("Download complete");
    } catch (err: any) {
      toast.error(err.message || "Failed to download report");
    }
  };

  return (
    <AppLayout>
      <Topbar greeting="Reports" subtitle="Generate and download health reports." />

      <PageHeader
        title="Reports"
        subtitle="Generate printable, shareable health reports."
        actions={
          <button onClick={handleGenerate} disabled={loading} className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-[13.5px] font-medium inline-flex items-center gap-2 hover:opacity-90 transition disabled:opacity-50">
            <BarChart3 className="h-4 w-4" /> {loading ? "Generating..." : "Generate Report"}
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: "Reports Generated", val: reportsList.length, tone: "primary" },
          { label: "Format PDF", val: reportsList.filter(r => r.format === "PDF").length, tone: "primary" },
          { label: "Format Excel", val: reportsList.filter(r => r.format === "EXCEL" || r.format === "XLSX").length, tone: "success" },
          { label: "Format CSV", val: reportsList.filter(r => r.format === "CSV").length, tone: "success" },
          { label: "Total Managed", val: reportsList.length, tone: "ai" },
        ].map((s) => (
          <div key={s.label} className="card-surface p-5">
            <div className="text-[12.5px] text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-[26px] font-semibold tracking-tight">{s.val}</div>
            <div className={`mt-2 h-1.5 w-10 rounded-full ${toneBg[s.tone as keyof typeof toneBg].split(" ")[0]}`} />
          </div>
        ))}
      </div>

      <div className="card-surface p-2">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          {["All Reports"].map((t, i) => (
            <button key={t} className="h-9 px-3.5 rounded-lg text-[13px] bg-primary/10 text-primary font-medium">{t}</button>
          ))}
        </div>

        <div className="divide-y divide-border">
          {reportsList.length === 0 ? (
            <div className="px-6 py-10 text-center text-[13px] text-muted-foreground">No reports generated yet. Click 'Generate Report' above.</div>
          ) : (
            reportsList.map((r, i) => {
              const isHighlighted = r.id === highlightedId;
              const formattedDate = new Date(r.generatedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
              });
              return (
                <div
                  key={r.id}
                  className={`flex items-center gap-4 px-4 py-4 hover:bg-hover transition ${
                    isHighlighted ? "bg-primary/10 border-l-4 border-l-primary" : ""
                  }`}
                >
                  <div className={`h-11 w-11 rounded-xl grid place-items-center shrink-0 ${toneBg["primary"]}`}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14.5px] font-semibold truncate">{r.title || `Health Report #${r.id.slice(0,6)}`}</div>
                    <div className="text-[12.5px] text-muted-foreground truncate">
                      {r.description || "Comprehensive clinical health overview summary."} · Generated on {formattedDate}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleDownload(r.id, "pdf")} className="h-9 px-3 rounded-lg border border-border text-[12.5px] inline-flex items-center gap-1.5"><Eye className="h-4 w-4" /> PDF</button>
                    <button onClick={() => handleDownload(r.id, "excel")} className="h-9 px-3 rounded-lg border border-border text-[12.5px] inline-flex items-center gap-1.5"><Download className="h-4 w-4" /> Excel</button>
                    <button onClick={() => handleDownload(r.id, "csv")} className="h-9 px-3 rounded-lg border border-border text-[12.5px] inline-flex items-center gap-1.5"><Download className="h-4 w-4" /> CSV</button>
                    <button onClick={() => handleDelete(r.id)} className="h-9 w-9 grid place-items-center rounded-lg border border-border text-danger hover:bg-danger/10 transition"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <ReportModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onGenerate={handleGenerateSubmit}
        loading={loading}
      />
    </AppLayout>
  );
}
