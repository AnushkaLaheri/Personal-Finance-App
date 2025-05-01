"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { AppHeader } from "@/components/app-header";
import { Pencil, Camera } from "lucide-react"; // or use your preferred icon library

type UserData = {
  profilePicture: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  bio: string;
};

const ProfilePage = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<UserData>({
    profilePicture: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    gender: "",
    bio: ""
  });
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null); // <-- Add this
  const [message, setMessage] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const response = await api.get("/auth/profile");
        setUserData(response.data);
        setFormData({ ...response.data });
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditClick = () => setIsEditing(true);
  const handleCancelClick = () => {
    if (userData) {
      setFormData({
        profilePicture: userData.profilePicture ?? "",
        name: userData.name ?? "",
        email: userData.email ?? "",
        phone: userData.phone ?? "",
        address: userData.address ?? "",
        dateOfBirth: userData.dateOfBirth ?? "",
        gender: userData.gender ?? "",
        bio: userData.bio ?? ""
      });
    }
    setIsEditing(false);
  };

  // Handle file input change
  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePicFile(e.target.files[0]);
      // Optionally show preview
      setFormData(prev => ({
        ...prev,
        profilePicture: URL.createObjectURL(e.target.files![0])
      }));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("email", formData.email);
      data.append("phone", formData.phone);
      data.append("address", formData.address);
      data.append("dateOfBirth", formData.dateOfBirth);
      data.append("gender", formData.gender);
      data.append("bio", formData.bio);
      if (profilePicFile) {
        data.append("profilePicture", profilePicFile);
      }

      const response = await api.put("/auth/profile", data, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      if (response.status === 200) {
        console.log("Updated profilePicture:", response.data.profilePicture); // <-- Add this log
        setUserData(response.data);
        setFormData(response.data); // This will set the new base64 image from backend
        setProfilePicFile(null);
        setMessage("Profile updated successfully");
        setIsEditing(false);
      } else {
        setMessage("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile data:", error);
      setMessage("Error updating profile data");
    }
  };

  useEffect(() => {
    if (message === "Profile updated successfully") {
      const timer = setTimeout(() => {
        setMessage("");
      }, 5000); // 5 seconds
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (loading) return <div className="text-center mt-8">Loading...</div>;
  if (!userData) return <div className="text-center mt-8 text-red-600">Error loading profile data.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center mb-4">
        <h1 className="flex-1 text-3xl font-bold text-center bg-gradient-to-r from-blue-800 to-cyan-600 bg-clip-text text-transparent drop-shadow-lg transition-all duration-500">
          Profile
        </h1>
        {!isEditing && (
          <button onClick={handleEditClick} className="text-gray-600 hover:text-blue-600 ml-4">
            <Pencil size={20} />
          </button>
        )}
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6 flex flex-col md:flex-row items-start">
        <div className="relative">
          <img
            src={
              isEditing
                ? (formData.profilePicture || userData?.profilePicture || "/default-avatar.png")
                : (userData?.profilePicture || "/default-avatar.png")
            }
            alt="Profile"
            className="rounded-full w-32 h-32 object-cover mb-4 md:mb-0 md:mr-6"
          />
          {isEditing && (
            <label className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow cursor-pointer hover:bg-gray-100">
              <Camera size={20} className="text-gray-600" />
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePicChange}
                className="hidden"
              />
            </label>
          )}
        </div>
        <div className="space-y-2 flex-1">
          <h2 className="text-xl font-semibold">{userData?.name}</h2>
          <p className="text-gray-600">{userData?.email}</p>

          {!isEditing ? (
            <>
            
              <div className="read-only-field">
                <span><strong>Phone:</strong> {userData.phone || "N/A"}</span>
              </div>
              <div className="read-only-field">
                <span><strong>Address:</strong> {userData.address || "N/A"}</span>
              </div>
              <div className="read-only-field">
                <span><strong>Date of Birth:</strong> {userData.dateOfBirth || "N/A"}</span>
              </div>
              <div className="read-only-field">
                <span><strong>Gender:</strong> {userData.gender || "N/A"}</span>
              </div>
              <div className="read-only-field">
                <span><strong>Bio:</strong> {userData.bio || "N/A"}</span>
              </div>
            </>
          ) : (
            // Editable form fields for when editing
            <>
            <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="name"
                className="w-full border px-4 py-2 rounded-md"
              />
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Phone"
                className="w-full border px-4 py-2 rounded-md"
              />
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Address"
                className="w-full border px-4 py-2 rounded-md"
              />
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className="w-full border px-4 py-2 rounded-md"
              />
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full border px-4 py-2 rounded-md"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Bio"
                className="w-full border px-4 py-2 rounded-md"
              />
            </>
          )}
        </div>
      </div>

      {/* Only show the submit/cancel buttons when editing */}
      {isEditing && (
        <div className="flex gap-4">
          <button onClick={handleFormSubmit} className="bg-green-600 text-white px-4 py-2 rounded-md">Update</button>
          <button type="button" onClick={handleCancelClick} className="bg-gray-400 text-white px-4 py-2 rounded-md">Cancel</button>
        </div>
      )}

      {/* Show messages */}
      {message && <div className="mt-4 text-center text-green-600 font-semibold">{message}</div>}
    </div>
  );
};

export default ProfilePage;
