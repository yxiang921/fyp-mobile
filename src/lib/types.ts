export type UserRole = 'super_admin' | 'pdrm_officer' | 'patrol_unit' | 'public_user';
export type MissingPersonStatus = 'pending' | 'active' | 'found' | 'closed' | 'reopened';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  agency: string | null;
  phone: string | null;
  avatar: string | null;
}

export interface Photo {
  url: string;
  type: string;
  is_primary: boolean;
}

export interface MissingPerson {
  id: number;
  case_number: string;
  full_name: string;
  gender: string | null;
  date_of_birth: string | null;
  ethnicity: string | null;
  nationality: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  hair_type: string | null;
  hair_color: string | null;
  eye_color: string | null;
  clothing_description: string | null;
  identifying_features: string | null;
  last_seen_location: string | null;
  last_seen_latitude: number | null;
  last_seen_longitude: number | null;
  last_seen_date: string | null;
  status: MissingPersonStatus;
  description: string | null;
  photos: Photo[];
  created_at: string;
  updated_at: string;
  detections?: Detection[];
  alerts?: CaseAlert[];
}

export interface CameraSummary {
  name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
}

export interface Detection {
  id: number;
  detection_id: string;
  similarity_score: number | null;
  status: string;
  detected_at: string | null;
  captured_images: string[];
  camera: CameraSummary | null;
}

export interface CaseAlert {
  id: number;
  alert_id: string;
  detection_id: number | null;
  similarity_score: number | null;
  status: string;
  description: string | null;
  resolved_at: string | null;
  created_at: string;
  camera: CameraSummary | null;
}

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  is_unread: boolean;
  created_at: string;
}

export interface Sighting {
  id: number;
  missing_person_id: number;
  missing_person_name: string | null;
  case_number: string | null;
  reporter_name: string | null;
  reporter_phone: string | null;
  location: string;
  latitude: number | null;
  longitude: number | null;
  sighted_at: string;
  notes: string | null;
  status: string;
  created_at: string;
}

export interface Pagination {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ListResponse<T> {
  success: boolean;
  data: T[];
  unread_count?: number;
  pagination?: Pagination;
}

export interface SingleResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface NotificationMissingPerson {
  id: number;
  case_number: string;
  full_name: string;
  gender: string | null;
  date_of_birth: string | null;
  last_seen_location: string | null;
  last_seen_latitude: number | null;
  last_seen_longitude: number | null;
  last_seen_date: string | null;
  status: MissingPersonStatus;
  description: string | null;
  photos: Photo[];
}

export interface NotificationDetection {
  id: number;
  detection_id: string;
  similarity_score: number | null;
  status: string;
  detected_at: string | null;
  captured_images: string[];
  camera: {
    name: string;
    location: string;
    latitude: number | null;
    longitude: number | null;
  } | null;
}

export interface NotificationDetail {
  id: number;
  type: string;
  title: string;
  message: string;
  is_unread: boolean;
  created_at: string;
  missing_person: NotificationMissingPerson | null;
  detection: NotificationDetection | null;
}
