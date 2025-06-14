'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { createRoom, joinRoom } from '@/lib/database'
import { Loader2, ArrowLeft, Mic } from 'lucide-react'

export default function CreateRoomPage() {
  const [roomName, setRoomName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!user) {
      setError('You must be logged in to create a room.');
      setIsLoading(false);
      router.push('/login'); // Redirect to login if user is null
      return;
    }

    if (!roomName.trim()) {
      setError('Room name is required')
      setIsLoading(false)
      return
    }

    try {
      // Create the room
      const { data: roomData, error: roomError } = await createRoom(roomName.trim(), user?.id);

      if (roomError) {
        setError(roomError.message);
        return;
      }

      // Add the creator as a participant
      const { error: participantError } = await joinRoom(roomData.id, user.id);

      if (participantError) {
        console.error("Failed to add creator as participant:", participantError);
        // Optionally, you might want to delete the room if the participant cannot be added
        setError("Room created but failed to join as participant. Please try again.");
        return;
      }

      // Redirect to the created room
      router.push(`/room/${roomData.id}`)
    } catch (error: any) {
      setError('Failed to create room. Please try again.')
    } finally {
      setIsLoading(false)
    }
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
            <Mic className="h-6 w-6 text-primary mr-2" />
            <h1 className="text-xl font-bold text-foreground">Create Room</h1>
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Create a New Voice Room</CardTitle>
            <CardDescription className="text-muted-foreground">
              Start a new voice chat room for English practice
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomName" className="text-foreground">
                  Room Name
                </Label>
                <Input
                  id="roomName"
                  type="text"
                  placeholder="Enter room name (e.g., 'English Conversation')"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>
              
              {error && (
                <div className="text-sm text-destructive-foreground bg-destructive/10 p-3 rounded-md border border-destructive/20">
                  {error}
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Room...
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Create Room
                  </>
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-muted-foreground text-sm">
                Room will be visible to all users and can accommodate 2-3 participants
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 