import React, { useState, useEffect, useMemo } from 'react';
import { 
  Car, 
  TrendingUp, 
  MapPin, 
  Settings, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Fuel, 
  Calendar, 
  ArrowLeft, 
  Info, 
  Coins, 
  Gauge, 
  User, 
  RefreshCw, 
  Building, 
  PlaneTakeoff, 
  Compass, 
  Check,
  ChevronRight
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface Trip {
  id: string;
  title: string;
  type: 'Airport' | 'City' | 'Corporate' | 'Outstation' | 'Other';
  km: number;
  durationHours: number;
  rentAmount: number; // Gross amount earned / billed
  fuelExpense: number; // Cost of fuel & materials
  date: string;
  status: 'Paid' | 'Pending';
  notes?: string;
}

interface AppSettings {
  driverName: string;
  vehicleModel: string;
  vehicleNumber: string;
  fuelRatePerKm: number;
  enableLegacyLogs: boolean;
  legacyTrips: number;
  legacyKm: number;
  legacyRent: number;
  legacyIncome: number;
}

// ============================================================================
// Initial Mock Seed Data (To perfectly match requested screen values)
// ============================================================================

const DEFAULT_SETTINGS: AppSettings = {
  driverName: 'Rajesh Kumar',
  vehicleModel: 'Maruti Suzuki Ertiga (CNG/Petrol)',
  vehicleNumber: 'DL 3C AB 1234',
  fuelRatePerKm: 6.50, // default auto calculate expense option
  enableLegacyLogs: true,
  legacyTrips: 36,
  legacyKm: 3920,
  legacyRent: 73150,
  legacyIncome: 29645
};

const DEFAULT_TRIPS: Trip[] = [
  {
    id: 'trip-1',
    title: 'Airport Transfer (T3 to Gurugram)',
    type: 'Airport',
    km: 120,
    durationHours: 6.5,
    rentAmount: 4500,
    fuelExpense: 2650, // Rent - Net Income: 4500 - 1850 = 2650
    date: '2026-05-29',
    status: 'Paid',
    notes: 'Premium corporate pick-up with luggage coordination.'
  },
  {
    id: 'trip-2',
    title: 'Delhi City Tour (Connaught Place)',
    type: 'City',
    km: 85,
    durationHours: 5,
    rentAmount: 2800,
    fuelExpense: 1580, // Rent - Income: 2800 - 1220 = 1580
    date: '2026-05-28',
    status: 'Paid',
    notes: 'Sightseeing trip for 4 passengers.'
  },
  {
    id: 'trip-3',
    title: 'Standard Corporate Commute',
    type: 'Corporate',
    km: 170,
    durationHours: 9,
    rentAmount: 5500,
    fuelExpense: 2740, // Rent - Income: 5500 - 2760 = 2740
    date: '2026-05-26',
    status: 'Paid',
    notes: 'Tech park client daily shuttle run.'
  },
  {
    id: 'trip-4',
    title: 'Weekend Outing to Alwar',
    type: 'Outstation',
    km: 250,
    durationHours: 14,
    rentAmount: 7800,
    fuelExpense: 4200,
    date: '2026-05-24',
    status: 'Pending',
    notes: 'Family weekend tour. Partial payment received.'
  },
  {
    id: 'trip-5',
    title: 'Local Marketplace Run',
    type: 'Other',
    km: 45,
    durationHours: 3,
    rentAmount: 1500,
    fuelExpense: 700,
    date: '2026-05-23',
    status: 'Paid',
    notes: 'Short distance local ride.'
  },
  {
    id: 'trip-6',
    title: 'Wedding Event Rental',
    type: 'Outstation',
    km: 270,
    durationHours: 11,
    rentAmount: 3200,
    fuelExpense: 1800,
    date: '2026-05-20',
    status: 'Paid',
    notes: 'Guest transport service.'
  }
];

export default function App() {
  // ============================================================================
  // State
  // ============================================================================
  const [trips, setTrips] = useState<Trip[]>(() => {
    const saved = localStorage.getItem('car_rental_dashboard_trips');
    return saved ? JSON.parse(saved) : DEFAULT_TRIPS;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('car_rental_dashboard_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [activeTab, setActiveTab] = useState<'home' | 'trips' | 'reports' | 'settings'>('home');
  
  // Search and Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterPayment, setFilterPayment] = useState<string>('All');

  // Reports Dynamic Filter parameters
  const [reportFilterMode, setReportFilterMode] = useState<'All' | 'Month' | 'Range'>('All');
  const [reportSelectedMonth, setReportSelectedMonth] = useState<string>('');
  const [reportStartDate, setReportStartDate] = useState<string>('');
  const [reportEndDate, setReportEndDate] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<Trip['type']>('City');
  const [formKm, setFormKm] = useState<number | ''>('');
  const [formDuration, setFormDuration] = useState<number | ''>('');
  const [formRent, setFormRent] = useState<number | ''>('');
  const [formFuel, setFormFuel] = useState<number | ''>('');
  const [formDate, setFormDate] = useState('');
  const [formStatus, setFormStatus] = useState<Trip['status']>('Paid');
  const [formNotes, setFormNotes] = useState('');
  const [autoFuelCalc, setAutoFuelCalc] = useState(true);

  // Toast / Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // ============================================================================
  // Lifecycles / Storage Sync
  // ============================================================================
  useEffect(() => {
    localStorage.setItem('car_rental_dashboard_trips', JSON.stringify(trips));
  }, [trips]);

  useEffect(() => {
    localStorage.setItem('car_rental_dashboard_settings', JSON.stringify(settings));
  }, [settings]);

  // Toast helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // ============================================================================
  // Fuel Auto-Estimator hook
  // ============================================================================
  useEffect(() => {
    if (autoFuelCalc && formKm !== '') {
      const estimatedExpenses = Math.round(Number(formKm) * settings.fuelRatePerKm);
      setFormFuel(estimatedExpenses);
    }
  }, [formKm, autoFuelCalc, settings.fuelRatePerKm]);

  // ============================================================================
  // Calculated Dashboard Stats
  // ============================================================================
  const stats = useMemo(() => {
    // Current dynamic values calculated from visible/active React state array
    const activeTripsCount = trips.length;
    let activeKm = 0;
    let activeRent = 0;
    let activeExpenses = 0;

    trips.forEach(t => {
      activeKm += Number(t.km) || 0;
      activeRent += Number(t.rentAmount) || 0;
      activeExpenses += Number(t.fuelExpense) || 0;
    });

    const activeIncome = activeRent - activeExpenses;

    // Totals include legacy historical log parameters if enabled in Settings
    const displayTrips = activeTripsCount + (settings.enableLegacyLogs ? settings.legacyTrips : 0);
    const displayKm = activeKm + (settings.enableLegacyLogs ? settings.legacyKm : 0);
    const displayRent = activeRent + (settings.enableLegacyLogs ? settings.legacyRent : 0);
    const displayIncome = activeIncome + (settings.enableLegacyLogs ? settings.legacyIncome : 0);

    return {
      totalTrips: displayTrips,
      totalKm: displayKm,
      totalRent: displayRent,
      totalIncome: displayIncome,
      activeTripsCount,
      activeKm,
      activeRent,
      activeIncome,
      activeExpenses,
      // Performance metrics
      averageIncomePerKm: displayKm > 0 ? (displayIncome / displayKm) : 0,
      averageRentPerTrip: displayTrips > 0 ? (displayRent / displayTrips) : 0,
      expenseRatio: displayRent > 0 ? (((displayRent - displayIncome) / displayRent) * 100) : 0
    };
  }, [trips, settings]);

  // Dynamic grouping and date filtering for Reports Tab
  const availableMonths = useMemo(() => {
    const list: string[] = [];
    trips.forEach(t => {
      if (t.date && t.date.length >= 7) {
        const yyyymm = t.date.substring(0, 7); // e.g., "2026-05"
        if (!list.includes(yyyymm)) {
          list.push(yyyymm);
        }
      }
    });
    // Fallback default months if no trips logged yet
    if (list.length === 0) {
      list.push('2026-05');
    }
    return list.sort((a, b) => b.localeCompare(a));
  }, [trips]);

  const activeReportMonthToShow = reportSelectedMonth || (availableMonths[0] || '2026-05');

  const formatMonthLabel = (yyyymm: string) => {
    if (!yyyymm || yyyymm.length < 7) return yyyymm;
    const [year, month] = yyyymm.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  const reportTrips = useMemo(() => {
    return trips.filter((trip) => {
      if (reportFilterMode === 'All') return true;
      if (reportFilterMode === 'Month') {
        return trip.date.startsWith(activeReportMonthToShow);
      }
      if (reportFilterMode === 'Range') {
        if (!reportStartDate && !reportEndDate) return true;
        const tripTime = new Date(trip.date).getTime();
        const start = reportStartDate ? new Date(reportStartDate + 'T00:00:00').getTime() : -Infinity;
        const end = reportEndDate ? new Date(reportEndDate + 'T23:59:59').getTime() : Infinity;
        return tripTime >= start && tripTime <= end;
      }
      return true;
    });
  }, [trips, reportFilterMode, activeReportMonthToShow, reportStartDate, reportEndDate]);

  const reportStats = useMemo(() => {
    let rent = 0;
    let expenses = 0;
    let km = 0;
    let hours = 0;
    const count = reportTrips.length;

    reportTrips.forEach(t => {
      rent += Number(t.rentAmount) || 0;
      expenses += Number(t.fuelExpense) || 0;
      km += Number(t.km) || 0;
      hours += Number(t.durationHours) || 0;
    });

    const netIncome = rent - expenses;

    return {
      count,
      rent,
      expenses,
      km,
      hours,
      netIncome,
      averageIncomePerKm: km > 0 ? (netIncome / km) : 0,
      expenseRatio: rent > 0 ? ((expenses / rent) * 100) : 0
    };
  }, [reportTrips]);

  // ============================================================================
  // Search & Filtering Execution
  // ============================================================================
  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      const matchesSearch = 
        trip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trip.type.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'All' || trip.type === filterType;
      const matchesPayment = filterPayment === 'All' || trip.status === filterPayment;

      return matchesSearch && matchesType && matchesPayment;
    });
  }, [trips, searchTerm, filterType, filterPayment]);

  // ============================================================================
  // Form Actions: Create or Update Trip
  // ============================================================================
  const openAddModal = () => {
    setEditingTrip(null);
    setFormTitle('');
    setFormType('City');
    setFormKm('');
    setFormDuration('');
    setFormRent('');
    setFormFuel('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormStatus('Paid');
    setFormNotes('');
    setAutoFuelCalc(true);
    setIsModalOpen(true);
  };

  const openEditModal = (trip: Trip) => {
    setEditingTrip(trip);
    setFormTitle(trip.title);
    setFormType(trip.type);
    setFormKm(trip.km);
    setFormDuration(trip.durationHours);
    setFormRent(trip.rentAmount);
    setFormFuel(trip.fuelExpense);
    setFormDate(trip.date);
    setFormStatus(trip.status);
    setFormNotes(trip.notes || '');
    setAutoFuelCalc(false); // disable auto trigger to permit manual adjustments
    setIsModalOpen(true);
  };

  const handleDeleteTrip = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this trip record? This will adjust all dashboard sums immediately.')) {
      setTrips(prev => prev.filter(t => t.id !== id));
      showToast('Trip record deleted', 'info');
    }
  };

  const handleSaveTrip = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim()) {
      showToast('Please enter a trip route name or title', 'error');
      return;
    }
    if (formKm === '' || Number(formKm) <= 0) {
      showToast('Please enter a valid route distance in KM', 'error');
      return;
    }
    if (formRent === '' || Number(formRent) < 0) {
      showToast('Please specify a gross rent charge', 'error');
      return;
    }

    const kmVal = Number(formKm);
    const durationVal = Number(formDuration) || 1;
    const rentVal = Number(formRent);
    const fuelVal = Number(formFuel) || 0;

    const payload: Trip = {
      id: editingTrip ? editingTrip.id : `trip-${Date.now()}`,
      title: formTitle.trim(),
      type: formType,
      km: kmVal,
      durationHours: durationVal,
      rentAmount: rentVal,
      fuelExpense: fuelVal,
      date: formDate || new Date().toISOString().split('T')[0],
      status: formStatus,
      notes: formNotes.trim()
    };

    if (editingTrip) {
      // Edit mode
      setTrips(prev => prev.map(t => t.id === editingTrip.id ? payload : t));
      showToast('Trip entry updated successfully');
    } else {
      // Insert new trip at the front of the history
      setTrips(prev => [payload, ...prev]);
      showToast('New trip parsed and logged successfully');
    }

    setIsModalOpen(false);
  };

  const resetAllStoredData = () => {
    if (window.confirm('Warning: This will clear all logged trip modifications and revert to initial demo seeds. Proceed?')) {
      setTrips(DEFAULT_TRIPS);
      setSettings(DEFAULT_SETTINGS);
      showToast('Database reset to defaults', 'info');
    }
  };

  // Helper formatting INR
  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Icon selector according to trip category
  const getTripIcon = (type: Trip['type']) => {
    switch(type) {
      case 'Airport':
        return <PlaneTakeoff className="w-5 h-5 text-indigo-600" />;
      case 'City':
        return <Compass className="w-5 h-5 text-emerald-600" />;
      case 'Corporate':
        return <Building className="w-5 h-5 text-slate-700" />;
      case 'Outstation':
        return <MapPin className="w-5 h-5 text-amber-600" />;
      default:
        return <Car className="w-5 h-5 text-teal-600" />;
    }
  };

  return (
    <div id="app-root" className="min-h-screen bg-neutral-900 text-neutral-800 flex items-center justify-center p-0 md:p-6 select-none font-sans">
      {/* Visual background pattern to highlight mobile focus */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      {/* Main Premium Phone Housing wrapper */}
      <div id="phone-container" className="w-full max-w-md bg-white min-h-[100vh] md:min-h-[840px] md:max-h-[900px] md:rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.5)] flex flex-col justify-between overflow-hidden relative border-0 md:border-8 border-neutral-950">
        
        {/* Sleek Camera Notch & Status indicator for device charm */}
        <div className="hidden md:flex bg-neutral-950 h-6 w-full justify-center items-center relative z-20">
          <div className="w-28 h-4 bg-neutral-950 rounded-b-xl absolute top-0 flex items-center justify-center gap-1.5 px-3">
            <span className="w-1.5 h-1.5 bg-neutral-800 rounded-full" />
            <span className="w-12 h-1 bg-neutral-800 rounded-xl" />
          </div>
        </div>

        {/* Top Header Section */}
        <header id="app-header" className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 p-4 pt-5 pb-5 text-white flex flex-col gap-2 shadow-md relative z-10 transition-all">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <Car className="w-6 h-6 text-emerald-400 animate-pulse" />
              </span>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Fleet Log</h1>
                <p className="text-xs text-neutral-300">Driver Dashboard • INR Currency</p>
              </div>
            </div>
            {/* Status light */}
            <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Active</span>
            </div>
          </div>

          {/* Quick Vehicle & Driver Badge */}
          <div className="mt-2 bg-neutral-800/60 border border-neutral-700/50 rounded-lg p-2 flex items-center justify-between text-[11px] text-neutral-300">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold">{settings.driverName}</span>
            </div>
            <div className="h-3 w-[1px] bg-neutral-700" />
            <div className="flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-mono">{settings.vehicleNumber}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Contents Window */}
        <main id="app-main" className="flex-1 overflow-y-auto bg-neutral-50 px-4 py-4 pb-28 relative">
          
          {/* TOAST NOTIFICATION FLOATER */}
          {toast && (
            <div id="toast-banner" className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg border text-xs max-w-[90%] transition-all duration-300 ${
              toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
              toast.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' :
              'bg-blue-50 text-blue-800 border-blue-200'
            }`}>
              {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0" />}
              <span className="font-semibold">{toast.message}</span>
            </div>
          )}

          {/* TAB 1: DASHBOARD HOME */}
          {activeTab === 'home' && (
            <div id="tab-home" className="space-y-4 animate-fadeIn">
              
              {/* Main Quick Summary Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div id="card-trips" className="bg-white rounded-xl border border-neutral-200/80 p-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:border-indigo-200 transition-all">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">Total Trips</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-2xl font-black text-neutral-800">{stats.totalTrips}</span>
                    <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">Rides</span>
                  </div>
                </div>

                <div id="card-income" className="bg-white rounded-xl border border-emerald-200/80 p-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)] bg-gradient-to-br from-emerald-50/10 to-white hover:border-emerald-300 transition-all">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">Total Net Income</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-2xl font-black text-emerald-600">{formatINR(stats.totalIncome)}</span>
                    <ArrowUpRight className="w-4 h-4 text-emerald-500 shrink-0 self-center" />
                  </div>
                </div>

                <div id="card-km" className="bg-white rounded-xl border border-neutral-200/80 p-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:border-teal-200 transition-all">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">Total KM Run</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-2xl font-black text-neutral-800">{stats.totalKm.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] font-semibold bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded">KM</span>
                  </div>
                </div>

                <div id="card-rent" className="bg-white rounded-xl border border-neutral-200/80 p-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:border-purple-200 transition-all">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">Total Gross Rent</span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-2xl font-black text-neutral-800">{formatINR(stats.totalRent)}</span>
                    <Coins className="w-4 h-4 text-purple-500 shrink-0 self-center" />
                  </div>
                </div>
              </div>

              {/* Informational Legacy notification */}
              {settings.enableLegacyLogs && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-900 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Archive Enabled:</span> Visual numbers include historical seed data ({settings.legacyTrips} trips, {settings.legacyKm} KM, {formatINR(settings.legacyIncome)} Net) representing verified logs. Disable in <b className="cursor-pointer underline" onClick={() => setActiveTab('settings')}>Settings</b>.
                  </div>
                </div>
              )}

              {/* Operational Efficiencies & Analytics bar */}
              <div className="bg-neutral-900 text-white rounded-xl p-3 shadow-md">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2.5 flex items-center justify-between">
                  <span>Operating Metrics</span>
                  <Gauge className="w-4 h-4 text-emerald-400" />
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-neutral-800 p-2 rounded-lg border border-neutral-700">
                    <span className="text-[9px] text-neutral-400 uppercase tracking-wide block">Avg Rent/Km</span>
                    <span className="text-xs font-bold text-neutral-200 mt-1 block">₹{(stats.totalKm > 0 ? (stats.totalRent / stats.totalKm) : 0).toFixed(2)}</span>
                  </div>
                  <div className="bg-neutral-800 p-2 rounded-lg border border-neutral-700">
                    <span className="text-[9px] text-neutral-400 uppercase tracking-wide block">Avg Net/Km</span>
                    <span className="text-xs font-bold text-emerald-400 mt-1 block">₹{stats.averageIncomePerKm.toFixed(2)}</span>
                  </div>
                  <div className="bg-neutral-800 p-2 rounded-lg border border-neutral-700">
                    <span className="text-[9px] text-neutral-400 uppercase tracking-wide block">Expenses/Rent</span>
                    <span className="text-xs font-bold text-rose-400 mt-1 block">{stats.expenseRatio.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Recent Trips Header */}
              <div id="section-trips-list" className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-sm text-neutral-800 tracking-tight">Recent Active Trips ({stats.activeTripsCount})</h3>
                  <button 
                    onClick={() => setActiveTab('trips')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer underline hover:no-underline"
                  >
                    View All <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Minimal dynamic short list */}
                <div className="space-y-2">
                  {trips.slice(0, 3).map((trip) => (
                    <div 
                      key={trip.id}
                      onClick={() => openEditModal(trip)}
                      className="group bg-white rounded-xl border border-neutral-200/80 p-3 shadow-xs hover:shadow-md hover:border-neutral-300 transition-all cursor-pointer relative"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <span className="p-2 bg-neutral-100 rounded-lg shrink-0">
                            {getTripIcon(trip.type)}
                          </span>
                          <div>
                            <h4 className="text-xs font-bold text-neutral-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{trip.title}</h4>
                            <p className="text-[10px] text-neutral-500 font-medium mt-0.5">
                              {trip.date} • <span className="font-mono">{trip.km} KM</span> • {trip.durationHours} hrs
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-extrabold text-neutral-900 block">{formatINR(trip.rentAmount - trip.fuelExpense)}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded mt-1 inline-block ${
                            trip.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {trip.status}
                          </span>
                        </div>
                      </div>

                      {/* Expand indicator visual */}
                      <div className="mt-2.5 pt-2 border-t border-dashed border-neutral-100 flex items-center justify-between text-[10px] text-neutral-400">
                        <span className="italic line-clamp-1 max-w-[80%]">{trip.notes || 'No extra notes logged'}</span>
                        <span className="text-indigo-600 font-medium flex items-center group-hover:underline">Edit <ChevronRight className="w-2.5 h-2.5 ml-0.5" /></span>
                      </div>
                    </div>
                  ))}

                  {trips.length === 0 && (
                    <div className="bg-white rounded-xl border border-dashed border-neutral-300 p-6 text-center text-neutral-500">
                      <Car className="w-8 h-8 mx-auto text-neutral-300 mb-2" />
                      <p className="text-xs font-bold">No active trip items found!</p>
                      <button onClick={openAddModal} className="mt-2 bg-indigo-600 text-white rounded-lg px-3 py-1 text-[11px] font-semibold">
                        Add First Trip
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Informative Help Guide Card */}
              <div className="bg-indigo-50/50 border border-indigo-100/80 rounded-xl p-3.5 flex gap-2.5 items-start">
                <div className="p-1.5 bg-indigo-100 rounded-lg shrink-0">
                  <Coins className="w-4 h-4 text-indigo-700" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-indigo-900">How Net Income is calculated</h4>
                  <p className="text-[11px] text-indigo-800 mt-0.5 leading-relaxed">
                    <b>Net Income = Gross Rent - Expenses (Fuel, Tolls, CNG, Commission)</b>.<br />
                    Keep logs accurate by adjusting these factors in the modal! Custom average fuel calculators can also estimate fuel costs dynamically based on KM parameters.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DETAILED TRIPS LIST */}
          {activeTab === 'trips' && (
            <div id="tab-trips-list" className="space-y-4 animate-fadeIn">
              
              {/* Search bar and Filters */}
              <div className="bg-white rounded-xl border border-neutral-200 p-3 space-y-3 shadow-xs">
                
                {/* Search Text Input */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search trips, notes, routes..."
                    className="w-full pl-9 pr-8 py-1.5 text-xs bg-neutral-100 border border-transparent rounded-lg focus:outline-none focus:border-indigo-400 focus:bg-white transition-all text-neutral-800"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Chips Type selector */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Filter By Service Type</span>
                  <div className="flex flex-wrap gap-1">
                    {['All', 'Airport', 'City', 'Corporate', 'Outstation', 'Other'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`text-[10px] font-semibold px-2 py-1 rounded-md transition-all cursor-pointer ${
                          filterType === type 
                            ? 'bg-indigo-600 text-white shadow-xs' 
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status selector */}
                <div className="flex justify-between items-center pt-2 border-t border-dashed border-neutral-200">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Payment Status</span>
                  <div className="flex gap-1.5">
                    {['All', 'Paid', 'Pending'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilterPayment(status)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                          filterPayment === status
                            ? 'bg-neutral-900 text-white'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Trip Count header */}
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold text-neutral-600">Showing {filteredTrips.length} of {trips.length} active logs</span>
                {(filterType !== 'All' || filterPayment !== 'All' || searchTerm) && (
                  <button 
                    onClick={() => { setFilterType('All'); setFilterPayment('All'); setSearchTerm(''); }}
                    className="text-[10px] font-extrabold text-rose-600 hover:underline flex items-center gap-0.5"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Real list items */}
              <div className="space-y-2.5">
                {filteredTrips.map((trip) => (
                  <div 
                    key={trip.id}
                    onClick={() => openEditModal(trip)}
                    className="bg-white rounded-xl border border-neutral-200 p-3.5 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer hover:border-indigo-100 relative group"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-start gap-2.5">
                        <span className="p-2.5 bg-neutral-100 rounded-lg shrink-0 mt-0.5">
                          {getTripIcon(trip.type)}
                        </span>
                        <div>
                          <h4 className="text-xs font-black text-neutral-900 group-hover:text-indigo-600 transition-colors">{trip.title}</h4>
                          <span className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded font-semibold mt-1 inline-block">
                            {trip.type}
                          </span>
                          
                          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-2 text-[10px] text-neutral-500 font-medium">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-neutral-400 shrink-0" /> {trip.date}
                            </span>
                            <span className="flex items-center gap-1 font-mono">
                              <Gauge className="w-3 h-3 text-neutral-400 shrink-0" /> {trip.km} KM
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-neutral-400 shrink-0" /> {trip.durationHours} Hours
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Financial side metrics */}
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-neutral-900 block">{formatINR(trip.rentAmount)}</span>
                        <span className="text-[10px] text-neutral-400 block mt-0.5">Expense: {formatINR(trip.fuelExpense)}</span>
                        
                        <div className="mt-2.5 flex justify-end gap-1.5 items-center">
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                            trip.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {trip.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expand details block */}
                    {trip.notes && (
                      <p className="mt-3 text-[10px] text-neutral-500 bg-neutral-50/80 rounded border border-neutral-100 p-2 italic leading-normal">
                        {trip.notes}
                      </p>
                    )}

                    {/* Operational edit / delete hover tools */}
                    <div className="mt-3 pt-2.5 border-t border-dashed border-neutral-100 flex justify-between items-center text-[10px]">
                      <span className="text-emerald-600 font-black">Net Income: {formatINR(trip.rentAmount - trip.fuelExpense)}</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); openEditModal(trip); }}
                          className="bg-indigo-50 hover:bg-indigo-100 p-1 rounded text-indigo-700 hover:text-indigo-900 transition-all flex items-center font-bold px-1.5 gap-0.5"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                        <button 
                          onClick={(e) => handleDeleteTrip(trip.id, e)}
                          className="bg-rose-50 hover:bg-rose-100 p-1 rounded text-rose-700 hover:text-rose-900 transition-all flex items-center font-bold px-1.5 gap-0.5"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredTrips.length === 0 && (
                  <div className="bg-white rounded-xl border border-dashed border-neutral-300 p-10 text-center text-neutral-500">
                    <X className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
                    <p className="text-xs font-bold">No trips match the applied search/filters.</p>
                    <button 
                      onClick={() => { setFilterType('All'); setFilterPayment('All'); setSearchTerm(''); }}
                      className="mt-2 bg-neutral-900 text-white rounded-lg px-3 py-1 text-[10px] font-semibold"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: FINANCIAL & FLEET REPORTS */}
          {activeTab === 'reports' && (
            <div id="tab-reports" className="space-y-4 animate-fadeIn">
              
              {/* Report Timeframe Filters Card */}
              <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-extrabold text-xs text-neutral-800 uppercase tracking-widest leading-none">Report Filter System</h3>
                  </div>
                  
                  {/* Mode Selector Toggle Buttons */}
                  <div className="flex bg-neutral-100 p-0.5 rounded-lg border border-neutral-200 shrink-0">
                    <button 
                      type="button"
                      onClick={() => setReportFilterMode('All')}
                      className={`text-[9px] font-bold px-2 py-1 rounded-md transition-all cursor-pointer ${
                        reportFilterMode === 'All' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-700'
                      }`}
                    >
                      All Time
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setReportFilterMode('Month');
                        if (!reportSelectedMonth && availableMonths.length > 0) {
                          setReportSelectedMonth(availableMonths[0]);
                        }
                      }}
                      className={`text-[9px] font-bold px-2 py-1 rounded-md transition-all cursor-pointer ${
                        reportFilterMode === 'Month' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-700'
                      }`}
                    >
                      Monthly
                    </button>
                    <button 
                      type="button"
                      onClick={() => setReportFilterMode('Range')}
                      className={`text-[9px] font-bold px-2 py-1 rounded-md transition-all cursor-pointer ${
                        reportFilterMode === 'Range' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-700'
                      }`}
                    >
                      Date Range
                    </button>
                  </div>
                </div>

                {/* Monthly Grouping Selector */}
                {reportFilterMode === 'Month' && (
                  <div className="space-y-1.5 animate-fadeIn text-xs">
                    <label className="font-bold text-neutral-600 block text-[10px] uppercase tracking-wider">Select Calendar Month</label>
                    <div className="relative">
                      <select
                        value={activeReportMonthToShow}
                        onChange={(e) => setReportSelectedMonth(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 font-bold text-neutral-800 focus:bg-white focus:border-indigo-400 outline-none cursor-pointer appearance-none pr-8"
                      >
                        {availableMonths.map((m) => (
                          <option key={m} value={m}>
                            📅 {formatMonthLabel(m)}
                          </option>
                        ))}
                      </select>
                      <span className="absolute right-3 top-3 pointer-events-none text-neutral-400">▼</span>
                    </div>
                  </div>
                )}

                {/* Custom Date Range Picker */}
                {reportFilterMode === 'Range' && (
                  <div className="space-y-2 animate-fadeIn text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-neutral-500 text-[9px] uppercase tracking-wider block mb-1">Start Date</label>
                        <input 
                          type="date"
                          value={reportStartDate}
                          onChange={(e) => setReportStartDate(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 font-mono font-bold text-neutral-700 focus:bg-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-neutral-500 text-[9px] uppercase tracking-wider block mb-1">End Date</label>
                        <input 
                          type="date"
                          value={reportEndDate}
                          onChange={(e) => setReportEndDate(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-2 font-mono font-bold text-neutral-700 focus:bg-white outline-none"
                        />
                      </div>
                    </div>
                    {(reportStartDate || reportEndDate) && (
                      <button 
                        onClick={() => { setReportStartDate(''); setReportEndDate(''); }}
                        className="text-[10px] text-rose-600 hover:underline font-bold"
                      >
                        Reset system dates ×
                      </button>
                    )}
                  </div>
                )}

                {/* Tiny summary label */}
                <div className="text-[10px] text-neutral-400 italic">
                  {reportFilterMode === 'All' && "Showing cumulative totals including any historical archive metrics configured."}
                  {reportFilterMode === 'Month' && `Aggregating active logs for the specific month of ${formatMonthLabel(activeReportMonthToShow)}.`}
                  {reportFilterMode === 'Range' && (reportStartDate || reportEndDate ? `Filtering active logs from ${reportStartDate || 'Start'} to ${reportEndDate || 'End'}.` : "Select customized start & end boundaries to filter report logs.")}
                </div>
              </div>

              {reportTrips.length === 0 && reportFilterMode !== 'All' ? (
                <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center text-neutral-500 animate-fadeIn">
                  <div className="text-3xl mb-1.5 opacity-75">📅</div>
                  <p className="font-extrabold text-xs text-neutral-800">No rides logged in this timeframe</p>
                  <p className="text-[10px] text-neutral-400 mt-1 max-w-[250px] mx-auto leading-normal">
                    There are no dynamic logs matching this range. Try picking a different month or date range tab.
                  </p>
                </div>
              ) : (
                <>
                  {/* Financial Statement Sheet Card */}
                  <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-xs space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-extrabold text-sm text-neutral-900 leading-none">
                        {reportFilterMode === 'All' && 'All-Time Financial Statement'}
                        {reportFilterMode === 'Month' && `${formatMonthLabel(activeReportMonthToShow)} Statement`}
                        {reportFilterMode === 'Range' && 'Date-Range Statement'}
                      </h3>
                      <span className="text-[9px] font-black uppercase bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded tracking-wider">
                        INR (₹)
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-500 leading-normal">
                      Financial breakdown computed based on the currently applied report filter configuration.
                    </p>

                    {(() => {
                      const displayRent = reportStats.rent + (settings.enableLegacyLogs && reportFilterMode === 'All' ? settings.legacyRent : 0);
                      const displayExpenses = reportStats.expenses + (settings.enableLegacyLogs && reportFilterMode === 'All' ? (settings.legacyRent - settings.legacyIncome) : 0);
                      const displayIncome = reportStats.netIncome + (settings.enableLegacyLogs && reportFilterMode === 'All' ? settings.legacyIncome : 0);
                      const displayKm = reportStats.km + (settings.enableLegacyLogs && reportFilterMode === 'All' ? settings.legacyKm : 0);
                      const displayCount = reportStats.count + (settings.enableLegacyLogs && reportFilterMode === 'All' ? settings.legacyTrips : 0);

                      return (
                        <div className="space-y-2 pt-2 text-xs">
                          <div className="flex justify-between items-center py-1.5 border-b border-neutral-100">
                            <span className="text-neutral-500 font-medium">Gross Billed Rent (Revenue)</span>
                            <span className="font-extrabold text-neutral-800">{formatINR(displayRent)}</span>
                          </div>
                          
                          <div className="flex justify-between items-center py-1.5 border-b border-neutral-100">
                            <span className="text-rose-600 font-semibold flex items-center gap-1">
                              <Fuel className="w-3.5 h-3.5 text-rose-500" /> Operating Fuel/CNG & Expenses
                            </span>
                            <span className="font-extrabold text-rose-600">-{formatINR(displayExpenses)}</span>
                          </div>

                          {settings.enableLegacyLogs && reportFilterMode === 'All' && (
                            <div className="flex justify-between items-center py-1.2 text-[10px] text-neutral-400 bg-neutral-50 px-1 rounded">
                              <span>Included legacy archive offset values</span>
                              <span>+{formatINR(settings.legacyIncome)} Net</span>
                            </div>
                          )}

                          <div className="flex justify-between items-center py-2 text-sm border-t border-dashed border-neutral-200">
                            <span className="font-black text-neutral-950">Net Earnings (Profit)</span>
                            <span className="font-black text-emerald-600 text-base">{formatINR(displayIncome)}</span>
                          </div>

                          {/* Extra descriptive metrics bottom line */}
                          <div className="grid grid-cols-2 gap-2 pt-2.5 mt-1 border-t border-neutral-100 text-[10px] font-bold text-neutral-500">
                            <div className="flex items-center gap-1">
                              <span className="text-xs">🛣️</span>
                              <span>{displayKm.toLocaleString('en-IN')} KM Logged</span>
                            </div>
                            <div className="text-right flex items-center justify-end gap-1">
                              <span>🚘 {displayCount} Bookings</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* SVG VISUAL GRAPH: Service Category Share */}
                  <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-xs space-y-3">
                    <h3 className="font-extrabold text-sm text-neutral-900">Trip Category Distribution</h3>
                    <p className="text-[10px] text-neutral-500">Revenue segments earned across taxi booking types within this timeframe</p>
                    
                    <div className="space-y-2 pt-2">
                      {['Airport', 'City', 'Corporate', 'Outstation', 'Other'].map((category) => {
                        const groupTrips = reportTrips.filter(t => t.type === category);
                        const categorySum = groupTrips.reduce((acc, current) => acc + current.rentAmount, 0);
                        const percent = reportStats.rent > 0 ? (categorySum / reportStats.rent) * 100 : 0;
                        
                        const barColor = 
                          category === 'Airport' ? 'bg-indigo-600' :
                          category === 'City' ? 'bg-emerald-500' :
                          category === 'Corporate' ? 'bg-slate-700' :
                          category === 'Outstation' ? 'bg-amber-500' : 'bg-teal-500';

                        return (
                          <div key={category} className="space-y-1">
                            <div className="flex justify-between text-[11px] font-bold">
                              <span className="text-neutral-700 flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${barColor}`} /> {category} ({groupTrips.length} runs)
                              </span>
                              <span className="text-neutral-900 font-mono">
                                {formatINR(categorySum)} <span className="text-[9px] text-neutral-400 font-normal">({percent.toFixed(0)}%)</span>
                              </span>
                            </div>
                            <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${barColor} transition-all duration-500`} 
                                style={{ width: `${Math.max(percent, percent > 0 ? 2 : 0)}%` }} 
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Live SVG Chart showing Trip Milestones */}
                  <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-xs space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-extrabold text-sm text-neutral-900">Weekly Route Trends</h3>
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">Timeline</span>
                    </div>
                    <p className="text-[10px] text-neutral-500">Chronological analysis of the last 6 bookings matching applied filters.</p>

                    {/* Inline SVG Chart Canvas */}
                    <div className="relative pt-3">
                      <svg viewBox="0 0 320 120" className="w-full h-auto overflow-visible select-none">
                        {/* Background lines */}
                        <line x1="10" y1="10" x2="310" y2="10" stroke="#f0f0f0" strokeWidth="1" />
                        <line x1="10" y1="50" x2="310" y2="50" stroke="#f0f0f0" strokeWidth="1" />
                        <line x1="10" y1="90" x2="310" y2="90" stroke="#f0f0f0" strokeWidth="1" />
                        <line x1="10" y1="110" x2="310" y2="110" stroke="#e5e5e5" strokeWidth="1" />

                        {(() => {
                          const points = reportTrips.slice(0, 6).reverse();
                          if (points.length < 2) {
                            return (
                              <text x="160" y="65" textAnchor="middle" fill="#999" fontSize="9" fontWeight="bold">
                                At least 2 filtered bookings required to construct trends graph.
                              </text>
                            );
                          }

                          const maxVal = Math.max(...points.map(p => p.rentAmount), 5000);
                          const widthStep = 300 / (points.length - 1);

                          // Calculate coordinates for Gross Rent & Net Income
                          const coordinatesRent = points.map((p, i) => {
                            const x = 10 + (i * widthStep);
                            const y = 110 - ((p.rentAmount / maxVal) * 90);
                            return { x, y };
                          });

                          const coordinatesNet = points.map((p, i) => {
                            const x = 10 + (i * widthStep);
                            const netVal = p.rentAmount - p.fuelExpense;
                            const y = 110 - ((netVal / maxVal) * 90);
                            return { x, y };
                          });

                          // Join path coordinates
                          const rentPathString = coordinatesRent.reduce((acc, curr, idx) => {
                            return acc + `${idx === 0 ? 'M' : 'L'} ${curr.x} ${curr.y}`;
                          }, '');

                          const netPathString = coordinatesNet.reduce((acc, curr, idx) => {
                            return acc + `${idx === 0 ? 'M' : 'L'} ${curr.x} ${curr.y}`;
                          }, '');

                          return (
                            <>
                              {/* Rent Billed Path Line */}
                              <path 
                                d={rentPathString} 
                                fill="none" 
                                stroke="#818cf8" 
                                strokeWidth="2.5" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                              />
                              {/* Net Profit Path Line */}
                              <path 
                                d={netPathString} 
                                fill="none" 
                                stroke="#10b981" 
                                strokeWidth="2.5" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                              />

                              {/* Dots coordinates */}
                              {coordinatesRent.map((c, i) => (
                                <circle key={`r-${i}`} cx={c.x} cy={c.y} r="3.5" fill="#818cf8" stroke="#fff" strokeWidth="1.5" />
                              ))}
                              {coordinatesNet.map((c, i) => (
                                <circle key={`n-${i}`} cx={c.x} cy={c.y} r="3.5" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
                              ))}

                              {/* Render dates below */}
                              {points.map((p, i) => {
                                const x = 10 + (i * widthStep);
                                return (
                                  <text key={`txt-${i}`} x={x} y="119" textAnchor="middle" fill="#666" fontSize="7" fontWeight="bold">
                                    {p.date.split('-')[2]}/{p.date.split('-')[1]}
                                  </text>
                                );
                              })}
                            </>
                          );
                        })()}
                      </svg>
                      
                      {/* Legend indicator badges */}
                      <div className="flex justify-center gap-4 mt-2 pt-1 text-[9px] text-neutral-500 font-bold border-t border-neutral-100">
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-1.5 bg-indigo-400 rounded-xs" /> Rent Billed (Gross)
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2.5 h-1.5 bg-emerald-500 rounded-xs" /> Net Earned (Profit)
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 4: APP SETTINGS */}
          {activeTab === 'settings' && (
            <div id="tab-settings" className="space-y-4 animate-fadeIn">
              
              {/* Driver & Cab Details Configuration */}
              <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-xs space-y-3.5">
                <div className="flex items-center gap-1.5 border-b border-neutral-100 pb-2.5">
                  <User className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-extrabold text-xs text-neutral-800 uppercase tracking-widest leading-none">Driver & Vehicle Configuration</h3>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="font-semibold text-neutral-600 block mb-1">Driver Profile Name</label>
                    <input 
                      type="text"
                      value={settings.driverName}
                      onChange={(e) => setSettings(prev => ({ ...prev, driverName: e.target.value }))}
                      className="w-full bg-neutral-100 border border-neutral-200 outline-none rounded-lg p-2 font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-neutral-600 block mb-1">Vehicle Description/Model</label>
                    <input 
                      type="text"
                      value={settings.vehicleModel}
                      onChange={(e) => setSettings(prev => ({ ...prev, vehicleModel: e.target.value }))}
                      className="w-full bg-neutral-100 border border-neutral-200 outline-none rounded-lg p-2 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-neutral-600 block mb-1">Vehicle Number Plate</label>
                      <input 
                        type="text"
                        value={settings.vehicleNumber}
                        onChange={(e) => setSettings(prev => ({ ...prev, vehicleNumber: e.target.value }))}
                        className="w-full bg-neutral-100 border border-neutral-200 outline-none rounded-lg p-2 font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-neutral-600 block mb-1">Avg Exp (Fuel/CNG) per KM</label>
                      <div className="relative">
                        <span className="absolute left-2 top-2.5 font-bold text-neutral-500 text-[10px]">₹</span>
                        <input 
                          type="number"
                          step="0.1"
                          value={settings.fuelRatePerKm}
                          onChange={(e) => setSettings(prev => ({ ...prev, fuelRatePerKm: Number(e.target.value) || 0 }))}
                          className="w-full bg-neutral-100 border border-neutral-200 outline-none rounded-lg p-2 pl-5 font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Historical Archive offset parameters */}
              <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-amber-600" />
                    <h3 className="font-extrabold text-xs text-neutral-800 uppercase tracking-widest leading-none">Historical Metrics archive</h3>
                  </div>
                  <input 
                    type="checkbox"
                    checked={settings.enableLegacyLogs}
                    onChange={(e) => setSettings(prev => ({ ...prev, enableLegacyLogs: e.target.checked }))}
                    className="w-4.5 h-4.5 accent-indigo-600 cursor-pointer"
                  />
                </div>

                <p className="text-[10px] text-neutral-500 leading-normal">
                  Toggle or edit pre-existing historical logs (simulated database) to append offset parameters seamlessly onto live logged active calculations. This allows drivers to trace legacy values (42 rides, ₹41,275 Income) accurately!
                </p>

                {settings.enableLegacyLogs && (
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-dashed border-neutral-200 text-xs text-neutral-600 space-y-1">
                    <div>
                      <span className="text-[9px] uppercase font-semibold text-neutral-400">Archive Car Trips</span>
                      <input 
                        type="number" 
                        value={settings.legacyTrips} 
                        onChange={(e) => setSettings(prev => ({ ...prev, legacyTrips: Number(e.target.value) || 0 }))}
                        className="w-full bg-neutral-50 border border-neutral-200 p-1.5 rounded-md font-bold mt-1" 
                      />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-semibold text-neutral-400">Archive Distance (KM)</span>
                      <input 
                        type="number" 
                        value={settings.legacyKm}
                        onChange={(e) => setSettings(prev => ({ ...prev, legacyKm: Number(e.target.value) || 0 }))}
                        className="w-full bg-neutral-50 border border-neutral-200 p-1.5 rounded-md font-bold mt-1" 
                      />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-semibold text-neutral-400">Archive Gross Billed</span>
                      <input 
                        type="number" 
                        value={settings.legacyRent}
                        onChange={(e) => setSettings(prev => ({ ...prev, legacyRent: Number(e.target.value) || 0 }))}
                        className="w-full bg-neutral-50 border border-neutral-200 p-1.5 rounded-md font-bold mt-1" 
                      />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-semibold text-neutral-400">Archive Net Income (INR)</span>
                      <input 
                        type="number" 
                        value={settings.legacyIncome}
                        onChange={(e) => setSettings(prev => ({ ...prev, legacyIncome: Number(e.target.value) || 0 }))}
                        className="w-full bg-neutral-50 border border-neutral-200 p-1.5 rounded-md font-bold mt-1 text-emerald-600" 
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Hard Clean actions */}
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-2.5">
                <h4 className="text-xs font-extrabold text-rose-900 uppercase tracking-widest">Maintenance Controls</h4>
                <p className="text-[10px] text-rose-800 leading-normal">
                  Need a clean slate? Clearing storage wipes your custom modifications and restores original INR airport transfers and city tours.
                </p>
                <button 
                  onClick={resetAllStoredData}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Revert Database to Demo State
                </button>
              </div>
            </div>
          )}
        </main>

        {/* BOTTOM FLOOR TRIGGER: THE FLOATING PLUS (+) BUTTON */}
        <button 
          id="fab-plus"
          onClick={openAddModal}
          title="Add New Ride Record"
          className="absolute bottom-[66px] right-6 z-30 w-12 h-12 rounded-full bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 flex items-center justify-center transition-transform hover:scale-110 active:scale-95 text-xl font-bold cursor-pointer border-2 border-white"
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* BOTTOM NAVIGATION DRAWER BAR */}
        <nav id="bottom-bar" className="bg-white border-t border-neutral-200/90 h-[60px] flex items-center justify-around px-2 relative z-25 shrink-0 select-none">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-bold transition-all cursor-pointer ${
              activeTab === 'home' ? 'text-indigo-600' : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            <span>🏠</span>
            <span className="mt-0.5">Home</span>
          </button>

          <button 
            onClick={() => setActiveTab('trips')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-bold transition-all cursor-pointer ${
              activeTab === 'trips' ? 'text-indigo-600' : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            <span>📅</span>
            <span className="mt-0.5">Rides</span>
          </button>

          <button 
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-bold transition-all cursor-pointer ${
              activeTab === 'reports' ? 'text-indigo-600' : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            <span>📊</span>
            <span className="mt-0.5">Reports</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-bold transition-all cursor-pointer ${
              activeTab === 'settings' ? 'text-indigo-600' : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            <span>⚙️</span>
            <span className="mt-0.5">Settings</span>
          </button>
        </nav>

        {/* Dynamic Modal / Bottom-Sheet for Adding / Modifying Trip */}
        {isModalOpen && (
          <div id="modal-dimmer" className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xs flex flex-col justify-end z-40 animate-fadeIn">
            <div id="modal-content" className="bg-white rounded-t-2xl max-h-[92%] overflow-y-auto flex flex-col shadow-2xl animate-slideUp">
              
              {/* Modal Header */}
              <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-indigo-100 rounded text-indigo-700">
                    {editingTrip ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </span>
                  <h3 className="font-extrabold text-sm text-neutral-900">
                    {editingTrip ? 'Edit Verified Ride Log' : 'Log New Outing / Ride'}
                  </h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-600 rounded-full hover:bg-neutral-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Data input Form container */}
              <form onSubmit={handleSaveTrip} className="p-4 space-y-3.5 text-xs flex-1">
                
                {/* 1. Trip Route / Title */}
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Route / Booking Label *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Airport Drop Terminal 3"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-neutral-50 focus:bg-white border border-neutral-200 outline-none rounded-lg p-2 font-medium"
                    required
                  />
                </div>

                {/* 2. Service Category */}
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Trip / Service Segment *</label>
                  <select 
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as Trip['type'])}
                    className="w-full bg-neutral-50 outline-none border border-neutral-200 rounded-lg p-2 font-semibold text-neutral-800"
                  >
                    <option value="Airport">🛫 Airport Shuttle</option>
                    <option value="City">🧭 City Touring Ride</option>
                    <option value="Corporate">💼 Corporate Booking / Duty</option>
                    <option value="Outstation">🗺️ Outstation Multiday Outing</option>
                    <option value="Other">🚗 General Other Service</option>
                  </select>
                </div>

                {/* 3. Distance & Duration hours side-by-side */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">Distance (KM) *</label>
                    <input 
                      type="number" 
                      step="any"
                      placeholder="e.g. 120"
                      value={formKm}
                      onChange={(e) => setFormKm(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-neutral-50 outline-none border border-neutral-200 rounded-lg p-2 font-mono font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">Duration (Hours)</label>
                    <input 
                      type="number" 
                      step="any"
                      placeholder="e.g. 6.5"
                      value={formDuration}
                      onChange={(e) => setFormDuration(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-neutral-50 outline-none border border-neutral-200 rounded-lg p-2 font-mono font-bold"
                    />
                  </div>
                </div>

                {/* 4. Financial Billed Rent Input */}
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Total Gross Rent Billed (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 font-bold text-neutral-500">₹</span>
                    <input 
                      type="number" 
                      placeholder="e.g. 4500"
                      value={formRent}
                      onChange={(e) => setFormRent(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-neutral-50 outline-none border border-neutral-200 rounded-lg p-2 pl-6 font-mono font-bold text-neutral-900"
                      required
                    />
                  </div>
                </div>

                {/* 5. Fuel / CNG & Toll Operational Expenses */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-neutral-700">Trip Expenses (Fuel/CNG, Toll) *</label>
                    <button 
                      type="button" 
                      onClick={() => setAutoFuelCalc(!autoFuelCalc)}
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded cursor-pointer ${
                        autoFuelCalc ? 'bg-indigo-50 text-indigo-700' : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {autoFuelCalc ? 'Estimating @ ₹' + settings.fuelRatePerKm + '/km' : 'Manual Expense Input'}
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 font-bold text-neutral-500">₹</span>
                    <input 
                      type="number" 
                      placeholder="Expenses amount"
                      value={formFuel}
                      disabled={autoFuelCalc}
                      onChange={(e) => setFormFuel(e.target.value === '' ? '' : Number(e.target.value))}
                      className={`w-full bg-neutral-50 outline-none border border-neutral-200 rounded-lg p-2 pl-6 font-mono font-bold ${
                        autoFuelCalc ? 'text-neutral-400 bg-neutral-100' : 'text-neutral-900'
                      }`}
                    />
                  </div>
                  {autoFuelCalc && formKm !== '' && (
                    <p className="text-[10px] text-neutral-400 mt-0.5 italic text-right">Fuel auto-estimated via setting params.</p>
                  )}
                </div>

                {/* 6. Date & Payment status line */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">Booking Date</label>
                    <input 
                      type="date" 
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full bg-neutral-50 outline-none border border-neutral-200 rounded-lg p-2 font-mono font-bold text-neutral-700"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">Collection Status</label>
                    <div className="flex gap-1.5 mt-0.5">
                      {['Paid', 'Pending'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setFormStatus(opt as Trip['status'])}
                          className={`flex-1 py-1.5 font-bold rounded-lg cursor-pointer ${
                            formStatus === opt 
                              ? (opt === 'Paid' ? 'bg-emerald-500 text-white shadow-xs' : 'bg-rose-500 text-white shadow-xs')
                              : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 7. Extra details description */}
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">Booking Notes / Customer Info</label>
                  <textarea 
                    rows={2}
                    placeholder="Add passengers name, contact info, intermediate stopping nodes or details..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full bg-neutral-50 focus:bg-white border border-neutral-200 outline-none rounded-lg p-2 font-medium"
                  />
                </div>

                {/* Buttons controls */}
                <div className="space-y-2 pt-2 border-t border-neutral-100">
                  <button 
                    type="submit"
                    className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-extrabold p-3 rounded-xl transition-colors cursor-pointer text-xs"
                  >
                    {editingTrip ? 'Save Modifications' : 'Commit & Log Ride'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-bold p-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
