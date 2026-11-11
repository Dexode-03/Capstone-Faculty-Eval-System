import { useState, useEffect, useRef } from 'react';
import archiveService from '../../services/archiveService';
import {
  HiOutlineDownload,
  HiOutlineUpload,
  HiOutlineTrash,
  HiOutlineExclamation,
  HiOutlineCheckCircle,
  HiOutlineRefresh,
  HiOutlineInformationCircle,
  HiOutlineLockClosed,
  HiOutlineDocumentText,
  HiOutlineX,
  HiOutlineShieldCheck,
  HiOutlineDatabase,
} from 'react-icons/hi';

const CONFIRMATION_PHRASE = 'DELETE ARCHIVE EVALUATIONS';

export default function DataArchiveManagement({ onArchived }) {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Export state
  const [exportingId, setExportingId] = useState(null);

  // Wipe modal state
  const [wipeTargetPeriod, setWipeTargetPeriod] = useState(null);
  const [wipePassword, setWipePassword] = useState('');
  const [wipeConfirmation, setWipeConfirmation] = useState('');
  const [wipeLoading, setWipeLoading] = useState(false);
  const [wipeError, setWipeError] = useState('');

  // Restore state
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoreData, setRestoreData] = useState(null);
  const [restorePreview, setRestorePreview] = useState(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreError, setRestoreError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      const res = await archiveService.getPeriods();
      setPeriods(res.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to load archive periods.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Export Snapshot
  // ─────────────────────────────────────────────────────────────────
  const handleExport = async (period) => {
    try {
      setExportingId(period.id);
      setError('');
      setSuccessMessage('');

      const res = await archiveService.exportPeriod(period.id);
      const snapshot = res.data;

      // Create downloadable JSON blob
      const jsonStr = JSON.stringify(snapshot, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      const safeYear = (period.academic_year || 'period').replace(/\s+/g, '_');
      const safeSem = (period.semester || 'sem').replace(/\s+/g, '_');
      link.href = url;
      link.download = `fefas_archive_${safeYear}_${safeSem}.json`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      link.remove();

      setSuccessMessage(
        `Archive snapshot for ${period.academic_year} (${period.semester} Semester) exported successfully!`
      );
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Error exporting period snapshot.'
      );
    } finally {
      setExportingId(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Wipe / Purge Period Data
  // ─────────────────────────────────────────────────────────────────
  const openWipeModal = (period) => {
    setWipeTargetPeriod(period);
    setWipePassword('');
    setWipeConfirmation('');
    setWipeError('');
  };

  const closeWipeModal = () => {
    if (wipeLoading) return;
    setWipeTargetPeriod(null);
    setWipePassword('');
    setWipeConfirmation('');
    setWipeError('');
  };

  const handleWipeConfirm = async (e) => {
    e.preventDefault();
    if (!wipeTargetPeriod) return;

    if (!wipePassword) {
      setWipeError('Administrator password is required.');
      return;
    }

    if (wipeConfirmation.trim() !== CONFIRMATION_PHRASE) {
      setWipeError(`Confirmation phrase must match "${CONFIRMATION_PHRASE}" exactly.`);
      return;
    }

    try {
      setWipeLoading(true);
      setWipeError('');
      const payload = {
        password: wipePassword,
        confirmation: wipeConfirmation.trim(),
        phrase: wipeConfirmation.trim(),
      };

      const res = await archiveService.wipePeriod(wipeTargetPeriod.id, payload);

      setSuccessMessage(
        res.data?.message ||
          `Successfully purged evaluation data for ${wipeTargetPeriod.academic_year} (${wipeTargetPeriod.semester} Semester).`
      );
      setTimeout(() => setSuccessMessage(''), 6000);

      closeWipeModal();
      fetchPeriods();
      if (onArchived) onArchived();
    } catch (err) {
      setWipeError(
        err.response?.data?.message || err.message || 'Failed to wipe period archive.'
      );
    } finally {
      setWipeLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Restore Archive Snapshot
  // ─────────────────────────────────────────────────────────────────
  const handleFileChange = (file) => {
    if (!file) return;

    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setRestoreError('Please select a valid .json snapshot file.');
      return;
    }

    setRestoreError('');
    setRestoreFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed.academic_period || !Array.isArray(parsed.evaluations)) {
          throw new Error('Invalid archive snapshot schema. Missing academic_period or evaluations array.');
        }

        setRestoreData(parsed);
        setRestorePreview({
          academicYear: parsed.academic_period?.academic_year || 'Unknown',
          semester: parsed.academic_period?.semester || 'Unknown',
          exportedAt: parsed.exported_at ? new Date(parsed.exported_at).toLocaleString() : 'N/A',
          evaluationsCount: parsed.counts?.evaluations ?? parsed.evaluations?.length ?? 0,
          responsesCount: parsed.counts?.evaluation_responses ?? parsed.evaluation_responses?.length ?? 0,
          submissionsCount: parsed.counts?.evaluation_submissions ?? parsed.evaluation_submissions?.length ?? 0,
          hasChecksum: Boolean(parsed.checksum),
          version: parsed.version || '1.0',
        });
      } catch (err) {
        setRestoreData(null);
        setRestorePreview(null);
        setRestoreError(`Failed to parse snapshot file: ${err.message}`);
      }
    };
    reader.onerror = () => {
      setRestoreError('Error reading uploaded file.');
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  const handleClearRestore = () => {
    setRestoreFile(null);
    setRestoreData(null);
    setRestorePreview(null);
    setRestoreError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRestoreSubmit = async () => {
    if (!restoreData) return;

    try {
      setRestoreLoading(true);
      setRestoreError('');
      setError('');

      // Send payload with archiveData and root structure for full backend compatibility
      const payload = {
        archiveData: restoreData,
        ...restoreData,
      };

      const res = await archiveService.restoreArchive(payload);

      setSuccessMessage(
        res.data?.message ||
          `Archive restored successfully! Restored ${res.data?.restored?.evaluations || restorePreview?.evaluationsCount} evaluations.`
      );
      setTimeout(() => setSuccessMessage(''), 6000);

      handleClearRestore();
      fetchPeriods();
      if (onArchived) onArchived();
    } catch (err) {
      setRestoreError(
        err.response?.data?.message || err.message || 'Error restoring snapshot.'
      );
    } finally {
      setRestoreLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {error && (
        <div className="flex items-start justify-between bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-xs">
          <div className="flex items-center gap-2">
            <HiOutlineExclamation className="w-5 h-5 flex-shrink-0 text-red-500" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button
            onClick={() => setError('')}
            className="text-red-400 hover:text-red-700 p-0.5 rounded-md"
            aria-label="Dismiss error"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <HiOutlineCheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            <span className="text-sm font-medium">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-emerald-500 hover:text-emerald-800 p-0.5 rounded-md"
            aria-label="Dismiss success message"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Header / Explanation Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <HiOutlineDatabase className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                Data Migration & Archiving Engine
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Manage evaluation lifecycle archives, export cryptographically signed JSON snapshots, purge historical evaluation data, and restore periods.
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchPeriods(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 self-start md:self-auto"
          >
            <HiOutlineRefresh className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Feature Explanation Pills */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-2">
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <HiOutlineDownload className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                1. Export Snapshot
              </h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Download a complete, SHA-256 verified JSON archive containing evaluations, question responses, and anonymous submissions.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <HiOutlineTrash className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                2. Purge Historical Data
              </h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Free database storage by wiping responses from closed historical periods while safely retaining period metadata.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <HiOutlineUpload className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                3. Atomic Restore
              </h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Re-import previously exported snapshots with referential integrity verification inside an all-or-nothing database transaction.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Restore Section Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HiOutlineUpload className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-800 text-sm">
              Restore Archive Snapshot
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">JSON Snapshot Upload</span>
        </div>

        <div className="p-6">
          {restoreError && (
            <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
              <HiOutlineExclamation className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
              <div className="flex-1">{restoreError}</div>
              <button
                onClick={() => setRestoreError('')}
                className="text-red-400 hover:text-red-700"
              >
                <HiOutlineX className="w-4 h-4" />
              </button>
            </div>
          )}

          {!restorePreview ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
              <div className="flex flex-col items-center justify-center">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full mb-3">
                  <HiOutlineDocumentText className="w-8 h-8" />
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  Click to choose a JSON archive snapshot or drag and drop
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports exported FEFAS archive files (.json) with checksum verification
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg">
                    <HiOutlineDocumentText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">
                      {restoreFile?.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      File Size: {(restoreFile.size / 1024).toFixed(1)} KB • Snapshot Version {restorePreview.version}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleClearRestore}
                  disabled={restoreLoading}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-white transition-colors"
                >
                  Choose Different File
                </button>
              </div>

              {/* Snapshot Metadata Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Academic Period</span>
                  <span className="text-slate-800 font-bold text-sm">
                    {restorePreview.academicYear} ({restorePreview.semester})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Evaluations</span>
                  <span className="text-slate-800 font-bold text-sm">
                    {restorePreview.evaluationsCount} records
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Question Responses</span>
                  <span className="text-slate-800 font-bold text-sm">
                    {restorePreview.responsesCount} responses
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Checksum Verification</span>
                  <span className="inline-flex items-center gap-1 font-bold text-sm text-emerald-600">
                    <HiOutlineShieldCheck className="w-4 h-4" />
                    {restorePreview.hasChecksum ? 'SHA-256 Validated' : 'Unsigned'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-amber-700 flex items-center gap-1.5">
                  <HiOutlineInformationCircle className="w-4 h-4 flex-shrink-0" />
                  Restoring will safely upsert/restore evaluations for this period into the database.
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleClearRestore}
                    disabled={restoreLoading}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRestoreSubmit}
                    disabled={restoreLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs"
                  >
                    {restoreLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Restoring Snapshot...
                      </>
                    ) : (
                      <>
                        <HiOutlineUpload className="w-4 h-4" />
                        Confirm & Restore Snapshot
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Period Archives List Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">
              Academic Period Archive Status
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review current evaluation counts, download backups, or safely wipe historical closed cycles.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {periods.length} {periods.length === 1 ? 'Period' : 'Periods'} Total
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading period archive statuses...</p>
          </div>
        ) : periods.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <HiOutlineDatabase className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No academic periods found.</p>
            <p className="text-xs text-slate-400 mt-1">Create an academic period first.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Academic Period</th>
                  <th className="px-6 py-3.5">Duration</th>
                  <th className="px-6 py-3.5">Cycle Status</th>
                  <th className="px-6 py-3.5">Evaluation Data</th>
                  <th className="px-6 py-3.5">Archive Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {periods.map((period) => {
                  const isActive = Boolean(period.is_active);
                  const evalCount = period.evaluation_count || 0;
                  const isArchived = evalCount === 0 && !isActive;
                  const isExporting = exportingId === period.id;

                  return (
                    <tr
                      key={period.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isActive ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      {/* Academic Period */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {period.academic_year}
                        </div>
                        <div className="text-xs text-slate-500">
                          {period.semester} Semester
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {period.start_date && period.end_date ? (
                          <>
                            {new Date(period.start_date).toLocaleDateString()} —{' '}
                            {new Date(period.end_date).toLocaleDateString()}
                          </>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Cycle Status */}
                      <td className="px-6 py-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            Active Period
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            Closed / Inactive
                          </span>
                        )}
                      </td>

                      {/* Evaluation Data Count */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold text-xs px-2.5 py-1 rounded-lg ${
                              evalCount > 0
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {evalCount.toLocaleString()} {evalCount === 1 ? 'evaluation' : 'evaluations'}
                          </span>
                        </div>
                      </td>

                      {/* Archive Status Badge */}
                      <td className="px-6 py-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Active Cycle (Locked)
                          </span>
                        ) : isArchived ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                            <HiOutlineCheckCircle className="w-3.5 h-3.5 text-purple-600" />
                            Archived / Storage Purged
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                            Active Data / Ready
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Export Snapshot Button */}
                          <button
                            type="button"
                            onClick={() => handleExport(period)}
                            disabled={isExporting}
                            title="Export full JSON snapshot of evaluations and submissions"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {isExporting ? (
                              <>
                                <div className="w-3 h-3 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                                <span>Exporting...</span>
                              </>
                            ) : (
                              <>
                                <HiOutlineDownload className="w-4 h-4 text-slate-600" />
                                <span>Export Snapshot</span>
                              </>
                            )}
                          </button>

                          {/* Wipe Historical Data Button */}
                          <button
                            type="button"
                            onClick={() => openWipeModal(period)}
                            disabled={isActive || evalCount === 0}
                            title={
                              isActive
                                ? 'Cannot wipe data from an active academic period'
                                : evalCount === 0
                                ? 'No evaluation data to purge in this period'
                                : 'Purge evaluations from historical period to save space'
                            }
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                              isActive || evalCount === 0
                                ? 'text-slate-300 bg-slate-50 border border-slate-100 cursor-not-allowed'
                                : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200'
                            }`}
                          >
                            <HiOutlineTrash className="w-4 h-4 text-rose-600" />
                            <span>Wipe Data</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          Wipe Confirmation Modal
          ───────────────────────────────────────────────────────────── */}
      {wipeTargetPeriod && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="bg-rose-50 px-6 py-4 border-b border-rose-100 flex items-start gap-3">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                <HiOutlineExclamation className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-rose-900">
                  Confirm Historical Data Purge
                </h3>
                <p className="text-xs text-rose-700 mt-0.5">
                  Permanent removal of evaluation responses and submission ledgers
                </p>
              </div>
              <button
                type="button"
                onClick={closeWipeModal}
                disabled={wipeLoading}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleWipeConfirm} className="p-6 space-y-4">
              {wipeError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                  <HiOutlineExclamation className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />
                  <span>{wipeError}</span>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 space-y-1.5">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>Target Academic Period:</span>
                  <span>
                    {wipeTargetPeriod.academic_year} ({wipeTargetPeriod.semester} Semester)
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Evaluations to purge:</span>
                  <span className="font-semibold text-rose-600">
                    {wipeTargetPeriod.evaluation_count || 0} evaluations
                  </span>
                </div>
                <p className="pt-2 text-slate-500 border-t border-slate-200">
                  <strong>Notice:</strong> This action permanently purges evaluation records, individual answers, and anonymous submission markers for this period. Academic period definitions, users, and questions remain intact. Ensure you have exported a snapshot if you wish to restore later.
                </p>
              </div>

              {/* Security Requirement 1: Admin Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Administrator Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <HiOutlineLockClosed className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={wipePassword}
                    onChange={(e) => setWipePassword(e.target.value)}
                    placeholder="Enter your administrator password"
                    required
                    disabled={wipeLoading}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Security Requirement 2: Confirmation Phrase */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirmation Phrase <span className="text-rose-500">*</span>
                </label>
                <p className="text-xs text-slate-500 mb-1.5">
                  Type <span className="font-mono font-bold text-rose-700 bg-rose-50 px-1 py-0.5 rounded border border-rose-200">{CONFIRMATION_PHRASE}</span> below:
                </p>
                <input
                  type="text"
                  value={wipeConfirmation}
                  onChange={(e) => setWipeConfirmation(e.target.value)}
                  placeholder={CONFIRMATION_PHRASE}
                  required
                  disabled={wipeLoading}
                  className={`w-full px-3 py-2 text-sm font-mono border rounded-lg focus:ring-2 focus:outline-hidden ${
                    wipeConfirmation.trim() === CONFIRMATION_PHRASE
                      ? 'border-emerald-400 ring-emerald-500 text-emerald-800'
                      : 'border-slate-300 focus:ring-rose-500'
                  }`}
                />
                {wipeConfirmation.trim() === CONFIRMATION_PHRASE && (
                  <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                    <HiOutlineCheckCircle className="w-3.5 h-3.5" />
                    Confirmation phrase verified
                  </p>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeWipeModal}
                  disabled={wipeLoading}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    wipeLoading ||
                    !wipePassword ||
                    wipeConfirmation.trim() !== CONFIRMATION_PHRASE
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs"
                >
                  {wipeLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Purging Data...
                    </>
                  ) : (
                    <>
                      <HiOutlineTrash className="w-4 h-4" />
                      Permanently Wipe Evaluations
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
