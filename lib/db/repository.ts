import { createAdminClient } from '../supabase/admin';
import { mockStore } from './mock-store';
import {
  Incident,
  Report,
  WorkOrder,
  Evidence,
  AuditEvent,
  Notification,
  PriorityConfig,
  City,
  Jurisdiction,
  Agency,
  User,
  UserRole,
  VerificationDecision
} from '../types';

export class CivicPulseRepository {
  private isSupabaseEnabled(): boolean {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    );
  }

  // =========================================================================
  // INCIDENTS
  // =========================================================================
  async getIncidents(): Promise<Incident[]> {
    const supabase = createAdminClient();
    if (!supabase) return mockStore.getIncidents();

    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .order('first_reported_at', { ascending: false });

    if (error) {
      throw new Error(`Supabase query failed on 'incidents': ${error.message}`);
    }
    return (data || []) as Incident[];
  }

  async getIncidentById(id: string): Promise<Incident | undefined> {
    const supabase = createAdminClient();
    if (!supabase) return mockStore.getIncidentById(id);

    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Supabase query failed on 'incidents' by id: ${error.message}`);
    }
    return (data || undefined) as Incident | undefined;
  }

  // =========================================================================
  // REPORTS
  // =========================================================================
  async getReports(): Promise<Report[]> {
    const supabase = createAdminClient();
    if (!supabase) return mockStore.getReports();

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) {
      throw new Error(`Supabase query failed on 'reports': ${error.message}`);
    }
    return (data || []) as Report[];
  }

  async getReportById(id: string): Promise<Report | undefined> {
    const supabase = createAdminClient();
    if (!supabase) return mockStore.getReportById(id);

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .or(`id.eq.${id},reference_code.eq.${id}`)
      .maybeSingle();

    if (error) {
      throw new Error(`Supabase query failed on 'reports' by id: ${error.message}`);
    }
    return (data || undefined) as Report | undefined;
  }

  async addReport(reportData: Omit<Report, 'id' | 'reference_code' | 'submitted_at' | 'updated_at' | 'status'>): Promise<Report> {
    const supabase = createAdminClient();
    if (!supabase) return mockStore.addReport(reportData);

    try {
      const codeNum = Math.floor(1000 + Math.random() * 9000);
      const reference_code = `CP-2026-${codeNum}`;
      const now = new Date().toISOString();

      // 1. Insert Initial Report
      const newReportPayload = {
        ...reportData,
        reference_code,
        status: 'SUBMITTED',
        gps_accuracy: reportData.gps_accuracy || 15.0,
        location_source: reportData.location_source || 'gps',
        capture_timestamp: reportData.capture_timestamp || now,
        submitted_at: now,
        updated_at: now,
      };

      const { data: report, error: reportErr } = await supabase
        .from('reports')
        .insert(newReportPayload)
        .select()
        .single();

      if (reportErr || !report) {
        console.warn('Supabase report insert fallback:', reportErr?.message);
        return mockStore.addReport(reportData);
      }

      // 2. Check for nearby active incident within ~250m
      const { data: nearbyIncidents } = await supabase
        .from('incidents')
        .select('*')
        .eq('category', report.category)
        .eq('city_id', report.city_id)
        .neq('status', 'VERIFIED_CLOSED')
        .gte('lat', report.lat - 0.003)
        .lte('lat', report.lat + 0.003)
        .gte('lng', report.lng - 0.003)
        .lte('lng', report.lng + 0.003)
        .limit(1);

      let incidentId: string;

      if (nearbyIncidents && nearbyIncidents.length > 0) {
        // Corroborate existing incident
        const existing = nearbyIncidents[0];
        incidentId = existing.id;
        const newCount = (existing.report_count || 1) + 1;

        await supabase
          .from('incidents')
          .update({
            report_count: newCount,
            last_observed_at: now,
            updated_at: now,
          })
          .eq('id', existing.id);
      } else {
        // Create new incident
        const { calculatePriorityScore } = await import('../engines/priority');
        const priorityRes = calculatePriorityScore(report.category, {
          description: `${report.title} ${report.description}`,
          reportCount: 1,
          ageInHours: 0,
          isNearSensitiveAsset: true,
        });

        const { data: newInc } = await supabase
          .from('incidents')
          .insert({
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
          })
          .select()
          .single();

        incidentId = newInc ? newInc.id : report.id;

        // Auto-create initial work order
        const dueHours = priorityRes.level === 'CRITICAL' ? 12 : priorityRes.level === 'HIGH' ? 24 : 48;
        const dueAt = new Date(Date.now() + dueHours * 3600 * 1000).toISOString();

        // Get agency for category
        const { data: agencies } = await supabase.from('agencies').select('*').limit(5);
        const matchedAgency = agencies?.find((a: any) => a.category_coverage?.includes(report.category)) || agencies?.[0];

        if (matchedAgency && newInc) {
          await supabase.from('work_orders').insert({
            reference_code: `WO-AUTO-2026-${Math.floor(100 + Math.random() * 900)}`,
            incident_id: newInc.id,
            agency_id: matchedAgency.id,
            status: 'NEW',
            priority_level: priorityRes.level,
            due_at: dueAt,
          });
        }
      }

      // Link report to incident
      await supabase.from('reports').update({ linked_incident_id: incidentId }).eq('id', report.id);

      // Audit Event
      await supabase.from('audit_events').insert({
        actor_id: report.reporter_id,
        actor_name: report.reporter_name || 'Citizen',
        actor_role: 'citizen',
        entity_type: 'REPORT',
        entity_id: report.id,
        action: 'REPORT_SUBMITTED',
        details: `Submitted report ${report.reference_code} for ${report.category}. GPS accuracy: ±${report.gps_accuracy}m.`,
      });

      // Notification
      if (report.reporter_id) {
        await supabase.from('notifications').insert({
          user_id: report.reporter_id,
          title: 'Report Registered',
          message: `Your report ${report.reference_code} has been registered in the municipal queue.`,
          type: 'REPORT_STATUS',
          link: '/citizen/dashboard',
        });
      }

      report.linked_incident_id = incidentId;
      return report as Report;
    } catch (err: any) {
      console.error('Supabase addReport error:', err);
      return mockStore.addReport(reportData);
    }
  }

  // =========================================================================
  // WORK ORDERS
  // =========================================================================
  async getWorkOrders(): Promise<WorkOrder[]> {
    const supabase = createAdminClient();
    if (!supabase) return mockStore.getWorkOrders();

    try {
      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return mockStore.getWorkOrders();
      return data as WorkOrder[];
    } catch {
      return mockStore.getWorkOrders();
    }
  }

  async assignWorkOrder(
    workOrderId: string,
    workerId: string,
    workerName: string,
    team: string,
    officerName: string
  ): Promise<WorkOrder | undefined> {
    const supabase = createAdminClient();
    if (!supabase) return mockStore.assignWorkOrder(workOrderId, workerId, workerName, team, officerName);

    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('work_orders')
        .update({
          assigned_worker_id: workerId,
          assigned_team: team,
          status: 'ASSIGNED',
          acknowledged_at: now,
        })
        .eq('id', workOrderId)
        .select()
        .single();

      if (error || !data) {
        return mockStore.assignWorkOrder(workOrderId, workerId, workerName, team, officerName);
      }

      // Update incident status
      if (data.incident_id) {
        await supabase
          .from('incidents')
          .update({ status: 'ASSIGNED', updated_at: now })
          .eq('id', data.incident_id);
      }

      mockStore.assignWorkOrder(workOrderId, workerId, workerName, team, officerName);
      return data as WorkOrder;
    } catch {
      return mockStore.assignWorkOrder(workOrderId, workerId, workerName, team, officerName);
    }
  }

  async submitWorkOrderCompletion(
    workOrderId: string,
    notes: string,
    afterPhotoUrl: string,
    workerName: string
  ): Promise<WorkOrder | undefined> {
    const supabase = createAdminClient();
    if (!supabase) return mockStore.submitWorkOrderCompletion(workOrderId, notes, afterPhotoUrl, workerName);

    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('work_orders')
        .update({
          status: 'COMPLETED_PENDING_VERIFICATION',
          completed_at: now,
          resolution_notes: notes,
        })
        .eq('id', workOrderId)
        .select()
        .single();

      if (error || !data) {
        return mockStore.submitWorkOrderCompletion(workOrderId, notes, afterPhotoUrl, workerName);
      }

      // Record evidence
      await supabase.from('evidence').insert({
        work_order_id: workOrderId,
        uploader_role: 'worker',
        evidence_type: 'AFTER_WORK',
        url: afterPhotoUrl,
        captured_at: now,
        uploaded_at: now,
      });

      // Update incident status
      if (data.incident_id) {
        await supabase
          .from('incidents')
          .update({ status: 'COMPLETED_PENDING_VERIFICATION', updated_at: now })
          .eq('id', data.incident_id);
      }

      mockStore.submitWorkOrderCompletion(workOrderId, notes, afterPhotoUrl, workerName);
      return data as WorkOrder;
    } catch {
      return mockStore.submitWorkOrderCompletion(workOrderId, notes, afterPhotoUrl, workerName);
    }
  }

  async reviewWorkOrderVerification(
    workOrderId: string,
    decision: VerificationDecision,
    reason: string,
    reviewerName: string
  ): Promise<WorkOrder | undefined> {
    const supabase = createAdminClient();
    if (!supabase) return mockStore.reviewWorkOrderVerification(workOrderId, decision, reason, reviewerName);

    try {
      const now = new Date().toISOString();
      const isApproved = decision === 'APPROVED';

      const { data, error } = await supabase
        .from('work_orders')
        .update({
          status: isApproved ? 'VERIFIED_CLOSED' : 'REJECTED_COMPLETION',
          verified_at: isApproved ? now : null,
          rejection_reason: isApproved ? null : reason,
        })
        .eq('id', workOrderId)
        .select()
        .single();

      if (error || !data) {
        return mockStore.reviewWorkOrderVerification(workOrderId, decision, reason, reviewerName);
      }

      // Record verification record
      await supabase.from('verification_records').insert({
        work_order_id: workOrderId,
        decision,
        reason,
        created_at: now,
      });

      // Update incident
      if (data.incident_id) {
        await supabase
          .from('incidents')
          .update({
            status: isApproved ? 'VERIFIED_CLOSED' : 'REOPENED',
            updated_at: now,
          })
          .eq('id', data.incident_id);
      }

      mockStore.reviewWorkOrderVerification(workOrderId, decision, reason, reviewerName);
      return data as WorkOrder;
    } catch {
      return mockStore.reviewWorkOrderVerification(workOrderId, decision, reason, reviewerName);
    }
  }

  // =========================================================================
  // NOTIFICATIONS
  // =========================================================================
  async getNotifications(userId?: string): Promise<Notification[]> {
    const supabase = createAdminClient();
    if (!supabase) return mockStore.getNotifications(userId);

    try {
      let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (userId) query = query.eq('user_id', userId);

      const { data, error } = await query;
      if (error || !data) return mockStore.getNotifications(userId);
      return data as Notification[];
    } catch {
      return mockStore.getNotifications(userId);
    }
  }

  async markNotificationRead(id: string): Promise<void> {
    const supabase = createAdminClient();
    mockStore.markNotificationRead(id);

    if (!supabase) return;
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
    } catch {}
  }

  // =========================================================================
  // PRIORITY CONFIGURATION
  // =========================================================================
  async getPriorityConfig(): Promise<PriorityConfig> {
    const supabase = createAdminClient();
    if (!supabase) return mockStore.getPriorityConfig();

    try {
      const { data, error } = await supabase.from('priority_configurations').select('*').limit(1).single();
      if (error || !data) return mockStore.getPriorityConfig();

      return {
        weights: {
          severity: Number(data.severity_weight),
          safety_impact: Number(data.safety_impact_weight),
          infrastructure: Number(data.infrastructure_weight),
          recurrence: Number(data.recurrence_weight),
          age: Number(data.age_weight),
          corroboration: Number(data.corroboration_weight),
          evidence: Number(data.evidence_weight),
        },
        thresholds: {
          critical: Number(data.critical_threshold),
          high: Number(data.high_threshold),
          medium: Number(data.medium_threshold),
          low: 0,
        },
        emergency_keywords: data.emergency_keywords || [],
      };
    } catch {
      return mockStore.getPriorityConfig();
    }
  }

  // =========================================================================
  // USERS & AUTHENTICATION
  // =========================================================================
  async getUsers(): Promise<User[]> {
    const supabase = createAdminClient();
    if (!supabase) return mockStore.getUsers();

    try {
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (error || !data) return mockStore.getUsers();
      return data as User[];
    } catch {
      return mockStore.getUsers();
    }
  }

  async getUserById(id: string): Promise<User | undefined> {
    const supabase = createAdminClient();
    if (!supabase) return mockStore.getUserById(id);

    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
      if (error || !data) return mockStore.getUserById(id);
      return data as User;
    } catch {
      return mockStore.getUserById(id);
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const supabase = createAdminClient();
    if (!supabase) return mockStore.getUserByEmail(email);

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('email', email.trim().toLowerCase())
        .maybeSingle();

      if (error || !data) return mockStore.getUserByEmail(email);
      return data as User;
    } catch {
      return mockStore.getUserByEmail(email);
    }
  }

  async createUser(userData: Omit<User, 'id' | 'created_at'>): Promise<User> {
    const supabase = createAdminClient();
    const mockUser = mockStore.createUser(userData);

    if (!supabase) return mockUser;

    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          id: mockUser.id,
          name: userData.name,
          email: userData.email.toLowerCase().trim(),
          role: userData.role,
          phone: userData.phone || null,
          city_id: userData.city_id,
        })
        .select()
        .single();

      if (error || !data) return mockUser;
      return data as User;
    } catch {
      return mockUser;
    }
  }

  async updateUserRole(
    userId: string,
    newRole: UserRole,
    adminId: string = 'usr-admin-1',
    adminName: string = 'CivicPulse Admin'
  ): Promise<User | undefined> {
    const supabase = createAdminClient();
    const updated = mockStore.updateUserRole(userId, newRole, adminId, adminName);

    if (!supabase) return updated;

    try {
      const { data, error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)
        .select()
        .single();

      if (error || !data) return updated;
      return data as User;
    } catch {
      return updated;
    }
  }

  async toggleUserStatus(
    userId: string,
    active: boolean,
    adminId: string = 'usr-admin-1',
    adminName: string = 'CivicPulse Admin'
  ): Promise<User | undefined> {
    const updated = mockStore.toggleUserStatus(userId, active, adminId, adminName);
    return updated;
  }
}

export const dbRepository = new CivicPulseRepository();
