import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CheckCircle2, Layers3, ShieldCheck, Trash2, UsersRound, XCircle } from "lucide-react";
import api from "../api/client.js";

const TABS = [
  { value: "Moderation", icon: ShieldCheck },
  { value: "Users", icon: UsersRound },
  { value: "Universities", icon: Building2 },
  { value: "Structure", icon: Layers3 },
];

export default function Admin() {
  const [tab, setTab] = useState("Moderation");
  const queryClient = useQueryClient();

  const queue = useQuery({
    queryKey: ["moderation-queue"],
    queryFn: () => api.get("/resources/moderation/queue").then((r) => r.data),
    enabled: tab === "Moderation",
  });

  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.get("/users").then((r) => r.data),
    enabled: tab === "Users",
  });

  const universities = useQuery({
    queryKey: ["admin-universities"],
    queryFn: () => api.get("/universities").then((r) => r.data),
    enabled: tab === "Universities" || tab === "Structure",
  });

  const [newUni, setNewUni] = useState({ name: "", slug: "", city: "" });

  const createUniversity = useMutation({
    mutationFn: (data) => api.post("/universities", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-universities"] });
      setNewUni({ name: "", slug: "", city: "" });
    },
  });

  const deleteUniversity = useMutation({
    mutationFn: (id) => api.delete(`/universities/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-universities"] }),
  });

  const moderate = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/resources/${id}/moderate`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["moderation-queue"] }),
  });

  const banUser = useMutation({
    mutationFn: ({ id, banned }) => api.patch(`/users/${id}/ban`, { banned }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const [structureUniId, setStructureUniId] = useState("");
  const [newCollegeName, setNewCollegeName] = useState("");
  const [newDept, setNewDept] = useState({ name: "", collegeId: "" });

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
      <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-highland/20 bg-white px-3 py-1.5 text-sm font-semibold text-highland">
            <ShieldCheck size={16} />
            Admin workspace
          </div>
          <h1 className="font-display text-4xl font-semibold text-ink">Moderate and organize the platform</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Review submitted resources, manage user access, and maintain the university structure used across upload and browse.
          </p>
        </div>
      </div>

      <div className="mb-6 overflow-x-auto rounded-xl border border-line bg-white p-2 shadow-sm">
        <div className="flex min-w-max gap-2">
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.value;
            return (
              <button
                key={item.value}
                onClick={() => setTab(item.value)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                  active ? "bg-highland text-white" : "text-muted hover:bg-mist hover:text-ink"
                }`}
              >
                <Icon size={16} />
                {item.value}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "Moderation" && (
        <section className="space-y-4">
          {queue.isLoading && <p className="text-sm text-muted">Loading moderation queue...</p>}
          {queue.data?.length === 0 && <div className="empty-state">Nothing pending review.</div>}
          {queue.data?.map((resource) => (
            <div key={resource.id} className="surface-card rounded-xl p-5">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                <div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="badge-gold">PENDING</span>
                    <span className="badge">{resource.type?.replaceAll("_", " ")}</span>
                    {resource.university?.name && <span className="badge">{resource.university.name}</span>}
                  </div>
                  <h2 className="text-xl font-semibold text-ink">{resource.title}</h2>
                  <p className="mt-2 text-sm text-muted">
                    Uploaded by {resource.uploader?.fullName} ({resource.uploader?.email})
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => moderate.mutate({ id: resource.id, status: "APPROVED" })}
                    className="btn-primary"
                  >
                    <CheckCircle2 size={16} />
                    Approve
                  </button>
                  <button
                    onClick={() => moderate.mutate({ id: resource.id, status: "REJECTED" })}
                    className="btn-secondary border-ember/30 text-ember hover:border-ember hover:text-ember"
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {tab === "Users" && (
        <section className="table-shell">
          {users.isLoading && <div className="p-4 text-sm text-muted">Loading users...</div>}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-mist text-xs uppercase text-muted">
                <tr>
                  <th className="p-4 text-left">Name</th>
                  <th className="p-4 text-left">Email</th>
                  <th className="p-4 text-left">Role</th>
                  <th className="p-4 text-left">Verification</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.data?.items?.map((user) => (
                  <tr key={user.id}>
                    <td className="p-4 font-semibold text-ink">{user.fullName}</td>
                    <td className="p-4 text-muted">{user.email}</td>
                    <td className="p-4"><span className="badge">{user.role}</span></td>
                    <td className="p-4">{user.isVerified ? <span className="badge-green">Verified</span> : <span className="badge-gold">Unverified</span>}</td>
                    <td className="p-4">{user.isBanned ? <span className="badge-gold">Banned</span> : <span className="badge-green">Active</span>}</td>
                    <td className="p-4">
                      <button
                        onClick={() => banUser.mutate({ id: user.id, banned: !user.isBanned })}
                        className="btn-secondary min-h-9 px-3 py-1.5"
                      >
                        {user.isBanned ? "Unban" : "Ban"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "Universities" && (
        <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createUniversity.mutate(newUni);
            }}
            className="section-panel h-fit rounded-xl p-5"
          >
            <h2 className="text-lg font-semibold text-ink">Add university</h2>
            <p className="mt-1 text-sm text-muted">Create a university record used in upload and browse filters.</p>
            <div className="mt-5 space-y-4">
              <div>
                <label className="field-label">Name</label>
                <input
                  value={newUni.name}
                  onChange={(e) => setNewUni({ ...newUni, name: e.target.value })}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="field-label">Slug</label>
                <input
                  value={newUni.slug}
                  onChange={(e) => setNewUni({ ...newUni, slug: e.target.value })}
                  required
                  placeholder="aau"
                  className="input-field"
                />
              </div>
              <div>
                <label className="field-label">City</label>
                <input
                  value={newUni.city}
                  onChange={(e) => setNewUni({ ...newUni, city: e.target.value })}
                  placeholder="Addis Ababa"
                  className="input-field"
                />
              </div>
              <button disabled={createUniversity.isPending} className="btn-dark w-full">Add university</button>
            </div>
          </form>

          <div className="grid gap-3 md:grid-cols-2">
            {universities.isLoading && <p className="text-sm text-muted">Loading universities...</p>}
            {universities.data?.map((university) => (
              <div key={university.id} className="surface-card rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-ink">{university.name}</h2>
                    <p className="mt-1 text-sm text-muted">{university.city || "City not set"} - /{university.slug}</p>
                    <p className="mt-3 text-xs font-semibold text-muted">
                      {university._count?.departments ?? 0} departments - {university._count?.resources ?? 0} resources
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Delete ${university.name}? This also removes its colleges, departments, and courses.`)) {
                        deleteUniversity.mutate(university.id);
                      }
                    }}
                    className="text-ember hover:text-ember"
                    aria-label={`Delete ${university.name}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "Structure" && (
        <section>
          <div className="section-panel mb-6 rounded-xl p-5">
            <label className="field-label">University</label>
            <select
              value={structureUniId}
              onChange={(e) => setStructureUniId(e.target.value)}
              className="select-field max-w-xl"
            >
              <option value="">Select a university to manage</option>
              {universities.data?.map((university) => (
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
                    <div key={department.id} className="flex items-center justify-between rounded-lg border border-line bg-white p-3 text-sm">
                      <span className="font-semibold text-ink">{department.name}</span>
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
      )}
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
          <div key={item.id} className="flex items-center justify-between rounded-lg border border-line bg-white p-3 text-sm">
            <span className="font-semibold text-ink">{item.name}</span>
            <button onClick={() => onDelete(item)} className="text-ember hover:underline">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
