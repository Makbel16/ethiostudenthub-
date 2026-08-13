import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/client.js";

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

  // --- Structure tab (colleges + departments for a chosen university) ---
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
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="font-display text-3xl font-semibold mb-8">Admin</h1>

      <div className="flex gap-6 border-b border-line mb-8">
        {["Moderation", "Users", "Universities", "Structure"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm font-medium course-tab ${
              tab === t ? "text-highland border-b-2 border-highland" : "text-ink/50"
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === "Moderation" && (
        <div className="space-y-4">
          {queue.isLoading && <p className="text-ink/60">Loading…</p>}
          {queue.data?.length === 0 && <p className="text-ink/50">Nothing pending review.</p>}
          {queue.data?.map((r) => (
            <div key={r.id} className="border border-line rounded-sm p-5 bg-white flex items-center justify-between">
              <div>
                <p className="font-medium">{r.title}</p>
                <p className="text-sm text-ink/60">
                  {r.type} · uploaded by {r.uploader?.fullName} ({r.uploader?.email})
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => moderate.mutate({ id: r.id, status: "APPROVED" })}
                  className="text-sm bg-highland text-paper px-3 py-1.5 rounded-sm hover:opacity-90"
                >
                  Approve
                </button>
                <button
                  onClick={() => moderate.mutate({ id: r.id, status: "REJECTED" })}
                  className="text-sm border border-line px-3 py-1.5 rounded-sm hover:border-red-500 hover:text-red-600"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "Users" && (
        <table className="w-full text-sm border border-line rounded-sm overflow-hidden bg-white">
          <thead className="bg-ink/5 course-tab text-xs text-ink/60">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.data?.items?.map((u) => (
              <tr key={u.id}>
                <td className="p-3">{u.fullName}</td>
                <td className="p-3 text-ink/60">{u.email}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">{u.isBanned ? "Banned" : "Active"}</td>
                <td className="p-3">
                  <button
                    onClick={() => banUser.mutate({ id: u.id, banned: !u.isBanned })}
                    className="text-xs border border-line px-2 py-1 rounded-sm hover:border-highland"
                  >
                    {u.isBanned ? "Unban" : "Ban"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === "Universities" && (
        <div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createUniversity.mutate(newUni);
            }}
            className="flex gap-2 mb-6"
          >
            <input
              placeholder="Name"
              value={newUni.name}
              onChange={(e) => setNewUni({ ...newUni, name: e.target.value })}
              required
              className="border border-line px-3 py-2 rounded-sm text-sm flex-1"
            />
            <input
              placeholder="slug (e.g. aau)"
              value={newUni.slug}
              onChange={(e) => setNewUni({ ...newUni, slug: e.target.value })}
              required
              className="border border-line px-3 py-2 rounded-sm text-sm w-40"
            />
            <input
              placeholder="City"
              value={newUni.city}
              onChange={(e) => setNewUni({ ...newUni, city: e.target.value })}
              className="border border-line px-3 py-2 rounded-sm text-sm w-40"
            />
            <button className="bg-ink text-paper px-4 py-2 rounded-sm text-sm hover:bg-highland transition-colors">
              Add
            </button>
          </form>

          <div className="space-y-2">
            {universities.isLoading && <p className="text-ink/60">Loading…</p>}
            {universities.data?.map((u) => (
              <div key={u.id} className="border border-line rounded-sm p-4 bg-white flex items-center justify-between">
                <div>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-ink/50">{u.city} · /{u.slug}</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Delete ${u.name}? This also removes its colleges/departments/courses.`)) {
                      deleteUniversity.mutate(u.id);
                    }
                  }}
                  className="text-xs text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "Structure" && (
        <div>
          <div className="mb-6">
            <label className="text-xs course-tab text-ink/50 block mb-1">University</label>
            <select
              value={structureUniId}
              onChange={(e) => setStructureUniId(e.target.value)}
              className="w-full max-w-sm border border-line bg-white px-3 py-2 rounded-sm text-sm"
            >
              <option value="">Select a university to manage</option>
              {universities.data?.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {structureUniId && (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Colleges */}
              <div>
                <p className="course-tab text-xs text-highland mb-3">COLLEGES / SCHOOLS</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newCollegeName.trim()) createCollege.mutate(newCollegeName.trim());
                  }}
                  className="flex gap-2 mb-4"
                >
                  <input
                    placeholder="College name"
                    value={newCollegeName}
                    onChange={(e) => setNewCollegeName(e.target.value)}
                    className="flex-1 border border-line px-3 py-2 rounded-sm text-sm"
                  />
                  <button className="bg-ink text-paper px-4 py-2 rounded-sm text-sm hover:bg-highland transition-colors">
                    Add
                  </button>
                </form>
                <div className="space-y-2">
                  {colleges.isLoading && <p className="text-ink/60 text-sm">Loading…</p>}
                  {colleges.data?.length === 0 && (
                    <p className="text-ink/50 text-sm">No colleges yet — optional layer, you can skip it.</p>
                  )}
                  {colleges.data?.map((c) => (
                    <div key={c.id} className="border border-line rounded-sm p-3 bg-white flex items-center justify-between text-sm">
                      <span>{c.name}</span>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${c.name}"? Departments under it will become unassigned.`)) {
                            deleteCollege.mutate(c.id);
                          }
                        }}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Departments */}
              <div>
                <p className="course-tab text-xs text-highland mb-3">DEPARTMENTS</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newDept.name.trim()) createDepartment.mutate(newDept);
                  }}
                  className="space-y-2 mb-4"
                >
                  <input
                    placeholder="Department name"
                    value={newDept.name}
                    onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                    className="w-full border border-line px-3 py-2 rounded-sm text-sm"
                  />
                  <select
                    value={newDept.collegeId}
                    onChange={(e) => setNewDept({ ...newDept, collegeId: e.target.value })}
                    className="w-full border border-line px-3 py-2 rounded-sm text-sm"
                  >
                    <option value="">No college (attach directly to university)</option>
                    {colleges.data?.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <button className="w-full bg-ink text-paper px-4 py-2 rounded-sm text-sm hover:bg-highland transition-colors">
                    Add department
                  </button>
                </form>
                <div className="space-y-2">
                  {departments.isLoading && <p className="text-ink/60 text-sm">Loading…</p>}
                  {departments.data?.length === 0 && <p className="text-ink/50 text-sm">No departments yet.</p>}
                  {departments.data?.map((d) => (
                    <div key={d.id} className="border border-line rounded-sm p-3 bg-white flex items-center justify-between text-sm">
                      <span>{d.name}</span>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${d.name}"?`)) deleteDepartment.mutate(d.id);
                        }}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}