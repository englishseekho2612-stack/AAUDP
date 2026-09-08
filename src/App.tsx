/**
 * AI TEACHING STUDIO — PART 01
 * Production Foundation + Responsive App Shell + Local Project System
 */

import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { ThemeProvider } from './context/ThemeContext';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { AppView } from './types/navigation';
import { AppBar } from './components/common/AppBar';
import { Sidebar } from './components/common/Sidebar';
import { BottomNav } from './components/common/BottomNav';
import { ToastContainer } from './components/common/ToastContainer';
import { HomeView } from './views/HomeView';
import { ProjectsView } from './views/ProjectsView';
import { CreateProjectView } from './views/CreateProjectView';
import { TeachingView } from './views/TeachingView';
import { SettingsView } from './views/SettingsView';
import { ClassroomHubView } from './views/ClassroomHubView';
import { StudentClassroomView } from './views/StudentClassroomView';
import { VideoEditorView } from './views/VideoEditorView';
import { StorageManagerView } from './views/StorageManagerView';
import { SystemQADashboardView } from './views/SystemQADashboardView';
import { ProjectDashboard } from './components/dashboard/ProjectDashboard';
import { DataRecoveryBanner } from './components/common/DataRecoveryBanner';
import { FirstLaunchModal } from './components/common/FirstLaunchModal';
import { CurriculumHubView } from './views/CurriculumHubView';
import { StudentPortalView } from './views/StudentPortalView';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { WindowsTitleBar } from './components/desktop/WindowsTitleBar';

