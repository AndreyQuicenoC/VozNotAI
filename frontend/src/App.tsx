/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/navigation/Sidebar.tsx";
import { Header } from "./components/navigation/Header.tsx";
import { PublicHeader } from "./components/navigation/PublicHeader.tsx";
import { PublicFooter } from "./components/navigation/PublicFooter.tsx";
import { DashboardView } from "./features/dashboard/DashboardView.tsx";
import { WorkspaceView } from "./features/workspace/WorkspaceView.tsx";
import { AdminClusterView } from "./features/admin/AdminClusterView.tsx";
import { NotesHubView } from "./features/notes/NotesHubView.tsx";
import { ProfileView } from "./features/profile/ProfileView.tsx";
import { AboutView } from "./features/about/AboutView.tsx";
import {
  FeaturesView,
  HomeView,
  HowItWorksView,
  PrivacyView,
} from "./features/public/PublicInfoViews.tsx";
import { LoginView } from "./features/auth/LoginView.tsx";
import { RegisterView } from "./features/auth/RegisterView.tsx";
import { PasswordRecoveryView } from "./features/auth/PasswordRecoveryView.tsx";
import { ManualView } from "./features/manual/ManualView.tsx";
import { AiConfigView } from "./features/ai-config/AiConfigView.tsx";
import { QuickUploadModal } from "./components/shared/QuickUploadModal.tsx";
import { CommandPaletteModal } from "./components/shared/CommandPaletteModal.tsx";
import { useVozNotStore } from "./services/store.ts";
import { normalizeRoute, isAccessibleWithoutAuth, isPublicRoute, type AppRoute } from "./utils/routes.ts";

export default function App() {
  const { currentSessionId, setCurrentSessionId, currentUser, authReady, error } = useVozNotStore();

  // Route state
  const [currentPath, setCurrentPath] = useState<AppRoute>(() =>
    window.location.hash ? normalizeRoute(window.location.hash) : "home"
  );
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);

  // Sync hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const raw = window.location.hash || "";
      const canonical = normalizeRoute(raw);
      setCurrentPath(canonical);
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigateTo = (path: AppRoute | string) => {
    const canonical = normalizeRoute(path);
    setCurrentPath(canonical);
    window.location.hash = `#/${canonical}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isPublic = isPublicRoute(currentPath);
  const isAdmin = currentUser?.role === "admin";
  const showPublicShell = isPublic || (!currentUser && currentPath === "manual");

  useEffect(() => {
    if (!authReady) return;
    if (!window.location.hash) {
      navigateTo(currentUser ? "dashboard" : "home");
      return;
    }
    if (!currentUser && !isAccessibleWithoutAuth(currentPath)) {
      navigateTo("login");
    }
  }, [authReady, currentUser, currentPath]);

  return (
    <div className="min-h-screen bg-[#080e1e] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Global Quick Upload Modal */}
      {showUploadModal && (
        <QuickUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            navigateTo("workspace");
          }}
          onCreated={() => {
            setShowUploadModal(false);
            navigateTo("workspace");
          }}
        />
      )}

      {/* Global Command Palette Spotlight Search Modal */}
      <CommandPaletteModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onNavigate={navigateTo}
        onSelectSession={(sessId) => {
          setCurrentSessionId(sessId);
          navigateTo("workspace");
        }}
      />

      {error && (
        <div role="alert" className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-amber-500/40 bg-[#151b2c] px-4 py-3 text-xs text-amber-200 shadow-xl">
          {error}
        </div>
      )}

      {!authReady && !showPublicShell ? (
        <div className="min-h-screen flex items-center justify-center text-sm text-slate-300">
          Comprobando sesión…
        </div>
      ) : showPublicShell ? (
        <div className="flex flex-col min-h-screen">
          <PublicHeader currentPath={currentPath} onNavigate={navigateTo} />
          <main className="flex-1 pt-24 pb-12 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
            {currentPath === "home" && <HomeView onNavigate={navigateTo} />}
            {currentPath === "features" && <FeaturesView onNavigate={navigateTo} />}
            {currentPath === "how-it-works" && <HowItWorksView onNavigate={navigateTo} />}
            {currentPath === "privacy" && <PrivacyView />}
            {currentPath === "about" && <AboutView onNavigate={navigateTo} />}
            {currentPath === "manual" && <ManualView />}
            {currentPath === "login" && <LoginView onNavigate={navigateTo} />}
            {currentPath === "register" && <RegisterView onNavigate={navigateTo} />}
            {currentPath === "recovery" && <PasswordRecoveryView onNavigate={navigateTo} />}
          </main>
          <PublicFooter onNavigate={navigateTo} />
        </div>
      ) : (
        <div className="flex h-screen overflow-hidden">
          {/* Collapsible Left Navigation Sidebar */}
          <Sidebar
            currentPath={currentPath}
            onNavigate={navigateTo}
            onOpenUploadModal={() => setShowUploadModal(true)}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />

          {/* Right Main Content Area with dynamic margin based on collapse state */}
          <div
            className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ${
              isSidebarCollapsed ? "pl-20" : "pl-64"
            }`}
          >
            {/* Top Bar Header */}
            <Header
              onNavigate={navigateTo}
              onOpenSearch={() => setIsSearchModalOpen(true)}
              isCollapsed={isSidebarCollapsed}
            />

            {/* Scrollable View Area */}
            <main className="flex-1 overflow-y-auto p-6 md:p-8 pt-24 max-w-7xl mx-auto w-full">
              {currentPath === "dashboard" && (
                <DashboardView
                  onNavigate={navigateTo}
                  onOpenUploadModal={() => setShowUploadModal(true)}
                />
              )}

              {currentPath === "workspace" && (
                <WorkspaceView
                  sessionId={currentSessionId}
                  onNavigate={navigateTo}
                  onOpenUploadModal={() => setShowUploadModal(true)}
                />
              )}

              {currentPath === "notes" && (
                <NotesHubView
                  onNavigateToSession={(sessionId) => {
                    setCurrentSessionId(sessionId);
                    navigateTo("workspace");
                  }}
                />
              )}

              {/* Admin Panel: Protected for administrators only */}
              {currentPath === "admin" &&
                (isAdmin ? (
                  <AdminClusterView />
                ) : (
                  <div className="p-8 rounded-2xl bg-[#0f172a] border border-gray-800 text-center space-y-4 max-w-lg mx-auto mt-12 animate-fade-in">
                    <span className="material-symbols-outlined text-4xl text-amber-400">
                      lock
                    </span>
                    <h2 className="text-lg font-bold text-white">Acceso Restringido a Administradores</h2>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      El panel de administración del clúster CUDA y asignación de cuotas está reservado
                      para operadores con privilegios de Administrador.
                    </p>
                    <button
                      onClick={() => navigateTo("dashboard")}
                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs cursor-pointer"
                    >
                      Volver al Dashboard
                    </button>
                  </div>
                ))}

              {currentPath === "ai-config" && <AiConfigView />}

              {currentPath === "manual" && <ManualView />}

              {currentPath === "profile" && <ProfileView />}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}
