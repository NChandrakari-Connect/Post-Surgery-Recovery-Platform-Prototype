import { patients, getPatientFullName } from '../../data/patients';
import { getReportsByPatientId } from '../../data/reports';
import { formatDate } from '../../utils/helpers';
import { FileText, Eye, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ReportsOverview() {
  const navigate = useNavigate();
  const allReports = patients.flatMap(p => {
    const reps = getReportsByPatientId(p.id);
    return reps.map(r => ({ ...r, patientName: getPatientFullName(p) }));
  });

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <p className="eyebrow">Reports</p>
            <h1>Medical Reports</h1>
          </div>
          <p className="page-subtitle" style={{ paddingBottom: 8 }}>{allReports.length} reports across all patients</p>
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Report</th>
                <th>Patient</th>
                <th>Type</th>
                <th>Date</th>
                <th>Department</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {allReports.map(report => (
                <tr key={report.id}>
                  <td style={{ fontWeight: 600, fontSize: 14 }}>{report.name}</td>
                  <td style={{ fontSize: 13 }}>{report.patientName}</td>
                  <td><span className="status-badge on-track" style={{ fontSize: 11 }}>{report.type}</span></td>
                  <td style={{ fontSize: 13 }}>{formatDate(report.date)}</td>
                  <td style={{ fontSize: 13 }}>{report.department}</td>
                  <td><span className="status-badge completed" style={{ fontSize: 11 }}><span className="status-dot" />Completed</span></td>
                  <td>
                    <button className="table-action" onClick={() => navigate(`/patients/${report.patientId}`)}>
                      <Eye size={14} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
