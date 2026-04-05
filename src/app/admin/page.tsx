"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, UserPlus, Key, Users, Loader2, Trash2 } from "lucide-react";

interface Employee {
  id: number;
  code: string;
  name: string;
  role: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add Employee State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("EMPLOYEE");
  const [isAdding, setIsAdding] = useState(false);

  // Change Password State
  const [passwordModalEmpId, setPasswordModalEmpId] = useState<number | null>(null);
  const [updatePassword, setUpdatePassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Employee State
  const [deleteModalEmpId, setDeleteModalEmpId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/employees");
      const data = await res.json();
      if (res.ok) {
        setEmployees(data.employees);
      } else {
        toast.error(data.error || "Failed to fetch employees");
      }
    } catch (error) {
      toast.error("Error fetching employees");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCode.length !== 4 || newPassword.length !== 4) {
      toast.error("Code and password must be exactly 4 digits");
      return;
    }
    setIsAdding(true);
    try {
      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: newCode, name: newName, password: newPassword, role: newRole }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Employee added successfully");
        setShowAddModal(false);
        setNewCode("");
        setNewName("");
        setNewPassword("");
        setNewRole("EMPLOYEE");
        fetchEmployees();
      } else {
        toast.error(data.error || "Failed to add employee");
      }
    } catch (error) {
      toast.error("Error adding employee");
    } finally {
      setIsAdding(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalEmpId) return;
    if (updatePassword.length !== 4) {
      toast.error("Password must be exactly 4 digits");
      return;
    }
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/employees/${passwordModalEmpId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: updatePassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Password updated successfully");
        setPasswordModalEmpId(null);
        setUpdatePassword("");
      } else {
        toast.error(data.error || "Failed to update password");
      }
    } catch (error) {
      toast.error("Error updating password");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!deleteModalEmpId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/employees/${deleteModalEmpId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Employee deleted successfully");
        setDeleteModalEmpId(null);
        fetchEmployees();
      } else {
        toast.error(data.error || "Failed to delete employee");
      }
    } catch (error) {
      toast.error("Error deleting employee");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push("/modules")}
            className="p-2 -ml-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-xs text-gray-500 font-medium">Employee Management</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all"
        >
          <UserPlus size={16} />
          <span className="hidden sm:inline">Add Employee</span>
        </button>
      </header>

      <div className="max-w-4xl mx-auto mt-8 px-4">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="animate-spin text-gray-400" size={32} />
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600">
                    <th className="px-6 py-4">Code</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium">{emp.code}</td>
                      <td className="px-6 py-4 font-medium">{emp.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${emp.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"}`}>
                          {emp.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setPasswordModalEmpId(emp.id)}
                            className="inline-flex items-center p-2 text-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Change Password"
                          >
                            <Key size={18} />
                          </button>
                          <button
                            onClick={() => setDeleteModalEmpId(emp.id)}
                            className="inline-flex items-center p-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Employee"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {employees.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        <Users size={32} className="mx-auto text-gray-300 mb-3" />
                        <p>No employees found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-bold mb-4">Add Employee</h2>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                  placeholder="Employee Name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl font-mono text-center bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    placeholder="0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl font-mono text-center bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                    placeholder="••••"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium transition-colors text-sm"
                >
                  {isAdding ? "Adding..." : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {passwordModalEmpId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-bold mb-4">Update Password</h2>
            <p className="text-sm text-gray-500 mb-6">Enter a new 4-digit numeric password for this user.</p>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  required
                  value={updatePassword}
                  onChange={(e) => setUpdatePassword(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl font-mono text-center bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xl tracking-widest"
                  placeholder="••••"
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setPasswordModalEmpId(null); setUpdatePassword(""); }}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || updatePassword.length !== 4}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium transition-colors text-sm"
                >
                  {isUpdating ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalEmpId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-red-600">
                <Trash2 size={24} />
              </div>
              <h2 className="text-xl font-bold mb-2">Delete Employee?</h2>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to permanently delete this employee? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalEmpId(null)}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteEmployee}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-xl font-medium transition-colors text-sm"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
