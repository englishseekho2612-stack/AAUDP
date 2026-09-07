import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { TeachingProject, LearningSource, SourcePriority, AIOutputType, ProjectAIOutput } from '../types/project';
import { projectRepository, CreateProjectDTO } from '../storage/projectRepository';
import { blobStorage } from '../storage/blobStorage';
import { MAX_SOURCES_PER_PROJECT } from '../services/sourceEngineContract';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ProjectContextType {
  projects: TeachingProject[];
  activeProject: TeachingProject | null;
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: number | null;
  error: string | null;
  toasts: ToastMessage[];
  createProject: (dto: CreateProjectDTO) => Promise<TeachingProject>;
  openProject: (id: string) => Promise<void>;
  closeProject: () => void;
  updateActiveProject: (updater: (prev: TeachingProject) => TeachingProject) => void;
  saveActiveProjectNow: () => Promise<void>;
  renameProject: (id: string, newName: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<TeachingProject>;
  deleteProject: (id: string) => Promise<void>;
  refreshProjects: () => Promise<void>;
  addSourceToActiveProject: (source: LearningSource, replaceSourceId?: string) => void;
  removeSourceFromActiveProject: (source: LearningSource) => Promise<void>;
  toggleSourcePriorityInActiveProject: (sourceId: string, priority: SourcePriority) => void;
  toggleSourceAISelectionInActiveProject: (sourceId: string, selected: boolean) => void;
  reorderSourcesInActiveProject: (sourceId: string, direction: 'up' | 'down') => void;
  updateTeacherInstructionsInActiveProject: (instructions: string) => Promise<void>;
  saveProjectOutput: (outputType: AIOutputType, output: ProjectAIOutput) => Promise<void>;
  updateProjectOutputTeacherEdits: (outputType: AIOutputType, teacherEditedContent: any) => Promise<void>;
  restoreProjectOutputToAI: (outputType: AIOutputType) => Promise<void>;
  switchProjectOutputView: (outputType: AIOutputType, view: 'ai' | 'teacher' | 'split') => void;
  deleteProjectOutput: (outputType: AIOutputType) => Promise<void>;
  dismissToast: (id: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const ACTIVE_PROJECT_STORAGE_KEY = 'ai_teaching_studio_active_proj_id';

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<TeachingProject[]>([]);
  const [activeProject, setActiveProject] = useState<TeachingProject | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const autoSaveTimerRef = useRef<number | null>(null);
  const pendingSaveProjectRef = useRef<TeachingProject | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Load all projects on mount
  const refreshProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      let list = await projectRepository.getAll();
      
      // If first-ever launch with no projects, seed the starter projects from specification
      const hasInitialized = localStorage.getItem('ai_teaching_studio_initialized_v2');
      if (list.length === 0 || !hasInitialized) {
        let biologyProject = list.find((p) => p.name.includes('Photosynthesis'));
        if (!biologyProject) {
          biologyProject = await projectRepository.create({
            name: 'Class 10 Biology — Photosynthesis',
            subject: 'Biology',
            classGrade: 'Class 10',
            language: 'en',
          });

          // Preload the Photosynthesis curriculum source for testing Section 33
          const photosynthesisText = `Topic: Photosynthesis\n\nOverview:\nPhotosynthesis is the fundamental biological process by which green plants and certain photosynthetic organisms transform light energy into chemical energy. During photosynthesis, light energy is absorbed to convert water, carbon dioxide, and inorganic minerals into oxygen and energy-rich carbohydrates (glucose).\n\nKey Mechanisms and Concepts:\n1. Chloroplast Structure:\nPhotosynthesis takes place within the chloroplasts of photosynthetic plant cells. Chloroplasts contain thylakoid membranes organized into coin-like stacks called grana, suspended within a protein-rich fluid termed stroma. Chlorophyll a and b pigments embedded in thylakoid membranes absorb blue and red light wavelengths while reflecting green.\n\n2. Light Reactions (Thylakoid Membrane):\nLight-dependent reactions occur across the thylakoid membrane. Solar photons excite electrons in chlorophyll reaction centers, inducing photolysis of water molecules (which releases gaseous oxygen O2). High-energy electron transport generates a proton gradient across the thylakoid lumen that drives ATP synthase to produce ATP and reduces NADP+ to NADPH.\n\n3. Dark Reactions / Calvin Cycle (Stroma):\nThe light-independent reactions (Calvin cycle) take place in the stroma. Atmospheric carbon dioxide is fixed by the enzyme RuBisCO into 3-phosphoglycerate (3-PGA). ATP and NADPH from the light reactions provide chemical energy and reducing power to synthesize Glyceraldehyde 3-phosphate (G3P) and glucose. RuBP is regenerated to sustain cyclical fixation.\n\n4. ATP Production & Energy Currency:\nATP synthesis via photophosphorylation stores high-energy chemical bonds that fuel carbon fixation and plant metabolic processes.\n\n5. Factors Affecting Photosynthesis:\nKey limiting factors include Light Intensity, Carbon Dioxide Concentration, Temperature, and Water Availability (governed by Blackman's Principle of Limiting Factors).`;

          const photoSource: LearningSource = {
            id: `src_photo_${Date.now()}`,
            projectId: biologyProject.id,
            name: 'Photosynthesis Core Biology Curriculum',
            type: 'text',
            priority: 'primary',
            selectedForAI: true,
            status: 'ready',
            originalRef: 'internal://photosynthesis_curriculum.txt',
            characterCount: photosynthesisText.length,
            wordCount: photosynthesisText.split(/\s+/).filter(Boolean).length,
            extractedText: photosynthesisText,
            metadata: {
              originalFileName: 'photosynthesis_curriculum.txt',
              lastExtractedLength: photosynthesisText.length,
            },
            orderIndex: 0,
            createdTimestamp: Date.now(),
            updatedTimestamp: Date.now(),
          };

          biologyProject.sources = [photoSource];
          await projectRepository.update(biologyProject);
        }

        let englishProject = list.find((p) => p.name.includes('His First Flight'));
        if (!englishProject) {
          englishProject = await projectRepository.create({
            name: 'Class 10 English — His First Flight',
            subject: 'English',
            classGrade: 'Class 10',
            language: 'en',
          });
        }

        list = await projectRepository.getAll();
        localStorage.setItem('ai_teaching_studio_initialized_v2', 'true');
      }

      setProjects(list);

      // Restore active project if remembered
      const savedActiveId = localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY);
      if (savedActiveId && !activeProject) {
        const found = list.find((p) => p.id === savedActiveId);
        if (found) {
          setActiveProject(found);
        }
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError('Could not load local projects. Your previous data is preserved.');
    } finally {
      setIsLoading(false);
    }
  }, [activeProject]);

  useEffect(() => {
    refreshProjects();
  }, []);

  // Save active project helper
  const performSave = async (proj: TeachingProject) => {
    try {
      setIsSaving(true);
      const updated = await projectRepository.update(proj);
      setLastSaved(Date.now());
      // Update in projects list
      setProjects((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
      return updated;
    } catch (err) {
      console.error('Failed to auto-save project:', err);
      showToast('Autosave paused. Local cache maintained.', 'error');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const saveActiveProjectNow = useCallback(async () => {
    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    const current = pendingSaveProjectRef.current || activeProject;
    if (current) {
      await performSave(current);
      pendingSaveProjectRef.current = null;
    }
  }, [activeProject]);

  // Update active project with debounced auto-save (Section 12: Auto-save foundation)
  const updateActiveProject = useCallback((updater: (prev: TeachingProject) => TeachingProject) => {
    setActiveProject((prev) => {
      if (!prev) return null;
      const updated = updater(prev);
      pendingSaveProjectRef.current = updated;

      if (autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = window.setTimeout(() => {
        if (pendingSaveProjectRef.current) {
          performSave(pendingSaveProjectRef.current);
          pendingSaveProjectRef.current = null;
        }
      }, 800); // 800ms debounce

      return updated;
    });
  }, []);

  const createProject = useCallback(
    async (dto: CreateProjectDTO): Promise<TeachingProject> => {
      try {
        const newProj = await projectRepository.create(dto);
        setProjects((prev) => [newProj, ...prev]);
        setActiveProject(newProj);
        localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, newProj.id);
        showToast(`Project "${newProj.name}" created successfully.`, 'success');
        return newProj;
      } catch (err) {
        console.error('Failed to create project:', err);
        showToast('Failed to create project. Please try again.', 'error');
        throw err;
      }
    },
    [showToast]
  );

  const openProject = useCallback(
    async (id: string) => {
      try {
        // Flush any pending auto-save before switching
        if (pendingSaveProjectRef.current) {
          await saveActiveProjectNow();
        }

        const project = await projectRepository.getById(id);
        if (project) {
          const updated = { ...project, lastOpenedTimestamp: Date.now() };
          await projectRepository.update(updated);
          setActiveProject(updated);
          localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, id);
          setProjects((prev) =>
            prev.map((p) => (p.id === id ? updated : p))
          );
        } else {
          showToast('Project could not be found.', 'error');
        }
      } catch (err) {
        console.error('Failed to open project:', err);
        showToast('Unable to open project.', 'error');
      }
    },
    [saveActiveProjectNow, showToast]
  );

  const closeProject = useCallback(() => {
    if (pendingSaveProjectRef.current) {
      saveActiveProjectNow();
    }
    setActiveProject(null);
    localStorage.removeItem(ACTIVE_PROJECT_STORAGE_KEY);
  }, [saveActiveProjectNow]);

  const renameProject = useCallback(
    async (id: string, newName: string) => {
      try {
        const updated = await projectRepository.rename(id, newName);
        setProjects((prev) =>
          prev.map((p) => (p.id === id ? updated : p))
        );
        if (activeProject?.id === id) {
          setActiveProject(updated);
        }
        showToast('Project renamed successfully.', 'success');
      } catch (err) {
        console.error('Failed to rename project:', err);
        showToast('Could not rename project.', 'error');
        throw err;
      }
    },
    [activeProject, showToast]
  );

  const duplicateProject = useCallback(
    async (id: string): Promise<TeachingProject> => {
      try {
        const duplicated = await projectRepository.duplicate(id);
        setProjects((prev) => [duplicated, ...prev]);
        showToast(`Duplicated as "${duplicated.name}".`, 'success');
        return duplicated;
      } catch (err) {
        console.error('Failed to duplicate project:', err);
        showToast('Could not duplicate project.', 'error');
        throw err;
      }
    },
    [showToast]
  );

  const deleteProject = useCallback(
    async (id: string) => {
      try {
        await projectRepository.delete(id);
        setProjects((prev) => prev.filter((p) => p.id !== id));
        if (activeProject?.id === id) {
          setActiveProject(null);
          localStorage.removeItem(ACTIVE_PROJECT_STORAGE_KEY);
        }
        showToast('Project permanently deleted.', 'info');
      } catch (err) {
        console.error('Failed to delete project:', err);
        showToast('Failed to delete project.', 'error');
        throw err;
      }
    },
    [activeProject, showToast]
  );

  // Source Engine Management Implementations (Part 02)
  const addSourceToActiveProject = useCallback(
    (source: LearningSource, replaceSourceId?: string) => {
      updateActiveProject((prev) => {
        let nextSources: LearningSource[];
        if (replaceSourceId) {
          nextSources = prev.sources.map((s) => (s.id === replaceSourceId ? source : s));
        } else {
          if (prev.sources.length >= MAX_SOURCES_PER_PROJECT) return prev;
          nextSources = [...prev.sources, source];
        }
        nextSources.forEach((s, i) => {
          s.orderIndex = i;
        });
        return { ...prev, sources: nextSources };
      });
      saveActiveProjectNow();
      showToast(
        replaceSourceId ? `Source replaced with "${source.name}".` : `Source "${source.name}" added.`,
        'success'
      );
    },
    [updateActiveProject, saveActiveProjectNow, showToast]
  );

  const removeSourceFromActiveProject = useCallback(
    async (source: LearningSource) => {
      if (source.blobId) {
        try {
          await blobStorage.deleteBlob(source.blobId);
        } catch (e) {
          console.warn('Failed to delete associated blob:', e);
        }
      }
      updateActiveProject((prev) => {
        const nextSources = prev.sources.filter((s) => s.id !== source.id);
        nextSources.forEach((s, i) => {
          s.orderIndex = i;
        });
        return { ...prev, sources: nextSources };
      });
      await saveActiveProjectNow();
      showToast(`Source "${source.name}" removed. Slot freed.`, 'info');
    },
    [updateActiveProject, saveActiveProjectNow, showToast]
  );

  const toggleSourcePriorityInActiveProject = useCallback(
    (sourceId: string, priority: SourcePriority) => {
      updateActiveProject((prev) => ({
        ...prev,
        sources: prev.sources.map((s) => (s.id === sourceId ? { ...s, priority } : s)),
      }));
      saveActiveProjectNow();
    },
    [updateActiveProject, saveActiveProjectNow]
  );

  const toggleSourceAISelectionInActiveProject = useCallback(
    (sourceId: string, selected: boolean) => {
      updateActiveProject((prev) => ({
        ...prev,
        sources: prev.sources.map((s) => (s.id === sourceId ? { ...s, selectedForAI: selected } : s)),
      }));
      saveActiveProjectNow();
    },
    [updateActiveProject, saveActiveProjectNow]
  );

  const reorderSourcesInActiveProject = useCallback(
    (sourceId: string, direction: 'up' | 'down') => {
      updateActiveProject((prev) => {
        const idx = prev.sources.findIndex((s) => s.id === sourceId);
        if (idx === -1) return prev;
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= prev.sources.length) return prev;

        const copy = [...prev.sources];
        const temp = copy[idx];
        copy[idx] = copy[targetIdx];
        copy[targetIdx] = temp;
        copy.forEach((s, i) => {
          s.orderIndex = i;
        });
        return { ...prev, sources: copy };
      });
      saveActiveProjectNow();
    },
    [updateActiveProject, saveActiveProjectNow]
  );

  const updateTeacherInstructionsInActiveProject = useCallback(
    async (instructions: string) => {
      updateActiveProject((prev) => ({
        ...prev,
        teacherInstructions: instructions,
      }));
      await saveActiveProjectNow();
      showToast('Teacher instructions saved to project context.', 'success');
    },
    [updateActiveProject, saveActiveProjectNow, showToast]
  );

  const saveProjectOutput = useCallback(
    async (outputType: AIOutputType, output: ProjectAIOutput) => {
      updateActiveProject((prev) => ({
        ...prev,
        outputs: {
          ...prev.outputs,
          [outputType]: output,
        },
      }));
      await saveActiveProjectNow();
      showToast(`Saved ${output.title} to local project.`, 'success');
    },
    [updateActiveProject, saveActiveProjectNow, showToast]
  );

  const updateProjectOutputTeacherEdits = useCallback(
    async (outputType: AIOutputType, teacherEditedContent: any) => {
      updateActiveProject((prev) => {
        const current = prev.outputs[outputType];
        if (!current) return prev;

        const updatedOutput: ProjectAIOutput = {
          ...current,
          teacherEditedContent,
          status: 'edited',
          lastModifiedAt: Date.now(),
          versionHistory: [
            ...current.versionHistory,
            {
              versionId: `v_${Date.now()}`,
              timestamp: Date.now(),
              author: 'teacher',
              summaryOfChange: 'Manual modifications by teacher',
            },
          ],
        };

        return {
          ...prev,
          outputs: {
            ...prev.outputs,
            [outputType]: updatedOutput,
          },
        };
      });
      await saveActiveProjectNow();
      showToast('Teacher changes saved locally.', 'success');
    },
    [updateActiveProject, saveActiveProjectNow, showToast]
  );

  const restoreProjectOutputToAI = useCallback(
    async (outputType: AIOutputType) => {
      updateActiveProject((prev) => {
        const current = prev.outputs[outputType];
        if (!current || !current.rawAiContent) return prev;

        const restoredOutput: ProjectAIOutput = {
          ...current,
          teacherEditedContent: null,
          activeView: 'ai',
          status: 'completed',
          lastModifiedAt: Date.now(),
          versionHistory: [
            ...current.versionHistory,
            {
              versionId: `v_${Date.now()}`,
              timestamp: Date.now(),
              author: 'teacher',
              summaryOfChange: 'Restored original AI generated output',
            },
          ],
        };

        return {
          ...prev,
          outputs: {
            ...prev.outputs,
            [outputType]: restoredOutput,
          },
        };
      });
      await saveActiveProjectNow();
      showToast('Restored original AI version.', 'info');
    },
    [updateActiveProject, saveActiveProjectNow, showToast]
  );

  const switchProjectOutputView = useCallback(
    (outputType: AIOutputType, view: 'ai' | 'teacher' | 'split') => {
      updateActiveProject((prev) => {
        const current = prev.outputs[outputType];
        if (!current) return prev;

        return {
          ...prev,
          outputs: {
            ...prev.outputs,
            [outputType]: {
              ...current,
              activeView: view,
            },
          },
        };
      });
      saveActiveProjectNow();
    },
    [updateActiveProject, saveActiveProjectNow]
  );

  const deleteProjectOutput = useCallback(
    async (outputType: AIOutputType) => {
      updateActiveProject((prev) => {
        const current = prev.outputs[outputType];
        if (!current) return prev;

        const resetOutput: ProjectAIOutput = {
          id: `out_${outputType}_${Date.now()}`,
          type: outputType,
          title: current.title,
          status: 'not_started',
          targetLanguage: current.targetLanguage,
          rawAiContent: null,
          teacherEditedContent: null,
          activeView: 'ai',
          versionHistory: [],
        };

        return {
          ...prev,
          outputs: {
            ...prev.outputs,
            [outputType]: resetOutput,
          },
        };
      });
      await saveActiveProjectNow();
      showToast('Output cleared.', 'info');
    },
    [updateActiveProject, saveActiveProjectNow, showToast]
  );

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        isLoading,
        isSaving,
        lastSaved,
        error,
        toasts,
        createProject,
        openProject,
        closeProject,
        updateActiveProject,
        saveActiveProjectNow,
        renameProject,
        duplicateProject,
        deleteProject,
        refreshProjects,
        addSourceToActiveProject,
        removeSourceFromActiveProject,
        toggleSourcePriorityInActiveProject,
        toggleSourceAISelectionInActiveProject,
        reorderSourcesInActiveProject,
        updateTeacherInstructionsInActiveProject,
        saveProjectOutput,
        updateProjectOutputTeacherEdits,
        restoreProjectOutputToAI,
        switchProjectOutputView,
        deleteProjectOutput,
        dismissToast,
        showToast,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export function useProject(): ProjectContextType {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
