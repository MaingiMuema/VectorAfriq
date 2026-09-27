"use client";

import { useState, useEffect } from "react";
import { FiSave, FiPlus } from "react-icons/fi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { toast } from "react-hot-toast";

interface Setting {
  id: string;
  key: string;
  value: string;
  type: "STRING" | "NUMBER" | "BOOLEAN" | "JSON";
  category: string;
  description: string | null;
}

type SettingType = "STRING" | "NUMBER" | "BOOLEAN" | "JSON";

interface NewSetting {
  key: string;
  value: string;
  type: SettingType;
  category: string;
  description: string;
}

type GroupedSettings = {
  [key: string]: Setting[];
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [showNewForm, setShowNewForm] = useState(false);
  const [newSetting, setNewSetting] = useState<NewSetting>({
    key: "",
    value: "",
    type: "STRING",
    category: "",
    description: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");

      const data = await res.json();
      setSettings(data);
    } catch (err) {
      setError("Error loading settings");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (key: string, value: string) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  };

  const saveSetting = async (setting: Setting) => {
    const newValue = editedValues[setting.key];
    if (newValue === undefined || newValue === setting.value) return;

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: setting.key,
          value: setting.type === "BOOLEAN" ? newValue === "true" : newValue,
        }),
      });

      if (!res.ok) throw new Error("Failed to update setting");

      const updatedSetting = await res.json();
      setSettings(
        settings.map((s) => (s.id === updatedSetting.id ? updatedSetting : s))
      );

      const newEditedValues = { ...editedValues };
      delete newEditedValues[setting.key];
      setEditedValues(newEditedValues);

      toast.success("Setting updated successfully");
    } catch (err) {
      toast.error("Error updating setting");
      console.error(err);
    }
  };

  const handleCreateSetting = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSetting),
      });

      if (!res.ok) throw new Error("Failed to create setting");

      const setting = await res.json();
      setSettings([...settings, setting]);
      setShowNewForm(false);
      setNewSetting({
        key: "",
        value: "",
        type: "STRING",
        category: "",
        description: "",
      });
      toast.success("Setting created successfully");
    } catch (err) {
      toast.error("Error creating setting");
      console.error(err);
    }
  };

  const groupedSettings = settings.reduce<GroupedSettings>((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#468AD1] text-white rounded-lg hover:bg-[#2F6FAE]"
        >
          <FiPlus className="w-5 h-5" />
          New Setting
        </button>
      </div>

      {/* New Setting Form */}
      {showNewForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Create New Setting</h2>
          <form onSubmit={handleCreateSetting} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Key
              </label>
              <input
                type="text"
                value={newSetting.key}
                onChange={(e) =>
                  setNewSetting({ ...newSetting, key: e.target.value })
                }
                className="mt-1 w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Value
              </label>
              <input
                type="text"
                value={newSetting.value}
                onChange={(e) =>
                  setNewSetting({ ...newSetting, value: e.target.value })
                }
                className="mt-1 w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <Select
                value={newSetting.type}
                onValueChange={(value: SettingType) =>
                  setNewSetting({ ...newSetting, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STRING">String</SelectItem>
                  <SelectItem value="NUMBER">Number</SelectItem>
                  <SelectItem value="BOOLEAN">Boolean</SelectItem>
                  <SelectItem value="JSON">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <input
                type="text"
                value={newSetting.category}
                onChange={(e) =>
                  setNewSetting({ ...newSetting, category: e.target.value })
                }
                className="mt-1 w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={newSetting.description}
                onChange={(e) =>
                  setNewSetting({ ...newSetting, description: e.target.value })
                }
                className="mt-1 w-full px-3 py-2 border rounded-lg"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#468AD1] text-white rounded-lg hover:bg-[#2F6FAE]"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Settings Groups */}
      {Object.entries(groupedSettings).map(([category, categorySettings]) => (
        <div key={category} className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4 capitalize">{category}</h2>
          <div className="space-y-4">
            {categorySettings.map((setting) => (
              <div key={setting.id} className="flex items-start gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {setting.key}
                    {setting.description && (
                      <span className="ml-2 text-gray-500 text-xs">
                        {setting.description}
                      </span>
                    )}
                  </label>
                  {setting.type === "BOOLEAN" ? (
                    <Select
                      value={editedValues[setting.key] ?? setting.value}
                      onValueChange={(value) =>
                        handleValueChange(setting.key, value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">True</SelectItem>
                        <SelectItem value="false">False</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <input
                      type={setting.type === "NUMBER" ? "number" : "text"}
                      value={editedValues[setting.key] ?? setting.value}
                      onChange={(e) =>
                        handleValueChange(setting.key, e.target.value)
                      }
                      className="mt-1 w-full px-3 py-2 border rounded-lg"
                    />
                  )}
                </div>
                {editedValues[setting.key] !== undefined && (
                  <button
                    onClick={() => saveSetting(setting)}
                    className="mt-6 p-2 text-[#468AD1] hover:bg-red-50 rounded-lg"
                  >
                    <FiSave className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
