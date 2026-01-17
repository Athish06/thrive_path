const API_ROOT = 'http://localhost:8000/api';

interface ApiErrorResponse {
  detail?: string;
  message?: string;
}

const parseError = async (response: Response): Promise<string> => {
  try {
    const data = (await response.json()) as ApiErrorResponse;
    return data.detail || data.message || response.statusText;
  } catch (error) {
    return response.statusText;
  }
};

export interface AssessmentTool {
  id: string;
  name: string;
  parent_activity: {
    id: number;
    activity_name: string;
    activity_description?: string;
  };
  activities: {
    id: number;
    activity_name: string;
    activity_description?: string;
  }[];
  activity_count: number;
}

export interface AssessmentToolsResponse {
  [key: string]: AssessmentTool;
}

/**
 * Fetches assessment tools (ISAA, INDT, Clinical Snapshots) from the backend
 */
export const fetchAssessmentTools = async (token: string): Promise<AssessmentToolsResponse> => {
  const response = await fetch(`${API_ROOT}/assessment-tools`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json() as Promise<AssessmentToolsResponse>;
};

/**
 * Checks if a session has assessment activities (ISAA, INDT, or Clinical Snapshots)
 * Assessment tool activity IDs: ISAA = 1, INDT = 2, Clinical Snapshots = 11
 */
export const isAssessmentSession = (activities: { activity_id?: number }[]): boolean => {
  const ASSESSMENT_ACTIVITY_IDS = [1, 2, 11];
  return activities.some(activity =>
    activity.activity_id && ASSESSMENT_ACTIVITY_IDS.includes(activity.activity_id)
  );
};

/**
 * Formats assessment scores for session completion API
 * Converts the modal's assessment data into the format expected by the backend
 */
export interface AssessmentCompletionData {
  sessionId: number;
  actualStartTime: string;
  actualEndTime: string;
  assessmentScores: {
    [toolId: string]: {
      [activityId: string]: {
        score: number;
        duration: number;
      };
    };
  };
}

export interface SessionActivityUpdate {
  id: number; // session_activity_id
  actual_duration: number;
  performance_notes: string; // JSON string of assessment scores
}

export const formatAssessmentDataForAPI = (
  data: AssessmentCompletionData,
  sessionActivities: { id: number; activity_id: number }[],
  assessmentTools: AssessmentToolsResponse
): {
  actualStartTime: string;
  actualEndTime: string;
  activityUpdates: SessionActivityUpdate[];
} => {
  const activityUpdates: SessionActivityUpdate[] = [];

  // Map tool IDs to their parent activity IDs
  const toolIdToActivityId: { [toolId: string]: number } = {};
  Object.entries(assessmentTools).forEach(([toolId, tool]) => {
    toolIdToActivityId[toolId] = tool.parent_activity.id;
  });

  // For each tool with scores, create an activity update
  Object.entries(data.assessmentScores).forEach(([toolId, activityScores]) => {
    const parentActivityId = toolIdToActivityId[toolId];
    if (!parentActivityId) return;

    // Find the session_activity record for this tool
    const sessionActivity = sessionActivities.find(sa => sa.activity_id === parentActivityId);
    if (!sessionActivity) return;

    // Calculate average score and prepare items object
    const scores: number[] = [];
    const items: { [itemId: string]: number } = {};

    Object.entries(activityScores).forEach(([activityId, scoreData]) => {
      items[activityId] = scoreData.score;
      scores.push(scoreData.score);
    });

    const average = scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;

    // Get duration for this tool (use first activity's duration as they should all be the same per tool)
    const firstActivity = Object.values(activityScores)[0];
    const duration = firstActivity?.duration || 0;

    // Create the performance_notes JSON structure expected by backend
    const performanceNotes = {
      items,
      average: Math.round(average * 100) / 100 // Round to 2 decimal places
    };

    activityUpdates.push({
      id: sessionActivity.id,
      actual_duration: duration,
      performance_notes: JSON.stringify(performanceNotes)
    });
  });

  return {
    actualStartTime: data.actualStartTime,
    actualEndTime: data.actualEndTime,
    activityUpdates
  };
};
