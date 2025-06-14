'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { createUserProfile, getUserProfile } from '@/lib/database'
import { Loader2, User } from 'lucide-react'

interface ProfileSetupProps {
  onComplete: () => void
}

export default function ProfileSetup({ onComplete }: ProfileSetupProps) {
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    checkExistingProfile()
  }, [user])

  const checkExistingProfile = async () => {
    if (!user) return
    
    try {
      const { data, error } = await getUserProfile(user.id)
      if (data && !error) {
        // Profile already exists, skip setup
        onComplete()
        return
      }
    } catch (err) {
      // Profile doesn't exist, continue with setup
    }
    
    setIsChecking(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!displayName.trim()) {
      setError('Display name is required')
      setIsLoading(false)
      return
    }

    if (displayName.length < 2) {
      setError('Display name must be at least 2 characters')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await createUserProfile(
        user!.id,
        user!.email!,
        displayName.trim()
      )

      if (error) {
        setError(error.message)
      } else {
        onComplete()
      }
    } catch (err) {
      setError('Failed to create profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-foreground">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-card border-border">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
            <User className="h-6 w-6 text-primary" />
            Welcome!
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Set up your profile to start chatting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-foreground">
                Display Name
              </Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Enter your display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                required
                minLength={2}
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">
                This name will be visible to other participants
              </p>
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
                  Creating Profile...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 