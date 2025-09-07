"use client";

import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_QUESTIONS } from '@/lib/graphql/questions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Search, Clock, Eye, MessageCircle, DollarSign, ChevronUp, ChevronDown, Plus } from 'lucide-react';

export default function QuestionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [skip, setSkip] = useState(0);
  const take = 20;

  const { data, loading, error, refetch } = useQuery(GET_QUESTIONS, {
    variables: {
      skip,
      take,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
    },
    fetchPolicy: 'cache-and-network',
  });

  const questions = data?.questions || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return <Badge variant="default">Open</Badge>;
      case 'IN_PROGRESS': return <Badge variant="secondary">In Progress</Badge>;
      case 'ANSWERED': return <Badge variant="outline">Answered</Badge>;
      case 'CLOSED': return <Badge variant="destructive">Closed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getVoteScore = (votes: any[]) => {
    return votes?.reduce((score, vote) => {
      return score + (vote.voteType === 'UP' ? 1 : -1);
    }, 0) || 0;
  };

  if (loading && questions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading questions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">Error loading questions: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">All Questions</h1>
            <p className="text-muted-foreground">Find answers to your technical questions from experts</p>
          </div>
          <Button asChild>
            <Link href="/ask">
              <Plus className="h-4 w-4 mr-2" />
              Ask Question
            </Link>
          </Button>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-6">
          {questions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No questions found.</p>
                <Button asChild className="mt-4">
                  <Link href="/ask">Ask the first question</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            questions.map((question: any) => (
              <Card key={question.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Vote/Stats Section */}
                    <div className="flex flex-col items-center space-y-2 min-w-[80px]">
                      <div className="flex flex-col items-center">
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        <span className="font-bold text-lg">{getVoteScore(question.votes)}</span>
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">votes</span>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <MessageCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{question._count?.answers || 0}</span>
                        <span className="text-xs text-muted-foreground">answers</span>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{question.viewCount}</span>
                        <span className="text-xs text-muted-foreground">views</span>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <Link 
                          href={`/questions/${question.id}`}
                          className="text-xl font-semibold hover:text-primary line-clamp-2"
                        >
                          {question.title}
                        </Link>
                        <div className="flex items-center ml-4">
                          {question.bountyAmount && question.bountyAmount > 0 && (
                            <div className="flex items-center text-green-600 font-medium">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {question.bountyAmount}
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {question.content}
                      </p>

                      {/* Tags */}
                      {question.tags && question.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {question.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {getStatusBadge(question.status)}
                          {question.group && (
                            <Badge variant="outline">{question.group.name}</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>{formatDate(question.createdAt)}</span>
                          </div>
                          <span>by {question.author.name} ({question.author.reputation})</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        <div className="flex justify-center mt-8 space-x-2">
          <Button
            variant="outline"
            onClick={() => setSkip(Math.max(0, skip - take))}
            disabled={skip === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setSkip(skip + take)}
            disabled={questions.length < take}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}