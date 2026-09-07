/**
 * AI Teaching Studio — Classroom Client Real-Time Service
 * Multi-user signaling, SSE stream listener, BroadcastChannel fallback,
 * and REST APIs for Private Classroom.
 */

import {
  ClassroomSession,
  StudentParticipant,
  StudentPrivateQuestion,
  ClassPoll,
  ClassQuizQuestion,
  ClassroomAttendanceRecord,
  ClassroomBroadcastState,
} from '../../types/classroom';

export type ClassroomEventCallback = (event: {
  type: string;
  data: any;
}) => void;

class ClassroomClientService {
  // 1. Classes Management
  async getClasses(): Promise<ClassroomSession[]> {
    try {
      const res = await fetch('/api/classroom/classes');
      const data = await res.json();
      return data.success ? data.classes : [];
    } catch (err) {
      console.error('Error fetching classes:', err);
      return [];
    }
  }

  async createClass(payload: {
    className: string;
    subject?: string;
    teacherName: string;
    description?: string;
    scheduledTime?: string;
    durationMinutes?: number;
    associatedProjectId?: string;
  }): Promise<{ success: boolean; session?: ClassroomSession; error?: string }> {
    try {
      const res = await fetch('/api/classroom/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to create classroom' };
    }
  }

  async getClassInfo(classCode: string): Promise<any> {
    try {
      const res = await fetch(`/api/classroom/classes/${classCode.toUpperCase()}`);
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to fetch class info' };
    }
  }

  async updateClassStatus(
    classCode: string,
    status?: 'scheduled' | 'live' | 'ended',
    isLocked?: boolean,
    hasWaitingRoom?: boolean
  ): Promise<any> {
    try {
      const res = await fetch(`/api/classroom/classes/${classCode.toUpperCase()}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, isLocked, hasWaitingRoom }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  async updateBroadcastState(
    classCode: string,
    state: Partial<ClassroomBroadcastState>
  ): Promise<any> {
    try {
      const res = await fetch(`/api/classroom/classes/${classCode.toUpperCase()}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  // 2. Student Participation
  async joinClass(
    classCode: string,
    displayName: string
  ): Promise<{
    success: boolean;
    participant?: StudentParticipant;
    classInfo?: any;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/classroom/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode, displayName }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to join classroom' };
    }
  }

  async leaveClass(classCode: string, participantId: string): Promise<void> {
    try {
      await fetch('/api/classroom/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode, participantId }),
      });
    } catch (err) {
      console.warn('Error leaving classroom:', err);
    }
  }

