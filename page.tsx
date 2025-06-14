"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Mic, LogOut, Loader2, Settings } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getRooms, type Room } from "@/lib/database"

export default function Home() {
  const router = useRouter()
  const { user, signOut, isLoading: authLoading } = useAuth()
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login")
    }
  }, [router, user, authLoading])

  useEffect(() => {
    const fetchRooms = async () => {
      if (!user) return
      setIsLoadingRooms(true)
      try {
        const { data, error } = await getRooms()
        if (error) {
          console.error("Error fetching rooms:", error)
          return
        }
        setRooms(data || [])
      } catch (err) {
        console.error("Unexpected error fetching rooms:", err)
      } finally {
        setIsLoadingRooms(false)
      }
    }
    if (user) {
      fetchRooms()
      // Refresh rooms every 10 seconds
      const intervalId = setInterval(fetchRooms, 10000)
      return () => clearInterval(intervalId)
    }
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  const handleRefreshRooms = async () => {
    if (!user) return
    setIsLoadingRooms(true)
    try {
      const { data, error } = await getRooms()
      if (error) {
        console.error("Error fetching rooms:", error)
        return
      }
      setRooms(data || [])
    } catch (err) {
      console.error("Unexpected error fetching rooms:", err)
    } finally {
      setIsLoadingRooms(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 text-white">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-purple-500" />
          <h2 className="text-xl font-medium">Loading...</h2>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <header className="p-4 border-b border-slate-700">
        <div className="container flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice Chat
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-purple-700">
                  {user.email?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm hidden sm:inline">{user.email}</span>
            </div>
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="text-slate-300">
                <Settings className="h-4 w-4 mr-2" />
                Profile
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-slate-300">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 container flex flex-col items-center justify-center p-4 space-y-8">
        <div className="text-center space-y-2 max-w-md">
          <h2 className="text-3xl font-bold tracking-tight">Welcome to Voice Chat</h2>
          <p className="text-slate-300">Join or create voice chat rooms to connect with others in real-time.</p>
        </div>
        <div className="grid gap-4 w-full max-w-md">
          <Link href="/create-room" className="w-full">
            <Button size="lg" className="w-full bg-purple-600 hover:bg-purple-700">
              Create a Room
            </Button>
          </Link>
          <Link href="/join-room" className="w-full">
            <Button size="lg" variant="outline" className="w-full border-purple-600 text-purple-100">
              Join a Room
            </Button>
          </Link>
        </div>
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active Rooms</CardTitle>
              <CardDescription className="text-slate-400">Recently created voice rooms</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
              onClick={handleRefreshRooms}
              disabled={isLoadingRooms}
            >
              {isLoadingRooms ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-refresh-cw"
                >
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
              )}
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoadingRooms ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : rooms.length > 0 ? (
              rooms.slice(0, 5).map((room) => (
                <Link href={`/room/${room.id}`} key={room.id} className="block">
                  <div className="p-3 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors">
                    <div className="font-medium">{room.name}</div>
                    <div className="text-sm text-slate-300">Room ID: {room.id}</div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center p-4 text-slate-400">No rooms available</div>
            )}
          </CardContent>
        </Card>
      </main>
      <footer className="p-4 text-center text-sm text-slate-400">
        <p>Connect with others through voice chat. Real-time communication made simple.</p>
      </footer>
    </div>
  )
}

