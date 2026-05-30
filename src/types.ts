/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  language?: 'en' | 'hi' | 'te';
  createdAt: any; // Firestore Timestamp or Date ISO string
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: any;
  updatedAt: any;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'model';
  createdAt: any;
}

export interface SymptomCheckRecord {
  id: string;
  userId: string;
  symptoms: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  duration: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  results: string; // Markdown analysis compiled by Gemini
  createdAt: any;
}

export interface SavedDoctorRecord {
  id: string;
  userId: string;
  doctorId: string;
  doctorName: string;
  specialization: string;
  experience?: number;
  rating?: number;
  hospitalAffiliation?: string;
  availability?: string;
  consultationFee?: number;
  createdAt: any;
}

export interface SavedHospitalRecord {
  id: string;
  userId: string;
  hospitalId: string;
  name: string;
  rating?: number;
  address?: string;
  phone?: string;
  website?: string;
  createdAt: any;
}

export interface NearbyHospitalPlace {
  placeId: string;
  name: string;
  rating?: number;
  address?: string;
  phone?: string;
  website?: string;
  distance?: number; // Calculated distance in km or meters
  openNow?: boolean;
  latitude: number;
  longitude: number;
}

export interface DoctorProfile {
  id: string;
  name: string;
  specialization: string;
  experience: number;
  rating: number;
  hospitalAffiliation: string;
  availability: string;
  consultationFee: number;
  address?: string;
}
