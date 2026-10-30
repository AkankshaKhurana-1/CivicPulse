'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IssueCategory, Report, LocationSource, Incident } from '@/lib/types';
import { mockStore } from '@/lib/db/mock-store';
import { suggestCategoryAndTitle, extractImageExifMetadata } from '@/lib/engines/ai-adapter';
import { findDuplicateIncidents } from '@/lib/engines/duplicates';
import { LocationPicker, LocationPickerValue } from '@/components/map/LocationPicker';
import {
  Trash2, AlertTriangle, Droplets, Car, Lightbulb, Footprints, Accessibility, HelpCircle,
  MapPin, Camera, CheckCircle2, ArrowRight, ArrowLeft, Sparkles, ShieldCheck,
  ThumbsUp, Info, Map as MapIcon, AlertCircle,
} from 'lucide-react';

const CATEGORY_OPTIONS: { id: IssueCategory; label: string; icon: any; description: string }[] = [
  { id: 'plastic_litter', label: 'Plastic Litter & Waste Dump', icon: Trash2, description: 'Single-use plastic, commercial packaging waste on roads' },
  { id: 'blocked_drain', label: 'Blocked Stormwater Drain', icon: AlertTriangle, description: 'Choked concrete drain line, silt accumulation' },
  { id: 'waterlogging', label: 'Waterlogging & Inundation', icon: Droplets, description: 'Knee-deep standing water on traffic lane' },
  { id: 'pothole', label: 'Pothole & Asphalt Damage', icon: Car, description: 'Crater-like potholes, bitumen binder washout' },
  { id: 'broken_streetlight', label: 'Broken / Unlit Streetlight', icon: Lightbulb, description: 'Non-functional street lamps, dark corridor' },
  { id: 'damaged_footpath', label: 'Damaged Footpath / Open Pit', icon: Footprints, description: 'Broken pedestrian slabs, un-covered drain pits' },
  { id: 'accessibility_barrier', label: 'Accessibility Ramp Barrier', icon: Accessibility, description: 'Blocked tactile paving or wheelchair ramp' },
  { id: 'overflowing_waste', label: 'Overflowing Waste Dumpster', icon: Trash2, description: 'Secondary dumpster spilling over onto road' },
  { id: 'other', label: 'Other Civic Hazard', icon: HelpCircle, description: 'General public infrastructure maintenance problem' },
];

