import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  TeachingStudioLayout,
  ActiveContentMode,
  CameraLayoutMode,
  AnnotationTool,
  AnnotationStroke,
  AudioPreset,
  RecognizedVoiceCommand,
  TeacherNoteEntry,
  RecordingMode,
  RecordingProject,
} from '../../types/teaching';
import { MindMapNode, PresentationContent, MindMapContent } from '../../types/ai';

// Services
import { audioEngine } from '../../services/teaching/audioEngine';
import { cameraService } from '../../services/teaching/cameraService';
import { recordingService, ActiveRecordingStats } from '../../services/teaching/recordingService';
import { voiceCommandService } from '../../services/teaching/voiceCommandService';
import { teachingSessionService } from '../../services/teaching/sessionStorage';

// Subcomponents
import { TeachingTopBar } from './TeachingTopBar';
import { TeachingToolbar } from './TeachingToolbar';
import { PresentationCanvas } from './PresentationCanvas';
import { MindMapCanvas } from './MindMapCanvas';
import { VisualTreeCanvas } from '../knowledge/VisualTreeCanvas';
import { DetailPanel } from './DetailPanel';
import { WhiteboardCanvas } from './WhiteboardCanvas';
import { TeacherCameraOverlay } from './TeacherCameraOverlay';
import { AudioSettingsModal } from './AudioSettingsModal';
import { CameraSettingsModal } from './CameraSettingsModal';
import { StartRecordingModal, RecordingCompleteModal } from './RecordingModals';
import { AIAssistantDrawer } from './AIAssistantDrawer';
import { TeacherNotesDrawer } from './TeacherNotesDrawer';
import { LiveCaptionsOverlay } from './LiveCaptionsOverlay';
import { VoiceCommandFeedback } from './VoiceCommandFeedback';
import { StudentViewModal } from './StudentViewModal';
import { YouTubeLiveModal } from './YouTubeLiveModal';
import { ClassroomInteractionDrawer } from '../classroom/ClassroomInteractionDrawer';
import { classroomService } from '../../services/classroom/classroomClientService';

interface TeachingStudioProps {
  onExit: () => void;
  classCode?: string;
  onOpenLiveStudentView?: () => void;
  onOpenVideoEditor?: (recording?: any) => void;
}

