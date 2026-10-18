// API-spezifische Typen für Frontend-Backend-Kommunikation
// Diese Datei kann im Frontend und Backend verwendet werden

import { FormData } from './formData';

export interface ApplicationSubmissionRequest {
  formData: FormData;
  uuid: string;
}

export interface ApplicationSubmissionResponse {
  success: boolean;
  message: string;
  uuid?: string;
  email?: string;
  errors?: string[];
}

export interface ApplicationListResponse {
  success: boolean;
  data: FormData[];
  meta?: {
    count: number;
    limit: number;
    offset: number;
  };
}

export interface DatabaseStatsResponse {
  success: boolean;
  data: {
    totalApplications: number;
    applicationsByMonth: Record<string, number>;
    applicationsByMembership: Record<string, number>;
    recentApplications: Array<{
      email: string;
      creationDate: string;
      membership: string;
    }>;
  };
  timestamp: string;
}
