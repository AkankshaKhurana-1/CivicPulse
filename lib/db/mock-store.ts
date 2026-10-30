import {
  Report,
  Incident,
  WorkOrder,
  Evidence,
  AuditEvent,
  DependencyLink,
  City,
  Jurisdiction,
  Agency,
  User,
  UserRole,
  WorkOrderStatus,
  ReportStatus,
  VerificationDecision,
  Notification,
  PriorityConfig,
  DuplicateCandidate,
  InfrastructureAsset,
  RepairVerificationAnalysis,
  RepairMonitoringRecord,
  RecurrenceEvent,
  RootCauseRecommendation,
  MaintenanceInspection,
} from '../types';
import {
  SEED_CITIES,
  SEED_JURISDICTIONS,
  SEED_AGENCIES,
  SEED_USERS,
  SEED_INCIDENTS,
  SEED_REPORTS,
  SEED_WORK_ORDERS,
  SEED_EVIDENCE,
  SEED_DEPENDENCY_LINKS,
  SEED_AUDIT_EVENTS
} from './seed-data';
import {
  SEED_INFRASTRUCTURE_ASSETS,
  SEED_DNA_INCIDENTS,
  SEED_DNA_WORK_ORDERS,
  SEED_DNA_EVIDENCE,
  SEED_DNA_REPORTS,
  SEED_REPAIR_ANALYSES,
  SEED_RECURRENCE_EVENTS,
  SEED_ROOT_CAUSE_RECOMMENDATIONS,
  SEED_MAINTENANCE_INSPECTIONS
} from './seed-dna-data';
import { calculatePriorityScore, DEFAULT_PRIORITY_CONFIG } from '../engines/priority';
import { findDuplicateIncidents } from '../engines/duplicates';
import { analyzeRepairEvidence } from '../engines/repair-accountability';
import { findMatchingInfrastructureAsset, registerIncidentOnAsset, createInfrastructureAssetFromIncident } from '../engines/failure-dna';

const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    user_id: 'usr-citizen-1',
    title: 'Report Work Order Dispatched',
    message: 'Your report CP-2026-9812 has been assigned to MCD Solid Waste & Environmental Services.',
    type: 'WORK_ORDER',
    link: '/citizen/dashboard',
    read: false,
    created_at: '2026-10-01T10:30:00Z',
  },
  {
    id: 'notif-2',
    user_id: 'usr-citizen-1',
    title: 'Field Worker Submitted Evidence',
    message: 'Work order WO-MCD-2026-081 completion evidence submitted by field worker. Pending supervisor verification.',
    type: 'REPORT_STATUS',
    link: '/issues/inc-001',
    read: false,
    created_at: '2026-10-09T17:45:00Z',
  },
  {
    id: 'notif-3',
    user_id: 'usr-citizen-2',
    title: 'Report Corroboration Updated',
    message: 'Your report CP-2026-9890 was corroborated with 8 nearby citizen reports. Priority elevated to CRITICAL.',
    type: 'REPORT_STATUS',
    link: '/issues/inc-003',
    read: true,
    created_at: '2026-10-03T08:00:00Z',
  },
];

class MockStore {
  private cities: City[] = [...SEED_CITIES];
  private jurisdictions: Jurisdiction[] = [...SEED_JURISDICTIONS];
  private agencies: Agency[] = [...SEED_AGENCIES];
  private users: User[] = SEED_USERS.map(u => ({ ...u }));
  private incidents: Incident[] = [...SEED_DNA_INCIDENTS, ...SEED_INCIDENTS];
  private reports: Report[] = [...SEED_DNA_REPORTS, ...SEED_REPORTS];
  private workOrders: WorkOrder[] = [...SEED_DNA_WORK_ORDERS, ...SEED_WORK_ORDERS];
  private evidence: Evidence[] = [...SEED_DNA_EVIDENCE, ...SEED_EVIDENCE];
  private dependencyLinks: DependencyLink[] = [...SEED_DEPENDENCY_LINKS];
  private auditEvents: AuditEvent[] = [...SEED_AUDIT_EVENTS];
  private notifications: Notification[] = [...SEED_NOTIFICATIONS];
  private priorityConfig: PriorityConfig = { ...DEFAULT_PRIORITY_CONFIG };
  private infrastructureAssets: InfrastructureAsset[] = [...SEED_INFRASTRUCTURE_ASSETS];
  private repairAnalyses: RepairVerificationAnalysis[] = [...SEED_REPAIR_ANALYSES];
  private repairMonitoringRecords: RepairMonitoringRecord[] = [];
  private recurrenceEvents: RecurrenceEvent[] = [...SEED_RECURRENCE_EVENTS];
  private rootCauseRecommendations: RootCauseRecommendation[] = [...SEED_ROOT_CAUSE_RECOMMENDATIONS];
  private maintenanceInspections: MaintenanceInspection[] = [...SEED_MAINTENANCE_INSPECTIONS];