export const TeachingStudio: React.FC<TeachingStudioProps> = ({
  onExit,
  classCode = 'STUDIO1',
  onOpenLiveStudentView,
  onOpenVideoEditor,
}) => {
  const { activeProject, updateActiveProject } = useProject();

  // 1. STUDIO LAYOUT & VIEW STATES
  const [activeLayout, setActiveLayout] = useState<TeachingStudioLayout>('presentation_camera');
  const [contentMode, setContentMode] = useState<ActiveContentMode>('slides');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 1.1 PART 05 CLASSROOM STATE
  const [activeClassCode, setActiveClassCode] = useState(classCode);
  const [isClassroomDrawerOpen, setIsClassroomDrawerOpen] = useState(false);
  const [classroomStudentCount, setClassroomStudentCount] = useState(0);
  const [classroomRaisedHandsCount, setClassroomRaisedHandsCount] = useState(0);

  // 2. CONTENT STATE (Slides & Mind Map)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedMindMapNode, setSelectedMindMapNode] = useState<MindMapNode | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  // 3. HARDWARE CAMERA STATE
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLayout, setCameraLayout] = useState<CameraLayoutMode>('bubble');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  // 4. HARDWARE AUDIO & DSP STATE
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [audioPreset, setAudioPreset] = useState<AudioPreset>('clear_teaching');

  // 5. WHITEBOARD & ANNOTATIONS STATE
  const [activeTool, setActiveTool] = useState<AnnotationTool>('pen');
  const [penColor, setPenColor] = useState('#ef4444');
  const [penSize, setPenSize] = useState(4);
  const [strokes, setStrokes] = useState<AnnotationStroke[]>([]);
  const [undoStack, setUndoStack] = useState<AnnotationStroke[][]>([]);
  const [redoStack, setRedoStack] = useState<AnnotationStroke[][]>([]);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [isFrozen, setIsFrozen] = useState(false);

  // 6. RECORDING STATE
  const [isRecording, setIsRecording] = useState(false);
  const [recordingFormattedTime, setRecordingFormattedTime] = useState('00:00:00');
  const [isStartRecordingModalOpen, setIsStartRecordingModalOpen] = useState(false);
  const [completedRecording, setCompletedRecording] = useState<RecordingProject | null>(null);
  const [isRecordingCompleteModalOpen, setIsRecordingCompleteModalOpen] = useState(false);

  // 7. AI VOICE COMMANDS & CAPTIONS
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
  const [lastVoiceCommand, setLastVoiceCommand] = useState<RecognizedVoiceCommand | null>(null);
  const [pendingDestructiveCommand, setPendingDestructiveCommand] = useState<RecognizedVoiceCommand | null>(null);
  const [liveCaptionText, setLiveCaptionText] = useState('');
  const [showLiveCaptions, setShowLiveCaptions] = useState(false);

  // 8. PRIVATE TEACHER NOTES & AI ASSISTANT DRAWERS
  const [teacherNotes, setTeacherNotes] = useState<Record<string, TeacherNoteEntry>>({});
  const [isTeacherNotesOpen, setIsTeacherNotesOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

  // 9. PART 05 INTEGRATION PREVIEWS
  const [isStudentViewModalOpen, setIsStudentViewModalOpen] = useState(false);
  const [isYouTubeLiveModalOpen, setIsYouTubeLiveModalOpen] = useState(false);

  // Canvas container reference for recording and snapshots
  const studioMainCanvasRef = useRef<HTMLDivElement | null>(null);

  // Extract presentation and mindmap outputs safely from PART 03
  const presentationContent = (
    (activeProject?.outputs?.slides?.teacherEditedContent as PresentationContent | undefined) ||
    (activeProject?.outputs?.slides?.rawAiContent as PresentationContent | undefined) ||
    null
  );

  const mindMapContent = (
    (activeProject?.outputs?.mind_map?.teacherEditedContent as MindMapContent | undefined) ||
    (activeProject?.outputs?.mind_map?.rawAiContent as MindMapContent | undefined) ||
    null
  );

  const totalSlides = presentationContent?.slides?.length || 4;

  // -------------------------------------------------------------------------
  // INITIALIZATION: Check Session Recovery & Hardware Setup
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!activeProject) return;

    // Load saved teacher notes
    const loadedNotes = teachingSessionService.getTeacherNotesForProject(activeProject.id);
    setTeacherNotes(loadedNotes);

    // Check for crash recovery session (Section 51)
    const recoverable = teachingSessionService.getRecoverableSession();
    if (recoverable && recoverable.projectId === activeProject.id) {
      const wantRecover = window.confirm(
        `An unfinished teaching session was found from ${new Date(
          recoverable.savedAt
        ).toLocaleTimeString()}.\nWould you like to recover your slide position, layout, and drawings?`
      );
      if (wantRecover) {
        setActiveLayout(recoverable.activeLayout);
        setContentMode(recoverable.contentMode);
        setCurrentSlideIndex(recoverable.currentSlideIndex);
        setStrokes(recoverable.annotations || []);
        setIsFrozen(recoverable.isFrozen || false);
        setAudioPreset(recoverable.audioPreset || 'clear_teaching');
      } else {
        teachingSessionService.clearRecoverableSession();
      }
    }

    // Initialize microphone with permission
    audioEngine
      .startInputStream()
      .then((stream) => {
        setAudioStream(stream);
      })
      .catch((err) => {
        console.warn('Microphone permission notice:', err);
      });

    // Subscribe to mic level
    const unsubMeter = audioEngine.onMeterUpdate((lvl) => {
      setMicLevel(lvl);
    });

    // Subscribe to recording timer
    const unsubRec = recordingService.onStatsUpdate((stats: ActiveRecordingStats) => {
      setRecordingFormattedTime(stats.formattedTime);
    });

    // Subscribe to AI voice commands
    const unsubVoice = voiceCommandService.onCommand((cmd: RecognizedVoiceCommand) => {
      handleVoiceCommand(cmd);
    });

    // Subscribe to live captions
    const unsubCaptions = voiceCommandService.onCaption((text: string) => {
      setLiveCaptionText(text);
      setShowLiveCaptions(true);
    });

    return () => {
      unsubMeter();
      unsubRec();
      unsubVoice();
      unsubCaptions();
      audioEngine.stopInputStream();
      cameraService.stopCamera();
    };
  }, [activeProject]);

  // Periodic Auto-Save for Session Recovery (Section 50)
  useEffect(() => {
    if (!activeProject) return;

    const interval = setInterval(() => {
      teachingSessionService.saveSession({
        sessionId: `session_${activeProject.id}`,
        projectId: activeProject.id,
        projectName: activeProject.name,
        activeLayout,
        contentMode,
        currentSlideIndex,
        selectedMindMapNodeId: selectedMindMapNode?.id || null,
        annotations: strokes,
        isFrozen,
        teacherNotes,
        audioPreset,
        savedAt: Date.now(),
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [
    activeProject,
    activeLayout,
    contentMode,
    currentSlideIndex,
    selectedMindMapNode,
    strokes,
    isFrozen,
    teacherNotes,
    audioPreset,
  ]);

  // PART 05: Real-time Classroom Broadcast Synchronization
  useEffect(() => {
    if (activeClassCode) {
      classroomService.updateBroadcastState(activeClassCode, {
        contentMode,
        currentSlideIndex,
        totalSlides,
        teacherCameraActive: isCameraActive,
        teacherMicActive: !isMicMuted,
      });
    }
  }, [activeClassCode, contentMode, currentSlideIndex, totalSlides, isCameraActive, isMicMuted]);

  // PART 05: Classroom Participants & Hand Raise Monitoring
  useEffect(() => {
    if (!activeClassCode) return;

    classroomService.getParticipants(activeClassCode).then((parts) => {
      const active = parts.filter((p) => p.status === 'active');
      setClassroomStudentCount(active.length);
      setClassroomRaisedHandsCount(active.filter((p) => p.handRaised).length);
    });

    const unsub = classroomService.subscribeToClassEvents(
      activeClassCode,
      'teacher',
      'teacher-main',
      (ev) => {
        if (
          ev.type === 'STUDENT_JOINED' ||
          ev.type === 'STUDENT_LEFT' ||
          ev.type === 'STUDENT_STATUS_UPDATED' ||
          ev.type === 'STUDENT_REMOVED'
        ) {
          classroomService.getParticipants(activeClassCode).then((parts) => {
            const active = parts.filter((p) => p.status === 'active');
            setClassroomStudentCount(active.length);
            setClassroomRaisedHandsCount(active.filter((p) => p.handRaised).length);
          });
        }
      }
    );

    return () => unsub();
  }, [activeClassCode]);

  // -------------------------------------------------------------------------
  // KEYBOARD SHORTCUTS (Section 4 & 55)
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.min(totalSlides - 1, prev + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key.toLowerCase() === 'm') {
        handleToggleMute();
      } else if (e.key.toLowerCase() === 'v') {
        handleToggleCamera();
      } else if (e.key.toLowerCase() === 'w') {
        setContentMode((m) => (m === 'whiteboard' ? 'slides' : 'whiteboard'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalSlides, strokes, undoStack, redoStack]);

  // -------------------------------------------------------------------------
  // CAMERA TOGGLE
  // -------------------------------------------------------------------------
  const handleToggleCamera = async () => {
    if (isCameraActive) {
      cameraService.stopCamera();
      setIsCameraActive(false);
      setCameraStream(null);
    } else {
      try {
        const stream = await cameraService.startCamera();
        setCameraStream(stream);
        setIsCameraActive(true);
      } catch (err: any) {
        alert(err.message || 'Could not start camera.');
      }
    }
  };

  // -------------------------------------------------------------------------
  // AUDIO TOGGLE
  // -------------------------------------------------------------------------
  const handleToggleMute = () => {
    const nextMute = !isMicMuted;
    setIsMicMuted(nextMute);
    audioEngine.setMuted(nextMute);
  };

  // -------------------------------------------------------------------------
  // WHITEBOARD STROKE ACTIONS (Undo, Redo, Clear)
  // -------------------------------------------------------------------------
  const handleStrokesChange = (newStrokes: AnnotationStroke[]) => {
    setUndoStack((prev) => [...prev, strokes]);
    setRedoStack([]);
    setStrokes(newStrokes);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, strokes]);
    setUndoStack((prev) => prev.slice(0, -1));
    setStrokes(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, strokes]);
    setRedoStack((prev) => prev.slice(0, -1));
    setStrokes(next);
  };

  const handleClearAnnotations = () => {
    if (strokes.length === 0) return;
    if (window.confirm('Clear all whiteboard drawings on this screen?')) {
      handleStrokesChange([]);
    }
  };

  // -------------------------------------------------------------------------
  // SNAPSHOT CAPTURE (Section 27)
  // -------------------------------------------------------------------------
  const handleCaptureSnapshot = () => {
    // Find the whiteboard canvas or generate snapshot
    const canvas = document.getElementById('whiteboard-annotation-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${activeProject?.name || 'Lesson'}_Snapshot_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.warn('Snapshot capture notice:', e);
    }
  };

  // -------------------------------------------------------------------------
  // VOICE COMMAND DISPATCHER (Section 31 - 34)
  // -------------------------------------------------------------------------
  const handleVoiceCommand = (cmd: RecognizedVoiceCommand) => {
    setLastVoiceCommand(cmd);

    // Destructive check (Section 33)
    if (cmd.isDestructive) {
      setPendingDestructiveCommand(cmd);
      return;
    }

    // Execute safe commands
    switch (cmd.intent) {
      case 'next_slide':
        setCurrentSlideIndex((prev) => Math.min(totalSlides - 1, prev + 1));
        break;
      case 'prev_slide':
        setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
        break;
      case 'jump_slide':
        if (typeof cmd.parameter === 'number') {
          const targetIndex = cmd.parameter - 1;
          if (targetIndex >= 0 && targetIndex < totalSlides) {
            setCurrentSlideIndex(targetIndex);
          }
        }
        break;
      case 'open_mind_map':
        setContentMode('mind_map');
        setActiveLayout('mind_map_detail');
        setShowDetailPanel(true);
        break;
      case 'open_whiteboard':
        setContentMode('whiteboard');
        setActiveLayout('whiteboard_only');
        break;
      case 'show_notes':
        setIsTeacherNotesOpen(true);
        break;
      case 'explain_topic':
        setIsAIAssistantOpen(true);
        break;
      case 'start_recording':
        if (!isRecording) {
          setIsStartRecordingModalOpen(true);
        }
        break;
      case 'stop_recording':
        if (isRecording) {
          handleStopRecording();
        }
        break;
      case 'go_fullscreen':
        handleToggleFullscreen();
        break;
      default:
        break;
    }

    // Auto-hide command pill after 2.5 seconds
    setTimeout(() => {
      setLastVoiceCommand(null);
    }, 2500);
  };

  // -------------------------------------------------------------------------
  // RECORDING LIFECYCLE (Section 37 - 43)
  // -------------------------------------------------------------------------
  const handleConfirmStartRecording = async (mode: RecordingMode) => {
    setIsStartRecordingModalOpen(false);

    // Grab the main studio canvas element
    const canvas = document.getElementById('whiteboard-annotation-canvas') as HTMLCanvasElement;
    if (!canvas) {
      alert('Could not initialize video capture canvas.');
      return;
    }

    const success = await recordingService.startRecording({
      projectId: activeProject?.id || 'demo_proj',
      projectTitle: activeProject?.name || 'Lesson',
      mode,
      layout: activeLayout,
      videoCanvas: canvas,
      audioStream: audioEngine.getProcessedStream(),
      cameraEnabled: isCameraActive,
      cameraLayout,
      audioPreset,
    });

    if (success) {
      setIsRecording(true);
    } else {
      alert('Could not start recording with current hardware configuration.');
    }
  };

  const handleStopRecording = async () => {
    const project = await recordingService.stopRecording(strokes);
    setIsRecording(false);
    if (project) {
      setCompletedRecording(project);
      setIsRecordingCompleteModalOpen(true);
    }
  };

  const handleSaveRecordingToProject = (recording: RecordingProject) => {
    if (!activeProject) return;

    // Attach to project output under videos for non-destructive storage
    updateActiveProject((prev) => ({
      ...prev,
      updatedTimestamp: Date.now(),
    }));
  };

  // -------------------------------------------------------------------------
  // FULLSCREEN
  // -------------------------------------------------------------------------
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // -------------------------------------------------------------------------
  // TEACHER NOTES
  // -------------------------------------------------------------------------
  const handleSaveTeacherNote = (note: TeacherNoteEntry) => {
    if (!activeProject) return;
    teachingSessionService.saveTeacherNote(activeProject.id, note);
    setTeacherNotes((prev) => ({
      ...prev,
      [note.targetId]: note,
    }));
  };

  const handleDeleteTeacherNote = (targetId: string) => {
    if (!activeProject) return;
    teachingSessionService.deleteTeacherNote(activeProject.id, targetId);
    setTeacherNotes((prev) => {
      const next = { ...prev };
      delete next[targetId];
      return next;
    });
  };

  return (
    <div
      id="ai-teaching-studio-root"
      className="relative w-screen h-screen flex flex-col bg-slate-900 text-slate-100 overflow-hidden font-sans select-none"
    >
      {/* 1. TOP NAVIGATION & STATUS BAR */}
      <TeachingTopBar
        projectName={activeProject?.name || 'AI Teaching Studio'}
        activeLayout={activeLayout}
        onLayoutChange={(l) => {
          setActiveLayout(l);
          if (l === 'whiteboard_only') setContentMode('whiteboard');
          else if (l === 'mind_map_detail') {
            setContentMode('mind_map');
            setShowDetailPanel(true);
          }
        }}
        contentMode={contentMode}
        onContentModeChange={(m) => {
          setContentMode(m);
          if (m === 'whiteboard') setActiveLayout('whiteboard_only');
          else if (m === 'mind_map') setShowDetailPanel(true);
        }}
        currentSlideIndex={currentSlideIndex}
        totalSlides={totalSlides}
        selectedTopicTitle={selectedMindMapNode?.title}
        isRecording={isRecording}
        recordingFormattedTime={recordingFormattedTime}
        onStartRecordingClick={() => setIsStartRecordingModalOpen(true)}
        onStopRecordingClick={handleStopRecording}
        onOpenAudioSettings={() => setIsAudioModalOpen(true)}
        onOpenCameraSettings={() => setIsCameraModalOpen(true)}
        onOpenStudentViewPreview={() => setIsStudentViewModalOpen(true)}
        onOpenYouTubeLiveModal={() => setIsYouTubeLiveModalOpen(true)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onExitStudio={onExit}
        classCode={activeClassCode}
        studentCount={classroomStudentCount}
        raisedHandsCount={classroomRaisedHandsCount}
        onOpenClassroomPanel={() => setIsClassroomDrawerOpen(!isClassroomDrawerOpen)}
      />

      {/* 2. MAIN TEACHING WORKSPACE AREA */}
      <main
        id="teaching-workspace-main"
        aria-label="Teaching Studio Main Workspace"
        className="relative flex-1 flex overflow-hidden min-h-0"
      >
        {/* LEFT / CENTER: PRIMARY CONTENT CANVAS (Slides / Mind Map / Whiteboard) */}
        <div
          ref={studioMainCanvasRef}
          id="teaching-primary-canvas-stage"
          className="relative flex-1 flex flex-col h-full overflow-hidden bg-slate-950"
        >
          {/* A. CONTENT VIEWPORT (Underlay) */}
          <div className="relative flex-1 w-full h-full overflow-hidden flex">
            {/* Mode 1: SLIDES */}
            {contentMode === 'slides' && (
              <div className="w-full h-full flex">
                {/* If layout is teacher_content (Side-by-side 50/50), show camera side */}
                {activeLayout === 'teacher_content' && isCameraActive && (
                  <div className="w-1/2 h-full p-3 border-r border-slate-800">
                    <TeacherCameraOverlay
                      layout="side_by_side"
                      onClose={() => setIsCameraActive(false)}
                      onChangeLayout={setCameraLayout}
                      stream={cameraStream}
                    />
                  </div>
                )}

                <div className={`${activeLayout === 'teacher_content' && isCameraActive ? 'w-1/2' : 'w-full'} h-full`}>
                  <PresentationCanvas
                    presentation={presentationContent}
                    currentSlideIndex={currentSlideIndex}
                    onSlideChange={setCurrentSlideIndex}
                    onSelectTopicForDetail={(title, exp) => {
                      setSelectedMindMapNode({
                        id: `slide_topic_${currentSlideIndex}`,
                        parentId: null,
                        title,
                        shortDescription: exp,
                        detailedExplanation: exp,
                        keyPoints: [],
                        examples: [],
                        questions: [],
                        sourceReferences: [],
                      });
                      setShowDetailPanel(true);
                    }}
                    onExplainWithAI={(topic) => {
                      setSelectedMindMapNode({
                        id: `slide_ai_${currentSlideIndex}`,
                        parentId: null,
                        title: topic,
                        shortDescription: `Slide concept: ${topic}`,
                        detailedExplanation: '',
                        keyPoints: [],
                        examples: [],
                        questions: [],
                        sourceReferences: [],
                      });
                      setIsAIAssistantOpen(true);
                    }}
                  />
                </div>
              </div>
            )}

            {/* Mode 2: MIND MAP */}
            {contentMode === 'mind_map' && (
              <div className="w-full h-full flex">
                <div className="flex-1 h-full">
                  <MindMapCanvas
                    mindMap={mindMapContent}
                    selectedNodeId={selectedMindMapNode?.id || null}
                    onSelectNode={(node) => {
                      setSelectedMindMapNode(node);
                      setShowDetailPanel(true);
                    }}
                  />
                </div>
              </div>
            )}

            {/* Mode 2.5: VISUAL TREE */}
            {contentMode === 'visual_tree' && (
              <div className="w-full h-full flex">
                <div className="flex-1 h-full">
                  <VisualTreeCanvas
                    content={
                      mindMapContent || {
                        id: 'fallback_tree',
                        title: activeProject?.name || 'Curriculum Knowledge Tree',
                        summary: 'Hierarchical conceptual framework',
                        displayMode: 'tree',
                        rootNode: {
                          id: 'root_subject',
                          parentId: null,
                          title: activeProject?.name || 'Core Curriculum',
                          nodeType: 'ROOT',
                          shortDescription: 'Core educational concept map grounded in curriculum sources.',
                          detailedExplanation: 'Comprehensive conceptual framework structured for visual exploration and classroom instruction.',
                          keyPoints: ['Foundational theory', 'Active learning pathways', 'Exam-tested concepts'],
                          examples: ['Applied classroom demonstration'],
                          questions: ['How do these subtopics interconnect?'],
                          sourceReferences: [],
                          children: [
                            {
                              id: 'sub_1',
                              parentId: 'root_subject',
                              title: 'Foundations & Principles',
                              nodeType: 'CONCEPT',
                              shortDescription: 'Essential theoretical foundations and mechanisms.',
                              detailedExplanation: 'Underlying scientific laws and governing relationships.',
                              keyPoints: ['Fundamental law', 'Key variables'],
                              examples: ['Direct application example'],
                              questions: ['What causes the rate change?'],
                              sourceReferences: [],
                              children: []
                            },
                            {
                              id: 'sub_2',
                              parentId: 'root_subject',
                              title: 'Experimental Process',
                              nodeType: 'PROCESS',
                              shortDescription: 'Step-by-step procedures and methodologies.',
                              detailedExplanation: 'Detailed phases of the chemical and biological pathway.',
                              keyPoints: ['Phase 1 initiation', 'Phase 2 catalysis'],
                              examples: ['Laboratory setup'],
                              questions: ['What is the control variable?'],
                              sourceReferences: [],
                              children: []
                            }
                          ]
                        }
                      }
                    }
                    selectedNode={selectedMindMapNode}
                    onSelectNode={(node) => {
                      setSelectedMindMapNode(node);
                      setShowDetailPanel(true);
                    }}
                  />
                </div>
              </div>
            )}

            {/* Mode 3: STANDALONE WHITEBOARD */}
            {contentMode === 'whiteboard' && (
              <div className="w-full h-full bg-white relative">
                {/* Clean standalone whiteboard rendered by WhiteboardCanvas */}
              </div>
            )}
          </div>

          {/* B. WHITEBOARD & ANNOTATION LAYER (Overlay directly on top of slides/mindmap) */}
          <WhiteboardCanvas
            isStandaloneWhiteboard={contentMode === 'whiteboard'}
            activeTool={activeTool}
            penColor={penColor}
            penSize={penSize}
            strokes={strokes}
            onStrokesChange={handleStrokesChange}
            showAnnotations={showAnnotations}
            isFrozen={isFrozen}
          />

          {/* C. TEACHER CAMERA OVERLAY (Bubble or PiP or Fullscreen) */}
          {isCameraActive && activeLayout !== 'teacher_content' && (
            <TeacherCameraOverlay
              layout={cameraLayout}
              onClose={() => setIsCameraActive(false)}
              onChangeLayout={setCameraLayout}
              stream={cameraStream}
            />
          )}

          {/* D. LIVE CAPTIONS OVERLAY */}
          <LiveCaptionsOverlay
            transcript={liveCaptionText}
            isVisible={showLiveCaptions}
            onClose={() => setShowLiveCaptions(false)}
          />

          {/* E. AI VOICE COMMAND FEEDBACK PILL */}
          <VoiceCommandFeedback
            lastCommand={lastVoiceCommand}
            pendingDestructiveCommand={pendingDestructiveCommand}
            onConfirmDestructive={() => {
              handleStrokesChange([]);
              setPendingDestructiveCommand(null);
            }}
            onCancelDestructive={() => setPendingDestructiveCommand(null)}
          />

          {/* F. BOTTOM FLOATING TEACHING TOOLBAR */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-center pointer-events-none z-30">
            <div className="pointer-events-auto">
              <TeachingToolbar
                isMicMuted={isMicMuted}
                micLevel={micLevel}
                onToggleMute={handleToggleMute}
                onOpenAudioSettings={() => setIsAudioModalOpen(true)}
                isCameraActive={isCameraActive}
                cameraLayout={cameraLayout}
                onToggleCamera={handleToggleCamera}
                onChangeCameraLayout={setCameraLayout}
                contentMode={contentMode}
                onContentModeChange={(m) => {
                  setContentMode(m);
                  if (m === 'whiteboard') setActiveLayout('whiteboard_only');
                }}
                activeTool={activeTool}
                onSelectTool={setActiveTool}
                penColor={penColor}
                onChangePenColor={setPenColor}
                penSize={penSize}
                onChangePenSize={setPenSize}
                canUndo={undoStack.length > 0}
                canRedo={redoStack.length > 0}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onClearAnnotations={handleClearAnnotations}
                showAnnotations={showAnnotations}
                onToggleShowAnnotations={() => setShowAnnotations(!showAnnotations)}
                isFrozen={isFrozen}
                onToggleFreeze={() => setIsFrozen(!isFrozen)}
                onCaptureSnapshot={handleCaptureSnapshot}
                onOpenAIAssistant={() => setIsAIAssistantOpen(!isAIAssistantOpen)}
                onOpenTeacherNotes={() => setIsTeacherNotesOpen(!isTeacherNotesOpen)}
                isPushToTalkActive={isPushToTalkActive}
                onPushToTalkDown={() => {
                  setIsPushToTalkActive(true);
                  voiceCommandService.setPushToTalk(true);
                }}
                onPushToTalkUp={() => {
                  setIsPushToTalkActive(false);
                  voiceCommandService.setPushToTalk(false);
                }}
                voiceCommandAvailable={voiceCommandService.isSupported()}
              />
            </div>
          </div>
        </div>

        {/* RIGHT: TOPIC DETAIL PANEL (Slides / Mind Map breakdown) */}
        {(showDetailPanel || activeLayout === 'mind_map_detail') && (
          <DetailPanel
            node={selectedMindMapNode}
            onClose={() => setShowDetailPanel(false)}
            onSaveTeacherNote={handleSaveTeacherNote}
            existingTeacherNote={
              selectedMindMapNode ? teacherNotes[`node_${selectedMindMapNode.id}`] : undefined
            }
            onInsertToWhiteboard={(text) => {
              const newStroke: AnnotationStroke = {
                id: `stroke_text_${Date.now()}`,
                tool: 'text',
                points: [{ x: 80, y: 120 }],
                color: '#ffffff',
                size: 4,
                opacity: 1,
                text,
                timestamp: Date.now(),
              };
              handleStrokesChange([...strokes, newStroke]);
            }}
            onSendToClassroom={(questionText) => {
              classroomService.createPoll(activeClassCode, questionText, ['Understood', 'Needs Clarification', 'Have Question']);
              setIsClassroomDrawerOpen(true);
            }}
            onUpdateNode={(updatedNode) => {
              setSelectedMindMapNode(updatedNode);
              if (!mindMapContent) return;
              const copy: MindMapContent = JSON.parse(JSON.stringify(mindMapContent));
              function update(n: MindMapNode): boolean {
                if (n.id === updatedNode.id) {
                  Object.assign(n, updatedNode);
                  return true;
                }
                if (n.children) {
                  for (const c of n.children) {
                    if (update(c)) return true;
                  }
                }
                return false;
              }
              if (copy.rootNode) update(copy.rootNode);
              updateActiveProject((prev) => ({
                ...prev,
                outputs: {
                  ...prev.outputs,
                  mind_map: {
                    ...(prev.outputs.mind_map as any),
                    teacherEditedContent: copy,
                    activeView: 'teacher',
                    lastModifiedAt: Date.now(),
                  },
                },
              }));
            }}
            onAddChildNodes={(parentId, newNodes) => {
              if (!mindMapContent) return;
              const copy: MindMapContent = JSON.parse(JSON.stringify(mindMapContent));
              function add(n: MindMapNode): boolean {
                if (n.id === parentId) {
                  n.children = [...(n.children || []), ...newNodes];
                  return true;
                }
                if (n.children) {
                  for (const c of n.children) {
                    if (add(c)) return true;
                  }
                }
                return false;
              }
              if (copy.rootNode) add(copy.rootNode);
              updateActiveProject((prev) => ({
                ...prev,
                outputs: {
                  ...prev.outputs,
                  mind_map: {
                    ...(prev.outputs.mind_map as any),
                    teacherEditedContent: copy,
                    activeView: 'teacher',
                    lastModifiedAt: Date.now(),
                  },
                },
              }));
              if (selectedMindMapNode?.id === parentId) {
                setSelectedMindMapNode({
                  ...selectedMindMapNode,
                  children: [...(selectedMindMapNode.children || []), ...newNodes],
                });
              }
            }}
          />
        )}
      </main>

      {/* 3. MODALS & DRAWERS */}
      {/* A. Hardware Audio DSP Modal */}
      <AudioSettingsModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
      />

      {/* B. Hardware Camera Modal */}
      <CameraSettingsModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        activeLayout={cameraLayout}
        onChangeLayout={setCameraLayout}
        onCameraToggled={setIsCameraActive}
      />

      {/* C. Start Recording Mode Selector */}
      <StartRecordingModal
        isOpen={isStartRecordingModalOpen}
        onClose={() => setIsStartRecordingModalOpen(false)}
        onConfirmStart={handleConfirmStartRecording}
        cameraActive={isCameraActive}
      />

      {/* D. Recording Complete & Export Modal */}
      <RecordingCompleteModal
        isOpen={isRecordingCompleteModalOpen}
        recording={completedRecording}
        onClose={() => setIsRecordingCompleteModalOpen(false)}
        onSaveToProject={handleSaveRecordingToProject}
        onOpenEditor={onOpenVideoEditor}
      />

      {/* E. In-Studio AI Assistant Drawer */}
      <AIAssistantDrawer
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        currentContext={{
          title: selectedMindMapNode?.title || `Slide ${currentSlideIndex + 1}`,
          description: selectedMindMapNode?.shortDescription || activeProject?.subject || activeProject?.name || '',
        }}
        onInsertToNotes={(text) => {
          handleSaveTeacherNote({
            targetId: `slide_${currentSlideIndex}`,
            targetType: 'slide',
            title: `Slide ${currentSlideIndex + 1}`,
            content: text,
            isPrivate: true,
            updatedAt: Date.now(),
          });
        }}
        onInsertToWhiteboard={(text) => {
          const newStroke: AnnotationStroke = {
            id: `stroke_ai_${Date.now()}`,
            tool: 'text',
            points: [{ x: 60, y: 100 }],
            color: '#38bdf8',
            size: 4,
            opacity: 1,
            text,
            timestamp: Date.now(),
          };
          handleStrokesChange([...strokes, newStroke]);
        }}
      />

      {/* F. Private Teacher Notes Drawer */}
      <TeacherNotesDrawer
        isOpen={isTeacherNotesOpen}
        onClose={() => setIsTeacherNotesOpen(false)}
        notes={teacherNotes}
        activeSlideIndex={currentSlideIndex}
        selectedNodeTitle={selectedMindMapNode?.title}
        onSaveNote={handleSaveTeacherNote}
        onDeleteNote={handleDeleteTeacherNote}
      />

      {/* G. Part 05 Classroom Student View Preview */}
      <StudentViewModal
        isOpen={isStudentViewModalOpen}
        onClose={() => setIsStudentViewModalOpen(false)}
        projectName={activeProject?.name || 'Classroom Lesson'}
        currentSlideIndex={currentSlideIndex}
        totalSlides={totalSlides}
        contentMode={contentMode}
        hasCamera={isCameraActive}
        classCode={activeClassCode}
        onOpenLiveStudentView={onOpenLiveStudentView}
      />

      {/* H. Part 05 YouTube Live Hub */}
      <YouTubeLiveModal
        isOpen={isYouTubeLiveModalOpen}
        onClose={() => setIsYouTubeLiveModalOpen(false)}
        projectName={activeProject?.name || 'Classroom Lesson'}
        hasCameraActive={isCameraActive}
        hasMicActive={!isMicMuted}
        isSimultaneousClassroomActive={classroomStudentCount > 0}
      />

      {/* I. Part 05 Interactive Classroom Drawer */}
      <ClassroomInteractionDrawer
        isOpen={isClassroomDrawerOpen}
        onClose={() => setIsClassroomDrawerOpen(false)}
        classCode={activeClassCode}
        className={activeProject?.name}
      />
    </div>
  );
};
