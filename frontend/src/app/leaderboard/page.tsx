"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Award, TrendingUp, Clock, Star } from "lucide-react";

// Mock data - replace with actual GraphQL queries
const mockLeaderboardData = {
  topExperts: [
    {
      id: "1",
      username: "techguru",
      email: "techguru@example.com",
      reputation: 2450,
      questionsAnswered: 156,
      bestAnswers: 89,
      rank: 1,
      avatar: null,
    },
    {
      id: "2", 
      username: "codemaster",
      email: "codemaster@example.com",
      reputation: 1850,
      questionsAnswered: 134,
      bestAnswers: 67,
      rank: 2,
      avatar: null,
    },
    {
      id: "3",
      username: "wskondon",
      email: "wskondon@gmail.com",
      reputation: 0,
      questionsAnswered: 0,
      bestAnswers: 0,
      rank: 3,
      avatar: null,
    }
  ]
};

export default function LeaderboardPage() {
  const [timeframe, setTimeframe] = useState('all-time');

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="h-6 w-6 flex items-center justify-center font-bold text-lg">{rank}</span>;
    }
  };

  const getRankBadgeVariant = (rank: number) => {
    switch (rank) {
      case 1:
        return "default";
      case 2:
        return "secondary";
      case 3:
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
        <p className="text-muted-foreground">
          Top experts and contributors in the community
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex gap-2 mb-6">
          <Button 
            variant={timeframe === 'all-time' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setTimeframe('all-time')}
          >
            All Time
          </Button>
          <Button 
            variant={timeframe === 'monthly' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setTimeframe('monthly')}
          >
            <Clock className="h-4 w-4 mr-1" />
            This Month
          </Button>
          <Button 
            variant={timeframe === 'weekly' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setTimeframe('weekly')}
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            This Week
          </Button>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <Trophy className="h-6 w-6 mr-2" />
            Top Experts
          </h2>
          {mockLeaderboardData.topExperts.map((expert, index) => (
            <Card key={expert.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getRankIcon(expert.rank)}
                      <Badge variant={getRankBadgeVariant(expert.rank) as "default" | "secondary" | "outline"}>
                        #{expert.rank}
                      </Badge>
                    </div>
                    
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={expert.avatar || undefined} />
                      <AvatarFallback>
                        {expert.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <h3 className="text-lg font-semibold">{expert.username}</h3>
                      <p className="text-sm text-muted-foreground">{expert.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-lg">{expert.reputation}</div>
                      <div className="text-muted-foreground">Reputation</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg">{expert.questionsAnswered}</div>
                      <div className="text-muted-foreground">Answers</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-lg">{expert.bestAnswers}</div>
                      <div className="text-muted-foreground">Best Answers</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 mr-2" />
              Coming Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              More leaderboard categories coming soon including top contributors, recent stars, 
              and specialized rankings by technology expertise.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}