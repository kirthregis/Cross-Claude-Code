// Server-safe stub — projects live in localStorage (client only).
// Server components that need project data use this stub and pass id to client.
import type { Project } from "./types";
export function loadProjects(): Project[] { return []; }
export function getProject(id: string): Project | undefined { return undefined; }
