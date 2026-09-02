import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers3 } from "lucide-react";
import api from "../api/client.js";

const getErrorMessage = (err, fallback) => {
  const error = err.response?.data?.error;
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (error.formErrors?.length) return error.formErrors.join(", ");
  if (error.fieldErrors) {
    return Object.entries(error.fieldErrors)
      .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
      .join("; ");
  }
  return fallback;
};

export default function AdminStructure() {
  const queryClient = useQueryClient();
  const [structureUniId, setStructureUniId] = useState("");
  const [newCollegeName, setNewCollegeName] = useState("");
  const [newDept, setNewDept] = useState({ name: "", collegeId: "" });

  const universities = useQuery({
    queryKey: ["admin-universities"],
    queryFn: () => api.get("/universities", { params: { pageSize: 100 } }).then((r) => r.data),
  });

  const universityItems = universities.data?.items ?? [];

  const colleges = useQuery({
    queryKey: ["admin-colleges", structureUniId],
    queryFn: () => api.get(`/universities/${structureUniId}/colleges`).then((r) => r.data),
    enabled: !!structureUniId,
  });

  const departments = useQuery({
    queryKey: ["admin-departments", structureUniId],
    queryFn: () => api.get(`/universities/${structureUniId}/departments`).then((r) => r.data),
    enabled: !!structureUniId,
  });

  const createCollege = useMutation({
    mutationFn: (name) => api.post(`/universities/${structureUniId}/colleges`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-colleges", structureUniId] });
      setNewCollegeName("");
    },
  });

  const deleteCollege = useMutation({
    mutationFn: (id) => api.delete(`/universities/colleges/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-colleges", structureUniId] });
      queryClient.invalidateQueries({ queryKey: ["admin-departments", structureUniId] });
    },
  });

  const createDepartment = useMutation({
    mutationFn: (data) => api.post(`/universities/${structureUniId}/departments`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-departments", structureUniId] });
      setNewDept({ name: "", collegeId: "" });
    },
  });

  const deleteDepartment = useMutation({
    mutationFn: (id) => api.delete(`/universities/departments/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-departments", structureUniId] }),
  });

  return (
    <div className="page-shell py-10">
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-highland/20 bg-white px-3 py-1.5 text-sm font-semibold text-highland dark:bg-dark-surface dark:border-dark-border">
          <Layers3 size={16} />
          Structure Management
        </div>
        <h1 className="font-display text-4xl font-semibold text-ink">University Structure</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Manage colleges and departments for universities.
        </p>
      </div>

      <section>
        <div className="section-panel mb-6 rounded-xl p-5">
          <label className="field-label">University</label>
          <select
            value={structureUniId}
            onChange={(e) => setStructureUniId(e.target.value)}
            className="select-field max-w-xl"
          >
            <option value="">Select a university to manage</option>
            {universityItems.map((university) => (
              <option key={university.id} value={university.id}>{university.name}</option>
            ))}
          </select>
        </div>

        {structureUniId && (
          <div className="grid gap-6 lg:grid-cols-2">
            <StructurePanel
              title="Colleges / Schools"
              description="Optional layer between university and department."
              inputValue={newCollegeName}
              inputPlaceholder="College name"
              onInputChange={setNewCollegeName}
              onSubmit={() => newCollegeName.trim() && createCollege.mutate(newCollegeName.trim())}
              items={colleges.data}
              isLoading={colleges.isLoading}
              emptyText="No colleges yet. You can attach departments directly to the university."
              onDelete={(item) => {
                if (confirm(`Delete "${item.name}"? Departments under it will become unassigned.`)) deleteCollege.mutate(item.id);
              }}
            />

            <div className="section-panel rounded-xl p-5">
              <h2 className="text-lg font-semibold text-ink">Departments</h2>
              <p className="mt-1 text-sm text-muted">Departments power the upload form and browse filters.</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newDept.name.trim()) createDepartment.mutate(newDept);
                }}
                className="mt-5 space-y-3"
              >
                <input
                  placeholder="Department name"
                  value={newDept.name}
                  onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                  className="input-field"
                />
                <select
                  value={newDept.collegeId}
                  onChange={(e) => setNewDept({ ...newDept, collegeId: e.target.value })}
                  className="select-field"
                >
                  <option value="">No college</option>
                  {colleges.data?.map((college) => (
                    <option key={college.id} value={college.id}>{college.name}</option>
                  ))}
                </select>
                <button className="btn-dark w-full">Add department</button>
              </form>

              <div className="mt-5 space-y-2">
                {departments.isLoading && <p className="text-sm text-muted">Loading departments...</p>}
                {departments.data?.length === 0 && <div className="empty-state py-6">No departments yet.</div>}
                {departments.data?.map((department) => (
                  <div key={department.id} className="flex items-center justify-between rounded-lg border border-line bg-white p-3 text-sm dark:bg-dark-surface dark:border-dark-border">
                    <span className="font-semibold text-ink dark:text-dark-text">{department.name}</span>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${department.name}"?`)) deleteDepartment.mutate(department.id);
                      }}
                      className="text-ember hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function StructurePanel({
  title,
  description,
  inputValue,
  inputPlaceholder,
  onInputChange,
  onSubmit,
  items,
  isLoading,
  emptyText,
  onDelete,
}) {
  return (
    <div className="section-panel rounded-xl p-5">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-muted">{description}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="mt-5 flex gap-2"
      >
        <input
          placeholder={inputPlaceholder}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          className="input-field"
        />
        <button className="btn-dark shrink-0">Add</button>
      </form>
      <div className="mt-5 space-y-2">
        {isLoading && <p className="text-sm text-muted">Loading...</p>}
        {items?.length === 0 && <div className="empty-state py-6">{emptyText}</div>}
        {items?.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-lg border border-line bg-white p-3 text-sm dark:bg-dark-surface dark:border-dark-border">
            <span className="font-semibold text-ink dark:text-dark-text">{item.name}</span>
            <button onClick={() => onDelete(item)} className="text-ember hover:underline">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
