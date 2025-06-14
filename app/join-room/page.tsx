'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { Loader2, ArrowLeft, Mic, Users } from 'lucide-react'

interface Room {
  id: string
  name: string
  created_at: string
  created_by: string
  is_active: boolean
}

export default function JoinRoomPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [roomName, setRoomName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) router.push('/login')
    fetchRooms()
    // eslint-disable-next-line
  }, [user])

  const fetchRooms = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (!error) setRooms(data || [])
    setIsLoading(false)
  }

  const handleJoinByName = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!roomName.trim()) {
      setError('Please enter a room name')
      return
    }
    // Find room by name
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('name', roomName.trim())
      .eq('is_active', true)
      .single()
    if (error || !data) {
      setError('Room not found')
      return
    }
    router.push(`/room/${data.id}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link href="/" className="mr-4">
            <Button variant="ghost" size="sm" className="text-foreground hover:bg-accent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex items-center">
            <Users className="h-6 w-6 text-primary mr-2" />
            <h1 className="text-xl font-bold text-foreground">Join Room</h1>
          </div>
        </div>

        <Card className="bg-card border-border mb-8">
          <CardHeader>
            <CardTitle className="text-foreground">Join by Room Name</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter the name of the room you want to join
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinByName} className="flex gap-2">
              <Input
                type="text"
                placeholder="Room name"
                value={roomName}
                onChange={e => setRoomName(e.target.value)}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
              />
              <Button type="submit" className="bg-primary hover:bg-primary/90">Join</Button>
            </form>
            {error && <div className="mt-2 text-destructive-foreground text-sm">{error}</div>}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Active Rooms</CardTitle>
            <CardDescription className="text-muted-foreground">
              Click a room to join
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : rooms.length > 0 ? (
              <div className="grid gap-3">
                {rooms.map(room => (
                  <Link key={room.id} href={`/room/${room.id}`}>
                    <Card className="bg-background hover:bg-card transition-colors cursor-pointer border-border mb-2">
                      <CardContent className="p-3 flex items-center gap-2">
                        <Mic className="h-4 w-4 text-primary" />
                        <span className="text-foreground font-medium">{room.name}</span>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No active rooms available</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 