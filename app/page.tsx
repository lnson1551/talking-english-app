'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { getRooms, getUserProfile, type Room } from '@/lib/database'
import { Loader2, Mic, LogOut, Plus, Users, Clock } from 'lucide-react'
import ProfileSetup from '@/components/profile-setup'

export default function Dashboard() {
  console.log('Dashboard component rendered');
  const { user, signOut, isLoading } = useAuth()
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(true)
  const [hasProfile, setHasProfile] = useState(false)
  const [isCheckingProfile, setIsCheckingProfile] = useState(true)
  const router = useRouter()

  useEffect(() => {
    console.log('useEffect: user, isLoading, router changed. isLoading:', isLoading, 'user:', user);
    if (!isLoading && !user) {
      console.log('Redirecting to login');
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    console.log('useEffect: user changed. user:', user);
    if (user) {
      console.log('User detected, checking profile and fetching rooms.');
      checkUserProfile()
      fetchRooms()
    }
  }, [user])

  const checkUserProfile = async () => {
    console.log('checkUserProfile called');
    if (!user) {
      console.log('checkUserProfile: No user, returning.');
      return
    }
    
    try {
      const { data, error } = await getUserProfile(user.id)
      console.log('checkUserProfile: getUserProfile result:', { data, error });
      setHasProfile(!!data && !error)
    } catch (err) {
      console.error('checkUserProfile: Error fetching profile:', err);
      setHasProfile(false)
    } finally {
      console.log('checkUserProfile: finished. hasProfile:', hasProfile);
      setIsCheckingProfile(false)
    }
  }

  const fetchRooms = async () => {
    console.log('fetchRooms called');
    try {
      const { data, error } = await getRooms()
      console.log('fetchRooms: getRooms result:', { data, error });
      if (error) {
        console.error('Error fetching rooms:', error)
        return
      }
      // Removed filtering for active rooms per MVP request. All fetched rooms will now be displayed.
      const allRooms = data || []
      allRooms.sort((a, b) => {
        const aCount = a.participant_count?.count || 0;
        const bCount = b.participant_count?.count || 0;
        return bCount - aCount; // Sort by participant count descending
      });
      setRooms(allRooms)
    } catch (error) {
      console.error('fetchRooms: Error:', error)
    } finally {
      console.log('fetchRooms: finished. rooms count:', rooms.length);
      setIsLoadingRooms(false)
    }
  }

  const handleSignOut = async () => {
    console.log('handleSignOut called');
    await signOut()
    router.push('/login')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Show profile setup for new users
  if (!isCheckingProfile && !hasProfile) {
    console.log('Rendering ProfileSetup');
    return <ProfileSetup onComplete={() => setHasProfile(true)} />
  }

  if (isLoading || isCheckingProfile) {
    console.log('Rendering Loading state. isLoading:', isLoading, 'isCheckingProfile:', isCheckingProfile);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-foreground">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    console.log('No user, returning null');
    return null
  }

  console.log('Rendering main dashboard content. User:', user?.email, 'Rooms:', rooms.length);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Mic className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Talking English</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-foreground text-sm">{user?.email}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-foreground hover:bg-accent"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8">
          {/* Welcome Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Welcome to Talking English!
            </h2>
            <p className="text-muted-foreground text-lg">
              Join voice chat rooms to practice English with others
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:space-x-4">
            <Link href="/create-room">
              <Button size="lg" className="w-full bg-primary hover:bg-primary/90">
                <Plus className="h-5 w-5 mr-2" />
                Create Room
              </Button>
            </Link>
            <Link href="/join-room">
              <Button size="lg" variant="outline" className="w-full border-border text-foreground hover:bg-accent">
                <Users className="h-5 w-5 mr-2" />
                Join Room
              </Button>
            </Link>
          </div>

          {/* Active Rooms */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex flex-col sm:flex-row items-center justify-between text-center sm:text-left">
                <span className="mb-2 sm:mb-0">Active Rooms</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchRooms}
                  disabled={isLoadingRooms}
                  className="text-foreground hover:bg-accent"
                >
                  {isLoadingRooms ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    'Refresh'
                  )}
                </Button>
              </CardTitle>
              <CardDescription className="text-muted-foreground text-center sm:text-left">
                Join existing voice chat rooms
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingRooms ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : rooms.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {rooms.map((room) => {
                    console.log(`Room: ${room.name}, ID: ${room.id}, is_active: ${room.is_active}, Participant Count: ${room.participant_count?.count || 0}`);
                    return (
                    <Link key={room.id} href={`/room/${room.id}`}>
                      <Card className="bg-background hover:bg-card transition-colors cursor-pointer border-border">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-foreground">{room.name}</h3>
                            <div className="flex items-center text-sm text-primary">
                              <Users className="h-4 w-4 mr-1" />
                              <span>{room.participant_count?.count || 0}</span>
                            </div>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(room.created_at)}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )})}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No active rooms available</p>
                  <p className="text-muted-foreground text-sm mt-2">Create a room to get started!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 