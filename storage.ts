
import { PostConfig, SavedProject } from '../types';

const STORAGE_KEY = 'chocopost_projects';
const DRAFT_KEY = 'chocopost_autosave_draft';

// --- LOCAL STORAGE CORE ---

export const getSavedProjects = (): SavedProject[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveProjectToStorage = (name: string, config: PostConfig): SavedProject[] => {
  const projects = getSavedProjects();
  const newProject: SavedProject = {
    id: crypto.randomUUID(),
    name: name || `Projeto ${new Date().toLocaleDateString()}`,
    lastModified: Date.now(),
    config,
  };
  
  const updatedProjects = [newProject, ...projects];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
  return updatedProjects;
};

export const deleteProjectFromStorage = (id: string): SavedProject[] => {
  const projects = getSavedProjects();
  const updatedProjects = projects.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProjects));
  return updatedProjects;
};

// --- DRAFTS (Auto Save) ---

export const saveDraft = (config: PostConfig) => {
    try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
            timestamp: Date.now(),
            config
        }));
    } catch (e) {}
};

export const getDraft = (): { config: PostConfig, timestamp: number } | null => {
    try {
        const data = localStorage.getItem(DRAFT_KEY);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        return null;
    }
};

// --- FILE EXPORT ---

export const exportProjectToFile = (config: PostConfig) => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", `choclar_backup_${Date.now()}.json`);
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};
