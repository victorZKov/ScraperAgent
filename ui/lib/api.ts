import { getSession } from 'next-auth/react';
import {
  ReportsListResponse,
  FullReport,
  TriggerResponse,
  JobStatus,
  ExpertsListResponse,
  ExpertConfig,
  RecipientsListResponse,
  EmailRecipientConfig,
  AIModelsListResponse,
  AIModelConfig,
  ScheduleConfig,
  SchedulesListResponse,
  Subscriber,
  SubscribeResponse,
  SubscriberStats,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7071';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const session = await getSession();
  const accessToken = (session as any)?.access_token as string | undefined;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.error || body.message || JSON.stringify(body);
    } catch {
      // response wasn't JSON, use statusText
    }
    throw new Error(detail);
  }
  return res.json();
}

export async function fetchReports(
  domain: 'market' | 'crypto',
  count = 20
): Promise<ReportsListResponse> {
  return fetchJSON<ReportsListResponse>(
    `${API_BASE}/api/${domain}/reports?count=${count}`
  );
}

export async function fetchReport(
  domain: 'market' | 'crypto',
  reportId: string
): Promise<FullReport> {
  return fetchJSON<FullReport>(
    `${API_BASE}/api/${domain}/reports/${reportId}`
  );
}

export async function triggerAnalysis(
  domain: 'market' | 'crypto'
): Promise<TriggerResponse> {
  return fetchJSON<TriggerResponse>(
    `${API_BASE}/api/${domain}/analyze`,
    { method: 'POST' }
  );
}

export async function fetchJobStatus(
  domain: 'market' | 'crypto',
  jobId: string
): Promise<JobStatus> {
  return fetchJSON<JobStatus>(
    `${API_BASE}/api/${domain}/jobs/${jobId}`
  );
}

export async function resendReportEmail(
  domain: 'market' | 'crypto',
  reportId: string
): Promise<{ success: boolean; recipients: string[]; message: string }> {
  return fetchJSON<{ success: boolean; recipients: string[]; message: string }>(
    `${API_BASE}/api/${domain}/reports/${reportId}/resend-email`,
    { method: 'POST' }
  );
}

export async function fetchAllReports(count = 20): Promise<ReportsListResponse> {
  const [marketRes, cryptoRes] = await Promise.allSettled([
    fetchReports('market', count),
    fetchReports('crypto', count),
  ]);

  const marketReports =
    marketRes.status === 'fulfilled' ? marketRes.value.reports : [];
  const cryptoReports =
    cryptoRes.status === 'fulfilled' ? cryptoRes.value.reports : [];

  const allReports = [...marketReports, ...cryptoReports].sort(
    (a, b) => new Date(b.GeneratedAt).getTime() - new Date(a.GeneratedAt).getTime()
  );

  return {
    reports: allReports,
    total: allReports.length,
  };
}

// ─── Configuration API ────────────────────────────────────────────────────

export async function fetchExperts(
  domain?: string
): Promise<ExpertsListResponse> {
  const params = domain ? `?domain=${domain}` : '';
  return fetchJSON<ExpertsListResponse>(
    `${API_BASE}/api/config/experts${params}`
  );
}

export async function addExpert(
  expert: Partial<ExpertConfig>
): Promise<ExpertConfig> {
  return fetchJSON<ExpertConfig>(`${API_BASE}/api/config/experts`, {
    method: 'POST',
    body: JSON.stringify(expert),
  });
}

export async function updateExpert(
  id: number,
  expert: Partial<ExpertConfig>
): Promise<ExpertConfig> {
  return fetchJSON<ExpertConfig>(`${API_BASE}/api/config/experts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(expert),
  });
}

export async function deleteExpert(id: number, permanent = true): Promise<void> {
  const params = permanent ? '?permanent=true' : '';
  await fetchJSON<{ success: boolean }>(
    `${API_BASE}/api/config/experts/${id}${params}`,
    { method: 'DELETE' }
  );
}

export async function fetchRecipients(
  domain?: string
): Promise<RecipientsListResponse> {
  const params = domain ? `?domain=${domain}` : '';
  return fetchJSON<RecipientsListResponse>(
    `${API_BASE}/api/config/recipients${params}`
  );
}

export async function addRecipient(
  recipient: Partial<EmailRecipientConfig>
): Promise<EmailRecipientConfig> {
  return fetchJSON<EmailRecipientConfig>(
    `${API_BASE}/api/config/recipients`,
    {
      method: 'POST',
      body: JSON.stringify(recipient),
    }
  );
}

export async function updateRecipient(
  id: number,
  recipient: Partial<EmailRecipientConfig>
): Promise<EmailRecipientConfig> {
  const data = await fetchJSON<{ recipient: EmailRecipientConfig }>(
    `${API_BASE}/api/config/recipients/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(recipient),
    }
  );
  return data.recipient;
}

export async function deleteRecipient(id: number, permanent = true): Promise<void> {
  const params = permanent ? '?permanent=true' : '';
  await fetchJSON<{ success: boolean }>(
    `${API_BASE}/api/config/recipients/${id}${params}`,
    { method: 'DELETE' }
  );
}

// ─── AI Models API ───────────────────────────────────────────────────────

export async function fetchAIModels(
  domain?: string
): Promise<AIModelsListResponse> {
  const params = domain ? `?domain=${domain}` : '';
  return fetchJSON<AIModelsListResponse>(
    `${API_BASE}/api/config/ai-models${params}`
  );
}

