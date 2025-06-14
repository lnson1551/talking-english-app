'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { getRoomParticipants, joinRoom, leaveRoom, updateParticipantMute, updateRoomActiveStatus, type RoomParticipant, deleteRoom } from '@/lib/database'
import { Mic, MicOff, LogOut, Loader2, Users, AlertTriangle } from 'lucide-react'
import AudioControls from '@/components/audio-controls'
import { cn } from '@/lib/utils'

// --- WebRTC helpers ---
const RTC_CONFIG = { 
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // Using a free TURN server from freeturn.net for MVP testing. 
    // Note: This free tier might be limited and does not support SSL (TURNS).
    // For production, consider a more robust solution like Cloudflare Calls or a paid TURN service.
    { urls: 'turn:freestun.net:3478', username: 'free', credential: 'free' }
  ] 
}

export default function RoomPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const roomId = params.roomId as string

  const [room, setRoom] = useState<any>(null)
  const [participants, setParticipants] = useState<RoomParticipant[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [joined, setJoined] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'failed'>('connecting')

  // WebRTC state
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteAudioRefs = useRef<{ [userId: string]: HTMLAudioElement | null }>({})
  const peerConnections = useRef<{ [userId: string]: RTCPeerConnection }>({})
  const signalingChannel = useRef<any>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useCallback((audioElement: HTMLAudioElement) => {
    if (audioElement && localStreamRef.current) {
      audioElement.srcObject = localStreamRef.current;
    }
  }, []);

  const fetchParticipants = useCallback(async () => {
    console.log('Fetching participants for room:', roomId);
    try {
      const { data, error } = await getRoomParticipants(roomId)
      if (!error) {
        console.log('Fetched participants:', data);
        setParticipants(data || [])
        // Check if user is already in the room
        const isUserInRoom = data?.some(p => p.user_id === user?.id)
        if (isUserInRoom && !joined) {
          setJoined(true)
        }
      } else {
        console.error('Error fetching participants:', error);
        // Add more detailed logging for debugging deployed environment
        console.error('Supabase error details (fetchParticipants):', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
      }
    } catch (err: any) {
      console.error('Error fetching participants (catch):', err)
      // Also log full error object from catch block
      console.error('Full catch error object:', err);
    }
  }, [roomId, user, joined]);

  // --- Fetch room and participants ---
  useEffect(() => {
    if (!user) return router.push('/login')
    fetchRoom()
    fetchParticipants()
    
    // Subscribe to participants changes
    const channel = supabase
      .channel('room_participants')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'room_participants', 
        filter: `room_id=eq.${roomId}` 
      }, fetchParticipants)
      .subscribe()
    
    return () => { 
      channel.unsubscribe()
      cleanupWebRTC()
    }
    // eslint-disable-next-line
  }, [user, roomId, fetchParticipants])

  const fetchRoom = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select(`*`)
        .eq('id', roomId)
        .single()

      if (error) {
        console.error('Supabase error details (fetchRoom):', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        setError('Room not found or access denied.')
        setIsLoading(false)
        return
      }
      
      if (!data) {
        setError('Room not found.')
        setIsLoading(false)
        return
      }
      console.log('fetchRoom: Fetched room data:', JSON.stringify(data, null, 2));

      setRoom(data)
    } catch (err) {
      console.error('Failed to load room (catch):', err)
      setError('Failed to load room.')
    } finally {
      setIsLoading(false)
    }
  }

  // --- Join/Leave Room ---
  const handleJoin = async () => {
    if (!user) return
    
    setError('')
    // Removed pre-join check for room activity and participant count, per MVP request.
    // Any room that can be navigated to is assumed joinable.

    try {
      // Check if user is already a participant
      console.log('handleJoin: Checking if user is already participant');
      const { data: existingParticipants, error: fetchError } = await getRoomParticipants(roomId);

      if (fetchError) {
        console.error('Error checking existing participants:', fetchError);
        // Add more detailed logging for debugging deployed environment
        console.error('Supabase error details (check existing participants in handleJoin):', {
          message: fetchError.message,
          code: fetchError.code,
          details: fetchError.details,
          hint: fetchError.hint,
        });
        setError('Failed to check room participants.');
        return;
      }

      const isAlreadyParticipant = existingParticipants?.some(p => p.user_id === user.id);

      if (isAlreadyParticipant) {
        console.log('User is already a participant in this room.');
        setJoined(true);
      } else {
        console.log('handleJoin: User not in room, attempting to join.');
        const { error } = await joinRoom(roomId, user.id, isMuted)
        if (error) {
          console.error('Error joining room:', error);
          console.error('Supabase error details (joinRoom):', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });
          setError(error.message)
          return
        }
        setJoined(true)
        console.log('handleJoin: Successfully joined room.');
      }
      
      await startLocalStream()
      fetchParticipants()
    } catch (err) {
      console.error('Error in handleJoin (catch):', err);
      setError('Failed to join room')
    }
  }

  const handleLeave = async () => {
    if (!user) return
    
    try {
      await leaveRoom(roomId, user.id)
      console.log('User left room.');
      // After leaving, re-fetch participants to check if room is empty
      const { data: updatedParticipants, error: participantsError } = await getRoomParticipants(roomId)

      console.log('DEBUG: participantsError (raw):', participantsError);
      console.log('DEBUG: typeof participantsError:', typeof participantsError);
      console.log('DEBUG: participantsError instanceof Error:', participantsError instanceof Error);
      console.log('DEBUG: Object.keys(participantsError):', participantsError ? Object.keys(participantsError) : 'null error object');

      if (participantsError) {
        console.error('Error re-fetching participants after leaving:', 
          'message:', participantsError.message, 
          'code:', participantsError.code, 
          'details:', participantsError.details, 
          'hint:', participantsError.hint
        );
      }

      if (updatedParticipants && updatedParticipants.length === 0) {
        console.log('No participants left. Deleting room...');
        // If no one is left, delete the room
        const { error: deleteError } = await deleteRoom(roomId)
        if (deleteError) {
          console.error('Error deleting room:', deleteError);
        } else {
          console.log('Room deleted successfully.');
        }
      } else {
        console.log('Participants still remaining after leave:', updatedParticipants?.length);
      }

      setJoined(false)
      cleanupWebRTC()
      router.push('/')
    } catch (err) {
      console.error('Error leaving room (catch):', err)
      router.push('/')
    }
  }

  const cleanupWebRTC = () => {
    // Close all peer connections
    Object.values(peerConnections.current).forEach(pc => {
      try {
        pc.close()
      } catch (err) {
        console.error('Error closing peer connection:', err)
      }
    })
    peerConnections.current = {}
    
    // Stop local stream
    stopLocalStream()
    
    // Remove audio elements
    Object.values(remoteAudioRefs.current).forEach(audio => {
      if (audio && audio.parentNode) {
        audio.parentNode.removeChild(audio)
      }
    })
    remoteAudioRefs.current = {}
    
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }

  // --- Mic control ---
  const handleToggleMic = async () => {
    if (!user) return
    
    const newMuted = !isMuted
    setIsMuted(newMuted)
    
    try {
      await updateParticipantMute(roomId, user.id, newMuted)
      
      if (newMuted) {
        stopLocalStream()
      } else {
        await startLocalStream()
      }
      
      // Update tracks for all peers
      Object.values(peerConnections.current).forEach(pc => {
        pc.getSenders().forEach(sender => {
          if (sender.track && sender.track.kind === 'audio') {
            sender.track.enabled = !newMuted
          }
        })
      })
    } catch (err) {
      setError('Failed to update mic status')
    }
  }

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      })
      localStreamRef.current = stream
      
      // Add to all existing peer connections
      Object.values(peerConnections.current).forEach(pc => {
        stream.getTracks().forEach(track => {
          try {
            pc.addTrack(track, stream)
          } catch (err) {
            console.error('Error adding track to peer connection:', err)
          }
        })
      })
    } catch (err) {
      setError('Could not access microphone. Please check permissions.')
    }
  }

  const stopLocalStream = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop()
      })
      localStreamRef.current = null
    }
  }

  // --- WebRTC Signaling ---
  useEffect(() => {
    if (!user || !joined) return
    
    // Setup signaling channel with reconnection logic
    setupSignalingChannel()
    
    return () => {
      if (signalingChannel.current) {
        signalingChannel.current.unsubscribe()
      }
    }
    // eslint-disable-next-line
  }, [user, joined])

  const setupSignalingChannel = () => {
    signalingChannel.current = supabase.channel(`webrtc-${roomId}`)
    signalingChannel.current
      .on('broadcast', { event: 'signal' }, async (payload: any) => {
        const { from, to, data } = payload.payload
        if (to !== user?.id) return
        await handleSignalingMessage(from, data)
      })
      .on('system', { event: 'disconnect' }, () => {
        setConnectionStatus('failed')
        // Attempt to reconnect
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          setupSignalingChannel()
        }, 3000)
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected')
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('failed')
        }
      })
  }

  // --- Peer Connection Management ---
  useEffect(() => {
    if (!user || !joined) return
    
    // Create peer connections for new participants
    participants.forEach(p => {
      if (p.user_id === user.id) return
      if (!peerConnections.current[p.user_id]) {
        createPeerConnection(p.user_id)
      }
    })
    
    // Remove connections for users who left
    Object.keys(peerConnections.current).forEach(uid => {
      if (!participants.find(p => p.user_id === uid)) {
        try {
          peerConnections.current[uid].close()
          delete peerConnections.current[uid]
          
          // Remove audio element
          if (remoteAudioRefs.current[uid]) {
            const audio = remoteAudioRefs.current[uid]
            if (audio && audio.parentNode) {
              audio.parentNode.removeChild(audio)
            }
            delete remoteAudioRefs.current[uid]
          }
        } catch (err) {
          console.error('Error cleaning up peer connection:', err)
        }
      }
    })
    // eslint-disable-next-line
  }, [participants, user, joined])

  const createPeerConnection = (remoteUserId: string) => {
    if (!user) return
    
    try {
      const pc = new RTCPeerConnection(RTC_CONFIG)
      peerConnections.current[remoteUserId] = pc
      
      // Add local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          try {
            pc.addTrack(track, localStreamRef.current!)
          } catch (err) {
            console.error('Error adding track:', err)
          }
        })
      }
      
      // Handle remote stream
      pc.ontrack = (event) => {
        if (!remoteAudioRefs.current[remoteUserId]) {
          const audio = document.createElement('audio')
          audio.autoplay = true
          audio.controls = false
          audio.style.display = 'none'
          remoteAudioRefs.current[remoteUserId] = audio
        }
        
        const audio = remoteAudioRefs.current[remoteUserId]!
        audio.srcObject = event.streams[0]
        
        // Attach to DOM if not already attached
        if (!document.getElementById(`audio-${remoteUserId}`)) {
          audio.id = `audio-${remoteUserId}`
          document.body.appendChild(audio)
        }
      }
      
      // ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal(remoteUserId, { type: 'ice', candidate: event.candidate })
        }
      }
      
      // Connection state changes
      pc.onconnectionstatechange = () => {
        console.log(`Connection state with ${remoteUserId}:`, pc.connectionState)
      }
      
      // ICE connection state changes
      pc.oniceconnectionstatechange = () => {
        console.log(`ICE connection state with ${remoteUserId}:`, pc.iceConnectionState)
      }
      
      // Offer/Answer (only initiator creates offer)
      if (user.id < remoteUserId) {
        pc.onnegotiationneeded = async () => {
          try {
            const offer = await pc.createOffer()
            await pc.setLocalDescription(offer)
            sendSignal(remoteUserId, { type: 'offer', sdp: offer })
          } catch (err) {
            console.error('Error creating offer:', err)
          }
        }
      }
    } catch (err) {
      console.error('Error creating peer connection:', err)
    }
  }

  const sendSignal = (to: string, data: any) => {
    if (!user || !signalingChannel.current) return
    
    try {
      signalingChannel.current.send({
        type: 'broadcast',
        event: 'signal',
        payload: { from: user.id, to, data }
      })
    } catch (err) {
      console.error('Error sending signal:', err)
    }
  }

  const handleSignalingMessage = async (from: string, data: any) => {
    const pc = peerConnections.current[from]
    if (!pc) return
    
    try {
      if (data.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        sendSignal(from, { type: 'answer', sdp: answer })
      } else if (data.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
      } else if (data.type === 'ice') {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate))
        } catch (err) {
          // Ignore ICE candidate errors (common when connection is already established)
        }
      }
    } catch (err) {
      console.error('Error handling signaling message:', err)
    }
  }

  // --- Auto-join ---
  useEffect(() => {
    if (user && !joined && !isLoading) {
      handleJoin()
    }
    // eslint-disable-next-line
  }, [user, joined, isLoading])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-foreground">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Loading room...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md bg-card border-border text-foreground">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-destructive flex items-center justify-center gap-2">
              <AlertTriangle className="h-6 w-6" />
              Error
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push('/')} className="bg-primary hover:bg-primary/90">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!room) {
    return null // Should ideally not happen if error handling works
  }

  const participantsWithNames = participants.map(p => ({
    user_id: p.user_id,
    display_name: p.user_profile?.display_name || p.user_id.substring(0, 8),
    is_muted: p.is_muted
  }))

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border p-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center space-x-3 mb-4 sm:mb-0">
            <Mic className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Room: {room?.name || roomId}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-foreground text-sm hidden sm:block">{user?.email}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLeave}
              className="text-foreground hover:bg-accent"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Leave Room
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex justify-center p-4">
        {/* Participants List - Now centered */}
        <Card className="flex-[2] relative overflow-hidden max-w-2xl"> {/* Adjusted max-w to keep it readable */}
          <CardHeader>
            <CardTitle className="text-xl">Participants ({participants.length})</CardTitle>
            <CardDescription>Active users in this room</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4 py-4">
            {participants.length === 0 ? (
              <p className="text-muted-foreground">No participants yet. Be the first!</p>
            ) : (
              participants.map(p => (
                <div 
                  key={p.id} 
                  className={cn(
                    "relative p-4 border rounded-lg flex flex-col items-center justify-center min-w-[120px] shadow-sm transition-all duration-200",
                    !p.is_muted ? "border-primary shadow-lg ring-2 ring-primary" : "border-border"
                  )}
                >
                  <p className="font-semibold text-foreground text-center break-words">
                    {p.user_profile?.display_name || 'Unknown User'}
                    {p.user_id === user?.id && " (You)"}
                  </p>
                  <div className="mt-2 flex items-center">
                    {!p.is_muted ? (
                      <Mic className="h-5 w-5 text-primary" />
                    ) : (
                      <MicOff className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className="ml-1 text-sm text-muted-foreground">
                      {!p.is_muted ? "Mic Open" : "Muted"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>

      {/* My Controls - Fixed at bottom and centered */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"> {/* Positioning for the mic button */}
        <Button
          onClick={handleToggleMic}
          disabled={!joined}
          size="icon" // Use icon size for a square button
          className={cn(
            "h-16 w-16 rounded-full p-0 flex items-center justify-center shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
            !isMuted ? "bg-primary hover:bg-primary/90" : "bg-muted-foreground hover:bg-muted-foreground/90"
          )}
          aria-label={!isMuted ? "Mute microphone" : "Unmute microphone"}
        >
          {!isMuted ? <Mic className="h-8 w-8" /> : <MicOff className="h-8 w-8" />}
        </Button>
      </div>
    </div>
  )
} 