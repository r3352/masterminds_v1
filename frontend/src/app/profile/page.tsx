'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useQuery, useMutation } from '@apollo/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GET_MY_QUESTIONS, GET_MY_ANSWERS, UPDATE_PROFILE_MUTATION } from '@/lib/graphql/profile';
import { toast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { Edit2, Calendar, Mail, User, Trophy, MessageSquare, HelpCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    bio: user?.bio || '',
    avatar_url: user?.avatar_url || '',
  });

  const { data: questionsData, loading: questionsLoading } = useQuery(GET_MY_QUESTIONS, {
    skip: !user,
    variables: { page: 1, limit: 10 }
  });
  
  const { data: answersData, loading: answersLoading } = useQuery(GET_MY_ANSWERS, {
    skip: !user,
    variables: { page: 1, limit: 10 }
  });

  const [updateProfile, { loading: updateLoading }] = useMutation(UPDATE_PROFILE_MUTATION, {
    onCompleted: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSave = async () => {
    try {
      await updateProfile({
        variables: { input: profileData }
      });
    } catch (error) {
      console.error('Profile update error:', error);
    }
  };

  const handleCancel = () => {
    setProfileData({
      full_name: user?.full_name || '',
      bio: user?.bio || '',
      avatar_url: user?.avatar_url || '',
    });
    setIsEditing(false);
  };

  if (authLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user.avatar_url || profileData.avatar_url} />
                <AvatarFallback className="text-lg">
                  {(user.full_name || user.username)?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>

              {isEditing ? (
                <div className="w-full space-y-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      rows={4}
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="avatar_url">Avatar URL</Label>
                    <Input
                      id="avatar_url"
                      value={profileData.avatar_url}
                      onChange={(e) => setProfileData({...profileData, avatar_url: e.target.value})}
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleSave} disabled={updateLoading} className="flex-1">
                      {updateLoading ? 'Saving...' : 'Save'}
                    </Button>
                    <Button variant="outline" onClick={handleCancel} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <h2 className="text-xl font-semibold">
                      {user.full_name || user.username}
                    </h2>
                    <p className="text-muted-foreground">@{user.username}</p>
                    {user.bio && (
                      <p className="text-sm mt-2 text-center">{user.bio}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center w-full">
                    <div>
                      <div className="flex items-center justify-center gap-1">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <p className="font-semibold">{user.reputation_score || 0}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Reputation</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1">
                        <HelpCircle className="h-4 w-4 text-blue-500" />
                        <p className="font-semibold">{questionsData?.myQuestions?.length || 0}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Questions</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1">
                        <MessageSquare className="h-4 w-4 text-green-500" />
                        <p className="font-semibold">{answersData?.myAnswers?.length || 0}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Answers</p>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1 w-full">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <Button onClick={() => setIsEditing(true)} className="w-full" variant="outline">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity Tabs */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="questions">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="questions">
                  Questions ({questionsData?.myQuestions?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="answers">
                  Answers ({answersData?.myAnswers?.length || 0})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="questions" className="space-y-4 mt-4">
                {questionsLoading ? (
                  <div className="text-center py-8">Loading questions...</div>
                ) : questionsData?.myQuestions?.length > 0 ? (
                  questionsData.myQuestions.map((question: any) => (
                    <div key={question.id} className="border-b pb-4 last:border-0">
                      <a 
                        href={`/questions/${question.id}`} 
                        className="hover:text-primary block"
                      >
                        <h3 className="font-medium text-lg">{question.title}</h3>
                      </a>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                        <span>{question.answerCount || 0} answers</span>
                        <span>{question.viewCount || 0} views</span>
                        {question.bountyAmount > 0 && (
                          <span className="text-green-600 font-medium">
                            ${question.bountyAmount} bounty
                          </span>
                        )}
                        <span>{new Date(question.createdAt).toLocaleDateString()}</span>
                      </div>
                      {question.content && (
                        <p className="text-sm mt-2 text-muted-foreground line-clamp-2">
                          {question.content.length > 100 
                            ? question.content.substring(0, 100) + '...'
                            : question.content
                          }
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No questions yet</p>
                    <Button className="mt-4" onClick={() => router.push('/ask')}>
                      Ask Your First Question
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="answers" className="space-y-4 mt-4">
                {answersLoading ? (
                  <div className="text-center py-8">Loading answers...</div>
                ) : answersData?.myAnswers?.length > 0 ? (
                  answersData.myAnswers.map((answer: any) => (
                    <div key={answer.id} className="border-b pb-4 last:border-0">
                      <a 
                        href={`/questions/${answer.question.id}`} 
                        className="hover:text-primary block"
                      >
                        <h3 className="font-medium">Answer to: {answer.question.title}</h3>
                      </a>
                      <p className="text-sm mt-2 line-clamp-3">
                        {answer.content.length > 150 
                          ? answer.content.substring(0, 150) + '...'
                          : answer.content
                        }
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                        <span>Score: {answer.score || 0}</span>
                        {answer.isAccepted && (
                          <span className="text-green-600 font-medium">✓ Accepted</span>
                        )}
                        <span>{new Date(answer.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No answers yet</p>
                    <Button className="mt-4" onClick={() => router.push('/questions')}>
                      Browse Questions to Answer
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}