export async function addAIModel(
  model: Partial<AIModelConfig>
): Promise<AIModelConfig> {
  const data = await fetchJSON<{ model: AIModelConfig }>(
    `${API_BASE}/api/config/ai-models`,
    {
      method: 'POST',
      body: JSON.stringify(model),
    }
  );
  return data.model;
}

export async function updateAIModel(
  id: number,
  model: Partial<AIModelConfig>
): Promise<AIModelConfig> {
  const data = await fetchJSON<{ model: AIModelConfig }>(
    `${API_BASE}/api/config/ai-models/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(model),
    }
  );
  return data.model;
}

export async function deleteAIModel(id: number, permanent = true): Promise<void> {
  const params = permanent ? '?permanent=true' : '';
  await fetchJSON<{ success: boolean }>(
    `${API_BASE}/api/config/ai-models/${id}${params}`,
    { method: 'DELETE' }
  );
}

export async function setDefaultAIModel(id: number): Promise<void> {
  await fetchJSON<{ success: boolean }>(
    `${API_BASE}/api/config/ai-models/${id}/set-default`,
    { method: 'POST' }
  );
}

// ─── Schedules API ──────────────────────────────────────────────────────

export async function fetchSchedules(): Promise<SchedulesListResponse> {
  return fetchJSON<SchedulesListResponse>(
    `${API_BASE}/api/config/schedules`
  );
}

export async function addSchedule(
  schedule: Partial<ScheduleConfig>
): Promise<ScheduleConfig> {
  const data = await fetchJSON<{ schedule: ScheduleConfig }>(
    `${API_BASE}/api/config/schedules`,
    {
      method: 'POST',
      body: JSON.stringify(schedule),
    }
  );
  return data.schedule;
}

export async function updateSchedule(
  id: number,
  schedule: Partial<ScheduleConfig>
): Promise<ScheduleConfig> {
  const data = await fetchJSON<{ schedule: ScheduleConfig }>(
    `${API_BASE}/api/config/schedules/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(schedule),
    }
  );
  return data.schedule;
}

export async function deleteSchedule(id: number, permanent = true): Promise<void> {
  const params = permanent ? '?permanent=true' : '';
  await fetchJSON<{ success: boolean }>(
    `${API_BASE}/api/config/schedules/${id}${params}`,
    { method: 'DELETE' }
  );
}

export async function toggleSchedule(id: number, enabled: boolean): Promise<void> {
  await fetchJSON<{ success: boolean }>(
    `${API_BASE}/api/config/schedules/${id}/toggle?enabled=${enabled}`,
    { method: 'POST' }
  );
}

// ─── Subscriber API ─────────────────────────────────────────────────────

export async function subscribe(
  email: string,
  name: string | null,
  domainPreference: string
): Promise<SubscribeResponse> {
  return fetchJSON<SubscribeResponse>(`${API_BASE}/api/subscribe`, {
    method: 'POST',
    body: JSON.stringify({ Email: email, Name: name, DomainPreference: domainPreference }),
  });
}

export async function getSubscription(token: string): Promise<{ subscriber: Subscriber }> {
  return fetchJSON<{ subscriber: Subscriber }>(
    `${API_BASE}/api/subscribe/manage/${token}`
  );
}

export async function updateSubscription(
  token: string,
  data: { Name?: string; DomainPreference?: string }
): Promise<{ subscriber: Subscriber }> {
  return fetchJSON<{ subscriber: Subscriber }>(
    `${API_BASE}/api/subscribe/manage/${token}`,
    { method: 'PUT', body: JSON.stringify(data) }
  );
}

export async function upgradeSubscription(
  token: string
): Promise<{ success: boolean; checkoutUrl: string }> {
  return fetchJSON<{ success: boolean; checkoutUrl: string }>(
    `${API_BASE}/api/subscribe/manage/${token}/upgrade`,
    { method: 'POST' }
  );
}

export async function checkPayment(
  token: string
): Promise<{ success: boolean; paymentStatus: string; subscriber: Subscriber | null }> {
  return fetchJSON<{ success: boolean; paymentStatus: string; subscriber: Subscriber | null }>(
    `${API_BASE}/api/subscribe/manage/${token}/check-payment`,
    { method: 'POST' }
  );
}

export async function cancelSubscription(token: string): Promise<void> {
  await fetchJSON<{ success: boolean }>(
    `${API_BASE}/api/subscribe/manage/${token}/cancel`,
    { method: 'POST' }
  );
}

export async function deleteSubscription(token: string): Promise<void> {
  await fetchJSON<{ success: boolean }>(
    `${API_BASE}/api/subscribe/manage/${token}`,
    { method: 'DELETE' }
  );
}

export async function fetchSubscribers(): Promise<{ subscribers: Subscriber[]; total: number }> {
  return fetchJSON<{ subscribers: Subscriber[]; total: number }>(
    `${API_BASE}/api/config/subscribers`
  );
}

export async function fetchSubscriberStats(): Promise<{ stats: SubscriberStats }> {
  return fetchJSON<{ stats: SubscriberStats }>(
    `${API_BASE}/api/config/subscribers/stats`
  );
}

export async function verifyEmail(token: string): Promise<{ success: boolean }> {
  return fetchJSON<{ success: boolean }>(
    `${API_BASE}/api/subscribe/verify?token=${encodeURIComponent(token)}`
  );
}

export async function adminUpdateSubscriber(
  id: number,
  update: { status?: string; domainPreference?: string }
): Promise<{ success: boolean; subscriber: Subscriber }> {
  return fetchJSON<{ success: boolean; subscriber: Subscriber }>(
    `${API_BASE}/api/admin/subscribers/${id}`,
    { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(update) }
  );
}