export function MultiStepReportForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Form State
  const [category, setCategory] = useState<IssueCategory>('pothole');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80'
  );

  // Location State (Set via LocationPicker interactive map)
  const [lat, setLat] = useState<number>(30.7333);
  const [lng, setLng] = useState<number>(76.7794);
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(15);
  const [locationSource, setLocationSource] = useState<LocationSource>('manual_pin');
  const [captureTimestamp, setCaptureTimestamp] = useState<string>(new Date().toISOString());
  const [address, setAddress] = useState<string>('Sector 17, Chandigarh 160017');
  const [city, setCity] = useState<string>('Chandigarh');
  const [locationConfirmed, setLocationConfirmed] = useState<boolean>(false);

  // AI & Duplicate Suggestions
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [exifNotice, setExifNotice] = useState<string | null>(null);
  const [createdReport, setCreatedReport] = useState<Report | null>(null);
  const [supportedIncident, setSupportedIncident] = useState<Incident | null>(null);

  // Handle AI Title & Category Suggestion
  const handleDescriptionChange = async (val: string) => {
    setDescription(val);
    if (val.length > 12 && !title) {
      setAiAnalyzing(true);
      const res = await suggestCategoryAndTitle(val, category);
      setTitle(res.suggestedTitle);
      setAiSuggestion(res.explanation);
      setAiAnalyzing(false);
    }
  };

  // Handle photo URL and optional EXIF inspection
  const handlePhotoUrlChange = (url: string) => {
    setPhotoUrl(url);
    const exif = extractImageExifMetadata(url);
    if (exif.hasGps && exif.lat && exif.lng) {
      setExifNotice(`Optional EXIF Geotag Detected: (${exif.lat.toFixed(4)}, ${exif.lng.toFixed(4)})`);
    } else {
      setExifNotice(null);
    }
  };

  // Apply optional EXIF GPS
  const handleApplyExif = () => {
    const exif = extractImageExifMetadata(photoUrl);
    if (exif.lat && exif.lng) {
      setLat(exif.lat);
      setLng(exif.lng);
      setLocationSource('exif');
      setGpsAccuracy(8);
      setAddress(`Camera Geotag Location (${exif.lat.toFixed(4)}, ${exif.lng.toFixed(4)})`);
      setLocationConfirmed(true);
      setExifNotice('EXIF Geotag coordinates applied.');
    }
  };

  // Callback when user confirms location in Map LocationPicker
  const handleLocationPickerConfirm = (loc: LocationPickerValue) => {
    setLat(loc.lat);
    setLng(loc.lng);
    setAddress(loc.address);
    if (loc.city) setCity(loc.city);
    if (loc.accuracy) {
      setGpsAccuracy(loc.accuracy);
    }
    if (loc.locationSource === 'search' || (loc.locationSource as string) === 'address_geocoded') {
      setLocationSource('address_geocoded');
    } else if (loc.locationSource === 'gps') {
      setLocationSource('gps');
    } else if (loc.locationSource === 'manual_pin') {
      setLocationSource('manual_pin');
    } else if (loc.accuracy) {
      setLocationSource('gps');
    } else {
      setLocationSource('manual_pin');
    }
    setCaptureTimestamp(new Date().toISOString());
    setLocationConfirmed(true);
  };

  // Hybrid 5-Signal Duplicate Scan with dynamic candidate radius
  const nearbyCandidates = findDuplicateIncidents(
    {
      category,
      lat,
      lng,
      accuracyMeters: gpsAccuracy,
      description: `${title} ${description}`,
      imageUrl: photoUrl,
      timestamp: captureTimestamp,
    },
    mockStore.getIncidents()
  );

  // Option 1: Citizen Supports Existing Incident
  const handleSupportExisting = (incidentId: string) => {
    const updated = mockStore.supportExistingIncident(incidentId, 'usr-citizen-1', 'Aarav Sharma');
    if (updated) {
      setSupportedIncident(updated);
      setStep(5);
    }
  };

  // Option 2: Citizen Submits as Separate Issue
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cityId = city.toLowerCase().includes('delhi')
      ? 'city-delhi'
      : city.toLowerCase().includes('ludhiana')
      ? 'city-ludhiana'
      : 'city-chandigarh';

    const newReport = mockStore.addReport({
      reporter_id: 'usr-citizen-1',
      reporter_name: 'Aarav Sharma',
      category,
      title: title || `${category.replace('_', ' ')} report`,
      description,
      lat,
      lng,
      gps_accuracy: gpsAccuracy,
      location_source: locationSource,
      capture_timestamp: captureTimestamp,
      address,
      city_id: cityId,
      jurisdiction_id: 'jur-central',
      privacy_level: 'PUBLIC',
      images: [photoUrl],
    });

    setCreatedReport(newReport);
    setStep(5);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Wizard Step Progress Bar */}
      <div className="bg-navy-900 text-white p-6 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[11px] uppercase font-bold tracking-widest text-brand-400">Step {step} of 5</span>
            <h2 className="text-xl font-bold">
              {step === 1 && 'Select Issue Category'}
              {step === 2 && 'Provide Details & Photo Evidence'}
              {step === 3 && 'Pinpoint Interactive Map Location'}
              {step === 4 && 'Duplicate Review & Corroboration'}
              {step === 5 && (supportedIncident ? 'Corroboration Recorded' : 'Report Registered Successfully')}
            </h2>
          </div>
          <div className="w-10 h-10 rounded-full bg-navy-800 border border-slate-700 flex items-center justify-center font-bold text-brand-400">
            {step}/5
          </div>
        </div>

        {/* Progress Dots */}
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i <= step ? 'bg-brand-500 shadow-sm shadow-brand-500/50' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step Contents */}
      <div className="p-6 md:p-8">
        {/* STEP 1: Category Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 font-medium">Choose the category that best describes the civic infrastructure hazard:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CATEGORY_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isSelected = category === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setCategory(opt.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start space-x-3 ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50/50 shadow-md ring-1 ring-brand-600'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className={`p-2.5 rounded-lg shrink-0 ${isSelected ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{opt.label}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{opt.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="pt-6 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-brand-600/20"
              >
                <span>Continue to Description</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Description & Photo Evidence */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Detailed Issue Description
              </label>
              <textarea
                value={description}
                onChange={e => handleDescriptionChange(e.target.value)}
                placeholder="Describe the hazard in detail (e.g. Large crater-like pothole on left lane near gate, causing traffic jam)..."
                className="w-full p-3 text-xs text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                rows={4}
                required
              />
            </div>

            {/* Title with AI Assistant Badge */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Issue Title
                </label>
                {aiSuggestion && (
                  <span className="text-[11px] text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded flex items-center">
                    <Sparkles className="w-3 h-3 text-brand-600 mr-1" /> AI Suggestion
                  </span>
                )}
              </div>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Title will auto-generate or type your own..."
                className="w-full p-3 text-xs text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            {/* Photo Upload with optional EXIF check */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Attach Photo Evidence (Image URL / Capture)
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="url"
                  value={photoUrl}
                  onChange={e => handlePhotoUrlChange(e.target.value)}
                  className="flex-1 p-3 text-xs text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="https://..."
                />
              </div>

              {exifNotice && (
                <div className="mt-2 p-2.5 bg-brand-50 border border-brand-200 rounded-lg text-xs text-brand-800 flex items-center justify-between">
                  <span>{exifNotice}</span>
                  <button
                    type="button"
                    onClick={handleApplyExif}
                    className="px-2.5 py-1 bg-brand-600 text-white rounded text-[11px] font-semibold hover:bg-brand-500"
                  >
                    Apply Coordinates
                  </button>
                </div>
              )}

              {photoUrl && (
                <div className="mt-3 relative w-32 h-24 rounded-lg overflow-hidden border border-slate-300 shadow-sm">
                  <img src={photoUrl} alt="Report evidence preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="pt-4 flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-between gap-2.5">
              <button
                onClick={() => setStep(1)}
                className="w-full xs:w-auto px-5 py-2.5 min-h-[44px] text-slate-600 hover:text-slate-900 font-semibold text-xs flex items-center justify-center space-x-1.5 rounded-xl border border-slate-200"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!description.trim()}
                className="w-full xs:w-auto px-6 py-2.5 min-h-[44px] bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-brand-600/20 disabled:opacity-50"
              >
                <span>Continue to Map Location</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Integrated Map Location Picker */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Interactive Location Picker</h4>
              <p className="text-xs text-slate-500">
                Search your landmark/university, use GPS locate, or click and drag the pin to set the exact spot.
              </p>
            </div>

            {/* Embedded Large Interactive LocationPicker */}
            <LocationPicker
              initialLocation={{
                lat,
                lng,
                address,
                city,
                accuracy: gpsAccuracy,
              }}
              onLocationConfirm={handleLocationPickerConfirm}
            />

            <div className="pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                onClick={() => setStep(2)}
                className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] text-slate-600 hover:text-slate-900 font-semibold text-xs flex items-center justify-center space-x-1.5 rounded-xl border border-slate-200"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-3">
                {!locationConfirmed && (
                  <span className="text-xs text-amber-600 font-medium flex items-center justify-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Please confirm location above</span>
                  </span>
                )}
                <button
                  onClick={() => {
                    if (!locationConfirmed) {
                      alert('Please verify and confirm the selected location on the map before proceeding.');
                      return;
                    }
                    setStep(4);
                  }}
                  disabled={!locationConfirmed}
                  className="w-full sm:w-auto px-6 py-2.5 min-h-[44px] bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-brand-600/20"
                >
                  <span>Proceed to Duplicate Scan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Duplicate Scan & Corroboration */}
        {step === 4 && (
          <div className="space-y-6">
            {/* Duplicate Candidates Found */}
            {nearbyCandidates.length > 0 ? (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 text-amber-900 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <h4 className="font-bold text-xs uppercase tracking-wider">
                      {nearbyCandidates.length} Existing Nearby Incident(s) Detected
                    </h4>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-800">
                    {nearbyCandidates[0].recommendation.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs text-amber-800 leading-relaxed">
                  Our hybrid duplicate engine detected an active incident nearby using 5 normalized signals:
                  Geographic distance ({nearbyCandidates[0].distance_meters}m), semantic text ({nearbyCandidates[0].text_similarity}%), category similarity ({nearbyCandidates[0].category_similarity}%), and perceptual image comparison.
                </p>

                {/* Candidate Card */}
                <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{nearbyCandidates[0].incident.title}</span>
                      <span className="text-slate-600 text-xs block">{nearbyCandidates[0].incident.address}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded">
                      Score: {nearbyCandidates[0].duplicate_score}%
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-slate-600">
                    {nearbyCandidates[0].signals_used.map(sig => (
                      <span key={sig} className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {sig}
                      </span>
                    ))}
                  </div>

                  {/* Citizen Choices */}
                  <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => handleSupportExisting(nearbyCandidates[0].incident.id)}
                      className="flex-1 py-2.5 px-3 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 shadow"
                    >
                      <ThumbsUp className="w-4 h-4 text-emerald-300" />
                      <span>Support This Existing Incident (+1 Corroboration)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg border border-slate-300"
                    >
                      Submit as Separate Issue
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-800 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Geospatial Hybrid Scan Passed: No duplicate incidents found within candidate search radius.</span>
              </div>
            )}

            {/* Submission Summary Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">Submission Summary</h4>
              <div className="grid grid-cols-2 gap-3 text-slate-700">
                <div><span className="font-semibold text-slate-900">Category:</span> {category.replace('_', ' ')}</div>
                <div><span className="font-semibold text-slate-900">City & Zone:</span> {city}</div>
                <div><span className="font-semibold text-slate-900">GPS Accuracy:</span> ±{gpsAccuracy}m ({locationSource})</div>
                <div><span className="font-semibold text-slate-900">Capture Time:</span> {new Date(captureTimestamp).toLocaleTimeString()}</div>
                <div className="col-span-2"><span className="font-semibold text-slate-900">Address:</span> {address}</div>
                <div className="col-span-2"><span className="font-semibold text-slate-900">Coordinates:</span> {lat.toFixed(5)}° N, {lng.toFixed(5)}° E</div>
                <div className="col-span-2"><span className="font-semibold text-slate-900">Title:</span> {title}</div>
              </div>
            </div>

            {nearbyCandidates.length === 0 && (
              <div className="pt-4 flex flex-col-reverse xs:flex-row items-stretch xs:items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-full xs:w-auto px-5 py-2.5 min-h-[44px] text-slate-600 hover:text-slate-900 font-semibold text-xs flex items-center justify-center space-x-1.5 rounded-xl border border-slate-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full xs:w-auto px-7 py-3 min-h-[44px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30"
                >
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span>Confirm & Register Report</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: Success & Tracking Reference */}
        {step === 5 && (
          <div className="text-center py-6 space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-100">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            {supportedIncident ? (
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">Corroboration Added to Existing Incident</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Thank you! Your report has been attached as supporting evidence to active incident{' '}
                  <span className="font-mono font-bold text-slate-900">{supportedIncident.id}</span>. Priority score increased to{' '}
                  <span className="font-bold text-emerald-600">{supportedIncident.priority_score}/100</span>.
                </p>
              </div>
            ) : createdReport ? (
              <>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-1">Civic Report Registered</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Your report has been assigned a priority score and routed to the designated municipal engineering queue.
                  </p>
                </div>

                {/* Tracking Reference Code Box */}
                <div className="bg-navy-900 text-white p-6 rounded-2xl max-w-md mx-auto shadow-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">Unique Tracking Code</span>
                  <span className="text-3xl font-mono font-bold text-brand-300 block tracking-wider">{createdReport.reference_code}</span>
                  <p className="text-[11px] text-slate-400">Save this reference code to track resolution progress or receive updates.</p>
                </div>
              </>
            ) : null}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-4">
              <button
                onClick={() => router.push('/citizen/dashboard')}
                className="w-full sm:w-auto px-6 py-2.5 min-h-[44px] bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center"
              >
                View on Citizen Dashboard
              </button>
              <button
                onClick={() => router.push('/map')}
                className="w-full sm:w-auto px-6 py-2.5 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 flex items-center justify-center"
              >
                View on Civic Map
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