  constructor() {
    // Initialize initial incident priority breakdowns using 7-factor engine
    this.incidents.forEach(inc => {
      const priorityRes = calculatePriorityScore(inc.category, {
        description: `${inc.title} ${inc.description}`,
        reportCount: inc.report_count,
        ageInHours: 12,
        isNearSensitiveAsset: true,
        config: this.priorityConfig,
      });
      inc.priority_score = priorityRes.score;
      inc.priority_level = priorityRes.level;
      inc.priority_reason = priorityRes.explanation;
      inc.priority_breakdown = priorityRes.breakdown;
      inc.is_emergency_override = priorityRes.breakdown.is_emergency_override;
      inc.emergency_reason = priorityRes.breakdown.emergency_reason;
    });
  }

  // Priority Config
  getPriorityConfig(): PriorityConfig {
    return this.priorityConfig;
  }

  updatePriorityConfig(config: Partial<PriorityConfig>): PriorityConfig {
    this.priorityConfig = {
      ...this.priorityConfig,
      ...config,
      weights: { ...this.priorityConfig.weights, ...(config.weights || {}) },
      thresholds: { ...this.priorityConfig.thresholds, ...(config.thresholds || {}) },
    };
    return this.priorityConfig;
  }

  // Cities & Jurisdictions
  getCities(): City[] {
    return this.cities;
  }

  getJurisdictions(cityId?: string): Jurisdiction[] {
    if (cityId) return this.jurisdictions.filter(j => j.city_id === cityId);
    return this.jurisdictions;
  }

  getAgencies(cityId?: string): Agency[] {
    if (cityId) return this.agencies.filter(a => a.city_id === cityId);
    return this.agencies;
  }

  getUsers(): User[] {
    return this.users;
  }

  getUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  }

  createUser(userData: Omit<User, 'id' | 'created_at'>): User {
    const existing = this.getUserByEmail(userData.email);
    if (existing) {
      throw new Error(`A user with email ${userData.email} already exists`);
    }

    const newUser: User = {
      id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...userData,
      email: userData.email.toLowerCase().trim(),
      active: true,
      created_at: new Date().toISOString(),
    };

    this.users.unshift(newUser);

    this.addAuditEvent({
      actor_id: newUser.id,
      actor_name: newUser.name,
      actor_role: newUser.role,
      entity_type: 'REPORT',
      entity_id: newUser.id,
      action: 'USER_REGISTERED',
      details: `New ${newUser.role} user account registered for ${newUser.name} (${newUser.email}).`,
      timestamp: newUser.created_at,
    });

    return newUser;
  }

  updateUserRole(userId: string, newRole: UserRole, adminId: string = 'usr-admin-1', adminName: string = 'Administrator'): User | undefined {
    const user = this.getUserById(userId);
    if (!user) return undefined;

    const previousRole = user.role;
    user.role = newRole;

    this.addAuditEvent({
      actor_id: adminId,
      actor_name: adminName,
      actor_role: 'admin',
      entity_type: 'WORK_ORDER',
      entity_id: user.id,
      action: 'ROLE_MODIFIED',
      details: `Administrator ${adminName} updated role for ${user.name} from "${previousRole}" to "${newRole}".`,
      timestamp: new Date().toISOString(),
    });

    return user;
  }

  toggleUserStatus(userId: string, active: boolean, adminId: string = 'usr-admin-1', adminName: string = 'Administrator'): User | undefined {
    const user = this.getUserById(userId);
    if (!user) return undefined;

    user.active = active;

    this.addAuditEvent({
      actor_id: adminId,
      actor_name: adminName,
      actor_role: 'admin',
      entity_type: 'WORK_ORDER',
      entity_id: user.id,
      action: active ? 'ACCOUNT_ACTIVATED' : 'ACCOUNT_DEACTIVATED',
      details: `Administrator ${adminName} ${active ? 'activated' : 'deactivated'} account for ${user.name} (${user.email}).`,
      timestamp: new Date().toISOString(),
    });

    return user;
  }

  // Reports
  getReports(): Report[] {
    return this.reports;
  }

  getReportById(id: string): Report | undefined {
    return this.reports.find(r => r.id === id || r.reference_code === id);
  }

  addReport(reportData: Omit<Report, 'id' | 'reference_code' | 'submitted_at' | 'updated_at' | 'status'>): Report {
    const id = `rep-${Date.now()}`;
    const codeNum = Math.floor(1000 + Math.random() * 9000);
    const reference_code = `CP-2026-${codeNum}`;
    const now = new Date().toISOString();

    const newReport: Report = {
      ...reportData,
      id,
      reference_code,
      status: 'SUBMITTED',
      gps_accuracy: reportData.gps_accuracy || 15.0,
      location_source: reportData.location_source || 'gps',
      capture_timestamp: reportData.capture_timestamp || now,
      submitted_at: now,
      updated_at: now,
    };

    this.reports.unshift(newReport);

    // Automatically create or link to incident
    const incident = this.createOrLinkIncident(newReport);
    newReport.linked_incident_id = incident.id;

    // Log audit event
    this.addAuditEvent({
      actor_id: newReport.reporter_id || 'usr-citizen-1',
      actor_name: newReport.reporter_name || 'Citizen',
      actor_role: 'citizen',
      entity_type: 'REPORT',
      entity_id: newReport.id,
      action: 'REPORT_SUBMITTED',
      details: `Submitted report ${newReport.reference_code} for category ${newReport.category} at ${newReport.address} (GPS accuracy: ±${newReport.gps_accuracy}m, Source: ${newReport.location_source}).`,
      timestamp: now,
    });

    // Notify citizen
    this.addNotification({
      user_id: newReport.reporter_id || 'usr-citizen-1',
      title: 'Report Registered',
      message: `Your report ${newReport.reference_code} for "${newReport.title}" has been registered in the municipal queue.`,
      type: 'REPORT_STATUS',
      link: `/citizen/dashboard`,
    });

    return newReport;
  }

  // Support / Corroborate an Existing Incident
  supportExistingIncident(incidentId: string, citizenId: string, citizenName: string): Incident | undefined {
    const incident = this.getIncidentById(incidentId);
    if (!incident) return undefined;

    const now = new Date().toISOString();
    incident.report_count += 1;
    incident.last_observed_at = now;

    const ageHours = (new Date(now).getTime() - new Date(incident.first_reported_at).getTime()) / (1000 * 3600);
    const updatedPriority = calculatePriorityScore(incident.category, {
      reportCount: incident.report_count,
      ageInHours: ageHours,
      isNearSensitiveAsset: true,
      description: incident.description,
      config: this.priorityConfig,
    });

    incident.priority_score = updatedPriority.score;
    incident.priority_level = updatedPriority.level;
    incident.priority_reason = updatedPriority.explanation;
    incident.priority_breakdown = updatedPriority.breakdown;

    this.addAuditEvent({
      actor_id: citizenId,
      actor_name: citizenName,
      actor_role: 'citizen',
      entity_type: 'INCIDENT',
      entity_id: incident.id,
      action: 'INCIDENT_CORROBORATED',
      details: `Citizen ${citizenName} supported/corroborated active incident. Report count increased to ${incident.report_count}. Priority score updated to ${incident.priority_score}.`,
      timestamp: now,
    });

    this.addNotification({
      user_id: citizenId,
      title: 'Incident Supported',
      message: `You supported "${incident.title}". Corroboration score updated to ${incident.priority_score}/100.`,
      type: 'REPORT_STATUS',
      link: `/issues/${incident.id}`,
    });

    return incident;
  }

  // Incidents
  getIncidents(): Incident[] {
    return this.incidents;
  }

  getIncidentById(id: string): Incident | undefined {
    return this.incidents.find(i => i.id === id);
  }

  private createOrLinkIncident(report: Report): Incident {
    // Check if there is an existing nearby incident (within ~200m) of same category
    const existing = this.incidents.find(
      i =>
        i.category === report.category &&
        i.city_id === report.city_id &&
        Math.abs(i.lat - report.lat) < 0.003 &&
        Math.abs(i.lng - report.lng) < 0.003
    );

    const now = new Date().toISOString();

    if (existing) {
      existing.report_count += 1;
      existing.last_observed_at = now;
      if (!existing.linked_report_ids.includes(report.id)) {
        existing.linked_report_ids.push(report.id);
      }

      // Recalculate priority with increased corroboration and age
      const ageHours = (new Date(now).getTime() - new Date(existing.first_reported_at).getTime()) / (1000 * 3600);
      const updatedPriority = calculatePriorityScore(existing.category, {
        description: existing.description,
        reportCount: existing.report_count,
        ageInHours: ageHours,
        isNearSensitiveAsset: true,
        config: this.priorityConfig,
      });

      existing.priority_score = updatedPriority.score;
      existing.priority_level = updatedPriority.level;
      existing.priority_reason = updatedPriority.explanation;
      existing.priority_breakdown = updatedPriority.breakdown;
      existing.is_emergency_override = updatedPriority.breakdown.is_emergency_override;
      existing.emergency_reason = updatedPriority.breakdown.emergency_reason;

      return existing;
    }

    // Calculate 7-Factor Priority Score & Emergency Check
    const priorityRes = calculatePriorityScore(report.category, {
      description: `${report.title} ${report.description}`,
      reportCount: 1,
      ageInHours: 0,
      isNearSensitiveAsset: true,
      config: this.priorityConfig,
    });

    // Create new incident
    const newIncident: Incident = {
      id: `inc-${Date.now()}`,
      category: report.category,
      title: report.title,
      description: report.description,
      lat: report.lat,
      lng: report.lng,
      address: report.address,
      city_id: report.city_id,
      jurisdiction_id: report.jurisdiction_id,
      priority_score: priorityRes.score,
      priority_level: priorityRes.level,
      priority_reason: priorityRes.explanation,
      priority_breakdown: priorityRes.breakdown,
      is_emergency_override: priorityRes.breakdown.is_emergency_override,
      emergency_reason: priorityRes.breakdown.emergency_reason,
      status: 'SUBMITTED',
      report_count: 1,
      first_reported_at: now,
      last_observed_at: now,
      linked_report_ids: [report.id],
    };

    this.incidents.unshift(newIncident);

    // Link or create physical infrastructure asset
    const matchingAsset = findMatchingInfrastructureAsset(newIncident, this.infrastructureAssets);
    if (matchingAsset) {
      const { updatedAsset, recurrenceEvent, recommendation } = registerIncidentOnAsset(
        matchingAsset,
        newIncident,
        this.workOrders
      );
      if (recurrenceEvent) {
        this.recurrenceEvents.unshift(recurrenceEvent);
      }
      if (recommendation && !this.rootCauseRecommendations.some(r => r.infrastructure_id === updatedAsset.id)) {
        this.rootCauseRecommendations.unshift(recommendation);
      }
    } else {
      const newAsset = createInfrastructureAssetFromIncident(newIncident);
      this.infrastructureAssets.unshift(newAsset);
    }

    // Auto-create initial work order
    this.createWorkOrderForIncident(newIncident);

    return newIncident;
  }

  // Work Orders
  getWorkOrders(): WorkOrder[] {
    return this.workOrders;
  }

  getWorkOrderById(id: string): WorkOrder | undefined {
    return this.workOrders.find(w => w.id === id || w.reference_code === id);
  }

  private createWorkOrderForIncident(incident: Incident): WorkOrder {
    const id = `wo-${Date.now()}`;
    const codeNum = Math.floor(100 + Math.random() * 900);
    const reference_code = `WO-AUTO-2026-${codeNum}`;
    const now = new Date();
    const dueHours = incident.priority_level === 'CRITICAL' ? 12 : incident.priority_level === 'HIGH' ? 24 : 48;
    const due = new Date(now.getTime() + dueHours * 60 * 60 * 1000);

    // Find agency
    const agency = this.agencies.find(a => a.category_coverage.includes(incident.category)) || this.agencies[0];

    const newWO: WorkOrder = {
      id,
      reference_code,
      incident_id: incident.id,
      agency_id: agency.id,
      agency_name: agency.name,
      status: 'NEW',
      created_at: now.toISOString(),
      due_at: due.toISOString(),
      sla_breached: false,
      priority_level: incident.priority_level,
    };

    this.workOrders.unshift(newWO);
    return newWO;
  }

  assignWorkOrder(workOrderId: string, workerId: string, workerName: string, team: string, officerName: string): WorkOrder | undefined {
    const wo = this.getWorkOrderById(workOrderId);
    if (!wo) return undefined;

    wo.assigned_worker_id = workerId;
    wo.assigned_worker_name = workerName;
    wo.assigned_team = team;
    wo.status = 'ASSIGNED';
    wo.acknowledged_at = new Date().toISOString();

    const incident = this.getIncidentById(wo.incident_id);
    if (incident) incident.status = 'ASSIGNED';

    this.addAuditEvent({
      actor_id: 'usr-officer-1',
      actor_name: officerName,
      actor_role: 'officer',
      entity_type: 'WORK_ORDER',
      entity_id: wo.id,
      action: 'WORKER_ASSIGNED',
      details: `Assigned Work Order ${wo.reference_code} to ${workerName} (${team}).`,
      timestamp: new Date().toISOString(),
    });

    // Notify field worker
    this.addNotification({
      user_id: workerId,
      title: 'New Work Order Assigned',
      message: `You have been assigned ${wo.reference_code}: ${incident?.title || 'Civic infrastructure repair'}.`,
      type: 'WORK_ORDER',
      link: `/worker/dashboard`,
    });

    return wo;
  }

  submitWorkOrderCompletion(workOrderId: string, notes: string, afterPhotoUrl: string, workerName: string): WorkOrder | undefined {
    const wo = this.getWorkOrderById(workOrderId);
    if (!wo) return undefined;

    const now = new Date().toISOString();
    wo.status = 'COMPLETED_PENDING_VERIFICATION';
    wo.completed_at = now;
    wo.resolution_notes = notes;

    const incident = this.getIncidentById(wo.incident_id);
    if (incident) incident.status = 'COMPLETED_PENDING_VERIFICATION';

    // Add Evidence
    this.evidence.unshift({
      id: `ev-${Date.now()}`,
      work_order_id: wo.id,
      uploader_id: wo.assigned_worker_id || 'usr-worker-1',
      uploader_role: 'worker',
      evidence_type: 'AFTER_WORK',
      url: afterPhotoUrl,
      captured_at: now,
      uploaded_at: now,
      ai_flagged: false,
    });

    this.addAuditEvent({
      actor_id: wo.assigned_worker_id || 'usr-worker-1',
      actor_name: workerName,
      actor_role: 'worker',
      entity_type: 'WORK_ORDER',
      entity_id: wo.id,
      action: 'COMPLETION_SUBMITTED',
      details: `Field Worker submitted work order completion with after-work evidence photo.`,
      timestamp: now,
    });

    // Notify supervisor
    this.addNotification({
      user_id: 'usr-oversight-1',
      title: 'Evidence Awaiting Verification',
      message: `${wo.reference_code} completed by ${workerName}. Ready for side-by-side photo review.`,
      type: 'WORK_ORDER',
      link: `/oversight/dashboard`,
    });

    return wo;
  }

  reviewWorkOrderVerification(workOrderId: string, decision: VerificationDecision, reason: string, reviewerName: string): WorkOrder | undefined {
    const wo = this.getWorkOrderById(workOrderId);
    if (!wo) return undefined;

    const now = new Date().toISOString();
    const incident = this.getIncidentById(wo.incident_id);

    if (decision === 'APPROVED') {
      wo.status = 'VERIFIED_CLOSED';
      wo.verified_at = now;
      if (incident) incident.status = 'VERIFIED_CLOSED';

      // Update linked reports
      this.reports
        .filter(r => r.linked_incident_id === wo.incident_id)
        .forEach(r => {
          r.status = 'VERIFIED_CLOSED';
          r.updated_at = now;

          // Notify citizen
          this.addNotification({
            user_id: r.reporter_id || 'usr-citizen-1',
            title: 'Civic Issue Resolved & Verified',
            message: `Your report ${r.reference_code} for "${r.title}" has been verified closed by State Oversight.`,
            type: 'REPORT_STATUS',
            link: `/issues/${incident?.id}`,
          });
        });

      // Update Infrastructure Asset Failure DNA
      if (incident) {
        const asset = this.infrastructureAssets.find(
          a => a.linked_incident_ids.includes(incident.id) || (a.category === incident.category && a.id === 'INF-CHD-001')
        );
        if (asset) {
          asset.approved_repairs += 1;
          asset.monitoring_status = 'REPAIRED_UNDER_MONITORING';
          asset.last_repaired_at = now;
          asset.updated_at = now;

          // Record 60-day monitoring record
          this.repairMonitoringRecords.unshift({
            id: `mon-${wo.id}`,
            infrastructure_id: asset.id,
            work_order_id: wo.id,
            incident_id: wo.incident_id,
            repair_verified_at: now,
            monitoring_days_configured: 60,
            monitoring_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
            days_without_recurrence: 0,
            recurrence_detected: false,
            status: 'UNDER_MONITORING',
          });
        }
      }

      this.addAuditEvent({
        actor_id: 'usr-oversight-1',
        actor_name: reviewerName,
        actor_role: 'oversight',
        entity_type: 'WORK_ORDER',
        entity_id: wo.id,
        action: 'COMPLETION_VERIFIED',
        details: `Supervisor approved resolution evidence. Issue verified closed. Active 60-day repair monitoring initiated.`,
        timestamp: now,
      });
    } else if (decision === 'REJECTED') {
      wo.status = 'REJECTED_COMPLETION';
      wo.rejection_reason = reason;
      if (incident) incident.status = 'REOPENED';

      // Update Infrastructure Asset rejected count
      if (incident) {
        const asset = this.infrastructureAssets.find(a => a.linked_incident_ids.includes(incident.id));
        if (asset) {
          asset.rejected_repairs += 1;
          asset.updated_at = now;
        }
      }

      this.addAuditEvent({
        actor_id: 'usr-oversight-1',
        actor_name: reviewerName,
        actor_role: 'oversight',
        entity_type: 'WORK_ORDER',
        entity_id: wo.id,
        action: 'COMPLETION_REJECTED',
        details: `Supervisor rejected evidence. Reason: ${reason}. Work order returned to worker.`,
        timestamp: now,
      });

      // Notify field worker about rejection
      if (wo.assigned_worker_id) {
        this.addNotification({
          user_id: wo.assigned_worker_id,
          title: 'Evidence Rejected - Action Required',
          message: `${wo.reference_code} evidence was rejected: ${reason}. Please re-inspect and submit corrected photo.`,
          type: 'WORK_ORDER',
          link: `/worker/dashboard`,
        });
      }
    } else if (decision === 'NEEDS_MORE_EVIDENCE') {
      wo.status = 'NEEDS_INFORMATION';
      wo.rejection_reason = reason;
      if (incident) incident.status = 'IN_PROGRESS';

      this.addAuditEvent({
        actor_id: 'usr-oversight-1',
        actor_name: reviewerName,
        actor_role: 'oversight',
        entity_type: 'WORK_ORDER',
        entity_id: wo.id,
        action: 'ADDITIONAL_EVIDENCE_REQUESTED',
        details: `Supervisor requested additional evidence photos. Notes: ${reason}.`,
        timestamp: now,
      });

      if (wo.assigned_worker_id) {
        this.addNotification({
          user_id: wo.assigned_worker_id,
          title: 'Additional Evidence Requested',
          message: `${wo.reference_code}: Supervisor requested additional verification photos. Notes: ${reason}`,
          type: 'WORK_ORDER',
          link: `/worker/dashboard`,
        });
      }
    }

    return wo;
  }

  reopenIssue(incidentId: string, citizenReason: string, citizenName: string): Incident | undefined {
    const incident = this.getIncidentById(incidentId);
    if (!incident) return undefined;

    const now = new Date().toISOString();
    incident.status = 'REOPENED';

    const wo = this.workOrders.find(w => w.incident_id === incidentId);
    if (wo) {
      wo.status = 'REOPENED';
      wo.rejection_reason = `Reopened by Citizen: ${citizenReason}`;
    }

    this.addAuditEvent({
      actor_id: 'usr-citizen-1',
      actor_name: citizenName,
      actor_role: 'citizen',
      entity_type: 'INCIDENT',
      entity_id: incident.id,
      action: 'ISSUE_REOPENED',
      details: `Citizen requested reopening. Reason: ${citizenReason}`,
      timestamp: now,
    });

    // Notify agency officer
    this.addNotification({
      user_id: 'usr-officer-1',
      title: 'Issue Reopened by Citizen',
      message: `Citizen reported "${incident.title}" remains unresolved: ${citizenReason}`,
      type: 'ESCALATION',
      link: `/officer/dashboard`,
    });

    return incident;
  }

  // Notifications
  getNotifications(userId?: string): Notification[] {
    if (userId) return this.notifications.filter(n => n.user_id === userId);
    return this.notifications;
  }

  markNotificationRead(id: string): void {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) notif.read = true;
  }

  addNotification(notifData: Omit<Notification, 'id' | 'created_at' | 'read'>): Notification {
    const notif: Notification = {
      ...notifData,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      read: false,
      created_at: new Date().toISOString(),
    };
    this.notifications.unshift(notif);
    return notif;
  }

  // Evidence
  getEvidence(workOrderId?: string, reportId?: string): Evidence[] {
    if (workOrderId) return this.evidence.filter(e => e.work_order_id === workOrderId);
    if (reportId) return this.evidence.filter(e => e.report_id === reportId);
    return this.evidence;
  }

  // Dependencies
  getDependencyLinks(): DependencyLink[] {
    return this.dependencyLinks;
  }

  // Audit Events
  getAuditEvents(entityId?: string): AuditEvent[] {
    if (entityId) return this.auditEvents.filter(a => a.entity_id === entityId);
    return this.auditEvents;
  }

  private addAuditEvent(eventData: Omit<AuditEvent, 'id'>): void {
    const id = `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    this.auditEvents.unshift({
      id,
      ...eventData,
    });
  }

  // =========================================================================
  // INFRASTRUCTURE ASSETS & FAILURE DNA METHODS
  // =========================================================================

  getInfrastructureAssets(): InfrastructureAsset[] {
    return this.infrastructureAssets;
  }

  getInfrastructureAssetById(id: string): InfrastructureAsset | undefined {
    return this.infrastructureAssets.find(a => a.id === id || a.reference_code === id);
  }

  addInfrastructureAsset(asset: InfrastructureAsset): InfrastructureAsset {
    this.infrastructureAssets.unshift(asset);
    return asset;
  }

  updateInfrastructureAsset(id: string, updates: Partial<InfrastructureAsset>): InfrastructureAsset | undefined {
    const asset = this.getInfrastructureAssetById(id);
    if (!asset) return undefined;
    Object.assign(asset, updates, { updated_at: new Date().toISOString() });
    return asset;
  }

  // =========================================================================
  // REPAIR VERIFICATION ANALYSES
  // =========================================================================

  getRepairAnalyses(workOrderId?: string): RepairVerificationAnalysis[] {
    if (workOrderId) return this.repairAnalyses.filter(a => a.work_order_id === workOrderId);
    return this.repairAnalyses;
  }

  getRepairVerificationAnalysis(workOrderId: string): RepairVerificationAnalysis | undefined {
    return this.repairAnalyses.find(a => a.work_order_id === workOrderId);
  }

  addRepairAnalysis(analysis: RepairVerificationAnalysis): RepairVerificationAnalysis {
    this.repairAnalyses.unshift(analysis);
    return analysis;
  }

  saveRepairVerificationAnalysis(analysis: RepairVerificationAnalysis): RepairVerificationAnalysis {
    const idx = this.repairAnalyses.findIndex(a => a.work_order_id === analysis.work_order_id);
    if (idx >= 0) {
      this.repairAnalyses[idx] = analysis;
    } else {
      this.repairAnalyses.unshift(analysis);
    }
    return analysis;
  }

  // =========================================================================
  // REPAIR MONITORING & RECURRENCE EVENTS
  // =========================================================================

  getRepairMonitoringRecords(infrastructureId?: string): RepairMonitoringRecord[] {
    if (infrastructureId) return this.repairMonitoringRecords.filter(m => m.infrastructure_id === infrastructureId);
    return this.repairMonitoringRecords;
  }

  getRecurrenceEvents(infrastructureId?: string): RecurrenceEvent[] {
    if (infrastructureId) return this.recurrenceEvents.filter(r => r.infrastructure_id === infrastructureId);
    return this.recurrenceEvents;
  }

  // =========================================================================
  // ROOT CAUSE RECOMMENDATIONS & INSPECTIONS
  // =========================================================================

  getRootCauseRecommendations(infrastructureId?: string): RootCauseRecommendation[] {
    if (infrastructureId) return this.rootCauseRecommendations.filter(r => r.infrastructure_id === infrastructureId);
    return this.rootCauseRecommendations;
  }

  convertRecommendationToInspection(
    recommendationId: string,
    scheduledDate: string,
    expertNotes?: string
  ): MaintenanceInspection | undefined {
    const rec = this.rootCauseRecommendations.find(r => r.id === recommendationId);
    if (!rec) return undefined;

    const id = `insp-${Date.now()}`;
    const asset = this.getInfrastructureAssetById(rec.infrastructure_id);
    const agency = this.agencies.find(a => a.category_coverage.includes(asset?.category || 'pothole')) || this.agencies[0];

    const inspection: MaintenanceInspection = {
      id,
      infrastructure_id: rec.infrastructure_id,
      recommendation_id: rec.id,
      inspection_type: 'ROOT_CAUSE_STRUCTURAL',
      agency_id: agency.id,
      agency_name: agency.name,
      assigned_engineer_name: 'Er. Harpreet Singh (Executive Engineer, PWD Highway)',
      scheduled_date: scheduledDate,
      findings: expertNotes || 'Initial engineering inspection authorized based on chronic failure pattern.',
      status: 'SCHEDULED',
      created_at: new Date().toISOString(),
    };

    rec.status = 'CONVERTED_TO_INSPECTION_WORK_ORDER';
    rec.converted_work_order_id = inspection.id;
    if (expertNotes) rec.expert_notes = expertNotes;

    this.maintenanceInspections.unshift(inspection);

    this.addAuditEvent({
      actor_id: 'usr-oversight-1',
      actor_name: 'Dr. Meera Iyer (State Oversight Director)',
      actor_role: 'oversight',
      entity_type: 'WORK_ORDER',
      entity_id: inspection.id,
      action: 'INSPECTION_AUTHORIZED',
      details: `Converted Root Cause Recommendation ${rec.id} to official engineering inspection for asset ${rec.infrastructure_name}.`,
      timestamp: new Date().toISOString(),
    });

    return inspection;
  }

  getMaintenanceInspections(infrastructureId?: string): MaintenanceInspection[] {
    if (infrastructureId) return this.maintenanceInspections.filter(i => i.infrastructure_id === infrastructureId);
    return this.maintenanceInspections;
  }

  // Reset to seed data
  reset(): void {
    this.cities = [...SEED_CITIES];
    this.jurisdictions = [...SEED_JURISDICTIONS];
    this.agencies = [...SEED_AGENCIES];
    this.users = SEED_USERS.map(u => ({ ...u }));
    this.incidents = [...SEED_DNA_INCIDENTS, ...SEED_INCIDENTS];
    this.reports = [...SEED_DNA_REPORTS, ...SEED_REPORTS];
    this.workOrders = [...SEED_DNA_WORK_ORDERS, ...SEED_WORK_ORDERS];
    this.evidence = [...SEED_DNA_EVIDENCE, ...SEED_EVIDENCE];
    this.dependencyLinks = [...SEED_DEPENDENCY_LINKS];
    this.auditEvents = [...SEED_AUDIT_EVENTS];
    this.notifications = [...SEED_NOTIFICATIONS];
    this.priorityConfig = { ...DEFAULT_PRIORITY_CONFIG };
    this.infrastructureAssets = [...SEED_INFRASTRUCTURE_ASSETS];
    this.repairAnalyses = [...SEED_REPAIR_ANALYSES];
    this.repairMonitoringRecords = [];
    this.recurrenceEvents = [...SEED_RECURRENCE_EVENTS];
    this.rootCauseRecommendations = [...SEED_ROOT_CAUSE_RECOMMENDATIONS];
    this.maintenanceInspections = [...SEED_MAINTENANCE_INSPECTIONS];
  }
}

export const mockStore = new MockStore();
