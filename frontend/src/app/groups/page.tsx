"use client";

import { useQuery } from '@apollo/client';
import { GET_GROUPS } from '@/lib/graphql/groups';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, TrendingUp } from "lucide-react";

export default function GroupsPage() {
  const { data: groupsData, loading, error } = useQuery(GET_GROUPS, {
    variables: { take: 20 },
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading groups...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">Error loading groups: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Expert Groups</h1>
          <p className="text-muted-foreground">
            Join specialized communities and connect with experts in your field
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Group
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groupsData?.groups?.length > 0 ? (
          groupsData.groups.map((group: any) => (
            <Card key={group.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{group.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {group.description || "Expert group for specialized discussions and Q&A"}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {group.category || "General"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-1" />
                    {group.memberCount || 0} members
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {group.questionsCount || 0} questions
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  {group.isMember ? "View Group" : "Join Group"}
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Groups Found</h3>
            <p className="text-muted-foreground mb-6">
              Be the first to create a group and build your expert community
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create First Group
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}