import { supabase } from './supabase'

export interface UserProfile {
  id: string
  email: string
  display_name: string
  created_at: string
}

export interface Room {
  id: string
  name: string
  created_at: string
  created_by: string
  is_active: boolean
  participant_count?: { count: number }
}

export interface RoomParticipant {
  id: string
  room_id: string
  user_id: string
  joined_at: string
  is_muted: boolean
  user_profile?: UserProfile
}

// User Profile Functions
export async function createUserProfile(userId: string, email: string, displayName: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert([
      {
        id: userId,
        email,
        display_name: displayName
      }
    ])
    .select()
    .single()

  return { data, error }
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  return { data, error }
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  return { data, error }
}

export async function createRoom(name: string, createdBy: string | undefined) {
  const { data, error } = await supabase
    .from('rooms')
    .insert([
      {
        name,
        created_by: createdBy,
        is_active: true
      }
    ])
    .select()
    .single()

  return { data, error }
}

// Room Functions
export async function getRooms() {
  const { data, error } = await supabase
    .from('rooms')
    .select(`
      *,
      participant_count:room_participants(count)
    `)
    .order('created_at', { ascending: false })

  return { data, error }
}

export async function getRoomParticipants(roomId: string) {
  const { data, error } = await supabase
    .from('room_participants')
    .select(`
      *
    `)
    .eq('room_id', roomId)

  return { data, error }
}

export async function joinRoom(roomId: string, userId: string, isMuted: boolean = false) {
  try {
    const { data, error } = await supabase
      .from('room_participants')
      .insert([
        {
          room_id: roomId,
          user_id: userId,
          is_muted: isMuted
        }
      ])
      .select()
      .single()

    return { data, error }
  } catch (err: any) {
    if (err.code === '23505') { // PostgreSQL unique_violation error code
      console.warn('Attempted to join room with existing participant. Ignoring duplicate entry.');
      // Return data as if successful, as the user is effectively 'in' the room
      return { data: [], error: null };
    }
    // Re-throw or return other errors
    return { data: null, error: err };
  }
}

export async function leaveRoom(roomId: string, userId: string) {
  const { error } = await supabase
    .from('room_participants')
    .delete()
    .eq('room_id', roomId)
    .eq('user_id', userId)

  return { error }
}

export async function updateParticipantMute(roomId: string, userId: string, isMuted: boolean) {
  const { data, error } = await supabase
    .from('room_participants')
    .update({ is_muted: isMuted })
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .select()
    .single()

  return { data, error }
}

export async function updateRoomActiveStatus(roomId: string, isActive: boolean) {
  // This function will now be primarily used for room activation or explicit status updates.
  // Deactivation (and deletion) logic is handled elsewhere, e.g., on leave.
  const { data, error } = await supabase
    .from('rooms')
    .update({ is_active: isActive })
    .eq('id', roomId)
    .select()
    .single();
  return { data, error };
}

export async function deleteRoom(roomId: string) {
  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', roomId)

  return { error };
} 