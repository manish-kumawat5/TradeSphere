import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  User, Mail, Phone, Calendar, Shield, CreditCard, 
  ChevronRight, Edit2, Check, X, AlertCircle, Loader2,
  Lock, Key, Sliders, Cpu, Eye, FileText
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user: authUser, checkAuth } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit States
  const [editField, setEditField] = useState(null); // 'name', 'phone', 'dob', 'marital', 'income'
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    dob: '',
    maritalStatus: '',
    incomeRange: ''
  });

  // Fetch full profile from DB
  async function fetchProfile() {
    try {
      const { data } = await api.get('/profile');
      if (data.success) {
        const p = data.data;
        setProfile(p);
        setFormData({
          name: p.name || '',
          phone: p.phone || '',
          dob: p.dob ? p.dob.substring(0, 10) : '',
          maritalStatus: p.maritalStatus || '',
          incomeRange: p.incomeRange || ''
        });
      }
    } catch (err) {
      console.error('Failed to load profile details', err);
      toast.error('Failed to load profile details');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (field) => {
    setSaving(true);
    try {
      const payload = {};
      if (field === 'name') payload.name = formData.name;
      if (field === 'phone') payload.phone = formData.phone;
      if (field === 'dob') payload.dob = formData.dob;

      // Note: Backend profile.controller supports updating name, phone, dob
      const { data } = await api.put('/profile', payload);
      if (data.success) {
        toast.success(`${field.toUpperCase()} updated successfully`);
        setProfile({ ...profile, ...data.data });
        setEditField(null);
        await checkAuth(); // Refresh global auth state
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || `Failed to update ${field}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = (field) => {
    if (profile) {
      setFormData({
        ...formData,
        [field]: field === 'dob' && profile.dob ? profile.dob.substring(0, 10) : profile[field] || ''
      });
    }
    setEditField(null);
  };

  // Helper to mask emails
  const maskEmail = (email) => {
    if (!email) return '';
    const [name, domain] = email.split('@');
    if (name.length <= 3) return email;
    return `${name.substring(0, 3)}*************@${domain}`;
  };

  // Helper to mask phone numbers
  const maskPhone = (phone) => {
    if (!phone) return '';
    if (phone.length < 5) return phone;
    return `*****${phone.substring(phone.length - 5)}`;
  };

  // Helper to mask PAN
  const maskPan = (pan) => {
    if (!pan) return '';
    if (pan.length < 4) return pan;
    return `******${pan.substring(pan.length - 4)}`;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
        <p className="text-muted text-sm font-semibold">Loading profile information...</p>
      </div>
    );
  }

  const userInitial = profile?.name?.[0]?.toUpperCase() || 'U';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      
      {/* Outer Grid: Left Menu & Right Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Side: Avatar Card & Tab Links */}
        <div className="md:col-span-4 space-y-6">
          
          {/* Profile Card */}
          <div className="glass-card p-6 bg-[var(--bg-card)] border border-[var(--border-subtle)] text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center border-2 border-emerald-500/20 mb-4 shadow-xl">
              <span className="text-[#00D09C] font-extrabold text-3xl">{userInitial}</span>
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">{profile?.name || 'User'}</h2>
            <p className="text-xs text-[var(--text-muted)] font-medium mb-2">{profile?.email || ''}</p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-[#00D09C] border border-emerald-500/20">
              <Shield className="w-3.5 h-3.5" />
              KYC {profile?.kycStatus || 'NOT_STARTED'}
            </span>
          </div>

          {/* Navigation Links Column */}
          <div className="glass-card bg-[var(--bg-card)] border border-[var(--border-subtle)] overflow-hidden rounded-2xl">
            <div className="flex flex-col">
              {[
                { label: 'Basic Details', active: true, icon: User },
                { label: 'Reports', active: false, icon: FileText, to: '/reports' },
                { label: 'Change Password', active: false, icon: Lock },
                { label: 'Change Groww PIN', active: false, icon: Key },
                { label: 'Trading controls', active: false, icon: Sliders },
                { label: 'Trading APIs', active: false, icon: Cpu },
                { label: 'Sell authorisation mode', active: false, icon: Eye },
                { label: 'Trading Details', active: false, icon: CreditCard }
              ].map((item, idx) => {
                const ItemIcon = item.icon;
                const linkClass = `flex items-center justify-between px-5 py-4 text-sm font-bold border-b border-[var(--border-subtle)] transition-colors last:border-b-0 ${
                  item.active 
                    ? 'bg-[var(--bg-elevated)]/25 text-[#00D09C] border-l-4 border-l-[#00D09C]' 
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]/30 hover:text-[var(--text-primary)]'
                }`;
                
                if (item.to) {
                  return (
                    <Link key={idx} to={item.to} className={linkClass}>
                      <span className="flex items-center gap-3">
                        <ItemIcon className="w-4.5 h-4.5" />
                        {item.label}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                    </Link>
                  );
                }

                return (
                  <div key={idx} className={`${linkClass} cursor-not-allowed opacity-75`}>
                    <span className="flex items-center gap-3">
                      <ItemIcon className="w-4.5 h-4.5" />
                      {item.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Tab Contents (Personal Details) */}
        <div className="md:col-span-8">
          
          <div className="glass-card p-6 md:p-8 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl">
            <div className="border-b border-[var(--border-subtle)] pb-5 mb-6">
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Personal Details</h1>
              <p className="text-xs text-[var(--text-muted)] font-bold mt-1.5 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[var(--text-muted)]" />
                PAN - <span className="font-mono text-[var(--text-primary)]">
                  {profile?.panNumber ? maskPan(profile.panNumber) : <span className="text-[var(--text-muted)] italic">Not added yet</span>}
                </span>
              </p>
            </div>

            {/* Fields Grid */}
            <div className="space-y-6">
              
              {/* Full Name */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-[var(--border-subtle)]">
                <div>
                  <span className="text-[11px] text-[var(--text-muted)] uppercase font-extrabold tracking-wider">Full Name</span>
                  {editField === 'name' ? (
                    <div className="flex items-center gap-2 mt-1.5">
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="px-3 py-1.5 text-sm rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] focus:outline-none focus:border-[#00D09C] text-[var(--text-primary)] font-bold"
                        placeholder="Enter full name"
                      />
                      <button 
                        onClick={() => handleSave('name')}
                        disabled={saving || !formData.name.trim()}
                        className="p-1.5 rounded-lg bg-emerald-500/10 text-[#00D09C] hover:bg-emerald-500/20"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleCancel('name')}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm font-bold mt-1">
                      {profile?.name ? (
                        <span className="text-[var(--text-primary)]">{profile.name}</span>
                      ) : (
                        <span className="text-[var(--text-muted)] italic">Not added yet</span>
                      )}
                    </p>
                  )}
                </div>
                {editField !== 'name' && (
                  <button 
                    onClick={() => setEditField('name')}
                    className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]/40 transition-all self-start"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Date of Birth */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-[var(--border-subtle)]">
                <div>
                  <span className="text-[11px] text-[var(--text-muted)] uppercase font-extrabold tracking-wider">Date of Birth</span>
                  {editField === 'dob' ? (
                    <div className="flex items-center gap-2 mt-1.5">
                      <input 
                        type="date" 
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        className="px-3 py-1.5 text-sm rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] focus:outline-none focus:border-[#00D09C] text-[var(--text-primary)] font-bold"
                      />
                      <button 
                        onClick={() => handleSave('dob')}
                        disabled={saving}
                        className="p-1.5 rounded-lg bg-emerald-500/10 text-[#00D09C] hover:bg-emerald-500/20"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleCancel('dob')}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm font-bold mt-1">
                      {profile?.dob ? (
                        <span className="text-[var(--text-primary)]">{new Date(profile.dob).toLocaleDateString('en-IN')}</span>
                      ) : (
                        <span className="text-[var(--text-muted)] italic">Not added yet</span>
                      )}
                    </p>
                  )}
                </div>
                {editField !== 'dob' && (
                  <button 
                    onClick={() => setEditField('dob')}
                    className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]/40 transition-all self-start"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Mobile Number */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-[var(--border-subtle)]">
                <div>
                  <span className="text-[11px] text-[var(--text-muted)] uppercase font-extrabold tracking-wider">Mobile Number</span>
                  {editField === 'phone' ? (
                    <div className="flex items-center gap-2 mt-1.5">
                      <input 
                        type="text" 
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="px-3 py-1.5 text-sm rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] focus:outline-none focus:border-[#00D09C] text-[var(--text-primary)] font-bold"
                        placeholder="Enter phone number"
                      />
                      <button 
                        onClick={() => handleSave('phone')}
                        disabled={saving}
                        className="p-1.5 rounded-lg bg-emerald-500/10 text-[#00D09C] hover:bg-emerald-500/20"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleCancel('phone')}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm font-bold mt-1">
                      {profile?.phone ? (
                        <span className="text-[var(--text-primary)]">{maskPhone(profile.phone)}</span>
                      ) : (
                        <span className="text-[var(--text-muted)] italic">Not added yet</span>
                      )}
                    </p>
                  )}
                </div>
                {editField !== 'phone' && (
                  <button 
                    onClick={() => setEditField('phone')}
                    className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]/40 transition-all self-start"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Email Address */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-[var(--border-subtle)]">
                <div>
                  <span className="text-[11px] text-[var(--text-muted)] uppercase font-extrabold tracking-wider">Email Address</span>
                  <p className="text-sm font-bold mt-1">
                    {profile?.email ? (
                      <span className="text-[var(--text-primary)]">{maskEmail(profile.email)}</span>
                    ) : (
                      <span className="text-[var(--text-muted)] italic">Not added yet</span>
                    )}
                  </p>
                </div>
                <button 
                  onClick={() => toast.error('Email address cannot be changed')}
                  className="p-2 rounded-lg text-[var(--text-muted)] cursor-not-allowed self-start"
                  title="Email cannot be changed"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {/* Marital Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-[var(--border-subtle)]">
                <div>
                  <span className="text-[11px] text-[var(--text-muted)] uppercase font-extrabold tracking-wider">Marital Status</span>
                  {editField === 'marital' ? (
                    <div className="flex items-center gap-2 mt-1.5">
                      <select
                        value={formData.maritalStatus}
                        onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                        className="px-3 py-1.5 text-sm rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] focus:outline-none focus:border-[#00D09C] text-[var(--text-primary)] font-bold"
                      >
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                      </select>
                      <button 
                        onClick={() => {
                          setProfile({ ...profile, maritalStatus: formData.maritalStatus });
                          setEditField(null);
                          toast.success('Marital status updated');
                        }}
                        className="p-1.5 rounded-lg bg-emerald-500/10 text-[#00D09C] hover:bg-emerald-500/20"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setEditField(null)}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm font-bold mt-1">
                      {profile?.maritalStatus ? (
                        <span className="text-[var(--text-primary)]">{profile.maritalStatus}</span>
                      ) : (
                        <span className="text-[var(--text-muted)] italic">Not added yet</span>
                      )}
                    </p>
                  )}
                </div>
                {editField !== 'marital' && (
                  <button 
                    onClick={() => setEditField('marital')}
                    className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]/40 transition-all self-start"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Gender */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-[var(--border-subtle)]">
                <div>
                  <span className="text-[11px] text-[var(--text-muted)] uppercase font-extrabold tracking-wider">Gender</span>
                  <p className="text-sm font-bold mt-1">
                    {profile?.gender ? (
                      <span className="text-[var(--text-primary)]">{profile.gender}</span>
                    ) : (
                      <span className="text-[var(--text-muted)] italic">Not added yet</span>
                    )}
                  </p>
                </div>
                <button 
                  onClick={() => toast.error('Gender cannot be changed')}
                  className="p-2 rounded-lg text-[var(--text-muted)] cursor-not-allowed self-start"
                  title="Gender cannot be changed"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {/* Income Range */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                <div>
                  <span className="text-[11px] text-[var(--text-muted)] uppercase font-extrabold tracking-wider">Income Range</span>
                  {editField === 'income' ? (
                    <div className="flex items-center gap-2 mt-1.5">
                      <select
                        value={formData.incomeRange}
                        onChange={(e) => setFormData({ ...formData, incomeRange: e.target.value })}
                        className="px-3 py-1.5 text-sm rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] focus:outline-none focus:border-[#00D09C] text-[var(--text-primary)] font-bold"
                      >
                        <option value="Below 1 Lakh">Below 1 Lakh</option>
                        <option value="1-5 Lakhs">1-5 Lakhs</option>
                        <option value="5-10 Lakhs">5-10 Lakhs</option>
                        <option value="10-25 Lakhs">10-25 Lakhs</option>
                        <option value="Above 25 Lakhs">Above 25 Lakhs</option>
                      </select>
                      <button 
                        onClick={() => {
                          setProfile({ ...profile, incomeRange: formData.incomeRange });
                          setEditField(null);
                          toast.success('Income range updated');
                        }}
                        className="p-1.5 rounded-lg bg-emerald-500/10 text-[#00D09C] hover:bg-emerald-500/20"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setEditField(null)}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm font-bold mt-1">
                      {profile?.incomeRange ? (
                        <span className="text-[var(--text-primary)]">{profile.incomeRange}</span>
                      ) : (
                        <span className="text-[var(--text-muted)] italic">Not added yet</span>
                      )}
                    </p>
                  )}
                </div>
                {editField !== 'income' && (
                  <button 
                    onClick={() => setEditField('income')}
                    className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]/40 transition-all self-start"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
