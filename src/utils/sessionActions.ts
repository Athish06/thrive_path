const API_ROOT = 'http://localhost:8000/api/sessions';

interface SessionSummary {
  id: number;
  session_date: string;
  start_time: string;
  end_time: string;
  student_name?: string | null;
}

export interface SessionRescheduleDetail {
  code?: string;
  message?: string;
  session?: SessionSummary;
  upcoming?: {
    count: number;
    sessions: SessionSummary[];
  };
}

export interface CascadeRescheduleResponse {
  total_updated: number;
  sessions: Array<{
    session_id: number;
    student_name?: string | null;
    previous_date: string;
    new_date: string;
    start_time: string;
    end_time: string;
  }>;
  include_weekends: boolean;
}

interface ApiErrorResponse {
  detail?: string | SessionRescheduleDetail;
  message?: string;
}

const parseError = async (response: Response): Promise<ApiErrorResponse | null> => {
  try {
    return (await response.json()) as ApiErrorResponse;
  } catch (error) {
    return null;
  }
};

const extractErrorMessage = (data: ApiErrorResponse | null, fallback: string) => {
  if (!data) {
    return fallback;
  }

  if (typeof data.detail === 'string' && data.detail.trim().length > 0) {
    return data.detail;
  }

  if (typeof data.message === 'string' && data.message.trim().length > 0) {
    return data.message;
  }

  const structuredDetail = data.detail as SessionRescheduleDetail | undefined;
  if (structuredDetail?.message) {
    return structuredDetail.message;
  }

  return fallback;
};

export class SessionNeedsRescheduleError extends Error {
  status: number;
  code?: string;
  detail: SessionRescheduleDetail;

  constructor(message: string, status: number, detail: SessionRescheduleDetail) {
    super(message);
    this.name = 'SessionNeedsRescheduleError';
    this.status = status;
    this.code = detail.code;
    this.detail = detail;
  }
}

const callSessionAction = async (sessionId: number, action: string, token: string) => {
  const response = await fetch(`${API_ROOT}/${sessionId}/${action}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 409) {
    const payload = await parseError(response);
    const detail = (payload?.detail as SessionRescheduleDetail) ?? {};
    const message = extractErrorMessage(payload, 'Session requires rescheduling before it can start.');
    throw new SessionNeedsRescheduleError(message, response.status, detail);
  }

  if (!response.ok) {
    const payload = await parseError(response);
    throw new Error(extractErrorMessage(payload, response.statusText));
  }

  return response.json();
};

export const startSessionRequest = async (sessionId: number, token: string) => {
  return callSessionAction(sessionId, 'start', token);
};

export const completeSessionRequest = async (sessionId: number, token: string, therapistNotes?: string) => {
  const response = await fetch(`${API_ROOT}/${sessionId}/complete`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      therapist_notes: therapistNotes || null
    })
  });

  if (!response.ok) {
    const payload = await parseError(response);
    throw new Error(extractErrorMessage(payload, response.statusText));
  }

  return response.json();
};

export const cascadeRescheduleRequest = async (
  sessionId: number,
  token: string,
  includeWeekends: boolean
): Promise<CascadeRescheduleResponse> => {
  const response = await fetch(`${API_ROOT}/${sessionId}/reschedule/cascade`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ include_weekends: includeWeekends }),
  });

  if (!response.ok) {
    const payload = await parseError(response);
    throw new Error(extractErrorMessage(payload, response.statusText));
  }

  return (await response.json()) as CascadeRescheduleResponse;
};