  async sendHeartbeat(classCode: string, participantId: string, role: string): Promise<void> {
    try {
      await fetch('/api/classroom/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode, participantId, role }),
      });
    } catch {
      // transient heartbeat failure is non-fatal
    }
  }

  async getParticipants(classCode: string): Promise<StudentParticipant[]> {
    try {
      const res = await fetch(`/api/classroom/participants?classCode=${classCode.toUpperCase()}`);
      const data = await res.json();
      return data.success ? data.participants : [];
    } catch {
      return [];
    }
  }

  async moderateParticipant(
    classCode: string,
    participantId: string,
    action: 'approve_waiting_room' | 'lower_hand' | 'allow_mic' | 'mute' | 'remove',
    value?: any
  ): Promise<any> {
    try {
      const res = await fetch('/api/classroom/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode, participantId, action, value }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  async toggleHandRaise(
    classCode: string,
    participantId: string,
    raised: boolean
  ): Promise<any> {
    try {
      const res = await fetch('/api/classroom/hand-raise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode, participantId, raised }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  // 3. Strict Teacher-Only Chat
  async sendQuestion(
    classCode: string,
    studentId: string,
    studentName: string,
    message: string
  ): Promise<{ success: boolean; question?: StudentPrivateQuestion; error?: string }> {
    try {
      const res = await fetch('/api/classroom/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode, studentId, studentName, message }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to send message' };
    }
  }

  async getMessages(
    classCode: string,
    role: 'teacher' | 'student',
    studentId?: string
  ): Promise<StudentPrivateQuestion[]> {
    try {
      const params = new URLSearchParams({
        classCode: classCode.toUpperCase(),
        role,
      });
      if (studentId) params.append('studentId', studentId);

      const res = await fetch(`/api/classroom/messages?${params.toString()}`);
      const data = await res.json();
      return data.success ? data.messages : [];
    } catch {
      return [];
    }
  }

  async replyToQuestion(
    classCode: string,
    questionId: string,
    teacherReply: string
  ): Promise<any> {
    try {
      const res = await fetch(`/api/classroom/messages/${questionId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode, teacherReply }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  async publishQuestion(
    classCode: string,
    questionId: string,
    publishMode: 'anonymous' | 'with_name'
  ): Promise<any> {
    try {
      const res = await fetch(`/api/classroom/messages/${questionId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode, publishMode }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  // 4. Polls
  async createPoll(
    classCode: string,
    question: string,
    options: string[]
  ): Promise<any> {
    try {
      const res = await fetch('/api/classroom/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode, question, options }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  async votePoll(
    classCode: string,
    pollId: string,
    studentId: string,
    optionId: string
  ): Promise<any> {
    try {
      const res = await fetch(`/api/classroom/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode, studentId, optionId }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  async setPollResultsVisibility(
    classCode: string,
    pollId: string,
    showResultsToStudents: boolean
  ): Promise<any> {
    try {
      const res = await fetch(`/api/classroom/polls/${pollId}/results-visibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode, showResultsToStudents }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  async closePoll(classCode: string, pollId: string): Promise<any> {
    try {
      const res = await fetch(`/api/classroom/polls/${pollId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  // 5. MCQ Quiz
  async launchQuiz(
    classCode: string,
    payload: {
      mode: 'practice' | 'test' | 'challenge';
      question: string;
      options: { id: string; label: string; text: string; isCorrect: boolean }[];
      explanation?: string;
      timeLimitSeconds: number;
    }
  ): Promise<any> {
    try {
      const res = await fetch('/api/classroom/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode, ...payload }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  async answerQuiz(
    classCode: string,
    quizId: string,
    studentId: string,
    optionId: string
  ): Promise<any> {
    try {
      const res = await fetch(`/api/classroom/quiz/${quizId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode, studentId, optionId }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  async revealQuizAnswer(classCode: string, quizId: string): Promise<any> {
    try {
      const res = await fetch(`/api/classroom/quiz/${quizId}/reveal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classCode }),
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  // 6. Attendance & Reports
  async getAttendance(classCode: string): Promise<ClassroomAttendanceRecord | null> {
    try {
      const res = await fetch(`/api/classroom/attendance/${classCode.toUpperCase()}`);
      const data = await res.json();
      return data.success ? data.record : null;
    } catch {
      return null;
    }
  }

  // 7. Real-Time Event Subscription (SSE + BroadcastChannel fallback)
  subscribeToClassEvents(
    classCode: string,
    role: 'teacher' | 'student',
    participantId: string | undefined,
    onEvent: ClassroomEventCallback
  ): () => void {
    const code = classCode.toUpperCase();
    const channelName = `ai_teaching_studio_${code}`;
    let broadcastChannel: BroadcastChannel | null = null;

    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        broadcastChannel = new BroadcastChannel(channelName);
        broadcastChannel.onmessage = (ev) => {
          if (ev.data && ev.data.type) {
            onEvent(ev.data);
          }
        };
      }
    } catch (err) {
      console.warn('BroadcastChannel not available:', err);
    }

    // Connect to Server-Sent Events (SSE)
    const query = new URLSearchParams({
      classCode: code,
      role,
    });
    if (participantId) query.append('participantId', participantId);

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/classroom/events?${query.toString()}`);

      const eventNames = [
        'CONNECTED',
        'STUDENT_JOINED',
        'STUDENT_LEFT',
        'STUDENT_RECONNECTED',
        'STUDENT_STATUS_UPDATED',
        'STUDENT_REMOVED',
        'BROADCAST_STATE_UPDATED',
        'QUESTION_RECEIVED',
        'QUESTION_REPLIED',
        'QUESTION_PUBLISHED',
        'POLL_STARTED',
        'POLL_UPDATED',
        'POLL_CLOSED',
        'QUIZ_LAUNCHED',
        'QUIZ_STATS_UPDATED',
        'QUIZ_ANSWER_REVEALED',
        'CLASS_LOCKED',
        'CLASS_STATUS_UPDATED',
      ];

      for (const name of eventNames) {
        eventSource.addEventListener(name, (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            onEvent({ type: name, data });
          } catch {
            // non-json payload
          }
        });
      }

      eventSource.onerror = (err) => {
        console.warn('SSE connection warning or reconnecting:', err);
      };
    } catch (e) {
      console.warn('Could not initialize EventSource:', e);
    }

    // Return unsubscriber
    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (broadcastChannel) {
        broadcastChannel.close();
      }
    };
  }
}

export const classroomService = new ClassroomClientService();
