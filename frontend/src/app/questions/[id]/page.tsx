"use client";

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { GET_QUESTION } from '@/lib/graphql/questions';
import { CREATE_ANSWER, VOTE_ANSWER, ACCEPT_ANSWER } from '@/lib/graphql/answers';
import { VOTE_QUESTION } from '@/lib/graphql/questions';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BountyPaymentModal } from '@/components/payments/bounty-payment-modal';
import { LiveActivity } from '@/components/realtime/live-activity';
import { useTyping } from '@/hooks/useTyping';
import { 
  ChevronUp, 
  ChevronDown, 
  MessageCircle, 
  Eye, 
  Clock, 
  DollarSign, 
  Check,
  Crown,
  User as UserIcon,
  Plus
} from 'lucide-react';
import Link from 'next/link';

export default function QuestionDetailPage() {
  const params = useParams();
  const questionId = params.id as string;
  const { user, isAuthenticated } = useAuth();
  const [answerContent, setAnswerContent] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [showBountyModal, setShowBountyModal] = useState(false);
  const { startTyping, stopTyping } = useTyping({ questionId });

  const { data, loading, error, refetch } = useQuery(GET_QUESTION, {
    variables: { id: questionId },
    skip: !questionId,
  });

  const [voteQuestion] = useMutation(VOTE_QUESTION, {
    onCompleted: () => refetch(),
  });

  const [voteAnswer] = useMutation(VOTE_ANSWER, {
    onCompleted: () => refetch(),
  });

  const [createAnswer] = useMutation(CREATE_ANSWER, {
    onCompleted: () => {
      setAnswerContent('');
      refetch();
    },
  });

  const [acceptAnswer] = useMutation(ACCEPT_ANSWER, {
    onCompleted: () => refetch(),
  });

  const question = data?.question;

  const handleVoteQuestion = async (voteType: 'UP' | 'DOWN') => {
    if (!isAuthenticated) return;
    try {
      await voteQuestion({
        variables: { questionId, voteType },
      });
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  const handleVoteAnswer = async (answerId: string, voteType: 'UP' | 'DOWN') => {
    if (!isAuthenticated) return;
    try {
      await voteAnswer({
        variables: { answerId, voteType },
      });
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  const handleAcceptAnswer = async (answerId: string) => {
    try {
      await acceptAnswer({
        variables: { answerId },
      });
    } catch (err) {
      console.error('Accept failed:', err);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answerContent.trim()) return;
    
    setSubmittingAnswer(true);
    try {
      await createAnswer({
        variables: {
          createAnswerDto: {
            content: answerContent,
            questionId,
          },
        },
      });
    } catch (err) {
      console.error('Submit failed:', err);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const getVoteScore = (votes: any[]) => {
    return votes?.reduce((score, vote) => {
      return score + (vote.voteType === 'UP' ? 1 : -1);
    }, 0) || 0;
  };

  const getUserVote = (votes: any[]) => {
    return votes?.find(vote => vote.user.id === user?.id)?.voteType;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isQuestionAuthor = user?.id === question?.author?.id;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading question...</div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">
          {error?.message || 'Question not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Live Activity */}
        <LiveActivity questionId={questionId} />
        
        {/* Question */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start gap-4">
              {/* Vote Section */}
              <div className="flex flex-col items-center space-y-2">
                <Button
                  variant={getUserVote(question.votes) === 'UP' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleVoteQuestion('UP')}
                  disabled={!isAuthenticated}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <span className="font-bold text-lg">{getVoteScore(question.votes)}</span>
                <Button
                  variant={getUserVote(question.votes) === 'DOWN' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleVoteQuestion('DOWN')}
                  disabled={!isAuthenticated}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>

              {/* Question Content */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="text-2xl">{question.title}</CardTitle>
                  <div className="flex items-center space-x-2">
                    {question.bountyAmount && question.bountyAmount > 0 ? (
                      <div className="flex items-center text-green-600 font-medium">
                        <DollarSign className="h-5 w-5 mr-1" />
                        <span className="text-lg">{question.bountyAmount}</span>
                      </div>
                    ) : (
                      isAuthenticated && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowBountyModal(true)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Bounty
                        </Button>
                      )
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4 mb-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>Asked {formatDate(question.createdAt)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="h-4 w-4" />
                    <span>{question.viewCount} views</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>{question._count?.answers || 0} answers</span>
                  </div>
                </div>

                <div className="prose max-w-none mb-6">
                  <p>{question.content}</p>
                </div>

                {/* Tags */}
                {question.tags && question.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {question.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Author Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Badge variant={question.status === 'ANSWERED' ? 'default' : 'secondary'}>
                      {question.status.replace('_', ' ')}
                    </Badge>
                    {question.group && (
                      <Badge variant="outline">{question.group.name}</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={question.author.avatar} />
                      <AvatarFallback>
                        {question.author.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {question.author.name} ({question.author.reputation})
                    </span>
                    {question.author.role === 'EXPERT' && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Answers */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">
            {question._count?.answers || 0} Answer{question._count?.answers !== 1 ? 's' : ''}
          </h2>
          
          {question.answers?.map((answer: any) => (
            <Card key={answer.id} className={`mb-4 ${answer.isAccepted ? 'ring-2 ring-green-500' : ''}`}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {/* Vote Section */}
                  <div className="flex flex-col items-center space-y-2">
                    <Button
                      variant={getUserVote(answer.votes) === 'UP' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => handleVoteAnswer(answer.id, 'UP')}
                      disabled={!isAuthenticated}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <span className="font-bold text-lg">{getVoteScore(answer.votes)}</span>
                    <Button
                      variant={getUserVote(answer.votes) === 'DOWN' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => handleVoteAnswer(answer.id, 'DOWN')}
                      disabled={!isAuthenticated}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    
                    {/* Accept Answer Button */}
                    {isQuestionAuthor && !question.acceptedAnswerId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcceptAnswer(answer.id)}
                        className="mt-2"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {answer.isAccepted && (
                      <div className="flex items-center text-green-600 mt-2">
                        <Check className="h-4 w-4 mr-1" />
                        <span className="text-xs">Accepted</span>
                      </div>
                    )}
                  </div>

                  {/* Answer Content */}
                  <div className="flex-1">
                    <div className="prose max-w-none mb-4">
                      <p>{answer.content}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        {answer.qualityScore && (
                          <Badge variant="outline">Quality: {answer.qualityScore}%</Badge>
                        )}
                        <span>Answered {formatDate(answer.createdAt)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={answer.author.avatar} />
                          <AvatarFallback>
                            {answer.author.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {answer.author.name} ({answer.author.reputation})
                        </span>
                        {answer.author.role === 'EXPERT' && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Answer Form */}
        {isAuthenticated ? (
          <Card>
            <CardHeader>
              <CardTitle>Your Answer</CardTitle>
              <CardDescription>
                Share your knowledge and help the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Write your answer here..."
                value={answerContent}
                onChange={(e) => {
                  setAnswerContent(e.target.value);
                  if (e.target.value.trim()) {
                    startTyping();
                  } else {
                    stopTyping();
                  }
                }}
                onBlur={stopTyping}
                rows={6}
                className="mb-4"
              />
              <Button 
                onClick={handleSubmitAnswer}
                disabled={!answerContent.trim() || submittingAnswer}
              >
                {submittingAnswer ? 'Submitting...' : 'Submit Answer'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Alert>
            <UserIcon className="h-4 w-4" />
            <AlertDescription>
              <Link href="/auth/login" className="text-blue-600 hover:underline">
                Sign in
              </Link> to answer this question.
            </AlertDescription>
          </Alert>
        )}

        {/* Bounty Payment Modal */}
        <BountyPaymentModal
          isOpen={showBountyModal}
          onClose={() => setShowBountyModal(false)}
          question={{
            id: question.id,
            title: question.title,
            author: question.author,
          }}
          onPaymentSuccess={() => {
            refetch();
          }}
        />
      </div>
    </div>
  );
}