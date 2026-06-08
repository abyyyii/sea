export interface ContainerData {
  arrivalDate?: string;
  containerNumber: string;
  consignee?: string;
  shippingLine: string;
  currentLocation: string;
  vesselName: string;
  voyageNumber: string;
  eta: string;
  lastUpdate: string;
  status: ContainerStatus;
  destinationPort?: string;
  isTracking?: boolean;
  error?: string;
  uploadTimestamp?: string;
  userEmail?: string;
  userName?: string;
}

export type ContainerStatus = 
  | 'In Transit'
  | 'Arrived'
  | 'Discharged'
  | 'Loading'
  | 'Pending'
  | 'Not Available';

export interface TrackingResult {
  success: boolean;
  data?: ContainerData;
  error?: string;
}

export interface UploadResponse {
  success: boolean;
  containerNumbers: string[];
  error?: string;
}
