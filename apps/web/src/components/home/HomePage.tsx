import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../../stores/auth-store";
import { projectManager } from "../../services/project-manager";
import type { RecentProject } from "../../services/project-manager";
import { useProjectStore } from "../../stores/project-store";
import { ToolcraftButton as Button } from "@vixmotion/ui";
import { ToolcraftText as Text } from "@vixmotion/ui";
import { Plus, Film, Clock, LogOut } from "@/icons/lucide-compat";

interface HomePageProps {
  onNavigate: (route: "editor" | "login" | "home") => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const username = useAuthStore((s) => s.username);
  const logout = useAuthStore((s) => s.logout);
  const loadProjectIntoStore = useProjectStore((s) => s.loadProject);

  const [projects, setProjects] = useState<RecentProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await projectManager.getRecentProjects();
      setProjects(list);
    } catch (e) {
      console.error("Failed to load projects:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreateProject = useCallback(async () => {
    const project = await projectManager.createProject({
      name: "New Project",
      settings: { width: 1920, height: 1080, frameRate: 30 },
    });
    await projectManager.addToRecent(project);
    loadProjectIntoStore(project);
    onNavigate("editor");
  }, [loadProjectIntoStore, onNavigate]);

  const handleOpenProject = useCallback(
    async (project: RecentProject) => {
      setLoadingProjectId(project.id);
      try {
        const loaded = await projectManager.openRecentProject(project);
        if (loaded) {
          loadProjectIntoStore(loaded);
          onNavigate("editor");
        }
      } catch (e) {
        console.error("Failed to open project:", e);
      } finally {
        setLoadingProjectId(null);
      }
    },
    [loadProjectIntoStore, onNavigate],
  );

  const handleLogout = useCallback(() => {
    logout();
    onNavigate("login");
  }, [logout, onNavigate]);

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.03),transparent_60%)]" />

      <header className="relative flex items-center justify-between px-8 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Text type="body" color="primary" weight="bold" className="text-sm text-primary">V</Text>
          </div>
          <Text type="body" color="primary" weight="semibold" className="text-base text-text-primary">VixMotion</Text>
        </div>

        <div className="flex items-center gap-3">
          <Button
            label="New project"
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={handleCreateProject}
          />
          <div className="flex items-center gap-2 pl-3 border-l border-border">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
              <Text type="supporting" color="primary" weight="semibold" className="text-xs text-primary">
                {username?.charAt(0)?.toUpperCase() || "?"}
              </Text>
            </div>
            <div className="hidden sm:block">
              <Text type="supporting" color="primary" weight="medium" className="text-xs text-text-primary">{username}</Text>
            </div>
            <Button
              label="Sign out"
              variant="ghost"
              size="sm"
              icon={<LogOut size={14} />}
              onClick={handleLogout}
            />
          </div>
        </div>
      </header>

      <main className="relative h-[calc(100vh-65px)] overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Text type="body" color="primary" weight="bold" className="text-2xl text-text-primary">
                Your Projects
              </Text>
              <Text type="supporting" color="secondary" className="text-sm text-text-muted mt-1">
                Recent projects will appear here
              </Text>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
              <Text type="supporting" color="secondary" className="text-sm text-text-secondary">
                Loading projects...
              </Text>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-16 h-16 rounded-2xl bg-background-tertiary flex items-center justify-center mb-5">
                <Film size={28} className="text-text-muted" />
              </div>
              <Text type="body" color="primary" weight="medium" className="text-lg text-text-primary mb-2">
                No projects yet
              </Text>
              <Text type="supporting" color="secondary" className="text-sm text-text-muted text-center max-w-sm mb-8">
                Create your first video project to get started.
              </Text>
              <Button
                label="Create your first project"
                variant="primary"
                icon={<Plus size={16} />}
                onClick={handleCreateProject}
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <button
                onClick={handleCreateProject}
                className="group flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-background-tertiary/30 hover:bg-background-tertiary transition-all"
              >
                <Plus size={24} className="text-text-muted group-hover:text-primary transition-colors mb-2" />
                <Text type="supporting" color="secondary" className="text-xs text-text-muted group-hover:text-primary transition-colors">
                  New Project
                </Text>
              </button>

              {projects.map((project) => {
                const isLoadingThis = loadingProjectId === project.id;
                return (
                  <button
                    key={project.id}
                    onClick={() => handleOpenProject(project)}
                    disabled={isLoadingThis}
                    className="group relative flex flex-col rounded-xl border border-border bg-background-tertiary hover:border-primary/40 hover:bg-background-elevated transition-all overflow-hidden text-left disabled:opacity-60"
                  >
                    <div className="aspect-video w-full bg-background flex items-center justify-center border-b border-border">
                      {isLoadingThis ? (
                        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      ) : (
                        <Film size={28} className="text-text-muted/50 group-hover:text-primary/50 transition-colors" />
                      )}
                    </div>
                    <div className="p-3 flex-1">
                      <Text type="supporting" color="primary" weight="medium" className="text-sm text-text-primary truncate group-hover:text-primary transition-colors">
                        {project.name}
                      </Text>
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-text-muted">
                        <Clock size={11} />
                        <span>{formatDate(project.lastOpened)}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
