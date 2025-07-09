import { apiClient } from "../apiClient";

export interface UserProfile {
  id: string;
  email: string;
  role: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    city?: string;
    zipCode?: string;
  };
  createdAt: string;
}

export class UserService {
  static async getUserProfile(): Promise<UserProfile> {
    try {
      console.log("[USER_SERVICE] Fetching user profile...");

      const data = await apiClient.get<{ user: UserProfile }>("/me");

      console.log("[USER_SERVICE] Profile fetched successfully");
      return data.user;
    } catch (error) {
      console.error("[USER_SERVICE] Error fetching profile:", error);
      throw error;
    }
  }

  static async updateProfile(
    profileData: Partial<UserProfile["profile"]>
  ): Promise<UserProfile> {
    try {
      console.log("[USER_SERVICE] Updating user profile...", profileData);

      const data = await apiClient.put<{ user: UserProfile }>(
        "/profile",
        profileData
      );

      console.log("[USER_SERVICE] Profile updated successfully");
      return data.user;
    } catch (error) {
      console.error("[USER_SERVICE] Error updating profile:", error);
      throw error;
    }
  }

  static async createProfile(
    profileData: UserProfile["profile"]
  ): Promise<UserProfile> {
    try {
      console.log("[USER_SERVICE] Creating user profile...", profileData);

      const data = await apiClient.post<{ user: UserProfile }>(
        "/profile",
        profileData
      );

      console.log("[USER_SERVICE] Profile created successfully");
      return data.user;
    } catch (error) {
      console.error("[USER_SERVICE] Error creating profile:", error);
      throw error;
    }
  }
}
