import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import UploadForm from './components/UploadForm';
import PatientTable from './components/PatientTable';
import PatientModal from './components/PatientModal';
import DashboardStats from './components/DashboardStats';
import { api } from './services/api';
import { Search, Download } from 'lucide-react';

function App() {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPatients = async () => {
    try {
      const res = await api.getPatients(filter, sort);
      setPatients(res.data);
    } catch (err) {
      console.error("Failed to fetch patients", err);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [filter, sort]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPatients(patients);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredPatients(patients.filter(p =>
        p.patient_id.toLowerCase().includes(query) ||
        p.risk_type.toLowerCase().includes(query)
      ));
    }
  }, [patients, searchQuery]);

  const handleExport = () => {
    const headers = ['Patient ID', 'Gestational Age', 'Risk Score', 'Type', 'Flag', 'Last Update'];
    const rows = filteredPatients.map(p => [
      p.patient_id,
      p.gestational_age_weeks,
      p.risk_score,
      p.risk_type,
      p.flag || 'Stable',
      p.timestamp
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "patient_risk_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col pb-10">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 grid grid-cols-1 md:grid-cols-4 gap-8">

        {/* Left Sidebar: Controls & Info */}
        <aside className="space-y-6">
          <UploadForm onUploadSuccess={fetchPatients} />

          <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 text-sm text-blue-800 shadow-sm">
            <h4 className="font-semibold mb-2">Pro Dashboard</h4>
            <ul className="list-disc list-inside space-y-1 opacity-80">
              <li>Stats update in real-time.</li>
              <li>Global search filters list.</li>
              <li>Export filtered views to CSV.</li>
            </ul>
          </div>
        </aside>

        {/* Main Content */}
        <section className="md:col-span-3 flex flex-col space-y-6">
          <DashboardStats patients={patients} />

          {/* Toolbar */}
          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by Patient ID or Type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
              />
            </div>
            <button
              onClick={handleExport}
              className="flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 shadow-sm transition-colors"
            >
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </button>
          </div>

          <div className="flex-1 min-h-[500px]">
            <PatientTable
              patients={filteredPatients}
              onSelectPatient={setSelectedPatientId}
              onFilterChange={setFilter}
              onSortChange={setSort}
            />
          </div>
        </section>
      </main>

      {/* Modal */}
      {selectedPatientId && (
        <PatientModal
          patientId={selectedPatientId}
          onClose={() => setSelectedPatientId(null)}
        />
      )}
    </div>
  );
}

export default App;
