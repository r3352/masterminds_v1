"use client";

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search, User, LogOut, Settings } from "lucide-react"
import { useAuth } from '@/contexts/auth-context'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { useState } from 'react'

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-bold text-xl">Masterminds</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/questions" className="text-sm font-medium hover:text-primary">
              Questions
            </Link>
            {isAuthenticated && (
              <Link href="/ask" className="text-sm font-medium hover:text-primary">
                Ask Question
              </Link>
            )}
            <Link href="/groups" className="text-sm font-medium hover:text-primary">
              Groups
            </Link>
            <Link href="/leaderboard" className="text-sm font-medium hover:text-primary">
              Leaderboard
            </Link>
          </div>

          {/* Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="search"
                placeholder="Search questions..."
                className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <NotificationBell />
                
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                  >
                    <User className="h-4 w-4" />
                  </Button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-background border rounded-md shadow-lg z-50">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium">{user?.full_name || user?.username}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                        <p className="text-xs text-muted-foreground">Reputation: {user?.reputation_score}</p>
                      </div>
                      <Link 
                        href="/profile" 
                        className="flex items-center px-4 py-2 text-sm hover:bg-muted"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Profile & Settings
                      </Link>
                      <button 
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm hover:bg-muted text-left"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}