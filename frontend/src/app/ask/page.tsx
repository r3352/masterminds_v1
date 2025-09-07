"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_QUESTION } from '@/lib/graphql/questions';
import { GET_GROUPS } from '@/lib/graphql/groups';
import { useAuth } from '@/contexts/auth-context';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DollarSign, Clock, Users, AlertCircle } from "lucide-react";

export default function AskQuestionPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [bountyAmount, setBountyAmount] = useState('');
  const [groupId, setGroupId] = useState('all');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { data: groupsData } = useQuery(GET_GROUPS, {
    variables: { take: 50 },
  });

  const [createQuestion] = useMutation(CREATE_QUESTION, {
    onCompleted: (data) => {
      router.push(`/questions/${data.createQuestion.id}`);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const tags = tagsInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .slice(0, 5);

      await createQuestion({
        variables: {
          input: {
            title: title.trim(),
            content: content.trim(),
            tags: tags.length > 0 ? tags : undefined,
            bountyAmount: bountyAmount ? parseFloat(bountyAmount) : undefined,
            groupId: groupId && groupId !== 'all' ? groupId : undefined,
          },
        },
      });
    } catch (err) {
      console.error('Submit failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTagClick = (tag: string) => {
    const currentTags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
    if (!currentTags.includes(tag) && currentTags.length < 5) {
      setTagsInput([...currentTags, tag].join(', '));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need to <a href="/auth/login" className="text-blue-600 hover:underline">sign in</a> to ask a question.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Ask a Question</h1>
        <p className="text-muted-foreground">Get expert answers to your technical questions. Set a bounty to incentivize high-quality responses.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Question Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Question</CardTitle>
              <CardDescription>Provide detailed information to get the best answers</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Question Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., How to implement OAuth 2.0 in Node.js?"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Be specific and concise. This will help experts understand your question quickly.
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="content">Detailed Description *</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                    placeholder="Describe your problem in detail. Include what you've tried, error messages, and expected behavior."
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Include relevant code, error messages, and what you've already tried.
                  </p>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="javascript, react, node.js (separate with commas)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Add up to 5 tags to help categorize your question.
                  </p>
                </div>

                {/* Bounty */}
                <div className="space-y-2">
                  <Label htmlFor="bounty">
                    <DollarSign className="inline h-4 w-4 mr-1" />
                    Bounty Amount
                  </Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="bounty"
                      type="number"
                      value={bountyAmount}
                      onChange={(e) => setBountyAmount(e.target.value)}
                      placeholder="0"
                      min="0"
                      max="1000"
                      className="w-32"
                    />
                    <span className="text-sm text-muted-foreground">USD</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Optional. Set a bounty to incentivize high-quality answers.
                  </p>
                </div>

                {/* Group Selection */}
                <div className="space-y-2">
                  <Label>
                    <Users className="inline h-4 w-4 mr-1" />
                    Target Group (Optional)
                  </Label>
                  <Select value={groupId} onValueChange={setGroupId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Groups (Recommended)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Groups (Recommended)</SelectItem>
                      {groupsData?.groups?.filter((group: any) => group.id && group.id !== "").map((group: any) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Target specific expert groups for more focused answers.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? 'Posting Question...' : 'Post Question'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Tips Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tips for Great Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Be Specific</h4>
                <p className="text-sm text-muted-foreground">
                  Include specific error messages, code snippets, and expected vs actual behavior.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Show Your Work</h4>
                <p className="text-sm text-muted-foreground">
                  Explain what you've already tried. This shows effort and helps experts avoid suggesting things you've done.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Use Good Tags</h4>
                <p className="text-sm text-muted-foreground">
                  Tags help route your question to the right experts. Use specific technology tags.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bounty Benefits</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Get answers faster</li>
                <li>• Attract top experts</li>
                <li>• Higher quality responses</li>
                <li>• Priority in expert feeds</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Popular Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {['javascript', 'python', 'react', 'node.js', 'aws', 'docker', 'sql', 'git'].map((tag) => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => handleTagClick(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}