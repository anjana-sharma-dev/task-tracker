import { useCallback, useEffect, useState } from "react";
import Board from "./Board";
import { getProjects } from "./api";
import NewProjectModal from "./NewProjectModal";
import Notifications from "./Notifications";
import { useToast } from "./Toast";

export default function TaskApp({ user, onLogout }) {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const loadProjects = useCallback(async () => {
    try {
      const data = await getProjects();
      setProjects(data);
      setProjectId((current) => {
        if (current && data.some((p) => p.id === current)) return current;
        return data[0]?.id ?? null;
      });
    } catch (e) {
      console.error("Failed to load projects", e);
      addToast(e.message || "Failed to load projects", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  async function handleProjectCreated(newProject) {
    await loadProjects();
    setProjectId(newProject.id);
    addToast(`Project "${newProject.name}" created successfully!`, "success");
  }

  const currentProject = projects.find((p) => p.id === projectId);
  const isOwner = currentProject?.owner_id === user.id;
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="enterprise-layout">
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`enterprise-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-title">TaskTracker</span>
            <span className="brand-workspace">Team Workspace</span>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <span>PROJECTS</span>
            <button
              className="sidebar-add-btn"
              onClick={() => {
                setShowNewProjectModal(true);
                setSidebarOpen(false);
              }}
              title="Create new project"
            >
              +
            </button>
          </div>

          <div className="sidebar-project-list">
            {projects.length === 0 ? (
              <p className="sidebar-empty-text">No projects yet</p>
            ) : (
              projects.map((p) => {
                const isActive = p.id === projectId;
                return (
                  <button
                    key={p.id}
                    className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                    onClick={() => {
                      setProjectId(p.id);
                      setSidebarOpen(false);
                    }}
                  >
                    <span className="nav-item-icon">📁</span>
                    <span className="nav-item-name">{p.name}</span>
                    {p.owner_id === user.id && (
                      <span className="nav-item-badge">Owner</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="sidebar-avatar">{userInitial}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user.name}</span>
              <span className="sidebar-user-email">{user.email}</span>
            </div>
          </div>
          <button
            className="sidebar-logout-btn"
            onClick={onLogout}
            title="Log out"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>


      <div className="enterprise-main-wrapper">
        <header className="enterprise-topbar">
          <div className="topbar-left">
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation sidebar"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <div className="breadcrumb">
              <span className="breadcrumb-root">Projects</span>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-current">
                {currentProject?.name || "Select Project"}
              </span>
            </div>
          </div>

          <div className="topbar-right">
            <button
              className="topbar-new-project-btn"
              onClick={() => setShowNewProjectModal(true)}
            >
              + New Project
            </button>

            <Notifications />
          </div>
        </header>

        <main className="enterprise-content">
          {loading ? (
            <div className="app-loading-screen">
              <div className="spinner"></div>
              <p>Loading your workspace...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="empty-project-prompt">
              <div className="empty-icon-large">🚀</div>
              <h2>Ready to organize your team?</h2>
              <p>Create your first project to start managing tasks and tracking deadlines.</p>
              <button
                className="btn-primary"
                onClick={() => setShowNewProjectModal(true)}
              >
                + Create First Project
              </button>
            </div>
          ) : (
            projectId !== null && (
              <Board
                projectId={projectId}
                project={currentProject}
                isOwner={isOwner}
              />
            )
          )}
        </main>
      </div>


      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
}
