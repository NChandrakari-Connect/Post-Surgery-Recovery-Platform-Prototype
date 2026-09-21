import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patients, getPatientFullName, getPatientInitials } from '../../data/patients';
import { formatDateShort, getStatusConfig, calculateDynamicRecovery } from '../../utils/helpers';
import { useApp } from '../../context/AppContext';
import { Search, Filter, Eye, Calendar, ArrowUpDown } from 'lucide-react';

export default function PatientList() {
  const navigate = useNavigate();
  const { getTasksForPatient, getCheckinsForPatient } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const filtered = patients
    .filter(p => {
      const matchesSearch = search === '' ||
        getPatientFullName(p).toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase()) ||
        p.surgery.procedure.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return getPatientFullName(a).localeCompare(getPatientFullName(b));
      if (sortBy === 'recovery') return b.recoveryDay - a.recoveryDay;
      if (sortBy === 'pain') return b.currentPain - a.currentPain;
      if (sortBy === 'status') {
        const order = { 'needs-review': 0, 'monitor': 1, 'on-track': 2 };
        return (order[a.status] ?? 2) - (order[b.status] ?? 2);
      }
      return 0;
    });

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <p className="eyebrow">Patients</p>
            <h1>Patient Directory</h1>
          </div>
          <p className="page-subtitle" style={{ paddingBottom: 8 }}>
            {patients.length} active patients
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: '1 1 300px', maxWidth: 400 }}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search patients, procedures..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-bar">
          {['all', 'on-track', 'monitor', 'needs-review'].map(status => (
            <button
              key={status}
              className={`filter-chip ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? 'All' : getStatusConfig(status).label}
            </button>
          ))}
        </div>

        <div className="filter-bar" style={{ marginLeft: 'auto' }}>
          <button
            className={`filter-chip ${sortBy === 'name' ? 'active' : ''}`}
            onClick={() => setSortBy('name')}
          >
            <ArrowUpDown size={12} /> Name
          </button>
          <button
            className={`filter-chip ${sortBy === 'status' ? 'active' : ''}`}
            onClick={() => setSortBy('status')}
          >
            <ArrowUpDown size={12} /> Priority
          </button>
          <button
            className={`filter-chip ${sortBy === 'pain' ? 'active' : ''}`}
            onClick={() => setSortBy('pain')}
          >
            <ArrowUpDown size={12} /> Pain
          </button>
        </div>
      </div>

      {/* Patient Cards */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><Search size={28} /></div>
            <h3>No patients found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {filtered.map(patient => {
            const statusConfig = getStatusConfig(patient.status);
            const recoveryPct = calculateDynamicRecovery(
              patient,
              getTasksForPatient ? getTasksForPatient(patient.id) : [],
              getCheckinsForPatient ? getCheckinsForPatient(patient.id) : []
            ).percentage;

            return (
              <div
                key={patient.id}
                className="card"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/patients/${patient.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && navigate(`/patients/${patient.id}`)}
              >
                <div className="card-pad">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div className="avatar-circle lg">{getPatientInitials(patient)}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 16 }}>{getPatientFullName(patient)}</div>
                        <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{patient.id} · {patient.age}y · {patient.gender}</div>
                      </div>
                    </div>
                    <span className={`status-badge ${patient.status}`}>
                      <span className="status-dot" />
                      {statusConfig.label}
                    </span>
                  </div>

                  <div style={{ fontSize: 14, color: 'var(--ink)', marginBottom: 12, fontWeight: 500 }}>
                    {patient.surgery.procedure}
                  </div>

                  <div className="info-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    <div className="info-item">
                      <span className="info-label">Surgery</span>
                      <span className="info-value" style={{ fontSize: 13 }}>{formatDateShort(patient.surgery.date)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Recovery</span>
                      <span className="info-value" style={{ fontSize: 13 }}>Day {patient.recoveryDay}/{patient.surgery.expectedRecoveryDays}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Pain</span>
                      <span className="info-value" style={{ fontSize: 13, fontWeight: 600, color: patient.currentPain >= 5 ? 'var(--status-needs-review)' : 'var(--ink)' }}>
                        {patient.currentPain}/10
                      </span>
                    </div>
                  </div>

                  {/* Recovery Progress Bar */}
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-soft)', marginBottom: 6 }}>
                      <span>Recovery Progress</span>
                      <span>{recoveryPct}%</span>
                    </div>
                    <div style={{ height: 4, background: 'var(--line)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(100, recoveryPct)}%`,
                        background: 'var(--teal)',
                        borderRadius: 2,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--line-soft)' }}>
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                      <Calendar size={12} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 4 }} />
                      Follow-up: {formatDateShort(patient.nextFollowUp)}
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); navigate(`/patients/${patient.id}`); }}>
                      View <Eye size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
