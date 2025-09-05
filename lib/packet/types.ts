export interface PacketProject {
  id: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  peril: string;
  incident_at: string;
  description: string;
  policy_number?: string;
  carrier_name?: string;
  preferred_date: string;
  preferred_window: string;
  created_at: string;
}

export interface PacketMedia {
  id: string;
  type: 'photo' | 'video';
  room_tag?: string;
  caption?: string;
  signed_url: string;
}