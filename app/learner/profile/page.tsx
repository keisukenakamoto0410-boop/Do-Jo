"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { compressAvatar, formatFileSize, needsCompression } from "@/lib/imageCompression";
import { COUNTRIES } from "@/lib/locationData";

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/users/${session?.user?.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      const data = await response.json();

      setName(data.name || "");
      setBio(data.bio || "");
      setAvatarPreview(data.avatar || "");
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 10MB before compression)
      if (file.size > 10 * 1024 * 1024) {
        alert("Image must be less than 10MB");
        return;
      }

      // Show preview immediately
      setAvatarPreview(URL.createObjectURL(file));

      // Compress the image
      const originalSize = formatFileSize(file.size);
      const compressed = await compressAvatar(file);
      const compressedSize = formatFileSize(compressed.size);

      console.log(`Avatar compressed: ${originalSize} -> ${compressedSize}`);
      setAvatar(compressed);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("bio", bio);
      if (avatar) {
        formData.append("avatar", avatar);
      }

      const response = await fetch(`/api/users/${session?.user?.id}`, {
        method: "PATCH",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      alert("Profile updated successfully!");
      router.push("/learner/dashboard");
    } catch (error) {
      console.error("Profile update error:", error);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00A8CC]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFB] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-[#1A2332] mb-8">Edit Profile</h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          {/* Avatar */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-[#1A2332] mb-2">
              Profile Photo
            </label>
            <div className="flex items-center space-x-6">
              <div className="relative">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-4 border-[#00A8CC]"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[#00A8CC] flex items-center justify-center text-white text-3xl font-bold">
                    {name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className="px-4 py-2 bg-[#00A8CC] text-white rounded-lg cursor-pointer hover:bg-[#006B7D] inline-block transition-colors"
                >
                  Choose Photo
                </label>
                <p className="text-xs text-[#566573] mt-2">
                  JPG, PNG or GIF. Max 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-[#1A2332] mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A8CC] focus:border-transparent"
              required
            />
          </div>

          {/* Bio */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-[#1A2332] mb-2">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A8CC] focus:border-transparent"
              rows={4}
              placeholder="Tell us about yourself..."
            />
          </div>

          {/* Buttons */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-[#00A8CC] text-white rounded-lg font-semibold hover:bg-[#006B7D] disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 text-[#1A2332] rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
