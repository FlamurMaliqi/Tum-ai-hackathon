import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/api";

interface Bauprojekt {
  id: number;
  name: string;
  description: string;
  location: string;
  start_date: string;
  status: string;
  created_at: string;
}

export default function BauprojekteManagement() {
  const [projects, setProjects] = useState<Bauprojekt[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Bauprojekt | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    start_date: "",
    status: "active",
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch(apiUrl("/api/v1/bauprojekte/"));
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Fehler",
        description: "Projektname ist erforderlich",
        variant: "destructive",
      });
      return;
    }

    try {
      const url = editingProject
        ? apiUrl(`/api/v1/bauprojekte/${editingProject.id}`)
        : apiUrl("/api/v1/bauprojekte/");
      
      const method = editingProject ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save project");
      }

      toast({
        title: "Erfolg",
        description: editingProject
          ? "Projekt wurde aktualisiert"
          : "Projekt wurde erstellt",
      });

      setIsDialogOpen(false);
      resetForm();
      fetchProjects();
    } catch (error) {
      console.error("Failed to save project:", error);
      toast({
        title: "Fehler",
        description: "Projekt konnte nicht gespeichert werden",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (project: Bauprojekt) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || "",
      location: project.location || "",
      start_date: project.start_date || "",
      status: project.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Möchten Sie dieses Projekt wirklich löschen?")) {
      return;
    }

    try {
      const response = await fetch(apiUrl(`/api/v1/bauprojekte/${id}`), {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

      toast({
        title: "Erfolg",
        description: "Projekt wurde gelöscht",
      });

      fetchProjects();
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast({
        title: "Fehler",
        description: "Projekt konnte nicht gelöscht werden",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      location: "",
      start_date: "",
      status: "active",
    });
    setEditingProject(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-500";
      case "completed":
        return "bg-blue-500/10 text-blue-500";
      case "on_hold":
        return "bg-yellow-500/10 text-yellow-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Aktiv";
      case "completed":
        return "Abgeschlossen";
      case "on_hold":
        return "Pausiert";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              Bauprojekte
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {projects.length} {projects.length === 1 ? "Projekt" : "Projekte"}
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Neues Projekt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingProject ? "Projekt bearbeiten" : "Neues Projekt erstellen"}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">Projektname *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="z.B. Neubau Bürogebäude"
                    className="mt-1 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Standort</label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="z.B. München Hauptstraße 123"
                    className="mt-1 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Beschreibung</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Projektbeschreibung..."
                    className="mt-1 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Startdatum</label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="mt-1 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="mt-1 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktiv</SelectItem>
                      <SelectItem value="on_hold">Pausiert</SelectItem>
                      <SelectItem value="completed">Abgeschlossen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Abbrechen
                  </Button>
                  <Button className="flex-1 rounded-xl" onClick={handleSubmit}>
                    {editingProject ? "Aktualisieren" : "Erstellen"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-card rounded-2xl border border-border/50 p-4 card-shadow hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{project.name}</h3>
                {project.location && (
                  <p className="text-sm text-muted-foreground mt-1">{project.location}</p>
                )}
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                {getStatusLabel(project.status)}
              </span>
            </div>

            {project.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {project.description}
              </p>
            )}

            {project.start_date && (
              <p className="text-xs text-muted-foreground mb-3">
                Start: {new Date(project.start_date).toLocaleDateString('de-DE')}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-xl"
                onClick={() => handleEdit(project)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Bearbeiten
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-destructive border-destructive/50 hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => handleDelete(project.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Keine Projekte vorhanden</h2>
          <p className="text-muted-foreground mb-4">
            Erstellen Sie Ihr erstes Bauprojekt
          </p>
        </div>
      )}
    </div>
  );
}
