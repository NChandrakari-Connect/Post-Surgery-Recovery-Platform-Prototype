import { useState } from 'react';
import { getPatientById, getPatientFullName } from '../../data/patients';
import { getReportsByPatientId } from '../../data/reports';
import { formatDate } from '../../utils/helpers';
import { useApp } from '../../context/AppContext';
import Modal from '../../components/common/Modal';
import { FileText, Eye, Download, Printer, CheckCircle, Clock } from 'lucide-react';

export default function PatientReports() {
  const { selectedPatientId, addToast } = useApp();
  const patient = getPatientById(selectedPatientId);
  const reports = getReportsByPatientId(selectedPatientId);
  const [selectedReport, setSelectedReport] = useState(null);

  if (!patient) return null;

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 28 }}>My Medical & Surgical Reports</h1>
        <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 15 }}>
          Official post-operative reports, pathology findings, laboratory results, and imaging studies.
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="card card-pad">
          <div className="empty-state">
            <FileText size={32} style={{ color: 'var(--teal)' }} />
            <h3>No reports available yet</h3>
            <p>Your surgical and diagnostic reports will appear here as soon as published by the laboratory and surgical team.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
          {reports.map(report => (
            <div key={report.id} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>{report.name}</h3>
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                      {formatDate(report.date)} · {report.department}
                    </div>
                  </div>
                  <span className={`status-badge ${report.status === 'completed' ? 'completed' : 'monitor'}`} style={{ fontSize: 11 }}>
                    {report.status === 'completed' ? 'Completed' : report.status}
                  </span>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <span className="status-badge on-track" style={{ fontSize: 11 }}>{report.type}</span>
                </div>

                <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6, marginBottom: 18 }}>
                  {report.summary}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10, paddingTop: 14, borderTop: '1px solid var(--line-soft)' }}>
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => setSelectedReport(report)}>
                  <Eye size={14} /> View Report
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => addToast(`Downloaded ${report.name} (PDF)`)}>
                  <Download size={14} /> PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report View Modal */}
      {selectedReport && (
        <Modal
          isOpen={Boolean(selectedReport)}
          onClose={() => setSelectedReport(null)}
          title={selectedReport.name}
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ padding: 14, background: 'var(--paper)', borderRadius: 'var(--radius-md)', border: '1px solid var(--line-soft)', fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div><strong>Patient:</strong> {getPatientFullName(patient)} (MRN: {patient.id})</div>
                <div><strong>Date:</strong> {formatDate(selectedReport.date)}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div><strong>Department:</strong> {selectedReport.department}</div>
                <div><strong>Sign-off:</strong> {selectedReport.signedBy || 'Dr. Ananya Sen'}</div>
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 6px', fontSize: 15 }}>Summary</h4>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink)' }}>{selectedReport.summary}</p>
            </div>

            {selectedReport.findings && (
              <div>
                <h4 style={{ margin: '0 0 6px', fontSize: 15 }}>Clinical Findings & Narrative</h4>
                <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--ink-soft)', background: 'var(--surface-hover)', padding: 14, borderRadius: 'var(--radius-md)', whiteSpace: 'pre-line' }}>
                  {selectedReport.findings}
                </div>
              </div>
            )}

            {selectedReport.impressions && (
              <div>
                <h4 style={{ margin: '0 0 6px', fontSize: 15 }}>Impression / Conclusion</h4>
                <div style={{ fontSize: 13, color: 'var(--ink)', padding: 12, borderLeft: '3px solid var(--teal)', background: 'var(--teal-pale)', borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}>
                  {selectedReport.impressions}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button className="btn btn-secondary" onClick={() => addToast('Printing report...')}>
                <Printer size={14} /> Print
              </button>
              <button className="btn btn-primary" onClick={() => setSelectedReport(null)}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
