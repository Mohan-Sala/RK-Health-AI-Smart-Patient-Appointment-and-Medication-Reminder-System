import { useState, useEffect } from "react";
import { Modal, Field, ModalFooter, inputCls } from "./Modal";

type Props = {
  open: boolean;
  onClose: () => void;
  onGenerate: (config: {
    title: string;
    reportType: string;
    fromDate: string;
    toDate: string;
    include: {
      appointments: boolean;
      medications: boolean;
      aiSummaries: boolean;
      activityLogs: boolean;
      healthInformation: boolean;
    };
    format: "PDF" | "Excel" | "CSV";
  }) => void;
  loading: boolean;
};

export function ReportModal({ open, onClose, onGenerate, loading }: Props) {
  const [title, setTitle] = useState("");
  const [reportType, setReportType] = useState("Complete Health Report");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [includeAppts, setIncludeAppts] = useState(true);
  const [includeMeds, setIncludeMeds] = useState(true);
  const [includeAI, setIncludeAI] = useState(true);
  const [includeLogs, setIncludeLogs] = useState(true);
  const [includeInfo, setIncludeInfo] = useState(true);

  const [format, setFormat] = useState<"PDF" | "Excel" | "CSV">("PDF");

  useEffect(() => {
    if (open) {
      setTitle("");
      setReportType("Complete Health Report");
      setFromDate("");
      setToDate("");
      setIncludeAppts(true);
      setIncludeMeds(true);
      setIncludeAI(true);
      setIncludeLogs(true);
      setIncludeInfo(true);
      setFormat("PDF");
    }
  }, [open]);

  const handleSubmit = () => {
    onGenerate({
      title,
      reportType,
      fromDate,
      toDate,
      include: {
        appointments: includeAppts,
        medications: includeMeds,
        aiSummaries: includeAI,
        activityLogs: includeLogs,
        healthInformation: includeInfo,
      },
      format,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Configure Health Report">
      <div className="px-6 py-5 space-y-4">
        <Field label="Report Title (Optional)">
          <input
            className={inputCls}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. My Health Summary (Left blank for auto-generation)"
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Report Type">
            <select
              className={inputCls}
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="Health Summary">Health Summary</option>
              <option value="Appointment Report">Appointment Report</option>
              <option value="Medication Report">Medication Report</option>
              <option value="Complete Health Report">Complete Health Report</option>
            </select>
          </Field>

          <Field label="Report Format">
            <select
              className={inputCls}
              value={format}
              onChange={(e) => setFormat(e.target.value as "PDF" | "Excel" | "CSV")}
            >
              <option value="PDF">PDF Document</option>
              <option value="Excel">Excel Spreadsheet</option>
              <option value="CSV">CSV Data File</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="From Date">
            <input
              type="date"
              className={inputCls}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </Field>
          <Field label="To Date">
            <input
              type="date"
              className={inputCls}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </Field>
        </div>

        <div>
          <label className="text-[12.5px] font-medium text-foreground/80 mb-2 block">
            Include Content Modules
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-secondary/20 border border-border">
            <label className="flex items-center gap-2 text-[13.5px] cursor-pointer">
              <input
                type="checkbox"
                checked={includeAppts}
                onChange={(e) => setIncludeAppts(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 bg-background"
              />
              Appointments
            </label>
            <label className="flex items-center gap-2 text-[13.5px] cursor-pointer">
              <input
                type="checkbox"
                checked={includeMeds}
                onChange={(e) => setIncludeMeds(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 bg-background"
              />
              Medications
            </label>
            <label className="flex items-center gap-2 text-[13.5px] cursor-pointer">
              <input
                type="checkbox"
                checked={includeAI}
                onChange={(e) => setIncludeAI(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 bg-background"
              />
              AI Summaries
            </label>
            <label className="flex items-center gap-2 text-[13.5px] cursor-pointer">
              <input
                type="checkbox"
                checked={includeLogs}
                onChange={(e) => setIncludeLogs(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 bg-background"
              />
              Activity Logs
            </label>
            <label className="flex items-center gap-2 text-[13.5px] cursor-pointer">
              <input
                type="checkbox"
                checked={includeInfo}
                onChange={(e) => setIncludeInfo(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 bg-background"
              />
              Health Information
            </label>
          </div>
        </div>
      </div>

      <ModalFooter>
        <button
          onClick={onClose}
          disabled={loading}
          className="h-10 px-4 rounded-xl border border-border text-[13.5px] font-medium hover:bg-hover transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-[13.5px] font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Report"}
        </button>
      </ModalFooter>
    </Modal>
  );
}