const StudioMainLayout: React.FC = () => {
  const { activeProject, projects, openProject, closeProject } = useProject();
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [activeTeachingClassCode, setActiveTeachingClassCode] = useState<string>('STUDIO1');
  const [studentClassCode, setStudentClassCode] = useState<string>('STUDIO1');
  const [autoOpenTeachingStudio, setAutoOpenTeachingStudio] = useState<boolean>(false);
  const [showFirstLaunchModal, setShowFirstLaunchModal] = useState<boolean>(() => {
    try {
      return localStorage.getItem('studio_onboarding_completed') !== 'true';
    } catch {
      return false;
    }
  });

  // Android Native Integration (Back button handling + Status Bar styling)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setBackgroundColor({ color: '#0f172a' });
    } catch {
      // Ignore if unsupported
    }

    const backListener = CapApp.addListener('backButton', () => {
      if (showFirstLaunchModal) {
        setShowFirstLaunchModal(false);
        return;
      }

      if (currentView === 'project_dashboard') {
        setCurrentView('projects');
      } else if (currentView === 'student_classroom') {
        setCurrentView('classroom_hub');
      } else if (currentView === 'video_editor') {
        setCurrentView('projects');
      } else if (currentView !== 'home') {
        setCurrentView('home');
      } else {
        CapApp.exitApp();
      }
    });

    return () => {
      backListener.then((l) => l.remove()).catch(() => {});
    };
  }, [currentView, showFirstLaunchModal]);

  const handleOpenProject = async (id: string) => {
    await openProject(id);
    setCurrentView('project_dashboard');
  };

  const handleNavigate = (view: AppView) => {
    setAutoOpenTeachingStudio(false);
    setCurrentView(view);
  };

  const handleBackToProjects = () => {
    setCurrentView('projects');
  };

  const handleStartTeachingStudio = async (code: string, projectId?: string) => {
    setActiveTeachingClassCode(code);
    if (projectId) {
      await openProject(projectId);
    }
    setAutoOpenTeachingStudio(true);
    setCurrentView('teaching');
  };

  const handleJoinAsStudent = (code: string) => {
    setStudentClassCode(code);
    setCurrentView('student_classroom');
  };

  // Dedicated full-screen Student Classroom View (Section 6 & 24)
  if (currentView === 'student_classroom') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <WindowsTitleBar />
        <div className="flex-1 flex flex-col">
          <ErrorBoundary fallbackTitle="Classroom View Error" onReset={() => setCurrentView('classroom_hub')}>
            <StudentClassroomView
              initialClassCode={studentClassCode}
              onExit={() => setCurrentView('classroom_hub')}
            />
          </ErrorBoundary>
        </div>
      </div>
    );
  }

  // Dedicated full-screen AI Video Editor (Part 06)
  if (currentView === 'video_editor') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        <WindowsTitleBar />
        <div className="flex-1 flex flex-col">
          <ErrorBoundary fallbackTitle="Video Editor Error" onReset={() => setCurrentView(activeProject ? 'project_dashboard' : 'projects')}>
            <VideoEditorView
              onExit={() => setCurrentView(activeProject ? 'project_dashboard' : 'projects')}
            />
          </ErrorBoundary>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Desktop Native Window Title Bar (only in Electron) */}
      <WindowsTitleBar />

      {/* Top Application Bar */}
      <AppBar
        currentView={currentView}
        onNavigate={handleNavigate}
        onBackToProjects={handleBackToProjects}
      />

      {/* Section 10: Data Loss Protection & Recovery Banner */}
      <DataRecoveryBanner />

      {/* Main Body Shell: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Navigation Sidebar */}
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
        />

        {/* Scrollable Viewport */}
        <main
          id="app-main-viewport"
          className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 md:px-8 focus:outline-none"
        >
          <ErrorBoundary fallbackTitle="View Error" onReset={() => setCurrentView('home')}>
            {currentView === 'home' && (
              <HomeView
                onNavigate={handleNavigate}
                onOpenProject={handleOpenProject}
              />
            )}

            {currentView === 'projects' && (
              <ProjectsView
                onOpenProject={handleOpenProject}
                onCreateNew={() => setCurrentView('create')}
              />
            )}

            {currentView === 'curriculum' && (
              <CurriculumHubView
                onOpenTeachingStudio={(projectId) => handleStartTeachingStudio('STUDIO1', projectId)}
                onOpenClassroomHub={() => setCurrentView('classroom_hub')}
              />
            )}

            {currentView === 'student_portal' && (
              <StudentPortalView
                onJoinLiveClass={(code) => handleJoinAsStudent(code)}
              />
            )}

            {currentView === 'create' && (
              <CreateProjectView
                onCancel={() => setCurrentView('projects')}
                onProjectCreated={handleOpenProject}
              />
            )}

            {currentView === 'project_dashboard' && (
              <ProjectDashboard onBack={handleBackToProjects} />
            )}

            {currentView === 'classroom_hub' && (
              <ClassroomHubView
                onStartTeachingStudio={handleStartTeachingStudio}
                onJoinAsStudent={handleJoinAsStudent}
                projects={projects}
                activeProjectId={activeProject?.id}
              />
            )}

            {currentView === 'teaching' && (
              <TeachingView
                initialStudioOpen={autoOpenTeachingStudio}
                classCode={activeTeachingClassCode}
                onOpenLiveStudentView={handleJoinAsStudent}
                onOpenClassroomHub={() => setCurrentView('classroom_hub')}
                onOpenVideoEditor={() => setCurrentView('video_editor')}
              />
            )}

            {currentView === 'storage_manager' && (
              <StorageManagerView onBack={() => setCurrentView('projects')} />
            )}

            {currentView === 'system_qa' && (
              <SystemQADashboardView onBack={() => setCurrentView('home')} />
            )}

            {currentView === 'settings' && <SettingsView onNavigate={setCurrentView} />}
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        currentView={currentView}
        onNavigate={handleNavigate}
      />

      {/* Global Toast Notifications */}
      <ToastContainer />

      {/* Section 22: First-Time User Experience Onboarding */}
      <FirstLaunchModal
        isOpen={showFirstLaunchModal}
        onClose={() => setShowFirstLaunchModal(false)}
        onNavigateToCreate={() => {
          setShowFirstLaunchModal(false);
          setCurrentView('create');
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ProjectProvider>
        <StudioMainLayout />
      </ProjectProvider>
    </ThemeProvider>
  );
}
