import { supabase } from '@/integrations/supabase/client';
import { ContainerData } from '@/types/container';

export interface ContainerUploadContext {
  arrivalDate?: string | null;
  consignee?: string | null;
  uploadTimestamp?: string;
  userEmail?: string | null;
  userName?: string | null;
  extras?: Record<string, string> | null;
}

export interface DbContainer {
  arrival_date: string | null;
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  consignee: string | null;
  container_number: string;
  shipping_line: string | null;
  current_location: string | null;
  vessel_name: string | null;
  voyage_number: string | null;
  eta: string | null;
  last_update: string | null;
  status: string;
  origin_port: string | null;
  destination_port: string | null;
  error: string | null;
  upload_timestamp: string;
  created_at: string;
  updated_at: string;
}

// Convert database container to app format
export const dbToContainerData = (db: DbContainer): ContainerData => ({
  arrivalDate: db.arrival_date || db.eta || '',
  containerNumber: db.container_number,
  consignee: db.consignee || '',
  shippingLine: db.shipping_line || '',
  currentLocation: db.current_location || '',
  vesselName: db.vessel_name || '',
  voyageNumber: db.voyage_number || '',
  eta: db.eta || '',
  lastUpdate: db.last_update || '',
  status: (db.status as ContainerData['status']) || 'Pending',
  destinationPort: db.destination_port || undefined,
  error: db.error || undefined,
  uploadTimestamp: db.upload_timestamp,
  userEmail: db.user_email || undefined,
  userName: db.user_name || undefined,
});

// Convert app container to database format (for insert/update)
export const containerDataToDb = (container: ContainerData, userId: string, context?: ContainerUploadContext) => ({
  user_id: userId,
  user_name: context?.userName ?? container.userName ?? null,
  user_email: context?.userEmail ?? container.userEmail ?? null,
  consignee: context?.consignee ?? container.consignee ?? null,
  container_number: container.containerNumber,
  shipping_line: container.shippingLine || null,
  current_location: container.currentLocation || null,
  vessel_name: container.vesselName || null,
  voyage_number: container.voyageNumber || null,
  arrival_date: context?.arrivalDate ?? container.arrivalDate ?? null,
  eta: container.eta || null,
  last_update: container.lastUpdate || null,
  status: container.status,
  origin_port: null,
  destination_port: container.destinationPort || null,
  error: container.error || null,
  upload_timestamp: context?.uploadTimestamp ?? container.uploadTimestamp ?? new Date().toISOString(),
  extras: context?.extras ?? {},
});

// Fetch all containers for the current user
export const fetchUserContainers = async (): Promise<ContainerData[]> => {
  const { data, error } = await supabase
    .from('tracked_containers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching containers:', error);
    throw error;
  }

  return (data as DbContainer[]).map(dbToContainerData);
};

// Upsert a container (insert or update)
export const upsertContainer = async (container: ContainerData, userId: string, context?: ContainerUploadContext): Promise<void> => {
  const dbData = containerDataToDb(container, userId, context);

  const { error } = await supabase
    .from('tracked_containers')
    .upsert(dbData, { 
      onConflict: 'user_id,container_number',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error('Error upserting container:', error);
    throw error;
  }
};

// Upsert multiple containers
export const upsertContainers = async (containers: ContainerData[], userId: string, contexts?: Record<string, ContainerUploadContext>): Promise<void> => {
  const dbData = containers.map((c) => containerDataToDb(c, userId, contexts?.[c.containerNumber]));

  const { error } = await supabase
    .from('tracked_containers')
    .upsert(dbData, { 
      onConflict: 'user_id,container_number',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error('Error upserting containers:', error);
    throw error;
  }
};

export const replaceUserContainers = async (
  containers: ContainerData[],
  userId: string,
  contexts?: Record<string, ContainerUploadContext>,
): Promise<void> => {
  const { error: deleteError } = await supabase
    .from('tracked_containers')
    .delete()
    .eq('user_id', userId);

  if (deleteError) {
    console.error('Error clearing existing user containers:', deleteError);
    throw deleteError;
  }

  if (containers.length === 0) {
    return;
  }

  const dbData = containers.map((container) => containerDataToDb(container, userId, contexts?.[container.containerNumber]));
  const { error: insertError } = await supabase
    .from('tracked_containers')
    .insert(dbData);

  if (insertError) {
    console.error('Error replacing user containers:', insertError);
    throw insertError;
  }
};

// Delete a container (with user ownership verification)
export const deleteContainer = async (containerNumber: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('tracked_containers')
    .delete()
    .eq('user_id', user.id)
    .eq('container_number', containerNumber);

  if (error) {
    console.error('Error deleting container:', error);
    throw error;
  }
};

// Delete multiple containers by container numbers
export const deleteContainers = async (containerNumbers: string[]): Promise<void> => {
  if (containerNumbers.length === 0) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('tracked_containers')
    .delete()
    .eq('user_id', user.id)
    .in('container_number', containerNumbers);

  if (error) {
    console.error('Error deleting containers:', error);
    throw error;
  }
};

// Delete all containers for current user
export const deleteAllContainers = async (): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('tracked_containers')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting all containers:', error);
    throw error;
  }
};
